import { Square } from 'lucide-react'
import Link from 'next/link'

export default function Navbar() {
  return (
    <nav className="flex h-[72px] items-center justify-between border-b border-[#E2E8F0] bg-white px-6" style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0F766E]">
          <Square className="h-4 w-4 text-white" fill="white" />
        </div>
        <span className="text-lg font-semibold text-[#0F172A]" style={{ fontWeight: 600 }}>
          Pronunciation AI
        </span>
      </div>
      <div className="flex items-center gap-6 text-sm text-[#64748B]">
        <Link href="#" className="hover:text-[#0F172A] transition-colors duration-200">
          Privacy
        </Link>
        <Link href="#" className="hover:text-[#0F172A] transition-colors duration-200">
          GitHub
        </Link>
      </div>
    </nav>
  )
}
