export default function Footer() {
  return (
    <footer className="border-t border-[#E2E8F0] py-8 text-center text-xs text-[#64748B]">
      <div className="flex items-center justify-center gap-4" style={{ maxWidth: 1100, margin: '0 auto' }}>
        <span>Powered by</span>
        <span className="font-medium text-[#334155]">Deepgram</span>
        <span className="text-[#E2E8F0]">·</span>
        <span className="font-medium text-[#334155]">Groq</span>
        <span className="text-[#E2E8F0]">·</span>
        <span className="font-medium text-[#334155]">Next.js</span>
        <span className="text-[#E2E8F0]">·</span>
        <span className="font-medium text-[#334155]">Vercel</span>
      </div>
    </footer>
  )
}
