"use client";

import { useState, useEffect, useCallback } from "react";
import { IconPlus, IconCheck, IconX, IconSpinner } from "@/components/icons/guest-icons";

/**
 * Komponen dropdown terpadu untuk Master Data (Departemen & Jabatan).
 * Menyediakan dropdown pilihan terstandardisasi dengan fitur tambah data baru secara instan
 * untuk mencegah kesalahan ketik (typo).
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
  const [isAdding, setIsAdding] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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

  const handleSaveNew = async (e) => {
    e?.preventDefault();
    if (!newItemName.trim()) {
      setError(`Nama ${itemType} tidak boleh kosong.`);
      return;
    }

    setSaving(true);
    setError("");

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newItemName.trim() }),
      });

      const updatedList = await res.json();
      if (!res.ok) throw new Error(updatedList.error || `Gagal menambahkan ${itemType}.`);

      if (Array.isArray(updatedList)) {
        setItems(updatedList);
      } else {
        await fetchItems();
      }

      window.dispatchEvent(new Event("master-data-updated"));
      onChange(newItemName.trim());
      setIsAdding(false);
      setNewItemName("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-1 text-xs">
      <div className="flex items-center justify-between">
        <label className="block font-semibold text-zinc-700 uppercase tracking-wider text-[10px]">
          {label} {required && "*"}
        </label>
        {!isAdding && (
          <button
            type="button"
            onClick={() => {
              setIsAdding(true);
              setError("");
            }}
            className="text-[10px] font-semibold text-zinc-900 hover:underline inline-flex items-center gap-1 cursor-pointer"
          >
            <IconPlus className="w-3 h-3" />
            <span>Tambah {itemType} baru</span>
          </button>
        )}
      </div>

      {isAdding ? (
        /* Mode Form Tambah Item Baru */
        <div className="p-2.5 rounded-xl border border-zinc-300 bg-zinc-50 space-y-2 animate-fadeIn">
          <p className="text-[11px] font-bold text-zinc-800">
            Tambah {itemType} baru ke master data:
          </p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              autoFocus
              placeholder={`Contoh nama ${itemType}...`}
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSaveNew();
                }
              }}
              className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:border-zinc-900"
            />
            <button
              type="button"
              disabled={saving}
              onClick={handleSaveNew}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-black text-white text-[11px] font-semibold transition-colors cursor-pointer disabled:opacity-50"
            >
              {saving ? <IconSpinner className="w-3 h-3" /> : <IconCheck className="w-3 h-3" />}
              <span>Simpan</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setNewItemName("");
                setError("");
              }}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/60 transition-colors cursor-pointer"
              title="Batal"
            >
              <IconX className="w-4 h-4" />
            </button>
          </div>
          {error && <p className="text-[10px] text-red-600">{error}</p>}
        </div>
      ) : (
        /* Mode Select Dropdown */
        <div className="space-y-1.5">
          <div className="relative">
            <select
              required={required}
              value={value}
              onChange={(e) => {
                if (e.target.value === "__NEW__") {
                  setIsAdding(true);
                } else {
                  onChange(e.target.value);
                }
              }}
              disabled={loading}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-800 focus:outline-none focus:border-zinc-900 transition-colors disabled:bg-zinc-50"
            >
              <option value="">
                {loading
                  ? `Memuat daftar ${itemType}...`
                  : items.length === 0
                  ? `-- Belum ada ${itemType} (Klik + Tambah) --`
                  : placeholder}
              </option>
              {items.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
              <option value="__NEW__" className="font-semibold text-zinc-900">
                + Tambah {itemType} Baru...
              </option>
            </select>
          </div>
          {items.length === 0 && !loading && (
            <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-amber-50/70 border border-amber-200/60 text-amber-800 text-[11px]">
              <span>Master data {itemType} belum ada.</span>
              <button
                type="button"
                onClick={() => setIsAdding(true)}
                className="font-bold underline hover:text-amber-900 cursor-pointer shrink-0"
              >
                + Tambah Sekarang
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
