'use client'

import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton'
import { ShieldCheck } from 'lucide-react'

interface AuthModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  redirectTo?: string
}

export function AuthModal({
  open,
  onOpenChange,
  redirectTo = '/',
}: AuthModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-6 sm:p-8">
        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-[#159b81]">
            <ShieldCheck size={24} />
          </div>
          <DialogTitle className="text-2xl font-semibold text-[#102b57]">
            Sign in to TheervuAI
          </DialogTitle>
          <DialogDescription className="mt-2 text-sm leading-relaxed text-slate-500 text-pretty">
            Save your customized preparation plans, keep track of completed checklist items, and revisit document explanations anytime.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 flex flex-col gap-4">
          <GoogleSignInButton
            redirectTo={redirectTo}
            onSuccess={() => onOpenChange(false)}
          />

          <p className="text-center text-[11px] leading-relaxed text-slate-400">
            By continuing, you agree to TheervuAI&apos;s privacy and safety guidelines. We protect your personal data and never store unnecessary documents.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
