export default function Footer() {
  return (
    <footer className="border-t border-[#E2E8F0] bg-white py-10">
      <div className="flex flex-col items-center gap-4 px-6 text-center text-xs text-[#475569]" style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          <span>Powered by</span>
          <span className="font-medium text-[#334155]">Deepgram Nova-2</span>
          <span className="hidden text-[#E2E8F0] sm:inline">·</span>
          <span className="font-medium text-[#334155]">Groq Llama 3.3</span>
          <span className="hidden text-[#E2E8F0] sm:inline">·</span>
          <span className="font-medium text-[#334155]">Next.js 15</span>
          <span className="hidden text-[#E2E8F0] sm:inline">·</span>
          <span className="font-medium text-[#334155]">Vercel</span>
        </div>
        <p className="text-[#64748B]">
          Audio is processed in memory and deleted immediately. No data is stored or retained.
        </p>
      </div>
    </footer>
  )
}
