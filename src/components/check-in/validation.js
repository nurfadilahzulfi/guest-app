/**
 * Validasi data formulir per langkah sebelum melanjutkan ke tahapan berikutnya.
 * Seluruh field formulir bersifat wajib diisi/dipilih.
 * @param {number} step - Nomor tahapan yang sedang divalidasi (1 - 4)
 * @param {Object} data - Data formulir tamu saat ini
 * @param {string} data.guestName - Nama lengkap tamu
 * @param {string} data.gender - Jenis kelamin tamu
 * @param {string} data.organization - Asal instansi/perusahaan
 * @param {string} data.guestPhone - Nomor HP tamu
 * @param {string} data.guestEmail - Alamat email tamu
 * @param {string} data.hostId - ID staf/host yang dikunjungi
 * @param {string} data.purpose - Kategori tujuan kunjungan
 * @param {string} [data.purposeNote] - Keterangan jika memilih "Lainnya"
 * @param {string} data.duration - Perkiraan durasi pertemuan
 * @returns {Record<string, string>} Objek pesan kesalahan per field (jika ada)
 */
export function validateStep(step, data) {
  const errors = {};

  if (step === 1) {
    if (!data.guestName || !data.guestName.trim()) {
      errors.guestName = "Nama lengkap wajib diisi.";
    }

    if (!data.gender) {
      errors.gender = "Pilih jenis kelamin Anda.";
    }

    if (!data.organization || !data.organization.trim()) {
      errors.organization = "Asal instansi / perusahaan / organisasi wajib diisi (isi 'Pribadi' jika personal).";
    }


    if (!data.guestPhone || !data.guestPhone.trim()) {
      errors.guestPhone = "Nomor HP wajib diisi.";
    } else if (!/^(\+62|62|0)8[1-9][0-9]{7,10}$/.test(data.guestPhone.replace(/[\s-]/g, ""))) {
      errors.guestPhone = "Format nomor HP tidak valid.";
    }

    if (!data.guestEmail || !data.guestEmail.trim()) {
      errors.guestEmail = "Email wajib diisi.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.guestEmail.trim())) {
      errors.guestEmail = "Format email tidak valid (contoh: nama@email.com).";
    }
  }

  if (step === 2) {
    if (!data.hostId) {
      errors.hostId = "Pilih host yang akan Anda temui.";
    }
  }

  if (step === 3) {
    if (!data.purpose) {
      errors.purpose = "Pilih kategori tujuan kunjungan.";
    }
    if (data.purpose === "Lainnya" && (!data.purposeNote || !data.purposeNote.trim())) {
      errors.purpose = "Isi keterangan tujuan kunjungan Anda.";
    }
    if (!data.duration) {
      errors.duration = "Pilih perkiraan durasi pertemuan.";
    }
  }

  return errors;
}

