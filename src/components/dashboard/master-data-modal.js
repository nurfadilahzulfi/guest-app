"use client";

import { useState, useEffect, useCallback } from "react";
import {
  IconBuilding,
  IconPlus,
  IconTrash,
  IconX,
  IconSpinner,
  IconCheck,
} from "@/components/icons/guest-icons";

/**
 * Modal Kelola Master Data Departemen dan Jabatan.
 * Memungkinkan Administrator melihat, menambah, dan menghapus daftar departemen dan jabatan
 * agar data karyawan seragam dan bebas dari salah ketik (typo).
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Status visibilitas modal
 * @param {function(): void} props.onClose - Handler menutup modal
 * @param {function(): void} [props.onUpdated] - Callback notifikasi perubahan data
 */
export function MasterDataModal({ isOpen, onClose, onUpdated }) {
  const [activeTab, setActiveTab] = useState("departments"); // "departments" | "positions"

  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [newItemName, setNewItemName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [resDept, resPos] = await Promise.all([
        fetch("/api/departments"),
        fetch("/api/positions"),
      ]);
      if (resDept.ok) setDepartments(await resDept.json());
      if (resPos.ok) setPositions(await resPos.json());
    } catch (err) {
      console.error("Gagal memuat master data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchData();
      setNewItemName("");
      setErrorMsg("");
      setSuccessMsg("");
    }
  }, [isOpen, fetchData]);

  if (!isOpen) return null;

  const handleAdd = async (e) => {
    e.preventDefault();
    const trimmed = newItemName.trim();
    if (!trimmed) {
      setErrorMsg("Nama tidak boleh kosong.");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");

    const endpoint = activeTab === "departments" ? "/api/departments" : "/api/positions";
    const labelType = activeTab === "departments" ? "Departemen" : "Jabatan";

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });

      const updated = await res.json();
      if (!res.ok) throw new Error(updated.error || `Gagal menambahkan ${labelType}.`);

      if (activeTab === "departments") {
        setDepartments(Array.isArray(updated) ? updated : [...departments, trimmed]);
      } else {
        setPositions(Array.isArray(updated) ? updated : [...positions, trimmed]);
      }

      setNewItemName("");
      setSuccessMsg(`${labelType} "${trimmed}" berhasil ditambahkan.`);
      window.dispatchEvent(new Event("master-data-updated"));
      onUpdated?.();
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (name) => {
    const labelType = activeTab === "departments" ? "departemen" : "jabatan";
    if (!window.confirm(`Hapus ${labelType} "${name}" dari daftar master data?`)) return;

    const endpoint = activeTab === "departments" ? "/api/departments" : "/api/positions";

    try {
      const res = await fetch(endpoint, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      const updated = await res.json();
      if (!res.ok) throw new Error(updated.error || `Gagal menghapus ${labelType}.`);

      if (activeTab === "departments") {
        setDepartments(Array.isArray(updated) ? updated : departments.filter((d) => d !== name));
      } else {
        setPositions(Array.isArray(updated) ? updated : positions.filter((p) => p !== name));
      }

      window.dispatchEvent(new Event("master-data-updated"));
      onUpdated?.();
    } catch (err) {
      alert(err.message);
    }
  };

  const currentList = activeTab === "departments" ? departments : positions;
  const currentTitle = activeTab === "departments" ? "Departemen" : "Jabatan";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-zinc-200 max-w-lg w-full p-6 space-y-4 animate-scaleIn">
        {/* Header Modal */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <IconBuilding className="w-5 h-5 text-zinc-700" />
            <h3 className="text-base font-bold text-zinc-900">
              Kelola Master Data Perusahaan
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 cursor-pointer"
          >
            <IconX className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="grid grid-cols-2 p-1 bg-zinc-100 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setActiveTab("departments");
              setErrorMsg("");
              setSuccessMsg("");
            }}
            className={`py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === "departments"
                ? "bg-white text-zinc-900 shadow-xs"
                : "text-zinc-500 hover:text-zinc-800"
            }`}
          >
            Daftar Departemen ({departments.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("positions");
              setErrorMsg("");
              setSuccessMsg("");
            }}
            className={`py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === "positions"
                ? "bg-white text-zinc-900 shadow-xs"
                : "text-zinc-500 hover:text-zinc-800"
            }`}
          >
            Daftar Jabatan ({positions.length})
          </button>
        </div>

        {/* Form Tambah Item */}
        <form onSubmit={handleAdd} className="space-y-2 text-xs">
          <label className="block font-semibold text-zinc-700 uppercase tracking-wider text-[10px]">
            Tambah {currentTitle} Baru
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder={`Contoh nama ${currentTitle.toLowerCase()}...`}
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              className="flex-1 rounded-xl border border-zinc-200 px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:border-zinc-900"
            />
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-black text-white font-semibold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {submitting ? <IconSpinner className="w-3.5 h-3.5" /> : <IconPlus className="w-3.5 h-3.5" />}
              <span>Tambah</span>
            </button>
          </div>

          {errorMsg && <p className="text-xs text-red-600">{errorMsg}</p>}
          {successMsg && (
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-800 text-xs flex items-center gap-1.5">
              <IconCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}
        </form>

        {/* Daftar Data */}
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
            {currentTitle} yang Tersedia di Sistem:
          </p>
          <div className="max-h-56 overflow-y-auto divide-y divide-zinc-100 border border-zinc-200 rounded-2xl bg-zinc-50/50">
            {loading ? (
              <div className="p-8 text-center text-zinc-400 flex items-center justify-center gap-2 text-xs">
                <IconSpinner className="w-4 h-4" />
                <span>Memuat data...</span>
              </div>
            ) : currentList.length === 0 ? (
              <div className="p-6 text-center text-zinc-400 text-xs space-y-1">
                <p className="font-semibold text-zinc-600">Belum ada {currentTitle.toLowerCase()} yang ditambahkan.</p>
                <p className="text-[11px] text-zinc-400">
                  Gunakan formulir di atas untuk menambahkan {currentTitle.toLowerCase()} pertama perusahaan Anda.
                </p>
              </div>
            ) : (
              currentList.map((item) => (
                <div
                  key={item}
                  className="flex items-center justify-between px-3.5 py-2.5 bg-white hover:bg-zinc-50/80 transition-colors"
                >
                  <span className="text-xs font-semibold text-zinc-800">{item}</span>
                  <button
                    type="button"
                    onClick={() => handleDelete(item)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    title={`Hapus ${item}`}
                  >
                    <IconTrash className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer Modal */}
        <div className="pt-2 border-t border-zinc-100 text-right">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-black text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
}
