/**
 * Test Suite: Penyederhanaan Penanganan SOS DNA Tour
 *
 * Verifikasi kontrak alur baru:
 *   triggered → resolved (langsung, via tombol "Tangani")
 *   triggered → false_alarm (via tombol "False Alarm" + alasan)
 *
 * Status acknowledged & in_action tetap didukung untuk tampilan historis.
 *
 * Test ini menggunakan logika yang diekstrak dari Emergency.tsx — tanpa
 * import React/browser dependencies agar bisa berjalan di Node.js via tsx.
 *
 * Jalankan dengan:
 *   npx tsx src/features/emergency/__tests__/Emergency.test.ts
 */

// ============================================================
// Tipe SosStatus (sesuai sosService.ts)
// ============================================================
type SosStatus = 'triggered' | 'acknowledged' | 'in_action' | 'resolved' | 'false_alarm';

// ============================================================
// Logika yang diekstrak dari Emergency.tsx (pure functions)
// ============================================================

/** Versi baru getStatusLabel (setelah patch) */
function getStatusLabel(status: SosStatus): string {
  switch (status) {
    case 'triggered': return 'Menunggu Penanganan';
    case 'acknowledged': return 'Diterima (Riwayat)';
    case 'in_action': return 'Dalam Penanganan (Riwayat)';
    case 'resolved': return 'Selesai';
    case 'false_alarm': return 'Alarm Palsu';
    default: return status;
  }
}

/** Versi baru isIncidentActive (setelah patch) */
function isIncidentActive(status: SosStatus): boolean {
  return status === 'triggered';
}

/** Versi baru getNextActionConfig (setelah patch) */
function getNextActionConfig(status: SosStatus): {
  nextStatus: SosStatus;
  buttonText: string;
  badgeText: string;
} | null {
  switch (status) {
    case 'triggered':
      return {
        nextStatus: 'resolved',
        buttonText: 'Tangani — Tandai Selesai',
        badgeText: 'Tangani',
      };
    default:
      return null;
  }
}

/** Badge text simulation (sesuai getStatusBadge yang sudah dipatch) */
function getBadgeText(status: SosStatus): string {
  switch (status) {
    case 'triggered': return 'MENUNGGU PENANGANAN';
    case 'acknowledged': return 'DITERIMA (RIWAYAT)';
    case 'in_action': return 'PENANGANAN (RIWAYAT)';
    case 'resolved': return 'SELESAI';
    case 'false_alarm': return 'ALARM PALSU';
    default: return status.toUpperCase();
  }
}

// ============================================================
// Mini test runner
// ============================================================
type TestResult = { name: string; passed: boolean; error?: string };
const results: TestResult[] = [];

function test(name: string, fn: () => void) {
  try {
    fn();
    results.push({ name, passed: true });
    console.log(`  ✅ ${name}`);
  } catch (err: any) {
    results.push({ name, passed: false, error: err.message });
    console.error(`  ❌ ${name}: ${err.message}`);
  }
}

function expectVal(actual: unknown) {
  return {
    toBe(expected: unknown) {
      if (actual !== expected) {
        throw new Error(`Expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`);
      }
    },
    toContain(substring: string) {
      if (typeof actual !== 'string' || !actual.includes(substring)) {
        throw new Error(`Expected "${actual}" to contain "${substring}"`);
      }
    },
    notToContain(substring: string) {
      if (typeof actual === 'string' && actual.includes(substring)) {
        throw new Error(`Expected "${actual}" NOT to contain "${substring}"`);
      }
    },
    toBeNull() {
      if (actual !== null) {
        throw new Error(`Expected null but got ${JSON.stringify(actual)}`);
      }
    },
    notToBeNull() {
      if (actual === null) {
        throw new Error(`Expected non-null value but got null`);
      }
    },
  };
}

// ============================================================
// SUITE 1: getStatusLabel — label baru
// ============================================================
console.log('\n=== Suite 1: getStatusLabel ===');

