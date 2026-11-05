import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================================
// HELPER: FORMAT ID JAMAAH
// ============================================================
//
// Aturan bisnis:
// - ID Jamaah yang valid berasal dari login_id (Pilgrims) atau
//   pilgrim_id (Registration).
// - p.id pada data registrasi adalah UUID backend, BUKAN ID Jamaah.
// - formId / registration_number adalah nomor registrasi, BUKAN ID Jamaah.
// - Jika tidak tersedia, kembalikan '-'.
//
// Penggunaan:
//   // Modul Pilgrims (p.id = login_id, p.pilgrimId = login_id):
//   formatJamaahId({ loginId: p.id })
//
//   // Modul Registration (p.pilgrimId = pilgrim_id backend, bisa null):
//   formatJamaahId({ pilgrimId: p.pilgrimId })
//
// ============================================================
export function formatJamaahId(data: {
  /** login_id dari entitas Jamaah (Pilgrims module). p.id = login_id */
  loginId?: string | null;
  /** pilgrim_id dari entitas Registration. Bisa null jika belum terhubung jamaah. */
  pilgrimId?: string | null;
}): string {
  const candidate = data.loginId || data.pilgrimId;
  if (!candidate || !candidate.trim()) return '-';
  return candidate.trim();
}

// ============================================================
// HELPER: FORMAT TANGGAL INDONESIA
// ============================================================
//
// Format hasil: "DD MMMM YYYY" (Bahasa Indonesia).
//
// Ketentuan:
// - Input "YYYY-MM-DD" (date-only) -> diproses tanpa timezone shift.
// - Input ISO timestamp (mengandung 'T') -> gunakan UTC agar tidak
//   bergeser hari saat ditampilkan.
// - null, undefined, string kosong -> '-'.
// - Nilai tidak valid -> '-'.
//
// ============================================================
const BULAN_INDONESIA = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
] as const;

export function formatDateIndo(value?: string | null): string {
  if (!value || !value.trim()) return '-';

  const trimmed = value.trim();

  // Pure date-only format: YYYY-MM-DD (no 'T', no timezone shift needed)
  const dateOnlyMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnlyMatch) {
    const year = parseInt(dateOnlyMatch[1], 10);
    const monthIdx = parseInt(dateOnlyMatch[2], 10) - 1;
    const day = parseInt(dateOnlyMatch[3], 10);

    if (
      isNaN(year) || isNaN(monthIdx) || isNaN(day) ||
      monthIdx < 0 || monthIdx > 11 ||
      day < 1 || day > 31
    ) {
      return '-';
    }

    return `${day} ${BULAN_INDONESIA[monthIdx]} ${year}`;
  }

  // ISO timestamp (contains 'T'): use UTC values to avoid timezone-induced day shift
  if (trimmed.includes('T')) {
    const d = new Date(trimmed);
    if (isNaN(d.getTime())) return '-';
    const monthIdx = d.getUTCMonth();
    if (monthIdx < 0 || monthIdx > 11) return '-';
    return `${d.getUTCDate()} ${BULAN_INDONESIA[monthIdx]} ${d.getUTCFullYear()}`;
  }

  // Fallback: try parsing as Date (e.g., "10 Juli 2026" already-formatted strings)
  const d = new Date(trimmed);
  if (isNaN(d.getTime())) return '-';

  const monthIdx = d.getMonth();
  if (monthIdx < 0 || monthIdx > 11) return '-';

  return `${d.getDate()} ${BULAN_INDONESIA[monthIdx]} ${d.getFullYear()}`;
}

// ============================================================
// HELPER: FORMAT ANGKA RIBUAN DENGAN TITIK (.)
// ============================================================
// Contoh: 1000 -> "1.000", 30000000 -> "30.000.000"
export function formatThousand(val?: number | string | null): string {
  if (val === undefined || val === null || val === '') return '';
  const str = String(val);
  const digitsOnly = str.replace(/\D/g, '');
  if (!digitsOnly) return '';
  return digitsOnly.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function unformatThousand(val?: string | null): string {
  if (!val) return '';
  return val.replace(/\D/g, '');
}
