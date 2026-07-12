'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { BookOpen, Shield, Menu, X } from 'lucide-react'

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (!menuOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [menuOpen])

  function closeMenu() {
    setMenuOpen(false)
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-white/80 backdrop-blur-md" aria-label="Main navigation">
      <div className="flex h-18 items-center justify-between px-6" style={{ maxWidth: 1100, margin: '0 auto' }}>
        <Link href="/" className="group flex items-center gap-3 rounded-lg transition-opacity hover:opacity-80" aria-label="Speech Analysis Home">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary transition-transform group-hover:scale-105">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          </div>
          <span className="text-lg font-semibold text-foreground">
            Livo AI
          </span>
        </Link>

        {/* Hamburger toggle — visible on mobile */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex sm:hidden items-center justify-center h-11 w-11 rounded-lg text-[#475569] hover:bg-bg-secondary transition-colors"
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        {/* Desktop nav links — hidden on mobile */}
        <div className="hidden sm:flex items-center gap-1" role="list">
          <Link
            href="#"
            className="group flex items-center gap-1.5 rounded-lg px-3 py-3 text-sm text-[#475569] transition-all hover:bg-bg-secondary hover:text-foreground min-h-11"
            role="listitem"
            onClick={closeMenu}
          >
            <BookOpen className="h-4 w-4" aria-hidden="true" />
            <span>Docs</span>
          </Link>
          <Link
            href="#"
            className="group flex items-center gap-1.5 rounded-lg px-3 py-3 text-sm text-[#475569] transition-all hover:bg-bg-secondary hover:text-foreground min-h-11"
            role="listitem"
            onClick={closeMenu}
          >
            <Shield className="h-4 w-4" aria-hidden="true" />
            <span>Privacy</span>
          </Link>
          <a
            href="https://github.com/Rahul-Aitla/livo"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-1.5 rounded-lg px-3 py-3 text-sm text-[#475569] transition-all hover:bg-bg-secondary hover:text-foreground min-h-11"
            role="listitem"
            aria-label="GitHub repository (opens in new tab)"
            onClick={closeMenu}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            <span>GitHub</span>
          </a>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="sm:hidden border-t border-border bg-white px-6 py-3 space-y-1" role="list">
          <Link
            href="#"
            className="flex items-center gap-2 rounded-lg px-3 py-3 text-sm text-[#475569] transition-colors hover:bg-bg-secondary hover:text-foreground min-h-11"
            role="listitem"
            onClick={closeMenu}
          >
            <BookOpen className="h-4 w-4" aria-hidden="true" />
            <span>Docs</span>
          </Link>
          <Link
            href="#"
            className="flex items-center gap-2 rounded-lg px-3 py-3 text-sm text-[#475569] transition-colors hover:bg-bg-secondary hover:text-foreground min-h-11"
            role="listitem"
            onClick={closeMenu}
          >
            <Shield className="h-4 w-4" aria-hidden="true" />
            <span>Privacy</span>
          </Link>
          <a
            href="https://github.com/Rahul-Aitla/livo"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg px-3 py-3 text-sm text-[#475569] transition-colors hover:bg-bg-secondary hover:text-foreground min-h-11"
            role="listitem"
            aria-label="GitHub repository (opens in new tab)"
            onClick={closeMenu}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            <span>GitHub</span>
          </a>
        </div>
      )}
    </nav>
  )
}