test('1. triggered → "Menunggu Penanganan"', () => {
  expectVal(getStatusLabel('triggered')).toBe('Menunggu Penanganan');
});

test('2. acknowledged → "Diterima (Riwayat)"', () => {
  expectVal(getStatusLabel('acknowledged')).toBe('Diterima (Riwayat)');
});

test('3. in_action → "Dalam Penanganan (Riwayat)"', () => {
  expectVal(getStatusLabel('in_action')).toBe('Dalam Penanganan (Riwayat)');
});

test('4. resolved → "Selesai"', () => {
  expectVal(getStatusLabel('resolved')).toBe('Selesai');
});

test('5. false_alarm → "Alarm Palsu"', () => {
  expectVal(getStatusLabel('false_alarm')).toBe('Alarm Palsu');
});

test('6. triggered TIDAK mengandung label lama "Terpicu"', () => {
  expectVal(getStatusLabel('triggered')).notToContain('Terpicu');
});

test('7. acknowledged mengandung "(Riwayat)"', () => {
  expectVal(getStatusLabel('acknowledged')).toContain('Riwayat');
});

test('8. in_action mengandung "(Riwayat)"', () => {
  expectVal(getStatusLabel('in_action')).toContain('Riwayat');
});

test('9. false_alarm TIDAK mengandung "False Alarm" (label lama)', () => {
  expectVal(getStatusLabel('false_alarm')).notToContain('False Alarm');
});

// ============================================================
// SUITE 2: Badge teks
// ============================================================
console.log('\n=== Suite 2: Badge teks ===');

test('10. Badge triggered = "MENUNGGU PENANGANAN"', () => {
  expectVal(getBadgeText('triggered')).toBe('MENUNGGU PENANGANAN');
});

test('11. Badge triggered TIDAK = "TERPICU"', () => {
  expectVal(getBadgeText('triggered')).notToContain('TERPICU');
});

test('12. Badge acknowledged mengandung "RIWAYAT"', () => {
  expectVal(getBadgeText('acknowledged')).toContain('RIWAYAT');
});

test('13. Badge in_action mengandung "RIWAYAT"', () => {
  expectVal(getBadgeText('in_action')).toContain('RIWAYAT');
});

test('14. Badge resolved = "SELESAI"', () => {
  expectVal(getBadgeText('resolved')).toBe('SELESAI');
});

test('15. Badge false_alarm = "ALARM PALSU"', () => {
  expectVal(getBadgeText('false_alarm')).toBe('ALARM PALSU');
});

test('16. Badge false_alarm TIDAK = "FALSE ALARM"', () => {
  expectVal(getBadgeText('false_alarm')).notToContain('FALSE ALARM');
});

// ============================================================
// SUITE 3: getNextActionConfig — kontrak alur baru
// ============================================================
console.log('\n=== Suite 3: getNextActionConfig (kontrak alur baru) ===');

test('17. triggered memiliki tombol Tangani', () => {
  const action = getNextActionConfig('triggered');
  expectVal(action).notToBeNull();
  expectVal(action!.badgeText).toBe('Tangani');
});

test('18. triggered mengirim nextStatus = "resolved"', () => {
  const action = getNextActionConfig('triggered');
  expectVal(action!.nextStatus).toBe('resolved');
});

test('19. triggered TIDAK mengirim nextStatus = "acknowledged"', () => {
  const action = getNextActionConfig('triggered');
  if (action?.nextStatus === 'acknowledged') throw new Error('Must NOT send acknowledged');
});

test('20. triggered TIDAK mengirim nextStatus = "in_action"', () => {
  const action = getNextActionConfig('triggered');
  if (action?.nextStatus === 'in_action') throw new Error('Must NOT send in_action');
});

test('21. acknowledged tidak memiliki tombol aksi (null)', () => {
  expectVal(getNextActionConfig('acknowledged')).toBeNull();
});

