export default function Footer() {
  return (
    <footer className="border-t border-border bg-white py-10">
      <div className="flex flex-col items-center gap-4 px-6 text-center text-xs text-[#475569]" style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          <span>Powered by</span>
          <span className="font-medium text-body">Deepgram Nova-2</span>
          <span className="hidden text-border sm:inline">·</span>
          <span className="font-medium text-body">Groq Llama 3.3</span>
          <span className="hidden text-border sm:inline">·</span>
          <span className="font-medium text-body">Next.js 15</span>
          <span className="hidden text-border sm:inline">·</span>
          <span className="font-medium text-body">Vercel</span>
        </div>
        <p className="text-muted">
          Audio is processed in memory and deleted immediately. No data is stored or retained.
        </p>
      </div>
    </footer>
  )
}
