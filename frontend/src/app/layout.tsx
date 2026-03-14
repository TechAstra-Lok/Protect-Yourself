import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Link from 'next/link'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Protect Yourself - Cybersecurity Dashboard',
  description: 'Advanced Threat Intelligence & Cybersecurity Monitoring',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen bg-[#020617]`}>
        <div className="fixed inset-0 z-[-1] opacity-40 mix-blend-screen pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-900/30 rounded-full blur-[100px] animate-float"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-purple-900/20 rounded-full blur-[100px] animate-float" style={{ animationDelay: '2s' }}></div>
        </div>
        
        {/* Navbar */}
        <nav className="fixed top-0 w-full z-50 flex justify-between items-center py-4 px-8 bg-slate-900/40 backdrop-blur-xl border-b border-slate-800">
          <Link href="/" className="flex items-center gap-3 text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500 hover:opacity-80 transition-opacity">
            <span className="text-cyan-400">🛡️</span> Protect Yourself
          </Link>
          <div className="hidden md:flex space-x-8 text-sm font-medium text-slate-300">
            <a href="/#" className="hover:text-cyan-400 transition-colors">Dashboard</a>
            <a href="/#analytics" className="hover:text-cyan-400 transition-colors">Threat Alerts <span className="ml-1 bg-red-500/20 text-red-500 py-0.5 px-2 rounded-full text-xs">3</span></a>
            <a href="/#report" className="hover:text-cyan-400 transition-colors">Reports</a>
            <Link href="/admin" className="hover:text-cyan-400 transition-colors flex items-center gap-1">
              Admin <span className="text-xs">🔒</span>
            </Link>
          </div>
          <button className="md:hidden text-white">☰</button>
        </nav>

        <main className="max-w-7xl mx-auto py-8">
          {children}
        </main>
      </body>
    </html>
  )
}
