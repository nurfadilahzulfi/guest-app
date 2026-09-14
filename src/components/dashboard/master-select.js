"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  IconCheck,
  IconSpinner,
  IconChevronDown,
} from "@/components/icons/guest-icons";

/**
 * Komponen dropdown terpadu untuk Master Data (Departemen & Jabatan).
 * Menyediakan dropdown pilihan terstandardisasi dari data master.
 *
 * @param {Object} props
 * @param {string} props.label - Label field
 * @param {boolean} [props.required=false] - Apakah field wajib diisi
 * @param {string} props.value - Nilai yang sedang dipilih
 * @param {function(string): void} props.onChange - Handler perubahan nilai
 * @param {string} props.endpoint - Endpoint API (misal "/api/departments" atau "/api/positions")
 * @param {string} [props.placeholder="Pilih opsi..."] - Teks placeholder
 * @param {string} [props.itemType="data"] - Jenis data (misal "departemen" atau "jabatan")
 */
export function MasterSelect({
  label,
  required = false,
  value,
  onChange,
  endpoint,
  placeholder = "Pilih opsi...",
  itemType = "data",
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  const dropdownRef = useRef(null);

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        setItems(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error(`Gagal memuat ${itemType}:`, err);
    } finally {
      setLoading(false);
    }
  }, [endpoint, itemType]);

  useEffect(() => {
    fetchItems();
    const handleUpdate = () => fetchItems();
    window.addEventListener("master-data-updated", handleUpdate);
    return () => window.removeEventListener("master-data-updated", handleUpdate);
  }, [fetchItems]);

  // Tutup dropdown ketika klik di luar
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="space-y-1.5 text-xs" ref={dropdownRef}>
      {/* Header Label */}
      <div>
        <label className="block font-semibold text-zinc-700 uppercase tracking-wider text-[10px]">
          {label} {required && "*"}
        </label>
      </div>

      {/* Baris Input Dropdown */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="w-full flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50/50 hover:bg-white px-3.5 py-2.5 text-xs text-left focus:outline-none focus:border-zinc-900 transition-colors shadow-2xs cursor-pointer"
        >
          <span className={value ? "text-zinc-900 font-semibold truncate" : "text-zinc-400"}>
            {loading ? `Memuat daftar ${itemType}...` : (value || placeholder)}
          </span>
          <IconChevronDown
            className={`w-3.5 h-3.5 text-zinc-400 shrink-0 ml-2 transition-transform duration-150 ${
              isOpen ? "rotate-180 text-zinc-900" : ""
            }`}
          />
        </button>

        {/* Panel Dropdown */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-white border border-zinc-200 rounded-2xl shadow-xl overflow-hidden animate-scaleIn">
            {/* Daftar Item Master */}
            <div className="max-h-52 overflow-y-auto divide-y divide-zinc-100">
              {loading ? (
                <div className="flex items-center justify-center gap-2 p-5 text-zinc-400">
                  <IconSpinner className="w-4 h-4" />
                  <span className="text-xs">Memuat daftar {itemType}...</span>
                </div>
              ) : items.length === 0 ? (
                <div className="p-4 text-center text-zinc-400 text-xs">
                  Belum ada pilihan {itemType}.
                </div>
              ) : (
                items.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      onChange(item);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left text-xs font-medium px-3.5 py-2.5 flex items-center justify-between hover:bg-zinc-50 transition-colors cursor-pointer ${
                      value === item
                        ? "bg-zinc-100/70 text-zinc-900 font-semibold"
                        : "text-zinc-700 hover:text-black"
                    }`}
                  >
                    <span className="truncate">{item}</span>
                    {value === item && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 shrink-0 flex items-center gap-1">
                        <IconCheck className="w-3 h-3 text-emerald-600" />
                        Terpilih
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
