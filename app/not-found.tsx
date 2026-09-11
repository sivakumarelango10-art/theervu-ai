import Link from 'next/link'
import { ArrowLeft, Compass, FileQuestion, Landmark } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="flex min-h-[85vh] flex-col items-center justify-center bg-white px-6 py-16 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 text-[#12366b] shadow-xs ring-1 ring-slate-200">
        <FileQuestion size={32} />
      </div>

      <span className="mt-6 text-xs font-bold uppercase tracking-widest text-[#159b81]">
        404 — Page Not Found
      </span>

      <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#102b57] sm:text-3xl">
        We couldn&apos;t find that page
      </h1>

      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-500">
        The link you followed may be broken or the procedure page may have moved. You can navigate to one of our core services below.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button
          asChild
          className="h-10 gap-2 bg-[#12366b] px-5 font-semibold text-white hover:bg-[#0d2a55]"
        >
          <Link href="/">
            <ArrowLeft size={15} />
            <span>Go to Homepage</span>
          </Link>
        </Button>

        <Button
          asChild
          variant="outline"
          className="h-10 gap-2 border-slate-200 text-slate-700 hover:bg-slate-50"
        >
          <Link href="/services">
            <Landmark size={15} />
            <span>Civic Services</span>
          </Link>
        </Button>

        <Button
          asChild
          variant="outline"
          className="h-10 gap-2 border-slate-200 text-slate-700 hover:bg-slate-50"
        >
          <Link href="/before-you-go">
            <Compass size={15} />
            <span>Before You Go</span>
          </Link>
        </Button>
      </div>
    </div>
  )
}
