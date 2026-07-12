import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-4xl sm:text-6xl font-bold text-primary" style={{ fontWeight: 700 }}>404</h1>
        <p className="mt-4 text-lg font-medium text-foreground">Page not found</p>
        <p className="mt-2 text-sm text-muted">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-xl bg-primary px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
        >
          Go home
        </Link>
      </div>
    </div>
  )
}
