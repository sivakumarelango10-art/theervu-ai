import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { env } from '@/lib/config/env'
import { getClientIp, checkRateLimit } from '@/lib/security/rate-limit'
import { logger } from '@/lib/observability/logger'

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
]

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export async function POST(request: Request) {
  const ip = getClientIp(request)
  const rl = checkRateLimit(`upload_${ip}`, 10, 60)
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Document upload limit reached. Please wait a minute before uploading another file.' },
      { status: 429, headers: { 'Retry-After': String(rl.reset) } }
    )
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const documentType = (formData.get('documentType') as string) || 'general'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error:
            'Unsupported file type. Please upload a PDF or an image (JPG, PNG, WebP).',
        },
        { status: 400 }
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds the 10MB limit.' },
        { status: 400 }
      )
    }

    // In local development fallback mode
    if (!env.supabase.isConfigured) {
      return NextResponse.json({
        id: 'doc_' + Math.random().toString(36).substring(7),
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        status: 'completed',
        extractedText: `[Sample Extracted Content from ${file.name}]: Document submitted for ${documentType}. Contains procedural instructions and required identification.`,
      })
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Sign in required to upload documents' }, { status: 401 })
    }

    const extension = file.name.split('.').pop()?.toLowerCase() || ''
    const validExtensions = ['pdf', 'png', 'jpg', 'jpeg', 'webp']
    if (!validExtensions.includes(extension)) {
      return NextResponse.json(
        { error: 'Invalid file extension. Please upload a PDF or an image.' },
        { status: 400 }
      )
    }

    const uniqueFileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${extension}`
    const storagePath = `users/${user.id}/${uniqueFileName}`

    // Upload to Supabase Storage bucket 'documents'
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Supabase Storage Upload Error:', uploadError.message)
      return NextResponse.json(
        { error: 'Failed to upload document to secure storage. Please try again.' },
        { status: 502 }
      )
    }

    const extractedSummary = `Text extracted from ${file.name}. Verification required.`

    // Save document metadata in database (matching schema column extracted_text)
    const { data: docRecord, error: dbError } = await supabase
      .from('documents')
      .insert({
        user_id: user.id,
        file_name: file.name,
        file_path: storagePath,
        file_type: file.type,
        file_size: file.size,
        processing_status: 'completed',
        extracted_text: extractedSummary,
      })
      .select()
      .single()

    if (dbError) {
      logger.error('Document Metadata DB Insert Error:', { error: dbError.message })
      return NextResponse.json(
        { error: 'Failed to record document metadata. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      id: docRecord.id,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      status: 'completed',
      extractedText: docRecord.extracted_text,
    })
  } catch (error: unknown) {
    logger.error('File Upload Error:', { error: String(error) })
    return NextResponse.json(
      { error: 'An unexpected error occurred during document upload.' },
      { status: 500 }
    )
  }
}
