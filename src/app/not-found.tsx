import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F8FAFC] px-4">
      <div className="max-w-md text-center">
        <h1 className="text-6xl font-bold text-[#0F766E]" style={{ fontWeight: 700 }}>404</h1>
        <p className="mt-4 text-lg font-medium text-[#0F172A]">Page not found</p>
        <p className="mt-2 text-sm text-[#64748B]">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-xl bg-[#0F766E] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#115E59]"
        >
          Go home
        </Link>
      </div>
    </div>
  )
}
