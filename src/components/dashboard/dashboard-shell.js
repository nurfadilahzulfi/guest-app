"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";

/**
 * Shell kontainer dashboard internal dengan kontrol drawer mobile.
 * @param {Object} props
 * @param {Object} props.user - Objek sesi user
 * @param {React.ReactNode} props.children - Konten halaman
 */
export function DashboardShell({ user, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-screen overflow-hidden bg-[#F8FAFC] flex">
      {/* Sidebar Navigasi */}
      <Sidebar
        user={user}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Area Konten Utama — scroll sendiri, sidebar diam */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar Mobile */}
        <header className="lg:hidden bg-white border-b border-zinc-200 px-4 py-3 flex items-center justify-between shrink-0 z-30">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl text-zinc-600 hover:bg-zinc-100 transition-colors"
            aria-label="Buka Menu"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-100 text-zinc-700">
            {user?.role}
          </span>
        </header>

        {/* Konten Halaman — area ini yang scroll, bukan seluruh halaman */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-7 lg:p-9">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
