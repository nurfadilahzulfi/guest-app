"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  IconPlus,
  IconCheck,
  IconX,
  IconSpinner,
  IconEdit,
  IconTrash,
  IconChevronDown,
} from "@/components/icons/guest-icons";

/**
 * Komponen dropdown terpadu untuk Master Data (Departemen & Jabatan).
 * Menyediakan dropdown pilihan terstandardisasi dengan fitur tambah, edit, dan hapus
 * data secara instan untuk mencegah kesalahan ketik (typo).
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
  const [isAdding, setIsAdding] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  /** State edit inline: { item: string, value: string } | null */
  const [editingItem, setEditingItem] = useState(null);
  const [editSaving, setEditSaving] = useState(false);

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
        setIsAdding(false);
        setEditingItem(null);
        setNewItemName("");
        setError("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
      setIsOpen(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Hapus ${itemType} "${item}" dari daftar master?`)) return;
    try {
      const res = await fetch(endpoint, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: item }),
      });
      const updatedList = await res.json();
      if (!res.ok) throw new Error(updatedList.error || `Gagal menghapus ${itemType}.`);
      if (Array.isArray(updatedList)) setItems(updatedList);
      else await fetchItems();
      window.dispatchEvent(new Event("master-data-updated"));
      if (value === item) onChange("");
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;
    const trimmedNew = editingItem.value.trim();
    if (!trimmedNew) {
      setError("Nama tidak boleh kosong.");
      return;
    }
    if (trimmedNew.toLowerCase() === editingItem.item.toLowerCase()) {
      setEditingItem(null);
      return;
    }
    setEditSaving(true);
    setError("");
    try {
      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldName: editingItem.item, newName: trimmedNew }),
      });
      const updatedList = await res.json();
      if (!res.ok) throw new Error(updatedList.error || `Gagal mengubah ${itemType}.`);
      if (Array.isArray(updatedList)) setItems(updatedList);
      else await fetchItems();
      window.dispatchEvent(new Event("master-data-updated"));
      if (value === editingItem.item) onChange(trimmedNew);
      setEditingItem(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setEditSaving(false);
    }
  };

  return (
    <div className="space-y-1.5 text-xs" ref={dropdownRef}>
      {/* Header Label & Tombol Tambah */}
      <div className="flex items-center justify-between">
        <label className="block font-semibold text-zinc-700 uppercase tracking-wider text-[10px]">
          {label} {required && "*"}
        </label>
        {!isAdding && (
          <button
            type="button"
            onClick={() => {
              setIsAdding(true);
              setIsOpen(true);
              setEditingItem(null);
              setError("");
            }}
            className="text-[10px] font-semibold text-zinc-800 hover:text-black hover:underline inline-flex items-center gap-1 cursor-pointer"
          >
            <IconPlus className="w-3 h-3 text-zinc-700" />
            <span>+ Tambah {itemType} baru</span>
          </button>
        )}
      </div>

      {/* Baris Input Dropdown & Tombol Aksi Cepat Edit/Hapus */}
      <div className="relative">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              setIsOpen((prev) => !prev);
              setIsAdding(false);
              setEditingItem(null);
              setError("");
            }}
            className="flex-1 flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50/50 hover:bg-white px-3.5 py-2.5 text-xs text-left focus:outline-none focus:border-zinc-900 transition-colors shadow-2xs cursor-pointer"
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

          {/* Tombol aksi langsung (Edit & Hapus) saat nilai terpilih */}
          {value && (
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setEditingItem({ item: value, value: value });
                  setIsOpen(true);
                  setIsAdding(false);
                  setError("");
                }}
                className="inline-flex items-center gap-1 px-2.5 py-2.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700 hover:text-zinc-900 text-[11px] font-semibold transition-colors cursor-pointer shadow-2xs"
                title={`Edit / ganti nama ${itemType} "${value}"`}
              >
                <IconEdit className="w-3.5 h-3.5 text-zinc-700" />
                <span className="hidden sm:inline">Edit</span>
              </button>

              <button
                type="button"
                onClick={() => handleDelete(value)}
                className="inline-flex items-center gap-1 px-2.5 py-2.5 rounded-xl border border-red-200 bg-white hover:bg-red-50 text-red-600 text-[11px] font-semibold transition-colors cursor-pointer shadow-2xs"
                title={`Hapus ${itemType} "${value}" dari daftar master`}
              >
                <IconTrash className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Hapus</span>
              </button>
            </div>
          )}
        </div>

        {/* Panel Dropdown */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-white border border-zinc-200 rounded-2xl shadow-xl overflow-hidden animate-scaleIn">
            {/* Form Tambah Item Baru */}
            {isAdding && (
              <div className="p-3 border-b border-zinc-100 bg-zinc-50/80 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold text-zinc-800">
                    Tambah {itemType} baru:
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAdding(false);
                      setNewItemName("");
                      setError("");
                    }}
                    className="p-1 rounded-md text-zinc-400 hover:bg-zinc-200 cursor-pointer"
                  >
                    <IconX className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    autoFocus
                    placeholder={`Ketik nama ${itemType}...`}
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSaveNew();
                      }
                      if (e.key === "Escape") {
                        setIsAdding(false);
                        setNewItemName("");
                      }
                    }}
                    className="flex-1 rounded-xl border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:border-zinc-900"
                  />
                  <button
                    type="button"
                    disabled={saving}
                    onClick={handleSaveNew}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-black text-white text-[11px] font-bold cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    {saving ? (
                      <IconSpinner className="w-3 h-3" />
                    ) : (
                      <IconCheck className="w-3 h-3" />
                    )}
                    <span>Simpan</span>
                  </button>
                </div>
                {error && <p className="text-[10px] text-red-600 font-medium">{error}</p>}
              </div>
            )}

            {/* Error Message banner */}
            {error && !isAdding && (
              <div className="px-3 py-1.5 bg-red-50 border-b border-red-100 text-[10px] text-red-600 font-medium">
                {error}
              </div>
            )}

            {/* Daftar Item Master */}
            <div className="max-h-52 overflow-y-auto divide-y divide-zinc-100">
              {loading ? (
                <div className="flex items-center justify-center gap-2 p-5 text-zinc-400">
                  <IconSpinner className="w-4 h-4" />
                  <span className="text-xs">Memuat daftar {itemType}...</span>
                </div>
              ) : items.length === 0 && !isAdding ? (
                <div className="p-4 text-center text-zinc-400 text-xs">
                  Belum ada pilihan {itemType}.{" "}
                  <button
                    type="button"
                    onClick={() => setIsAdding(true)}
                    className="font-bold text-zinc-800 underline cursor-pointer"
                  >
                    Tambah sekarang
                  </button>
                </div>
              ) : (
                items.map((item) => (
                  <div
                    key={item}
                    className={`flex items-center justify-between gap-2 px-3.5 py-2 hover:bg-zinc-50 transition-colors ${
                      value === item ? "bg-zinc-100/70" : ""
                    }`}
                  >
                    {editingItem?.item === item ? (
                      /* Mode Edit Inline */
                      <div className="flex-1 flex items-center gap-1.5 py-0.5">
                        <input
                          type="text"
                          autoFocus
                          value={editingItem.value}
                          onChange={(e) =>
                            setEditingItem({ ...editingItem, value: e.target.value })
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleSaveEdit();
                            }
                            if (e.key === "Escape") setEditingItem(null);
                          }}
                          className="flex-1 rounded-lg border border-zinc-300 bg-white px-2.5 py-1 text-xs text-zinc-900 focus:outline-none focus:border-zinc-900"
                        />
                        <button
                          type="button"
                          disabled={editSaving}
                          onClick={handleSaveEdit}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-black text-white text-[10px] font-bold cursor-pointer disabled:opacity-50"
                          title="Simpan perubahan nama"
                        >
                          {editSaving ? (
                            <IconSpinner className="w-3 h-3" />
                          ) : (
                            <IconCheck className="w-3 h-3" />
                          )}
                          <span>Simpan</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingItem(null)}
                          className="p-1 rounded-lg text-zinc-400 hover:bg-zinc-200 cursor-pointer"
                          title="Batal"
                        >
                          <IconX className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      /* Mode Tampil Normal dengan Tombol Edit & Hapus SELALU Terlihat */
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            onChange(item);
                            setIsOpen(false);
                            setEditingItem(null);
                          }}
                          className="flex-1 text-left text-xs font-medium text-zinc-800 hover:text-black flex items-center gap-2 py-0.5 truncate cursor-pointer"
                        >
                          <span className="truncate">{item}</span>
                          {value === item && (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 shrink-0">
                              Terpilih
                            </span>
                          )}
                        </button>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingItem({ item, value: item });
                              setError("");
                            }}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200 transition-colors cursor-pointer"
                            title={`Edit / ganti nama "${item}"`}
                          >
                            <IconEdit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(item);
                            }}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            title={`Hapus "${item}" dari daftar`}
                          >
                            <IconTrash className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Opsi Tambah Baru di Bawah List */}
            {!isAdding && items.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setIsAdding(true);
                  setError("");
                }}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-zinc-700 hover:text-black hover:bg-zinc-50 border-t border-zinc-100 cursor-pointer transition-colors"
              >
                <IconPlus className="w-3.5 h-3.5" />
                <span>Tambah {itemType} baru</span>
              </button>
            )}
          </div>
        )}
      </div>

      {!isOpen && items.length === 0 && !loading && (
        <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-amber-50/70 border border-amber-200/60 text-amber-800 text-[11px]">
          <span>Master data {itemType} belum ada.</span>
          <button
            type="button"
            onClick={() => {
              setIsOpen(true);
              setIsAdding(true);
            }}
            className="font-bold underline hover:text-amber-900 cursor-pointer shrink-0"
          >
            + Tambah Sekarang
          </button>
        </div>
      )}
    </div>
  );
}
