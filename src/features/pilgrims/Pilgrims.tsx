import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { toast } from '@/lib/toast';
import { ConfirmDeleteDialog } from '@/components/ui/ConfirmDeleteDialog';
import { Card } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { 
  Search, Filter, UserPlus, Trash2, Edit2, Eye,
  Users, CreditCard, BookOpen, FileCheck, Phone, 
  X, FileSpreadsheet, Flag, FileText, AlertTriangle,
  Calendar, User, RefreshCw
} from 'lucide-react';
import { Checkbox } from '@/components/ui/Checkbox';
import { useStore, Pilgrim, Group, Package } from '@/core/store';
import { Dialog, DialogContent } from '@/components/ui/Dialog';
import { exportMasterWorkbookToExcel } from '@/lib/export';
import { jamaahService, JamaahPayload, buildJamaahPayload } from '@/core/services/jamaahService';
import { packageService } from '@/core/services/packageService';
import { kloterService } from '@/core/services/kloterService';

export default function Pilgrims() {

// ==========================================
// FITUR: JAMAAH MASTER DATA (/api/jamaah)
// Implementasi Tahap 3B: Tambah & Edit via API
// ==========================================

  const { 
    groups: storeGroups,
    tourLeaders,
    mutawifs,
    schedules,
    emergencies,
    rooms,
    staffStocks,
    financeTransactions,
    financeExpenses
  } = useStore();

  // State Data API Master Jamaah
  const [jamaahList, setJamaahList] = useState<Pilgrim[]>([]);
  const [isJamaahLoading, setIsJamaahLoading] = useState<boolean>(true);
  const [jamaahFetchError, setJamaahFetchError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState<boolean>(false);

  // State Relasi Paket & Kloter dari Backend API
  const [packagesList, setPackagesList] = useState<Package[]>([]);
  const [klotersList, setKlotersList] = useState<Group[]>([]);
  const [packageFetchError, setPackageFetchError] = useState<string | null>(null);
  const [kloterFetchError, setKloterFetchError] = useState<string | null>(null);

  // State Filter & Navigasi UI
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<'all' | 'male' | 'female' | 'elderly' | 'unassigned'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [filterPackage, setFilterPackage] = useState("");
  const [filterGroup, setFilterGroup] = useState("");
  const [filterPassportStatus, setFilterPassportStatus] = useState("");
  const [filterDepartureDate, setFilterDepartureDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // State Modal Detail & Form Edit/Tambah
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isFormAddMode, setIsFormAddMode] = useState<boolean>(false);
  const [selectedPilgrim, setSelectedPilgrim] = useState<Pilgrim | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState<boolean>(false);
  const [detailFetchError, setDetailFetchError] = useState<string | null>(null);
  const [modalTab, setModalTab] = useState<'data-diri' | 'form-edit'>('data-diri');
  const [formData, setFormData] = useState<Partial<Pilgrim>>({});
  
  // State Submit & Error Validasi Backend (422)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const activeDetailUuidRef = useRef<string | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  // Fetch Data Master Jamaah dari GET /api/jamaah
  const fetchJamaahList = useCallback(async () => {
    setIsJamaahLoading(true);
    setJamaahFetchError(null);
    try {
      const data = await jamaahService.getJamaahList();
      setJamaahList(data);
      setHasFetched(true);
    } catch (err: any) {
      console.error("Gagal memuat data master jamaah dari /api/jamaah:", err);
      setJamaahFetchError(err.message || "Gagal memuat data jamaah dari server.");
    } finally {
      setIsJamaahLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJamaahList();
    // Load relasi paket & kloter murni dari API
    packageService.getPackages().then(setPackagesList).catch(err => {
      console.error("Gagal memuat daftar paket:", err);
      setPackageFetchError("Gagal memuat daftar paket dari API.");
    });
    kloterService.getKloters().then(setKlotersList).catch(err => {
      console.error("Gagal memuat daftar kloter:", err);
      setKloterFetchError("Gagal memuat daftar kloter dari API.");
    });
  }, [fetchJamaahList]);

  const formatIndoDate = (dateStr?: string, fallback: string = '-') => {
    if (!dateStr) return fallback;
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
      return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    } catch {
      return dateStr;
    }
  };

  // Statistik Murni dari Respons Backend API
  const totalPilgrims = jamaahList.length;
  const totalMale = jamaahList.filter(p => p.gender === 'Laki-laki' || p.gender === 'L' || p.gender === 'Pria (Male)').length;
  const totalFemale = jamaahList.filter(p => p.gender === 'Perempuan' || p.gender === 'P' || p.gender === 'Wanita (Female)').length;
  const totalElderly = jamaahList.filter(p => (p.age || 0) >= 60).length;
  const totalUnassigned = jamaahList.filter(p => !p.group || p.group === '-' || p.group === 'Belum ada kloter').length;
  const totalPassportReady = jamaahList.filter(p => p.passport && p.passport.trim().length > 3).length;

  const uniqueDepartureDates = useMemo(() => {
    const dates = new Set<string>();
    jamaahList.forEach(p => {
      if (p.departureDate && p.departureDate.trim() && p.departureDate !== '-') {
        dates.add(p.departureDate);
      }
    });
    return Array.from(dates);
  }, [jamaahList]);

  // Logika Filter Data Jamaah
  const filteredPilgrims = useMemo(() => {
    return jamaahList.filter(p => {
      // Tab Filter
      if (activeTab === 'male' && !(p.gender === 'Laki-laki' || p.gender === 'L' || p.gender === 'Pria (Male)')) return false;
      if (activeTab === 'female' && !(p.gender === 'Perempuan' || p.gender === 'P' || p.gender === 'Wanita (Female)')) return false;
      if (activeTab === 'elderly' && (p.age || 0) < 60) return false;
      if (activeTab === 'unassigned' && (p.group && p.group !== '-' && p.group !== 'Belum ada kloter')) return false;

      // Search Query
      const displayId = p.pilgrimId || p.formId || p.id;
      const matchesSearch = !searchTerm.trim() ||
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (p.passport && p.passport.toLowerCase().includes(searchTerm.toLowerCase())) ||
        p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        displayId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.phone && p.phone.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.group && p.group.toLowerCase().includes(searchTerm.toLowerCase()));

      // Dropdown Filters
      const matchesPackage = filterPackage ? p.umrahPackage === filterPackage : true;
      const matchesGroup = filterGroup ? p.group === filterGroup : true;
      const matchesDeparture = filterDepartureDate ? (
        p.departureDate === filterDepartureDate || 
        (p.departureDate && formatIndoDate(p.departureDate) === formatIndoDate(filterDepartureDate))
      ) : true;
      
      let matchesPassport = true;
      if (filterPassportStatus === 'ready') {
        matchesPassport = Boolean(p.passport && p.passport.trim().length > 3);
      } else if (filterPassportStatus === 'pending') {
        matchesPassport = !p.passport || p.passport.trim().length <= 3;
      }

      return matchesSearch && matchesPackage && matchesGroup && matchesDeparture && matchesPassport;
    });
  }, [jamaahList, activeTab, searchTerm, filterPackage, filterGroup, filterDepartureDate, filterPassportStatus]);

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredPilgrims.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredPilgrims.map(p => p.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleDeleteSelected = () => {
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    const idsToDelete = Array.from(selectedIds);
    if (idsToDelete.length === 0) {
      setIsDeleteDialogOpen(false);
      return;
    }
    setIsDeleting(true);
    let successCount = 0;
    const failures: string[] = [];
    for (const id of idsToDelete) {
      try {
        await jamaahService.deleteJamaah(id);
        successCount++;
      } catch (err: any) {
        console.error(`Gagal menghapus jamaah UUID ${id}:`, err);
        failures.push(id);
      }
    }
    setIsDeleting(false);
    setIsDeleteDialogOpen(false);
    if (failures.length === 0) {
      setSelectedIds(new Set());
      toast(
        successCount === 1
          ? "1 data jamaah berhasil dihapus dari backend."
          : `${successCount} data jamaah berhasil dihapus dari backend.`,
        "success"
      );
    } else {
      // Clear only successfully deleted IDs; keep failed ones selected so user can retry
      setSelectedIds(new Set(failures));
      toast(
        `${successCount} berhasil dihapus, ${failures.length} gagal. Silakan coba lagi untuk yang gagal.`,
        "error"
      );
    }
    // Refresh list regardless
    try {
      await fetchJamaahList();
    } catch {
      toast("Data dihapus dari server, namun gagal memperbarui tabel. Klik Refresh.", "info");
    }
  };

  // Open Detail Modal (GET /api/jamaah/{id})
  const openDetailModal = async (p: Pilgrim) => {
    const targetUuid = p.id; // UUID backend
    activeDetailUuidRef.current = targetUuid;

    setSelectedPilgrim(p);
    setFormData({ ...p });
    setDetailFetchError(null);
    setFieldErrors({});
    setModalTab('data-diri');
    setIsFormAddMode(false);
    setIsFormModalOpen(true);
    setIsDetailLoading(true);

    try {
      const detailData = await jamaahService.getJamaahDetail(targetUuid);
      if (activeDetailUuidRef.current === targetUuid) {
        setSelectedPilgrim(detailData);
        setFormData({ ...detailData });
      }
    } catch (err: any) {
      if (activeDetailUuidRef.current === targetUuid) {
        console.error(`Gagal mengambil detail jamaah UUID ${targetUuid}:`, err);
        setDetailFetchError(err.message || "Gagal memuat detail jamaah dari server.");
      }
    } finally {
      if (activeDetailUuidRef.current === targetUuid) {
        setIsDetailLoading(false);
      }
    }
  };

  // Open Add Modal (POST /api/jamaah)
  const openAddModal = () => {
    setSelectedPilgrim(null);
    setIsFormAddMode(true);
    setFieldErrors({});
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    setFormData({
      pilgrimId: `JMH-${randomSuffix}`,
      ktp: '',
      name: '',
      gender: 'Laki-laki',
      birthDate: '',
      phone: '',
      emergencyContact: '',
      passport: '',
      visaNumber: '',
      nationality: 'Indonesia',
      packageId: '',
      kloterId: '',
      hotelMakkah: '',
      hotelMadinah: '',
      departureDate: '',
      returnDate: '',
      tourLeader: '',
      mutawifLocal: '',
      status: 'active',
    });
    setModalTab('form-edit');
    setIsFormModalOpen(true);
  };

  // Open Edit Modal (PUT /api/jamaah/{id})
  // Wajib mengambil detail terbaru via GET /api/jamaah/{uuid} sebelum mengizinkan edit/simpan
  const openEditModal = async (p: Pilgrim) => {
    const targetUuid = p.id;
    activeDetailUuidRef.current = targetUuid;

    setSelectedPilgrim(p);
    setIsFormAddMode(false);
    setFieldErrors({});
    setDetailFetchError(null);
    
    // Set awal dari baris tabel (sementara menunggu GET detail)
    setFormData({
      id: p.id,
      pilgrimId: p.pilgrimId || '',
      ktp: p.ktp || '',
      name: p.name || '',
      gender: p.gender || 'Laki-laki',
      birthDate: p.birthDate || '',
      phone: p.phone || '',
      emergencyContact: p.emergencyContact || '',
      passport: p.passport || '',
      visaNumber: p.visaNumber || '',
      nationality: p.nationality || 'Indonesia',
      packageId: p.packageId || '',
      kloterId: p.kloterId || '',
      hotelMakkah: p.hotelMakkah || '',
      hotelMadinah: p.hotelMadinah || '',
      departureDate: p.departureDate || '',
      returnDate: p.returnDate || '',
      tourLeader: p.tourLeader || '',
      mutawifLocal: p.mutawifLocal || '',
      status: p.status || 'active',
    });

    setModalTab('form-edit');
    setIsFormModalOpen(true);
    setIsDetailLoading(true);

    try {
      const detailData = await jamaahService.getJamaahDetail(targetUuid);
      if (activeDetailUuidRef.current === targetUuid) {
        setSelectedPilgrim(detailData);
        setFormData({ ...detailData });
      }
    } catch (err: any) {
      if (activeDetailUuidRef.current === targetUuid) {
        console.error(`Gagal memuat detail terbaru jamaah UUID ${targetUuid}:`, err);
        setDetailFetchError(err.message || "Gagal mengambil detail terbaru dari server.");
      }
    } finally {
      if (activeDetailUuidRef.current === targetUuid) {
        setIsDetailLoading(false);
      }
    }
  };

  // Simpan Form (Tambah/Edit Master Jamaah) via API Backend
  const savePilgrim = async () => {
    setFieldErrors({});

    // Validasi Client-Side
    const loginIdVal = (formData.pilgrimId || '').trim();
    if (!loginIdVal) {
      setFieldErrors({ login_id: ["ID Login (login_id) wajib diisi."] });
      toast("ID Login Jamaah wajib diisi.", "error");
      return;
    }
    if (loginIdVal.length > 10) {
      setFieldErrors({ login_id: ["ID Login maksimal 10 karakter."] });
      toast("ID Login maksimal 10 karakter.", "error");
      return;
    }

    const nikVal = (formData.ktp || '').trim();
    if (isFormAddMode || nikVal) {
      if (!nikVal) {
        setFieldErrors({ nik: ["NIK KTP wajib diisi (tepat 16 digit angka)."] });
        toast("NIK KTP wajib diisi.", "error");
        return;
      }
      if (!/^\d{16}$/.test(nikVal)) {
        setFieldErrors({ nik: ["NIK KTP harus terdiri dari tepat 16 digit angka."] });
        toast("NIK KTP harus berupa 16 digit angka.", "error");
        return;
      }
    }

    if (!formData.name || !formData.name.trim()) {
      setFieldErrors({ full_name: ["Nama lengkap wajib diisi."] });
      toast("Nama lengkap wajib diisi.", "error");
      return;
    }

    const payload = buildJamaahPayload(formData);
    setIsSubmitting(true);

    let savedName = '';
    try {
      if (isFormAddMode) {
        const created = await jamaahService.createJamaah(payload as JamaahPayload);
        savedName = created.name;
      } else if (selectedPilgrim?.id) {
        const updated = await jamaahService.updateJamaah(selectedPilgrim.id, payload);
        savedName = updated.name;
      }
      toast(`Data jamaah "${savedName || 'jamaah'}" berhasil disimpan!`, "success");
      setIsFormModalOpen(false);
    } catch (err: any) {
      console.error("Gagal menyimpan data master jamaah ke server:", err);
      if (err.errors && typeof err.errors === 'object') {
        setFieldErrors(err.errors);
      }
      toast(err.message || "Gagal menyimpan data jamaah ke server.", "error");
      setIsSubmitting(false);
      return; // Berhenti jika POST/PUT gagal; pertahankan input form
    }

    // Penyimpanan berhasil! Coba perbarui daftar tabel
    try {
      await fetchJamaahList();
    } catch (refreshErr) {
      console.error("Simpan API berhasil, tetapi refresh daftar gagal:", refreshErr);
      toast("Data berhasil disimpan ke backend, namun gagal memperbarui tabel. Silakan klik tombol Refresh.", "info");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      const totalIncome = financeTransactions.filter(t => t.type.startsWith('Pemasukan') && t.status === 'Berhasil').reduce((sum, t) => sum + t.amount, 0);
      const totalExpense = financeExpenses
        .filter(t => t.type === 'Pengeluaran')
        .reduce((sum, t) => sum + t.amount, 0);
      const netBalance = totalIncome - totalExpense;

      const targetPilgrims = filteredPilgrims.length > 0 ? filteredPilgrims : jamaahList;

      const masterSheets = [
        {
          sheetName: 'Ringkasan Dashboard',
          title: 'Ringkasan Eksekutif & Master Index System',
          data: [
            { 'Modul / Menu': 'Data Master Jamaah', 'Total Data': `${targetPilgrims.length} Jamaah`, 'Catatan Status': 'Data Master Jamaah /api/jamaah' },
            { 'Modul / Menu': 'Data Kloter & Group', 'Total Data': `${storeGroups.length} Kloter`, 'Catatan Status': 'Rombongan Pembimbing' },
            { 'Modul / Menu': 'Buku Kas Keuangan', 'Total Data': `${financeTransactions.length} Transaksi`, 'Catatan Status': `Net Saldo: Rp ${netBalance.toLocaleString('id-ID')}` },
            { 'Modul / Menu': 'Room Meet Hotel', 'Total Data': `${rooms.length} Kamar`, 'Catatan Status': 'Makkah & Madinah Hotels' },
            { 'Modul / Menu': 'Stok & Inventaris Staff', 'Total Data': `${staffStocks.length} Items`, 'Catatan Status': 'Perlengkapan Staff & Gudang' },
            { 'Modul / Menu': 'SDM Mutawif & TL', 'Total Data': `${tourLeaders.length + mutawifs.length} SDM`, 'Catatan Status': 'Tour Leader & Mutawif Local' },
            { 'Modul / Menu': 'Itinerary & Agenda', 'Total Data': `${schedules.length} Kegiatan`, 'Catatan Status': 'Jadwal Rangkaian Ibadah' },
            { 'Modul / Menu': 'Log Darurat SOS', 'Total Data': `${emergencies.length} Insiden`, 'Catatan Status': 'Riwayat Laporan Darurat' }
          ]
        },
        {
          sheetName: 'Master Jamaah',
          title: 'Master Data Jamaah Umrah - DNA Tour (/api/jamaah)',
          data: targetPilgrims.map(p => ({
            'ID Jamaah (Kode Login)': p.pilgrimId || p.formId || p.id,
            'UUID Internal': p.id,
            'Nama Lengkap': p.name,
            'No. Paspor': p.passport || '-',
            'No. Visa': p.visaNumber || '-',
            'Kewarganegaraan': p.nationality || 'Indonesia',
            'Jenis Kelamin': p.gender || '-',
            'Usia': p.age ?? '-',
            'No. HP': p.phone || '-',
            'Kontak Darurat': p.emergencyContact || '-',
            'Paket Umrah': p.umrahPackage || '-',
            'Kloter / Group': p.group || '-',
            'Tour Leader': p.tourLeader || '-',
            'Mutawif Local': p.mutawifLocal || '-',
            'Hotel Makkah': p.hotelMakkah || p.hotel || '-',
            'Hotel Madinah': p.hotelMadinah || '-',
            'Tgl. Keberangkatan': p.departureDate || '-',
            'Tgl. Kepulangan': p.returnDate || '-'
          }))
        }
      ];

      await exportMasterWorkbookToExcel(masterSheets, `Master_Jamaah_DNA_Tour_${todayStr}`, 'LAPORAN MASTER REKAPITULASI JAMAAH - DNA TOUR');
      toast("Export Master Excel jamaah berhasil diunduh!", "success");
    } catch {
      toast("Gagal melakukan export Excel.", "error");
    }
  };

  const hasActiveFilters = filterPackage || filterGroup || filterDepartureDate || filterPassportStatus;
  const resetFilters = () => {
    setFilterPackage("");
    setFilterGroup("");
    setFilterDepartureDate("");
    setFilterPassportStatus("");
  };

  const totalPages = Math.max(1, Math.ceil(filteredPilgrims.length / itemsPerPage));
  const paginatedData = filteredPilgrims.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Group list for dropdowns (from API or store fallback)
  const availableKloters = klotersList.length > 0 ? klotersList : storeGroups;

  return (
    <div className="space-y-5 pb-10">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">
                Management Jamaah
              </h1>
              {isJamaahLoading ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 animate-pulse">
                  <RefreshCw className="w-3 h-3 mr-1 animate-spin" /> Memuat API...
                </span>
              ) : jamaahFetchError ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                  Gagal Memuat API
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  API Live (/api/jamaah)
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-gray-500 font-normal mt-1">
              Kelola dan pantau data master jamaah resmi terhubung ke backend (/api/jamaah)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            <Button 
              onClick={fetchJamaahList}
              variant="outline"
              disabled={isJamaahLoading}
              className="text-xs h-10 font-semibold text-gray-700 border-gray-200 bg-white hover:bg-gray-50 flex-1 sm:flex-none justify-center px-3 rounded-xl cursor-pointer shadow-2xs"
              title="Perbarui Data dari API"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1 text-gray-600 ${isJamaahLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>

            <Button 
              onClick={handleExportExcel}
              variant="outline"
              className="text-xs h-10 font-semibold text-gray-700 border-gray-200 bg-white hover:bg-gray-50 flex-1 sm:flex-none justify-center px-4 rounded-xl cursor-pointer shadow-2xs"
            >
              <FileSpreadsheet className="w-4 h-4 mr-1.5 text-gray-600" /> 
              Export Excel
            </Button>

            <Button 
              onClick={openAddModal}
              className="bg-[#740A03] hover:bg-[#580802] text-white font-semibold text-xs h-10 px-4 rounded-xl shadow-2xs flex-1 sm:flex-none justify-center cursor-pointer"
            >
              <UserPlus className="w-4 h-4 mr-1.5" /> 
              Tambah Jamaah
            </Button>
          </div>
        </div>
      </div>

      {/* Banner Error Panggilan API */}
      {jamaahFetchError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-red-800 animate-fade-in">
          <div className="flex items-center gap-3 text-xs sm:text-sm font-medium">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            <span>
              {jamaahList.length > 0 
                ? "Pembaruan data dari /api/jamaah gagal. Menampilkan data hasil muat terakhir."
                : `Gagal memuat data master jamaah dari server (/api/jamaah): ${jamaahFetchError}`}
            </span>
          </div>
          <Button 
            onClick={fetchJamaahList}
            variant="outline"
            size="sm"
            className="text-xs font-semibold border-red-300 text-red-700 hover:bg-red-100 rounded-xl shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Coba Lagi
          </Button>
        </div>
      )}

      {/* Stats Cards Grid (Dihitung Murni dari Respons API Backend) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Jamaah Master */}
        <Card 
          onClick={() => { setActiveTab('all'); setCurrentPage(1); }}
          className={`rounded-2xl border bg-white shadow-2xs cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.98] ${
            activeTab === 'all' 
              ? 'border-emerald-600 ring-2 ring-emerald-600/20 bg-emerald-50/20' 
              : 'border-gray-200/80 hover:border-gray-300'
          }`}
        >
          <div className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Master Jamaah</p>
              <h3 className="text-2xl font-bold text-gray-900 tracking-tight">{isJamaahLoading && !hasFetched ? '-' : totalPilgrims}</h3>
              <p className="text-[11px] text-gray-400 font-medium">{totalMale} Pria &bull; {totalFemale} Wanita</p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100 shrink-0">
              <Users className="w-5 h-5" />
            </div>
          </div>
        </Card>

        {/* Card 2: Jamaah Lansia */}
        <Card 
          onClick={() => { setActiveTab('elderly'); setCurrentPage(1); }}
          className={`rounded-2xl border bg-white shadow-2xs cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.98] ${
            activeTab === 'elderly' 
              ? 'border-amber-600 ring-2 ring-amber-600/20 bg-amber-50/20' 
              : 'border-gray-200/80 hover:border-gray-300'
          }`}
        >
          <div className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Jamaah Lansia</p>
              <h3 className="text-2xl font-bold text-gray-900 tracking-tight">{isJamaahLoading && !hasFetched ? '-' : totalElderly}</h3>
              <p className="text-[11px] text-amber-600 font-medium">Usia &ge; 60 Tahun</p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-100 shrink-0">
              <User className="w-5 h-5" />
            </div>
          </div>
        </Card>

        {/* Card 3: Paspor Ready */}
        <Card 
          className="rounded-2xl border border-gray-200/80 bg-white shadow-2xs transition-all duration-200 hover:border-gray-300"
        >
          <div className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Paspor Siap</p>
              <h3 className="text-2xl font-bold text-gray-900 tracking-tight">{isJamaahLoading && !hasFetched ? '-' : totalPassportReady}</h3>
              <p className="text-[11px] text-emerald-600 font-medium">Nomor Paspor Terdata</p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-100 shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
        </Card>

        {/* Card 4: Belum Ada Kloter */}
        <Card 
          onClick={() => { setActiveTab('unassigned'); setCurrentPage(1); }}
          className={`rounded-2xl border bg-white shadow-2xs cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.98] ${
            activeTab === 'unassigned' 
              ? 'border-purple-600 ring-2 ring-purple-600/20 bg-purple-50/20' 
              : 'border-gray-200/80 hover:border-gray-300'
          }`}
        >
          <div className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Belum Ada Kloter</p>
              <h3 className="text-2xl font-bold text-gray-900 tracking-tight">{isJamaahLoading && !hasFetched ? '-' : totalUnassigned}</h3>
              <p className="text-[11px] text-purple-600 font-medium">Perlu Alokasi Kloter</p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-100 shrink-0">
              <Flag className="w-5 h-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="rounded-2xl border border-gray-200/80 bg-white shadow-2xs overflow-hidden">
        {/* Navigation Tabs */}
        <div className="border-b border-gray-100 px-4 pt-3 bg-white">
          <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar pb-0.5">
            <button 
              onClick={() => { setActiveTab('all'); setCurrentPage(1); }}
              className={`relative pb-3 pt-2 px-3.5 text-xs sm:text-sm transition-all duration-200 whitespace-nowrap cursor-pointer flex items-center gap-2 select-none rounded-t-lg group active:scale-[0.96] ${
                activeTab === 'all' 
                  ? 'font-bold text-emerald-900' 
                  : 'font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50/80'
              }`}
            >
              <span>Semua Jamaah</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold transition-all duration-200 ${
                activeTab === 'all' 
                  ? 'bg-emerald-100 text-emerald-800 scale-105' 
                  : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200/80'
              }`}>
                {totalPilgrims}
              </span>
              {activeTab === 'all' && (
                <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-emerald-600 rounded-full animate-tab-indicator" />
              )}
            </button>

            <button 
              onClick={() => { setActiveTab('male'); setCurrentPage(1); }}
              className={`relative pb-3 pt-2 px-3.5 text-xs sm:text-sm transition-all duration-200 whitespace-nowrap cursor-pointer flex items-center gap-2 select-none rounded-t-lg group active:scale-[0.96] ${
                activeTab === 'male' 
                  ? 'font-bold text-blue-900' 
                  : 'font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50/80'
              }`}
            >
              <span>Jamaah Pria</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold transition-all duration-200 ${
                activeTab === 'male' 
                  ? 'bg-blue-100 text-blue-800 scale-105' 
                  : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200/80'
              }`}>
                {totalMale}
              </span>
              {activeTab === 'male' && (
                <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-blue-600 rounded-full animate-tab-indicator" />
              )}
            </button>

            <button 
              onClick={() => { setActiveTab('female'); setCurrentPage(1); }}
              className={`relative pb-3 pt-2 px-3.5 text-xs sm:text-sm transition-all duration-200 whitespace-nowrap cursor-pointer flex items-center gap-2 select-none rounded-t-lg group active:scale-[0.96] ${
                activeTab === 'female' 
                  ? 'font-bold text-pink-900' 
                  : 'font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50/80'
              }`}
            >
              <span>Jamaah Wanita</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold transition-all duration-200 ${
                activeTab === 'female' 
                  ? 'bg-pink-100 text-pink-800 scale-105' 
                  : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200/80'
              }`}>
                {totalFemale}
              </span>
              {activeTab === 'female' && (
                <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-pink-600 rounded-full animate-tab-indicator" />
              )}
            </button>

            <button 
              onClick={() => { setActiveTab('elderly'); setCurrentPage(1); }}
              className={`relative pb-3 pt-2 px-3.5 text-xs sm:text-sm transition-all duration-200 whitespace-nowrap cursor-pointer flex items-center gap-2 select-none rounded-t-lg group active:scale-[0.96] ${
                activeTab === 'elderly' 
                  ? 'font-bold text-amber-900' 
                  : 'font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50/80'
              }`}
            >
              <span>Lansia (&ge;60 Thn)</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold transition-all duration-200 ${
                activeTab === 'elderly' 
                  ? 'bg-amber-100 text-amber-800 scale-105' 
                  : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200/80'
              }`}>
                {totalElderly}
              </span>
              {activeTab === 'elderly' && (
                <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-amber-600 rounded-full animate-tab-indicator" />
              )}
            </button>

            <button 
              onClick={() => { setActiveTab('unassigned'); setCurrentPage(1); }}
              className={`relative pb-3 pt-2 px-3.5 text-xs sm:text-sm transition-all duration-200 whitespace-nowrap cursor-pointer flex items-center gap-2 select-none rounded-t-lg group active:scale-[0.96] ${
                activeTab === 'unassigned' 
                  ? 'font-bold text-purple-900' 
                  : 'font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50/80'
              }`}
            >
              <span>Belum Ada Kloter</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold transition-all duration-200 ${
                activeTab === 'unassigned' 
                  ? 'bg-purple-100 text-purple-800 scale-105' 
                  : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200/80'
              }`}>
                {totalUnassigned}
              </span>
              {activeTab === 'unassigned' && (
                <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-purple-600 rounded-full animate-tab-indicator" />
              )}
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <Input 
              placeholder="Cari nama, ID Jamaah (login_id), paspor, HP..." 
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="pl-9.5 pr-8 h-9.5 rounded-xl border-gray-200 bg-white text-xs sm:text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {selectedIds.size > 0 && (
              <Button 
                onClick={handleDeleteSelected} 
                variant="outline" 
                className="text-xs h-9 font-semibold text-red-600 border-red-200 hover:bg-red-50 px-3.5 rounded-xl"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                Hapus Terpilih ({selectedIds.size})
              </Button>
            )}

            <Button 
              variant={showFilters || hasActiveFilters ? "secondary" : "outline"} 
              className={`text-xs h-9 font-semibold px-3.5 rounded-xl ${
                showFilters || hasActiveFilters 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                  : 'border-gray-200 text-gray-700 hover:bg-gray-50'
              }`} 
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-3.5 h-3.5 mr-1.5" />
              Filter Lanjutan
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-emerald-600 ml-1.5"></span>
              )}
            </Button>
          </div>
        </div>

        {/* Extended Filters Panel */}
        {showFilters && (
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex flex-wrap gap-4 items-end">
            <div className="space-y-1.5 w-full sm:w-48">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Paket Umrah</label>
              <select 
                className="flex h-9 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                value={filterPackage}
                onChange={(e) => { setFilterPackage(e.target.value); setCurrentPage(1); }}
              >
                <option value="">Semua Paket</option>
                {packagesList.length > 0 ? packagesList.map(p => (
                  <option key={p.id} value={p.name}>{p.name}</option>
                )) : (
                  <>
                    <option value="Yamani">Yamani</option>
                    <option value="Raudhah">Raudhah</option>
                    <option value="Multazam">Multazam</option>
                  </>
                )}
              </select>
            </div>

            <div className="space-y-1.5 w-full sm:w-48">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Kloter Rombongan</label>
              <select 
                className="flex h-9 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                value={filterGroup}
                onChange={(e) => { setFilterGroup(e.target.value); setCurrentPage(1); }}
              >
                <option value="">Semua Kloter</option>
                {availableKloters.map(g => (
                  <option key={g.id} value={g.name}>{g.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5 w-full sm:w-40">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Status Paspor</label>
              <select 
                className="flex h-9 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                value={filterPassportStatus}
                onChange={(e) => { setFilterPassportStatus(e.target.value); setCurrentPage(1); }}
              >
                <option value="">Semua Status</option>
                <option value="ready">Paspor Siap</option>
                <option value="pending">Belum Ada Paspor</option>
              </select>
            </div>

            <div className="space-y-1.5 w-full sm:w-48">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Tanggal Keberangkatan</label>
              <select 
                className="flex h-9 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                value={filterDepartureDate}
                onChange={(e) => { setFilterDepartureDate(e.target.value); setCurrentPage(1); }}
              >
                <option value="">Semua Tanggal</option>
                {uniqueDepartureDates.map(d => (
                  <option key={d} value={d}>{formatIndoDate(d)}</option>
                ))}
              </select>
            </div>
            
            {hasActiveFilters && (
              <Button 
                variant="ghost" 
                className="h-9 text-xs text-gray-500 hover:text-gray-900"
                onClick={resetFilters}
              >
                Reset Filter
              </Button>
            )}
          </div>
        )}

        {/* Table View */}
        <div className="overflow-x-auto w-full">
          <Table className="w-full min-w-[1150px]">
            <TableHeader className="bg-gray-50/70 border-b border-gray-100">
              <TableRow className="border-b-gray-100 hover:bg-transparent">
                <TableHead className="w-12 text-center pl-4 py-3.5 whitespace-nowrap">
                  <Checkbox 
                    checked={selectedIds.size > 0 && selectedIds.size === filteredPilgrims.length}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Pilih semua"
                  />
                </TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider font-bold text-gray-500 py-3.5 whitespace-nowrap min-w-[120px]">ID JAMAAH</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider font-bold text-gray-500 py-3.5 whitespace-nowrap min-w-[260px]">PROFIL JAMAAH</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider font-bold text-gray-500 py-3.5 whitespace-nowrap min-w-[180px]">TGL KEBERANGKATAN</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider font-bold text-gray-500 py-3.5 whitespace-nowrap min-w-[180px]">KLOTER ROMBONGAN</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider font-bold text-gray-500 py-3.5 whitespace-nowrap min-w-[200px]">PAKET UMRAH</TableHead>
                <TableHead className="text-right pr-6 text-[11px] uppercase tracking-wider font-bold text-gray-500 py-3.5 whitespace-nowrap min-w-[130px]">AKSI</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody key={activeTab} className="divide-y divide-gray-100 animate-fade-in">
              {isJamaahLoading && !hasFetched ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500 space-y-2">
                      <RefreshCw className="w-6 h-6 text-emerald-600 animate-spin" />
                      <p className="text-sm font-semibold text-gray-700">Memuat data master jamaah dari server (/api/jamaah)...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : paginatedData.map((pilgrim) => {
                const displayId = pilgrim.pilgrimId || pilgrim.formId || pilgrim.id;
                const isElderly = (pilgrim.age || 0) >= 60;
                
                const formatDisplayDate = (dateStr?: string) => {
                  if (!dateStr) return '-';
                  try {
                    const d = new Date(dateStr);
                    if (isNaN(d.getTime())) return dateStr;
                    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
                  } catch {
                    return dateStr;
                  }
                };

                const depFormatted = formatDisplayDate(pilgrim.departureDate);
                const retFormatted = formatDisplayDate(pilgrim.returnDate);
                
                return (
                  <TableRow 
                    key={pilgrim.id} 
                    className={`cursor-pointer transition-colors hover:bg-gray-50/60 ${selectedIds.has(pilgrim.id) ? "bg-[#fcedea]/30" : ""}`}
                    onClick={(e) => {
                      if ((e.target as HTMLElement).closest('input[type="checkbox"], button')) return;
                      openDetailModal(pilgrim);
                    }}
                  >
                    {/* Checkbox */}
                    <TableCell className="pl-4 py-4 whitespace-nowrap">
                      <Checkbox 
                        checked={selectedIds.has(pilgrim.id)}
                        onCheckedChange={() => toggleSelect(pilgrim.id)}
                        aria-label={`Pilih ${pilgrim.name}`}
                      />
                    </TableCell>

                    {/* ID JAMAAH (login_id dari Backend) */}
                    <TableCell className="py-4 whitespace-nowrap">
                      <div className="font-bold text-sm tracking-tight text-[#480c0c] whitespace-nowrap font-mono">
                        {displayId}
                      </div>
                    </TableCell>

                    {/* Profil Jamaah */}
                    <TableCell className="py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#fcedea] text-[#782820] font-bold text-xs flex items-center justify-center shrink-0 border border-[#f5d0cb]">
                          {pilgrim.name ? pilgrim.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'JM'}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-1.5 whitespace-nowrap">
                            <span className="font-bold text-sm text-gray-900 whitespace-nowrap">{pilgrim.name || '-'}</span>
                            {isElderly && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#fdf6e7] text-[#b45309] border border-[#fbe8bf] shrink-0 whitespace-nowrap">
                                Lansia
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500 font-normal mt-0.5 whitespace-nowrap">
                            <span className="whitespace-nowrap">{pilgrim.gender || '-'} {pilgrim.age ? `• ${pilgrim.age} thn` : ''}</span>
                            {pilgrim.phone && (
                              <span className="text-gray-400 whitespace-nowrap">&bull; {pilgrim.phone}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    {/* Tanggal Keberangkatan */}
                    <TableCell className="py-4 whitespace-nowrap">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm text-gray-900 whitespace-nowrap">
                          <Calendar className="w-4 h-4 text-[#782820] shrink-0" />
                          <span className="whitespace-nowrap">{depFormatted}</span>
                        </div>
                        {pilgrim.returnDate && (
                          <div className="text-[11px] text-gray-400 pl-5.5 font-normal whitespace-nowrap">
                            Pulang: {retFormatted}
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {/* Kloter Rombongan */}
                    <TableCell className="py-4 whitespace-nowrap">
                      {pilgrim.group && pilgrim.group !== '-' && pilgrim.group !== 'Belum ada kloter' ? (
                        <span className="inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-bold text-gray-800 bg-white border border-gray-200/90 shadow-2xs whitespace-nowrap shrink-0 tracking-wide uppercase">
                          {pilgrim.group}
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-xs font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 whitespace-nowrap shrink-0">
                          Belum Ada Kloter
                        </span>
                      )}
                    </TableCell>

                    {/* Paket Umrah */}
                    <TableCell className="py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-bold text-[#782820] bg-[#fcedea] border border-[#f5d0cb] shadow-2xs tracking-wide uppercase whitespace-nowrap shrink-0">
                        {pilgrim.umrahPackage || '-'}
                      </span>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right pr-6 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5 whitespace-nowrap shrink-0">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="w-8 h-8 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors shrink-0" 
                          title="Lihat Detail Master Jamaah"
                          onClick={() => openDetailModal(pilgrim)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="w-8 h-8 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors shrink-0" 
                          title="Edit Jamaah"
                          onClick={() => openEditModal(pilgrim)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="w-8 h-8 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors shrink-0" 
                          title="Hapus Jamaah"
                          onClick={() => {
                            setSelectedIds(new Set([pilgrim.id]));
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}

              {!isJamaahLoading && filteredPilgrims.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="h-56 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-3 border border-gray-200">
                        <Users className="w-5 h-5 text-gray-400" />
                      </div>
                      <p className="font-semibold text-gray-900">
                        {searchTerm || hasActiveFilters ? "Tidak ada jamaah yang cocok dengan filter" : "Belum ada data jamaah"}
                      </p>
                      <p className="text-xs text-gray-500 mt-1 max-w-sm">
                        {searchTerm || hasActiveFilters 
                          ? "Coba sesuaikan kata kunci pencarian atau reset filter."
                          : "Data master jamaah dari server (/api/jamaah) belum memiliki entri."}
                      </p>
                      {hasActiveFilters && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-3 text-xs rounded-xl"
                          onClick={resetFilters}
                        >
                          Reset Semua Filter
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-xs text-gray-500">
            Menampilkan <span className="font-semibold text-gray-900">{filteredPilgrims.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> - <span className="font-semibold text-gray-900">{Math.min(currentPage * itemsPerPage, filteredPilgrims.length)}</span> dari <span className="font-semibold text-gray-900">{filteredPilgrims.length}</span> jamaah
          </span>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs h-8 rounded-lg border-gray-200 text-gray-700 flex-1 sm:flex-none cursor-pointer" 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
              disabled={currentPage === 1 || filteredPilgrims.length === 0}
            >
              Sebelumnya
            </Button>
            <span className="text-xs font-medium text-gray-600 px-2">
              Hal {currentPage} / {totalPages}
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs h-8 rounded-lg border-gray-200 text-gray-700 flex-1 sm:flex-none cursor-pointer" 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
              disabled={currentPage === totalPages || filteredPilgrims.length === 0}
            >
              Selanjutnya
            </Button>
          </div>
        </div>
      </Card>

      {/* Modal: Data Diri & Form Edit/Tambah Master Jamaah */}
      <Dialog open={isFormModalOpen} onOpenChange={setIsFormModalOpen}>
        <DialogContent hideClose className="w-[95vw] max-w-3xl sm:w-full max-h-[92vh] bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border-0 overflow-y-auto hide-scrollbar">
          {/* Top Bar Header with Tabs */}
          <div className="flex justify-between items-center pb-5 border-b border-gray-100 mb-6">
            <div className="flex items-center gap-2.5">
              {isFormAddMode ? (
                <button
                  type="button"
                  className="px-6 py-2.5 rounded-full text-sm sm:text-base font-bold bg-[#740A03] text-white shadow-xs cursor-default select-none"
                >
                  Tambah Master Jamaah Baru
                </button>
              ) : selectedPilgrim ? (
                <>
                  <button
                    type="button"
                    onClick={() => setModalTab('data-diri')}
                    className={`px-6 py-2.5 rounded-full text-sm sm:text-base font-bold transition-all duration-200 cursor-pointer active:scale-95 select-none ${
                      modalTab === 'data-diri'
                        ? 'bg-[#00a859] text-white shadow-xs'
                        : 'bg-white text-gray-800 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Data Diri Jamaah
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalTab('form-edit')}
                    className={`px-6 py-2.5 rounded-full text-sm sm:text-base font-bold transition-all duration-200 cursor-pointer active:scale-95 select-none ${
                      modalTab === 'form-edit'
                        ? 'bg-[#00a859] text-white shadow-xs'
                        : 'bg-white text-gray-800 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Form Edit
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="px-6 py-2.5 rounded-full text-sm sm:text-base font-bold bg-[#00a859] text-white shadow-xs cursor-default select-none"
                >
                  Form Master Jamaah
                </button>
              )}
            </div>
            
            <button
              onClick={() => setIsFormModalOpen(false)}
              className="text-gray-400 hover:text-gray-700 p-1.5 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Indikator Loading Detail */}
          {isDetailLoading && (
            <div className="py-6 px-6 bg-blue-50/60 border border-blue-200 rounded-2xl mb-4 text-xs font-semibold text-blue-800 flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
              <span>Memuat detail terbaru dari /api/jamaah/{activeDetailUuidRef.current}...</span>
            </div>
          )}

          {/* Indikator Error Detail */}
          {detailFetchError && (
            <div className="py-4 px-6 bg-red-50 border border-red-200 rounded-2xl mb-4 text-xs font-semibold text-red-800 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span>{detailFetchError}</span>
              </div>
              <Button 
                size="sm"
                variant="outline"
                className="text-xs font-semibold border-red-300 text-red-700 rounded-xl"
                onClick={() => {
                  if (activeDetailUuidRef.current) {
                    openDetailModal({ id: activeDetailUuidRef.current, name: '' } as Pilgrim);
                  }
                }}
              >
                Coba Lagi
              </Button>
            </div>
          )}

          {/* TAB 1: DATA DIRI DETAIL MASTER JAMAAH */}
          {modalTab === 'data-diri' && !isFormAddMode && selectedPilgrim && !isDetailLoading && (() => {
            const activePilgrim = selectedPilgrim;
            const matchedGroup = availableKloters.find(g => g.id === activePilgrim?.kloterId || g.name === activePilgrim?.group);

            const displayId = activePilgrim?.pilgrimId || activePilgrim?.formId || activePilgrim?.id || '-';
            const genderFormatted = activePilgrim?.gender || '-';
            const birthDateFormatted = activePilgrim?.birthDate 
              ? `${formatIndoDate(activePilgrim.birthDate)}${activePilgrim.age ? ` (${activePilgrim.age} Thn)` : ''}`
              : (activePilgrim?.age ? `${activePilgrim.age} Thn` : '-');
            const passportFormatted = activePilgrim?.passport || '-';
            const visaFormatted = activePilgrim?.visaNumber || '-';
            const nationalityFormatted = activePilgrim?.nationality || 'Indonesia';
            const phoneFormatted = activePilgrim?.phone || '-';
            const emergencyFormatted = activePilgrim?.emergencyContact || '-';

            const groupFormatted = activePilgrim?.group || '-';
            const rawTl = matchedGroup?.tourLeader || activePilgrim?.tourLeader || '-';
            const tlFormatted = rawTl && rawTl !== '-' ? (rawTl.includes('(TL)') ? rawTl : `${rawTl} (TL)`) : '-';
            const mutawifFormatted = matchedGroup?.mutawif || activePilgrim?.mutawifLocal || '-';
            const packageFormatted = activePilgrim?.umrahPackage || '-';
            const hotelFormatted = activePilgrim?.hotelMakkah || activePilgrim?.hotel || '-';
            const depFormatted = activePilgrim?.departureDate 
              ? `${formatIndoDate(activePilgrim.departureDate)}`
              : '-';
            const retFormatted = activePilgrim?.returnDate 
              ? `${formatIndoDate(activePilgrim.returnDate)}`
              : '-';

            return (
              <div className="space-y-7 animate-fade-in">
                {/* Card 1: Informasi Pribadi */}
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-3">
                    Informasi Pribadi
                  </h2>

                  <div className="bg-white border border-[#cbd5e1] rounded-3xl overflow-hidden divide-y divide-[#e2e8f0] shadow-2xs">
                    <div className="flex items-center justify-between py-3.5 sm:py-4 px-5 sm:px-6">
                      <div className="flex items-center gap-3.5 text-gray-700 text-sm font-medium">
                        <CreditCard className="w-4 h-4 text-[#782820] shrink-0" />
                        <span>ID Jamaah (login_id)</span>
                      </div>
                      <span className="font-bold text-gray-900 text-sm text-right font-mono">
                        {displayId}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-3.5 sm:py-4 px-5 sm:px-6">
                      <div className="flex items-center gap-3.5 text-gray-700 text-sm font-medium">
                        <User className="w-4 h-4 text-[#782820] shrink-0" />
                        <span>UUID Internal Backend</span>
                      </div>
                      <span className="font-bold text-gray-500 text-xs text-right font-mono truncate max-w-[200px] sm:max-w-none">
                        {activePilgrim?.id}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-3.5 sm:py-4 px-5 sm:px-6">
                      <div className="flex items-center gap-3.5 text-gray-700 text-sm font-medium">
                        <User className="w-4 h-4 text-[#782820] shrink-0" />
                        <span>Nama Lengkap</span>
                      </div>
                      <span className="font-bold text-gray-900 text-sm text-right">
                        {activePilgrim?.name || '-'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-3.5 sm:py-4 px-5 sm:px-6">
                      <div className="flex items-center gap-3.5 text-gray-700 text-sm font-medium">
                        <BookOpen className="w-4 h-4 text-[#782820] shrink-0" />
                        <span>NIK KTP</span>
                      </div>
                      <span className="font-bold text-gray-900 text-sm text-right font-mono">
                        {activePilgrim?.ktp || '-'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-3.5 sm:py-4 px-5 sm:px-6">
                      <div className="flex items-center gap-3.5 text-gray-700 text-sm font-medium">
                        <BookOpen className="w-4 h-4 text-[#782820] shrink-0" />
                        <span>Nomor Paspor</span>
                      </div>
                      <span className="font-bold text-gray-900 text-sm text-right">
                        {passportFormatted}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-3.5 sm:py-4 px-5 sm:px-6">
                      <div className="flex items-center gap-3.5 text-gray-700 text-sm font-medium">
                        <FileCheck className="w-4 h-4 text-[#782820] shrink-0" />
                        <span>Nomor Visa Umrah</span>
                      </div>
                      <span className="font-bold text-gray-900 text-sm text-right">
                        {visaFormatted}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-3.5 sm:py-4 px-5 sm:px-6">
                      <div className="flex items-center gap-3.5 text-gray-700 text-sm font-medium">
                        <Flag className="w-4 h-4 text-[#782820] shrink-0" />
                        <span>Kewarganegaraan</span>
                      </div>
                      <span className="font-bold text-gray-900 text-sm text-right">
                        {nationalityFormatted}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-3.5 sm:py-4 px-5 sm:px-6">
                      <div className="flex items-center gap-3.5 text-gray-700 text-sm font-medium">
                        <User className="w-4 h-4 text-[#782820] shrink-0" />
                        <span>Jenis Kelamin</span>
                      </div>
                      <span className="font-bold text-gray-900 text-sm text-right">
                        {genderFormatted}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-3.5 sm:py-4 px-5 sm:px-6">
                      <div className="flex items-center gap-3.5 text-gray-700 text-sm font-medium">
                        <Calendar className="w-4 h-4 text-[#782820] shrink-0" />
                        <span>Tanggal Lahir &amp; Usia</span>
                      </div>
                      <span className="font-bold text-gray-900 text-sm text-right">
                        {birthDateFormatted}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-3.5 sm:py-4 px-5 sm:px-6">
                      <div className="flex items-center gap-3.5 text-gray-700 text-sm font-medium">
                        <Phone className="w-4 h-4 text-[#782820] shrink-0" />
                        <span>Nomor Telepon</span>
                      </div>
                      <span className="font-bold text-gray-900 text-sm text-right">
                        {phoneFormatted}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-3.5 sm:py-4 px-5 sm:px-6">
                      <div className="flex items-center gap-3.5 text-gray-700 text-sm font-medium">
                        <Phone className="w-4 h-4 text-[#782820] shrink-0" />
                        <span>Kontak Darurat</span>
                      </div>
                      <span className="font-bold text-gray-900 text-sm text-right">
                        {emergencyFormatted}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card 2: Rincian Perjalanan */}
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-3">
                    Rincian Perjalanan
                  </h2>

                  <div className="bg-white border border-[#cbd5e1] rounded-3xl overflow-hidden divide-y divide-[#e2e8f0] shadow-2xs">
                    <div className="flex items-center justify-between py-3.5 sm:py-4 px-5 sm:px-6">
                      <div className="flex items-center gap-3.5 text-gray-700 text-sm font-medium">
                        <Users className="w-4 h-4 text-[#782820] shrink-0" />
                        <span>Kloter Rombongan</span>
                      </div>
                      <span className="font-bold text-gray-900 text-sm text-right">
                        {groupFormatted}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-3.5 sm:py-4 px-5 sm:px-6">
                      <div className="flex items-center gap-3.5 text-gray-700 text-sm font-medium">
                        <User className="w-4 h-4 text-[#782820] shrink-0" />
                        <span>Tour Leader</span>
                      </div>
                      <span className="font-bold text-gray-900 text-sm text-right">
                        {tlFormatted}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-3.5 sm:py-4 px-5 sm:px-6">
                      <div className="flex items-center gap-3.5 text-gray-700 text-sm font-medium">
                        <User className="w-4 h-4 text-[#782820] shrink-0" />
                        <span>Mutawif Lokal</span>
                      </div>
                      <span className="font-bold text-gray-900 text-sm text-right">
                        {mutawifFormatted}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-3.5 sm:py-4 px-5 sm:px-6">
                      <div className="flex items-center gap-3.5 text-gray-700 text-sm font-medium">
                        <FileText className="w-4 h-4 text-[#782820] shrink-0" />
                        <span>Paket Umrah</span>
                      </div>
                      <span className="font-bold text-gray-900 text-sm text-right">
                        {packageFormatted}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-3.5 sm:py-4 px-5 sm:px-6">
                      <div className="flex items-center gap-3.5 text-gray-700 text-sm font-medium">
                        <Calendar className="w-4 h-4 text-[#782820] shrink-0" />
                        <span>Hotel Makkah</span>
                      </div>
                      <span className="font-bold text-gray-900 text-sm text-right">
                        {hotelFormatted}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-3.5 sm:py-4 px-5 sm:px-6">
                      <div className="flex items-center gap-3.5 text-gray-700 text-sm font-medium">
                        <Calendar className="w-4 h-4 text-[#782820] shrink-0" />
                        <span>Hotel Madinah</span>
                      </div>
                      <span className="font-bold text-gray-900 text-sm text-right">
                        {activePilgrim?.hotelMadinah || '-'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-3.5 sm:py-4 px-5 sm:px-6">
                      <div className="flex items-center gap-3.5 text-gray-700 text-sm font-medium">
                        <Calendar className="w-4 h-4 text-[#782820] shrink-0" />
                        <span>Tanggal Keberangkatan</span>
                      </div>
                      <span className="font-bold text-gray-900 text-sm text-right">
                        {depFormatted}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-3.5 sm:py-4 px-5 sm:px-6">
                      <div className="flex items-center gap-3.5 text-gray-700 text-sm font-medium">
                        <Calendar className="w-4 h-4 text-[#782820] shrink-0" />
                        <span>Tanggal Kepulangan</span>
                      </div>
                      <span className="font-bold text-gray-900 text-sm text-right">
                        {retFormatted}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    onClick={() => setIsFormModalOpen(false)}
                    className="w-full h-12 bg-[#740A03] hover:bg-[#580802] text-white font-bold rounded-2xl text-base cursor-pointer shadow-md"
                  >
                    Tutup Detail
                  </Button>
                </div>
              </div>
            );
          })()}

          {/* TAB 2: FORM TAMBAH & EDIT MASTER JAMAAH (API BACKEND /api/jamaah) */}
          {(modalTab === 'form-edit' || isFormAddMode) && (
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                savePilgrim();
              }}
              className="space-y-6 animate-fade-in"
            >
              <div className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-2xl text-xs text-emerald-900 font-medium">
                {isFormAddMode 
                  ? "Formulir Tambah Master Jamaah baru. Data akan disimpan secara permanen ke backend Laravel (/api/jamaah)."
                  : `Mengubah data Jamaah UUID: ${selectedPilgrim?.id}. Perubahan akan disinkronkan ke API (/api/jamaah/${selectedPilgrim?.id}).`}
              </div>

              {/* SEKSI 1: IDENTITAS UTAMA (WAJIB BACKEND) */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#740A03] pb-1 border-b border-gray-100">
                  1. Identitas Utama &amp; Login
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">
                      ID Login Jamaah (login_id) <span className="text-red-500">*</span>
                    </label>
                    <Input 
                      value={formData.pilgrimId || ''} 
                      onChange={(e) => setFormData({ ...formData, pilgrimId: e.target.value })}
                      maxLength={10}
                      placeholder="Misal: JMH-001"
                      className={`h-10 rounded-xl font-mono ${fieldErrors.login_id ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                    />
                    <p className="text-[11px] text-gray-400">Max 10 karakter (kode login mobile).</p>
                    {fieldErrors.login_id && (
                      <p className="text-[11px] text-red-600 font-semibold">{fieldErrors.login_id.join(', ')}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">
                      NIK KTP <span className="text-red-500">*</span>
                    </label>
                    <Input 
                      value={formData.ktp || ''} 
                      onChange={(e) => setFormData({ ...formData, ktp: e.target.value })}
                      maxLength={16}
                      placeholder="16 Digit NIK KTP"
                      className={`h-10 rounded-xl font-mono ${fieldErrors.nik ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                    />
                    {fieldErrors.nik && (
                      <p className="text-[11px] text-red-600 font-semibold">{fieldErrors.nik.join(', ')}</p>
                    )}
                  </div>

                  <div className="space-y-1 sm:col-span-1">
                    <label className="text-xs font-bold text-gray-700">
                      Nama Lengkap Jamaah <span className="text-red-500">*</span>
                    </label>
                    <Input 
                      value={formData.name || ''} 
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Sesuai KTP / Paspor"
                      className={`h-10 rounded-xl ${fieldErrors.full_name ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                    />
                    {fieldErrors.full_name && (
                      <p className="text-[11px] text-red-600 font-semibold">{fieldErrors.full_name.join(', ')}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* SEKSI 2: INFORMASI PRIBADI & KONTAK */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#740A03] pb-1 border-b border-gray-100">
                  2. Informasi Biodata &amp; Kontak
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">Jenis Kelamin</label>
                    <select
                      value={formData.gender || 'Laki-laki'}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="flex h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="Laki-laki">Laki-laki (L)</option>
                      <option value="Perempuan">Perempuan (P)</option>
                    </select>
                    {fieldErrors.gender && (
                      <p className="text-[11px] text-red-600 font-semibold">{fieldErrors.gender.join(', ')}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">Tanggal Lahir</label>
                    <Input 
                      type="date"
                      value={formData.birthDate || ''} 
                      onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                      className="h-10 rounded-xl text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">Nomor Telepon / HP</label>
                    <Input 
                      value={formData.phone || ''} 
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+62 812-..."
                      className="h-10 rounded-xl"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">Kontak Darurat</label>
                    <Input 
                      value={formData.emergencyContact || ''} 
                      onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                      placeholder="Nama & HP Kerabat"
                      className="h-10 rounded-xl"
                    />
                  </div>
                </div>
              </div>

              {/* SEKSI 3: DOKUMEN PERJALANAN */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#740A03] pb-1 border-b border-gray-100">
                  3. Dokumen Perjalanan
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">Nomor Paspor</label>
                    <Input 
                      value={formData.passport || ''} 
                      onChange={(e) => setFormData({ ...formData, passport: e.target.value })}
                      placeholder="Contoh: X-99821014"
                      className="h-10 rounded-xl"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">Nomor Visa Umrah</label>
                    <Input 
                      value={formData.visaNumber || ''} 
                      onChange={(e) => setFormData({ ...formData, visaNumber: e.target.value })}
                      placeholder="Contoh: VSA-2026-99210"
                      className="h-10 rounded-xl"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">Kewarganegaraan</label>
                    <Input 
                      value={formData.nationality ?? ''} 
                      onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                      placeholder="Indonesia"
                      className="h-10 rounded-xl"
                    />
                  </div>
                </div>
              </div>

              {/* SEKSI 4: RELASI PAKET & KLOTER */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#740A03] pb-1 border-b border-gray-100">
                  4. Relasi Paket &amp; Kloter Rombongan
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-gray-700">Paket Umrah</label>
                      {packageFetchError && (
                        <span className="text-[10px] text-amber-600 font-semibold">{packageFetchError}</span>
                      )}
                    </div>
                    <select
                      value={formData.packageId || ''}
                      onChange={(e) => setFormData({ ...formData, packageId: e.target.value })}
                      className="flex h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="">Belum Memilih Paket (Kosong)</option>
                      {formData.packageId && !packagesList.some(p => p.id === formData.packageId) && (
                        <option value={formData.packageId}>
                          {selectedPilgrim?.umrahPackage && selectedPilgrim.umrahPackage !== '-' ? selectedPilgrim.umrahPackage : formData.packageId}
                        </option>
                      )}
                      {packagesList.map(pkg => (
                        <option key={pkg.id} value={pkg.id}>{pkg.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-gray-700">Kloter Rombongan</label>
                      {kloterFetchError && (
                        <span className="text-[10px] text-amber-600 font-semibold">{kloterFetchError}</span>
                      )}
                    </div>
                    <select
                      value={formData.kloterId || ''}
                      onChange={(e) => setFormData({ ...formData, kloterId: e.target.value })}
                      className="flex h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="">Belum Memilih Kloter (Kosong)</option>
                      {formData.kloterId && !klotersList.some(k => k.id === formData.kloterId) && (
                        <option value={formData.kloterId}>
                          {selectedPilgrim?.group && selectedPilgrim.group !== '-' ? selectedPilgrim.group : formData.kloterId}
                        </option>
                      )}
                      {klotersList.map(klt => (
                        <option key={klt.id} value={klt.id}>{klt.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* SEKSI 5: LOGISTIK & PEMBIMBING */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#740A03] pb-1 border-b border-gray-100">
                  5. Logistik Hotel, Tanggal &amp; Pembimbing
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">Hotel Makkah</label>
                    <Input 
                      value={formData.hotelMakkah ?? ''} 
                      onChange={(e) => setFormData({ ...formData, hotelMakkah: e.target.value })}
                      placeholder="Nama Hotel Makkah"
                      className="h-10 rounded-xl"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">Hotel Madinah</label>
                    <Input 
                      value={formData.hotelMadinah || ''} 
                      onChange={(e) => setFormData({ ...formData, hotelMadinah: e.target.value })}
                      placeholder="Nama Hotel Madinah"
                      className="h-10 rounded-xl"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">Tanggal Keberangkatan</label>
                    <Input 
                      type="date"
                      value={formData.departureDate || ''} 
                      onChange={(e) => setFormData({ ...formData, departureDate: e.target.value })}
                      className="h-10 rounded-xl text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">Tanggal Kepulangan</label>
                    <Input 
                      type="date"
                      value={formData.returnDate || ''} 
                      onChange={(e) => setFormData({ ...formData, returnDate: e.target.value })}
                      className={`h-10 rounded-xl text-xs ${fieldErrors.return_date ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                    />
                    {fieldErrors.return_date && (
                      <p className="text-[11px] text-red-600 font-semibold">{fieldErrors.return_date.join(', ')}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">Tour Leader (TL)</label>
                    <Input 
                      value={formData.tourLeader || ''} 
                      onChange={(e) => setFormData({ ...formData, tourLeader: e.target.value })}
                      placeholder="Nama Tour Leader"
                      className="h-10 rounded-xl"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">Mutawif Lokal</label>
                    <Input 
                      value={formData.mutawifLocal || ''} 
                      onChange={(e) => setFormData({ ...formData, mutawifLocal: e.target.value })}
                      placeholder="Nama Mutawif"
                      className="h-10 rounded-xl"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">Status Jamaah</label>
                    <select
                      value={formData.status || 'active'}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'archived' })}
                      className="flex h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="active">Aktif (Active)</option>
                      <option value="archived">Diarsipkan (Archived)</option>
                    </select>
                    <p className="text-[11px] text-gray-400">Arsipkan untuk menonaktifkan tanpa menghapus data.</p>
                  </div>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="pt-4 flex gap-3 border-t border-gray-100">
                <Button 
                  type="button" 
                  variant="outline" 
                  disabled={isSubmitting}
                  onClick={() => setIsFormModalOpen(false)}
                  className="flex-1 h-11 rounded-2xl text-xs font-semibold cursor-pointer"
                >
                  Batal
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex-1 h-11 bg-[#740A03] hover:bg-[#580802] text-white font-bold rounded-2xl text-xs cursor-pointer shadow-md"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" /> Menyimpan...
                    </span>
                  ) : (
                    <span>{isFormAddMode ? "Simpan Jamaah Baru" : "Simpan Perubahan"}</span>
                  )}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <ConfirmDeleteDialog 
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          if (!isDeleting) setIsDeleteDialogOpen(false);
        }}
        onConfirm={confirmDelete}
        itemCount={selectedIds.size || 1}
      />
    </div>
  );
}