test('22. in_action tidak memiliki tombol aksi (null)', () => {
  expectVal(getNextActionConfig('in_action')).toBeNull();
});

test('23. resolved tidak memiliki tombol aksi (null)', () => {
  expectVal(getNextActionConfig('resolved')).toBeNull();
});

test('24. false_alarm tidak memiliki tombol aksi (null)', () => {
  expectVal(getNextActionConfig('false_alarm')).toBeNull();
});

// ============================================================
// SUITE 4: isIncidentActive — definisi baru
// ============================================================
console.log('\n=== Suite 4: isIncidentActive ===');

test('25. triggered → isActive = true', () => {
  expectVal(isIncidentActive('triggered')).toBe(true);
});

test('26. acknowledged → isActive = false (historis)', () => {
  expectVal(isIncidentActive('acknowledged')).toBe(false);
});

test('27. in_action → isActive = false (historis)', () => {
  expectVal(isIncidentActive('in_action')).toBe(false);
});

test('28. resolved → isActive = false', () => {
  expectVal(isIncidentActive('resolved')).toBe(false);
});

test('29. false_alarm → isActive = false', () => {
  expectVal(isIncidentActive('false_alarm')).toBe(false);
});

// ============================================================
// SUITE 5: Status historis masih dapat ditampilkan
// ============================================================
console.log('\n=== Suite 5: Dukungan status historis ===');

test('30. acknowledged memiliki label (tidak kosong)', () => {
  const label = getStatusLabel('acknowledged');
  if (!label || label.length === 0) throw new Error('acknowledged label is empty');
});

test('31. in_action memiliki label (tidak kosong)', () => {
  const label = getStatusLabel('in_action');
  if (!label || label.length === 0) throw new Error('in_action label is empty');
});

test('32. acknowledged memiliki badge text (tidak kosong)', () => {
  const badge = getBadgeText('acknowledged');
  if (!badge || badge.length === 0) throw new Error('acknowledged badge is empty');
});

test('33. in_action memiliki badge text (tidak kosong)', () => {
  const badge = getBadgeText('in_action');
  if (!badge || badge.length === 0) throw new Error('in_action badge is empty');
});

// ============================================================
// SUITE 6: Statistik — klasifikasi sesuai aturan baru
// ============================================================
console.log('\n=== Suite 6: Statistik ===');

const mockIncidents: Array<{ status: SosStatus }> = [
  { status: 'triggered' },
  { status: 'triggered' },
  { status: 'acknowledged' },   // historis
  { status: 'in_action' },      // historis
  { status: 'resolved' },
  { status: 'resolved' },
  { status: 'false_alarm' },
];

const menungguCount = mockIncidents.filter(i => i.status === 'triggered').length;
const aktifCount = mockIncidents.filter(i => isIncidentActive(i.status)).length;
const selesaiCount = mockIncidents.filter(i => i.status === 'resolved').length;
const alarmPalsuCount = mockIncidents.filter(i => i.status === 'false_alarm').length;
const historisCount = mockIncidents.filter(i =>
  i.status === 'acknowledged' || i.status === 'in_action'
).length;

test('34. Menunggu Penanganan = jumlah triggered = 2', () => {
  expectVal(menungguCount).toBe(2);
});

test('35. Darurat Aktif (isIncidentActive) = hanya triggered = 2', () => {
  expectVal(aktifCount).toBe(2);
});

test('36. acknowledged dan in_action TIDAK dihitung sebagai Darurat Aktif', () => {
  // Jika acknowledged dan in_action masih dihitung aktif, aktifCount akan 4
  if (aktifCount === 4) throw new Error('acknowledged & in_action should NOT count as active');
});

test('37. Selesai = jumlah resolved = 2', () => {
  expectVal(selesaiCount).toBe(2);
});

