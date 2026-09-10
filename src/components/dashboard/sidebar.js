"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  IconLayoutDashboard,
  IconBuilding,
  IconCrown,
  IconUsersGroup,
  IconLogOut,
  IconX,
} from "@/components/icons/guest-icons";

/**
 * Sidebar navigasi dashboard internal adaptif multi-role.
 * @param {Object} props
 * @param {Object} props.user - Objek sesi user (name, email, role, department)
 * @param {boolean} props.isOpen - Status drawer mobile terbuka
 * @param {function(): void} props.onClose - Handler menutup drawer mobile
 */
export function Sidebar({ user, isOpen, onClose }) {
  const pathname = usePathname();

  const isRoleAdmin = user?.role === "ADMINISTRATOR";

  const navItems = [
    {
      label: "Ringkasan Kunjungan",
      href: "/dashboard",
      icon: IconLayoutDashboard,
      active: pathname === "/dashboard",
    },
    ...(isRoleAdmin
      ? [
        {
          label: "Data Karyawan",
          href: "/dashboard/hosts",
          icon: IconBuilding,
          active: pathname === "/dashboard/hosts",
        },
        {
          label: "Daftar Tamu Owner",
          href: "/dashboard/owners",
          icon: IconCrown,
          active: pathname === "/dashboard/owners",
        },
        {
          label: "Manajemen User",
          href: "/dashboard/users",
          icon: IconUsersGroup,
          active: pathname === "/dashboard/users",
        },
      ]
      : []),
  ];

  const roleLabelMap = {
    HOST: "Karyawan",
    ADMIN_HRD: "Admin HRD",
    ADMINISTRATOR: "Administrator",
  };

  const roleBadgeColor = {
    HOST: "bg-blue-50 text-blue-700 border-blue-200",
    ADMIN_HRD: "bg-purple-50 text-purple-700 border-purple-200",
    ADMINISTRATOR: "bg-zinc-900 text-white border-zinc-900",
  };

  return (
    <>
      {/* Backdrop Mobile */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden animate-fadeIn"
        />
      )}

      {/* Kontainer Sidebar */}
      <aside
        className={`
          fixed lg:relative top-0 bottom-0 left-0 z-50
          w-76 sm:w-80 max-w-[88vw] h-full bg-white border-r border-zinc-200/90 flex flex-col justify-between overflow-hidden
          transition-transform duration-200 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full pointer-events-none lg:pointer-events-auto lg:translate-x-0"}
        `}
      >
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
          {/* Header Brand */}
          <div className="p-4 sm:p-5 flex items-center justify-between border-b border-zinc-100 gap-2">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-center overflow-hidden shrink-0">
                <Image
                  src="/assets/logos/tanimas-logo.png"
                  alt="Logo PT Tanimas"
                  width={28}
                  height={28}
                  className="object-contain"
                  priority
                  unoptimized
                />
              </div>
              <div className="min-w-0 flex-1">
                <h2
                  className="text-xs sm:text-[13px] font-bold text-zinc-900 leading-snug break-words"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  PT. Tanimas Resources Internasional
                </h2>
                <p className="text-[11px] text-zinc-500 font-medium mt-0.5">
                  Portal Dashboard
                </p>
              </div>
            </div>

            {/* Tombol Tutup Mobile */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 lg:hidden shrink-0"
              aria-label="Tutup Menu"
            >
              <IconX className="w-5 h-5" />
            </button>
          </div>

          {/* Navigasi Utama */}
          <nav className="p-3.5 space-y-1">
            <p className="px-3 py-1 text-[10px] font-bold text-zinc-400 tracking-wider uppercase">
              Menu Utama
            </p>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`
                    flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150
                    ${item.active
                      ? "bg-zinc-900 text-white shadow-xs"
                      : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/80"
                    }
                  `}
                >
                  <Icon className={`w-4 h-4 ${item.active ? "text-white" : "text-zinc-500"}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            <div className="pt-3 mt-3 border-t border-zinc-100">
              <p className="px-3 py-1 text-[10px] font-bold text-zinc-400 tracking-wider uppercase">
                Akses Tamu
              </p>
              <Link
                href="/"
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/80 transition-colors"
              >
                <span className="w-4 h-4 flex items-center justify-center text-xs">📖</span>
                <span>Buku Tamu Publik</span>
              </Link>
            </div>
          </nav>
        </div>

        {/* Profil User & Tombol Keluar */}
        <div className="p-3.5 border-t border-zinc-100 space-y-3">
          <div className="p-3 rounded-2xl bg-zinc-50 border border-zinc-200/80">
            <div className="flex items-center justify-between mb-1.5">
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${roleBadgeColor[user?.role] || "bg-zinc-100 text-zinc-700"
                  }`}
              >
                {roleLabelMap[user?.role] || user?.role}
              </span>
              {user?.department && (
                <span className="text-[10px] text-zinc-400 font-medium truncate max-w-[110px]">
                  {user.department}
                </span>
              )}
            </div>
            <p className="text-xs font-bold text-zinc-900 truncate">
              {user?.name || "Staf Tanimas"}
            </p>
            <p className="text-[11px] text-zinc-500 truncate">
              {user?.email}
            </p>
          </div>

          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 border border-red-200/60 transition-colors cursor-pointer"
          >
            <IconLogOut className="w-4 h-4" />
            <span>Keluar Akun</span>
          </button>
        </div>
      </aside>
    </>
  );
}