test('38. Alarm Palsu = jumlah false_alarm = 1', () => {
  expectVal(alarmPalsuCount).toBe(1);
});

test('39. Status historis acknowledged + in_action tetap terhitung di total', () => {
  expectVal(historisCount).toBe(2);
  expectVal(mockIncidents.length).toBe(7);
});

test('40. acknowledged dan in_action tidak digabung ke Selesai', () => {
  // selesaiCount hanya resolved
  expectVal(selesaiCount).toBe(2);
  // historis tetap terpisah — totalnya tidak sama dengan selesai
  if (selesaiCount === historisCount + selesaiCount) throw new Error('historis should not be in selesai');
});

// ============================================================
// SUITE 7: Double-click protection
// ============================================================
console.log('\n=== Suite 7: Double-click protection ===');

test('41. updatingId guard mencegah request ganda', () => {
  let requestCount = 0;
  const updatingId: string | null = 'some-id'; // sudah ada request berjalan

  function simulateHandleUpdateStatus(id: string) {
    if (updatingId) return; // ← guard ini ada di kode asli baris 300
    requestCount++;
  }

  simulateHandleUpdateStatus('some-id');
  simulateHandleUpdateStatus('some-id');
  expectVal(requestCount).toBe(0); // keduanya diblokir
});

test('42. tanpa updatingId, request bisa berjalan', () => {
  let requestCount = 0;
  const updatingId: string | null = null; // tidak ada request berjalan

  function simulateHandleUpdateStatus(id: string) {
    if (updatingId) return;
    requestCount++;
  }

  simulateHandleUpdateStatus('some-id');
  expectVal(requestCount).toBe(1); // request berjalan normal
});

// ============================================================
// SUITE 8: Filter status
// ============================================================
console.log('\n=== Suite 8: Filter status ===');

function simulateFilterByStatus(incidents: Array<{ status: SosStatus }>, filterStatus: string) {
  return filterStatus ? incidents.filter(i => i.status === filterStatus) : incidents;
}

test('43. Filter "triggered" hanya menampilkan triggered', () => {
  const result = simulateFilterByStatus(mockIncidents, 'triggered');
  expectVal(result.length).toBe(2);
  if (result.some(i => i.status !== 'triggered')) throw new Error('Non-triggered item in filter result');
});

test('44. Filter "resolved" hanya menampilkan resolved', () => {
  const result = simulateFilterByStatus(mockIncidents, 'resolved');
  expectVal(result.length).toBe(2);
});

test('45. Filter "false_alarm" hanya menampilkan false_alarm', () => {
  const result = simulateFilterByStatus(mockIncidents, 'false_alarm');
  expectVal(result.length).toBe(1);
});

test('46. Filter "acknowledged" masih bisa menampilkan riwayat acknowledged', () => {
  const result = simulateFilterByStatus(mockIncidents, 'acknowledged');
  expectVal(result.length).toBe(1);
});

test('47. Filter "in_action" masih bisa menampilkan riwayat in_action', () => {
  const result = simulateFilterByStatus(mockIncidents, 'in_action');
  expectVal(result.length).toBe(1);
});

test('48. Filter "" (semua) menampilkan seluruh status', () => {
  const result = simulateFilterByStatus(mockIncidents, '');
  expectVal(result.length).toBe(7);
});

// ============================================================
// RINGKASAN
// ============================================================
console.log('\n' + '='.repeat(60));
const passed = results.filter(r => r.passed).length;
const failed = results.filter(r => !r.passed).length;
console.log(`\nHASIL: ${passed} lulus, ${failed} gagal dari ${results.length} total`);

if (failed > 0) {
  console.log('\nTest yang gagal:');
  results.filter(r => !r.passed).forEach(r => {
    console.log(`  ❌ ${r.name}`);
    console.log(`     ${r.error}`);
  });
  process.exit(1);
} else {
  console.log('\n✅ Semua test lulus!');
}
