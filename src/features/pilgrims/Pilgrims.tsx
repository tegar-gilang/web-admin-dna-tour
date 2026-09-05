import React, { useState, useMemo } from 'react';
import { toast } from '@/lib/toast';
import { ConfirmDeleteDialog } from '@/components/ui/ConfirmDeleteDialog';
import { Card, CardContent } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { 
  Search, Filter, UserPlus, Trash2, Edit2, Eye,
  Users, CreditCard, BookOpen, FileCheck, Phone, 
  AlertCircle, Package, Building2, PlaneTakeoff, PlaneLanding, X, FileSpreadsheet,
  CheckCircle2, Clock, HeartPulse, Check, Sparkles, Luggage, Shield,
  ArrowRight, UserCheck, AlertTriangle, Calendar, User, FileText, Flag
} from 'lucide-react';
import { Checkbox } from '@/components/ui/Checkbox';
import { useStore, Pilgrim } from '@/core/store';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { exportMasterWorkbookToExcel } from '@/lib/export';

export default function Pilgrims() {

// ==========================================
// FITUR: PILGRIMS
// Komponen utama untuk fitur PILGRIMS
// ==========================================

  const { 
    pilgrims, 
    addPilgrim, 
    updatePilgrim, 
    deletePilgrims, 
    groups,
    tourLeaders,
    mutawifs,
    schedules,
    emergencies,
    rooms,
    staffStocks,
    financeTransactions
  } = useStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<'all' | 'male' | 'female' | 'elderly' | 'unassigned' | 'unpaid'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [filterPackage, setFilterPackage] = useState("");
  const [filterGroup, setFilterGroup] = useState("");
  const [filterPassportStatus, setFilterPassportStatus] = useState("");
  const [filterDepartureDate, setFilterDepartureDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedPilgrim, setSelectedPilgrim] = useState<Pilgrim | null>(null);
  const [modalTab, setModalTab] = useState<'data-diri' | 'form-edit'>('data-diri');
  const [formData, setFormData] = useState<Partial<Pilgrim>>({});
  const [modifiedDates, setModifiedDates] = useState<{ [key: string]: boolean }>({});

  const todayStr = new Date().toISOString().split('T')[0];

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

  // Stats Calculations
  const totalPilgrims = pilgrims.length;
  const totalMale = pilgrims.filter(p => p.gender === 'Laki-laki' || p.gender === 'L').length;
  const totalFemale = pilgrims.filter(p => p.gender === 'Perempuan' || p.gender === 'P').length;
  const totalElderly = pilgrims.filter(p => (p.age || 0) >= 60).length;
  const totalUnassigned = pilgrims.filter(p => !p.group || p.group === '-' || p.group === 'Belum ada kloter').length;
  const totalPassportReady = pilgrims.filter(p => p.passport && p.passport.trim().length > 3).length;
  const totalLunas = pilgrims.filter(p => p.paymentOption === 'Bayar Lunas' || ((p.paidAmount || 0) >= (p.totalAmount || 30000000) && (p.totalAmount || 0) > 0)).length;
  const totalUnpaid = totalPilgrims - totalLunas;

  const uniqueDepartureDates = useMemo(() => {
    const dates = new Set<string>();
    pilgrims.forEach(p => {
      if (p.departureDate && p.departureDate.trim() && p.departureDate !== '-') {
        dates.add(p.departureDate);
      }
    });
    return Array.from(dates);
  }, [pilgrims]);

  // Filtered logic
  const filteredPilgrims = useMemo(() => {
    return pilgrims.filter(p => {
      // Tab filter
      if (activeTab === 'male' && !(p.gender === 'Laki-laki' || p.gender === 'L')) return false;
      if (activeTab === 'female' && !(p.gender === 'Perempuan' || p.gender === 'P')) return false;
      if (activeTab === 'elderly' && (p.age || 0) < 60) return false;
      if (activeTab === 'unassigned' && (p.group && p.group !== '-' && p.group !== 'Belum ada kloter')) return false;
      if (activeTab === 'unpaid') {
        const isPaid = p.paymentOption === 'Bayar Lunas' || ((p.paidAmount || 0) >= (p.totalAmount || 30000000) && (p.totalAmount || 0) > 0);
        if (!isPaid) return false;
      }

      // Search term
      const matchesSearch = 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (p.passport && p.passport.toLowerCase().includes(searchTerm.toLowerCase())) ||
        p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.formId && p.formId.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.phone && p.phone.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.group && p.group.toLowerCase().includes(searchTerm.toLowerCase()));

      // Dropdown filters
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
  }, [pilgrims, activeTab, searchTerm, filterPackage, filterGroup, filterDepartureDate, filterPassportStatus]);

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

  const confirmDelete = () => {
    deletePilgrims(Array.from(selectedIds));
    setSelectedIds(new Set());
    toast("Data jamaah berhasil dihapus.", "success");
  };

  // Open modal for detail
  const openDetailModal = (p: Pilgrim) => {
    setSelectedPilgrim(p);
    setFormData({ ...p });
    setModifiedDates({ departureDate: true, returnDate: true, registrationDate: true });
    setModalTab('data-diri');
    setIsFormModalOpen(true);
  };

  // Open modal for add
  const openAddModal = () => {
    const newId = `PL-${Math.floor(80000 + Math.random() * 10000)}`;
    const newFormId = `FRM-${Math.floor(100 + Math.random() * 900)}`;
    setSelectedPilgrim(null);
    setModifiedDates({});
    setModalTab('form-edit');
    setFormData({
      id: newId,
      formId: newFormId,
      name: '',
      passport: '',
      visaNumber: '',
      nationality: 'Indonesia',
      gender: '' as any,
      birthDate: '',
      age: undefined,
      phone: '',
      emergencyContact: '',
      group: '',
      tourLeader: '',
      mutawifLocal: '',
      umrahPackage: '',
      hotelMakkah: '',
      hotel: '',
      departureDate: '',
      returnDate: '',
      ktp: '',
      registrationDate: todayStr,
      totalAmount: undefined,
      paidAmount: undefined,
      paymentOption: '' as any,
      paymentMethod: '',
      koperBesar: false,
      koperKabin: false,
      batik: false,
      kainIhram: false,
      meningitis: false,
      photo: false
    });
    setIsFormModalOpen(true);
  };

  const openEditModal = (p: Pilgrim) => {
    setSelectedPilgrim(p);
    setFormData({ ...p });
    setModifiedDates({ departureDate: true, returnDate: true, registrationDate: true });
    setModalTab('form-edit');
    setIsFormModalOpen(true);
  };

  const savePilgrim = () => {
    if (!formData.id || !formData.id.trim()) {
      toast("ID Jamaah wajib diisi.", "error");
      return;
    }
    if (!formData.name) {
      toast("Nama lengkap jamaah wajib diisi.", "error");
      return;
    }

    const formIdToUse = formData.formId || selectedPilgrim?.formId || `FRM-${Math.floor(100 + Math.random() * 900)}`;
    const pilgrimIdToUse = formData.id || selectedPilgrim?.id || `PL-${Math.floor(80000 + Math.random() * 10000)}`;

    if (selectedPilgrim && pilgrims.some(p => p.id === selectedPilgrim.id)) {
      updatePilgrim(selectedPilgrim.id, {
        ...formData,
        id: pilgrimIdToUse,
        formId: formIdToUse,
      });
      toast("Data jamaah berhasil diperbarui.", "success");
    } else {
      const newPilgrim: Pilgrim = {
        id: pilgrimIdToUse,
        formId: formIdToUse,
        name: formData.name || '',
        passport: formData.passport || '',
        visaNumber: formData.visaNumber || '',
        nationality: formData.nationality || 'Indonesia',
        gender: formData.gender || 'Pria (Male)',
        birthDate: formData.birthDate || '',
        age: Number(formData.age) || (formData.birthDate ? Math.floor((new Date().getTime() - new Date(formData.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 48),
        phone: formData.phone || '',
        emergencyContact: formData.emergencyContact || '',
        group: formData.group || 'Kloter 4 Al-Barakah',
        tourLeader: formData.tourLeader || 'Ust. H. Muhammad Ridwan (TL)',
        mutawifLocal: formData.mutawifLocal || 'Ust. Ibrahim Al-Madani',
        umrahPackage: formData.umrahPackage || 'Multazam',
        hotelMakkah: formData.hotelMakkah || formData.hotel || 'Swissôtel Al Maqam Makkah',
        hotelMadinah: formData.hotelMadinah || '',
        hotel: formData.hotelMakkah || formData.hotel || 'Swissôtel Al Maqam Makkah',
        departureDate: formData.departureDate || '2026-07-10',
        returnDate: formData.returnDate || '2026-07-22',
        ktp: formData.ktp || '',
        totalAmount: Number(formData.totalAmount) || 35000000,
        paidAmount: Number(formData.paidAmount) || 35000000,
        paymentOption: formData.paymentOption || 'Bayar Lunas',
        paymentMethod: formData.paymentMethod || 'Transfer BCA',
        registrationDate: formData.registrationDate || todayStr,
        koperBesar: formData.koperBesar ?? true,
        koperKabin: formData.koperKabin ?? true,
        batik: formData.batik ?? true,
        kainIhram: formData.kainIhram ?? true,
        meningitis: formData.meningitis ?? true,
        photo: formData.photo ?? true
      };
      addPilgrim(newPilgrim);
      toast("Pendaftaran jamaah baru berhasil disimpan.", "success");
    }
    setIsFormModalOpen(false);
  };

  const handleExportExcel = async () => {
    try {
      const totalIncome = financeTransactions.filter(t => t.type.startsWith('Pemasukan') && t.status === 'Berhasil').reduce((sum, t) => sum + t.amount, 0);
      const totalExpense = financeTransactions.filter(t => t.type === 'Pengeluaran' && t.status === 'Berhasil').reduce((sum, t) => sum + t.amount, 0);
      const netBalance = totalIncome - totalExpense;

      const targetPilgrims = filteredPilgrims.length > 0 ? filteredPilgrims : pilgrims;

      const masterSheets = [
        {
          sheetName: 'Ringkasan Dashboard',
          title: 'Ringkasan Eksekutif & Master Index System',
          data: [
            { 'Modul / Menu': 'Data Jamaah', 'Total Data': `${targetPilgrims.length} Jamaah`, 'Catatan Status': 'Data Lengkap Registrasi, Paspor & Paket' },
            { 'Modul / Menu': 'Data Kloter & Group', 'Total Data': `${groups.length} Kloter`, 'Catatan Status': 'Rombongan Pembimbing' },
            { 'Modul / Menu': 'Buku Kas Keuangan', 'Total Data': `${financeTransactions.length} Transaksi`, 'Catatan Status': `Net Saldo: Rp ${netBalance.toLocaleString('id-ID')}` },
            { 'Modul / Menu': 'Room Meet Hotel', 'Total Data': `${rooms.length} Kamar`, 'Catatan Status': 'Makkah & Madinah Hotels' },
            { 'Modul / Menu': 'Stok & Inventaris Staff', 'Total Data': `${staffStocks.length} Items`, 'Catatan Status': 'Perlengkapan Staff & Gudang' },
            { 'Modul / Menu': 'SDM Mutawif & TL', 'Total Data': `${tourLeaders.length + mutawifs.length} SDM`, 'Catatan Status': 'Tour Leader & Mutawif Local' },
            { 'Modul / Menu': 'Itinerary & Agenda', 'Total Data': `${schedules.length} Kegiatan`, 'Catatan Status': 'Jadwal Rangkaian Ibadah' },
            { 'Modul / Menu': 'Log Darurat SOS', 'Total Data': `${emergencies.length} Insiden`, 'Catatan Status': 'Riwayat Laporan Darurat' }
          ]
        },
        {
          sheetName: 'Data Jamaah',
          title: 'Master Data Jamaah Umrah - DNA Tour',
          data: targetPilgrims.map(p => ({
            'ID Jamaah': p.id,
            'Form ID': p.formId || '-',
            'Nama Lengkap': p.name,
            'No. Paspor': p.passport,
            'No. Visa': p.visaNumber || '-',
            'Kewarganegaraan': p.nationality || 'Indonesia',
            'Jenis Kelamin': p.gender,
            'Usia': p.age,
            'No. HP': p.phone,
            'Kontak Darurat': p.emergencyContact || '-',
            'Paket Umrah': p.umrahPackage || '-',
            'Kloter / Group': p.group,
            'Tour Leader': p.tourLeader || '-',
            'Mutawif Local': p.mutawifLocal || '-',
            'Hotel Makkah': p.hotelMakkah || p.hotel || '-',
            'Hotel Madinah': p.hotelMadinah || '-',
            'Status Pembayaran': p.paymentOption || 'Belum Lunas',
            'Total Biaya (Rp)': p.totalAmount || 30000000,
            'Telah Dibayar (Rp)': p.paidAmount || 0,
            'Sisa Tagihan (Rp)': Math.max(0, (p.totalAmount || 30000000) - (p.paidAmount || 0)),
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

  return (
    <div className="space-y-5 pb-10">
      {/* Header Banner - Clean & Consistent */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">
              Jamaah
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 font-normal mt-1">
              Kelola dan pantau informasi data diri serta rincian perjalanan jamaah
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
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

      {/* Stats Cards Grid - Interactive & Tactile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Jamaah Terdaftar */}
        <Card 
          onClick={() => { setActiveTab('all'); setCurrentPage(1); }}
          className={`rounded-2xl border bg-white shadow-2xs cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.98] ${
            activeTab === 'all' 
              ? 'border-emerald-600 ring-2 ring-emerald-600/20 bg-emerald-50/20' 
              : 'border-gray-200/80 hover:border-gray-300'
          }`}
        >
          <CardContent className="p-5 flex flex-col justify-between h-full gap-3">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">TOTAL JAMAAH TERDAFTAR</p>
                <p className="text-2xl sm:text-[26px] font-bold tracking-tight text-[#2d0a0a]">
                  {totalPilgrims} Jamaah
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#fcedea] text-[#782820] flex items-center justify-center shrink-0 shadow-2xs">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-[#782820]">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>Database Registrasi Aktif</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Pembayaran Lunas */}
        <Card 
          onClick={() => { setActiveTab('all'); setCurrentPage(1); }}
          className={`rounded-2xl border bg-white shadow-2xs cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.98] ${
            activeTab === 'all' 
              ? 'border-emerald-600 ring-2 ring-emerald-600/20 bg-emerald-50/20' 
              : 'border-gray-200/80 hover:border-gray-300'
          }`}
        >
          <CardContent className="p-5 flex flex-col justify-between h-full gap-3">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">PEMBAYARAN LUNAS</p>
                <p className="text-2xl sm:text-[26px] font-bold tracking-tight text-[#2d0a0a]">
                  {totalLunas} Jamaah
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#fcedea] text-[#782820] flex items-center justify-center shrink-0 shadow-2xs">
                <CreditCard className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-[#782820]">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>Biaya Paket Terpenuhi</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Belum Lunas */}
        <Card 
          onClick={() => { setActiveTab('unpaid'); setCurrentPage(1); }}
          className={`rounded-2xl border bg-white shadow-2xs cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.98] ${
            activeTab === 'unpaid' 
              ? 'border-amber-600 ring-2 ring-amber-600/20 bg-amber-50/20' 
              : 'border-gray-200/80 hover:border-gray-300'
          }`}
        >
          <CardContent className="p-5 flex flex-col justify-between h-full gap-3">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">BELUM LUNAS</p>
                <p className="text-2xl sm:text-[26px] font-bold tracking-tight text-[#2d0a0a]">
                  {totalUnpaid} Jamaah
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#fdf6e7] text-[#c27803] flex items-center justify-center shrink-0 shadow-2xs">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-[#b45309]">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>Menunggu Pelunasan</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Paspor Terverifikasi */}
        <Card 
          onClick={() => { setActiveTab('all'); setCurrentPage(1); }}
          className="rounded-2xl border border-gray-200/80 bg-white shadow-2xs cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-sm active:scale-[0.98]"
        >
          <CardContent className="p-5 flex flex-col justify-between h-full gap-3">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">PASPOR TERVERIFIKASI</p>
                <p className="text-2xl sm:text-[26px] font-bold tracking-tight text-gray-900">
                  {totalPassportReady} Dokumen
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#edf5ff] text-[#2563eb] flex items-center justify-center shrink-0 shadow-2xs">
                <BookOpen className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-[#2563eb]">
              <FileCheck className="w-3.5 h-3.5 shrink-0" />
              <span>Dokumen Valid Siap Visa</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card with Integrated Tabs */}
      <Card className="overflow-hidden border border-gray-200/80 shadow-2xs">
        {/* Navigation Tabs Header */}
        <div className="border-b border-gray-100 bg-white px-4 sm:px-6 pt-2.5 pb-0">
          <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto scrollbar-none pb-0">
            <button 
              onClick={() => { setActiveTab('all'); setCurrentPage(1); }}
              className={`relative pb-3 pt-2 px-2.5 text-xs sm:text-sm transition-all duration-200 whitespace-nowrap cursor-pointer flex items-center gap-1.5 select-none rounded-t-lg group active:scale-[0.96] ${
                activeTab === 'all' 
                  ? 'font-bold text-emerald-800' 
                  : 'font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50/80'
              }`}
            >
              <span>Semua Jamaah</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold transition-all duration-200 ${
                activeTab === 'all' 
                  ? 'bg-emerald-100 text-emerald-800 scale-105' 
                  : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200/80'
              }`}>
                {pilgrims.length}
              </span>
              {activeTab === 'all' && (
                <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-emerald-600 rounded-full animate-tab-indicator" />
              )}
            </button>
            <button 
              onClick={() => { setActiveTab('male'); setCurrentPage(1); }}
              className={`relative pb-3 pt-2 px-2.5 text-xs sm:text-sm transition-all duration-200 whitespace-nowrap cursor-pointer flex items-center gap-1.5 select-none rounded-t-lg group active:scale-[0.96] ${
                activeTab === 'male' 
                  ? 'font-bold text-emerald-800' 
                  : 'font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50/80'
              }`}
            >
              <span>Laki-laki</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold transition-all duration-200 ${
                activeTab === 'male' 
                  ? 'bg-emerald-100 text-emerald-800 scale-105' 
                  : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200/80'
              }`}>
                {totalMale}
              </span>
              {activeTab === 'male' && (
                <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-emerald-600 rounded-full animate-tab-indicator" />
              )}
            </button>
            <button 
              onClick={() => { setActiveTab('female'); setCurrentPage(1); }}
              className={`relative pb-3 pt-2 px-2.5 text-xs sm:text-sm transition-all duration-200 whitespace-nowrap cursor-pointer flex items-center gap-1.5 select-none rounded-t-lg group active:scale-[0.96] ${
                activeTab === 'female' 
                  ? 'font-bold text-emerald-800' 
                  : 'font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50/80'
              }`}
            >
              <span>Perempuan</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold transition-all duration-200 ${
                activeTab === 'female' 
                  ? 'bg-emerald-100 text-emerald-800 scale-105' 
                  : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200/80'
              }`}>
                {totalFemale}
              </span>
              {activeTab === 'female' && (
                <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-emerald-600 rounded-full animate-tab-indicator" />
              )}
            </button>
            <button 
              onClick={() => { setActiveTab('elderly'); setCurrentPage(1); }}
              className={`relative pb-3 pt-2 px-2.5 text-xs sm:text-sm transition-all duration-200 whitespace-nowrap cursor-pointer flex items-center gap-1.5 select-none rounded-t-lg group active:scale-[0.96] ${
                activeTab === 'elderly' 
                  ? 'font-bold text-emerald-800' 
                  : 'font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50/80'
              }`}
            >
              <span>Lansia (&ge;60)</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold transition-all duration-200 ${
                activeTab === 'elderly' 
                  ? 'bg-amber-100 text-amber-800 scale-105' 
                  : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200/80'
              }`}>
                {totalElderly}
              </span>
              {activeTab === 'elderly' && (
                <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-emerald-600 rounded-full animate-tab-indicator" />
              )}
            </button>
            <button 
              onClick={() => { setActiveTab('unassigned'); setCurrentPage(1); }}
              className={`relative pb-3 pt-2 px-2.5 text-xs sm:text-sm transition-all duration-200 whitespace-nowrap cursor-pointer flex items-center gap-1.5 select-none rounded-t-lg group active:scale-[0.96] ${
                activeTab === 'unassigned' 
                  ? 'font-bold text-amber-800' 
                  : 'font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50/80'
              }`}
            >
              <span>Belum Ada Kloter</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold transition-all duration-200 ${
                activeTab === 'unassigned' 
                  ? 'bg-amber-100 text-amber-800 scale-105' 
                  : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200/80'
              }`}>
                {totalUnassigned}
              </span>
              {activeTab === 'unassigned' && (
                <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-amber-600 rounded-full animate-tab-indicator" />
              )}
            </button>
            <button 
              onClick={() => { setActiveTab('unpaid'); setCurrentPage(1); }}
              className={`relative pb-3 pt-2 px-2.5 text-xs sm:text-sm transition-all duration-200 whitespace-nowrap cursor-pointer flex items-center gap-1.5 select-none rounded-t-lg group active:scale-[0.96] ${
                activeTab === 'unpaid' 
                  ? 'font-bold text-red-800' 
                  : 'font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50/80'
              }`}
            >
              <span>Sisa Tagihan</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold transition-all duration-200 ${
                activeTab === 'unpaid' 
                  ? 'bg-red-100 text-red-800 scale-105' 
                  : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200/80'
              }`}>
                {totalUnpaid}
              </span>
              {activeTab === 'unpaid' && (
                <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-red-600 rounded-full animate-tab-indicator" />
              )}
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <Input 
              placeholder="Cari nama, ID, paspor, HP, kloter..." 
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
                <option value="Yamani">Yamani</option>
                <option value="Raudhah">Raudhah</option>
                <option value="Multazam">Multazam</option>
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
                {groups.map(g => (
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
                <TableHead className="text-[11px] uppercase tracking-wider font-bold text-gray-500 py-3.5 whitespace-nowrap min-w-[100px]">ID JAMAAH</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider font-bold text-gray-500 py-3.5 whitespace-nowrap min-w-[260px]">PROFIL JAMAAH</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider font-bold text-gray-500 py-3.5 whitespace-nowrap min-w-[180px]">TGL KEBERANGKATAN</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider font-bold text-gray-500 py-3.5 whitespace-nowrap min-w-[180px]">KLOTER ROMBONGAN</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider font-bold text-gray-500 py-3.5 whitespace-nowrap min-w-[200px]">PAKET UMRAH</TableHead>
                {activeTab === 'unpaid' && (
                  <TableHead className="text-[11px] uppercase tracking-wider font-bold text-gray-500 py-3.5 whitespace-nowrap min-w-[200px]">STATUS & SISA TAGIHAN</TableHead>
                )}
                <TableHead className="text-right pr-6 text-[11px] uppercase tracking-wider font-bold text-gray-500 py-3.5 whitespace-nowrap min-w-[130px]">AKSI</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody key={activeTab} className="divide-y divide-gray-100 animate-fade-in">
              {paginatedData.map((pilgrim) => {
                const totalCost = pilgrim.totalAmount || 30000000;
                const paid = pilgrim.paidAmount || 0;
                const remaining = Math.max(0, totalCost - paid);
                const isElderly = (pilgrim.age || 0) >= 60;
                
                // Format departure date nicely
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

                    {/* ID */}
                    <TableCell className="py-4 whitespace-nowrap">
                      <div className="font-bold text-sm tracking-tight text-[#480c0c] whitespace-nowrap">{pilgrim.id}</div>
                    </TableCell>

                    {/* Profil Jamaah */}
                    <TableCell className="py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#fcedea] text-[#782820] font-bold text-xs flex items-center justify-center shrink-0 border border-[#f5d0cb]">
                          {pilgrim.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-1.5 whitespace-nowrap">
                            <span className="font-bold text-sm text-gray-900 whitespace-nowrap">{pilgrim.name}</span>
                            {isElderly && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#fdf6e7] text-[#b45309] border border-[#fbe8bf] shrink-0 whitespace-nowrap">
                                Lansia
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500 font-normal mt-0.5 whitespace-nowrap">
                            <span className="whitespace-nowrap">{pilgrim.gender} &bull; {pilgrim.age || 45} thn</span>
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
                        {pilgrim.umrahPackage || 'Yamani'}
                      </span>
                    </TableCell>

                    {/* Status Bayar - Only when activeTab === 'unpaid' */}
                    {activeTab === 'unpaid' && (
                      <TableCell className="py-4 whitespace-nowrap">
                        <div className="space-y-1 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 whitespace-nowrap">
                            <Badge className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-semibold px-1.5 py-0 whitespace-nowrap shrink-0">
                              {pilgrim.paymentOption || 'DP'}
                            </Badge>
                            <span className="text-[11px] font-semibold text-rose-600 whitespace-nowrap">
                              Sisa: Rp {remaining.toLocaleString('id-ID')}
                            </span>
                          </div>
                          <div className="text-[10px] text-gray-400 font-medium whitespace-nowrap">
                            Terbayar: Rp {paid.toLocaleString('id-ID')} / {totalCost.toLocaleString('id-ID')}
                          </div>
                        </div>
                      </TableCell>
                    )}

                    {/* Actions */}
                    <TableCell className="text-right pr-6 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5 whitespace-nowrap shrink-0">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="w-8 h-8 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors shrink-0" 
                          title="Lihat Data Diri"
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

              {filteredPilgrims.length === 0 && (
                <TableRow>
                  <TableCell colSpan={activeTab === 'unpaid' ? 8 : 7} className="h-56 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-3 border border-gray-200">
                        <Users className="w-5 h-5 text-gray-400" />
                      </div>
                      <p className="font-semibold text-gray-900">Tidak ada data jamaah ditemukan</p>
                      <p className="text-xs text-gray-500 mt-1 max-w-sm">
                        Ubah filter pencarian atau gunakan tombol tambah untuk mendaftarkan jamaah baru.
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
              disabled={currentPage === 1}
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
              disabled={currentPage === totalPages}
            >
              Selanjutnya
            </Button>
          </div>
        </div>
      </Card>

      {/* Modal: Data Diri & Form Edit Jamaah (Matches Reference Design in Screenshots) */}
      <Dialog open={isFormModalOpen} onOpenChange={setIsFormModalOpen}>
        <DialogContent hideClose className="w-[95vw] max-w-2xl sm:w-full max-h-[92vh] bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border-0 overflow-y-auto hide-scrollbar">
          {/* Top Bar Header with Tabs (Exact Match to Screenshot 2) */}
          <div className="flex justify-between items-center pb-5 border-b border-gray-100 mb-6">
            <div className="flex items-center gap-2.5">
              {selectedPilgrim ? (
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
                  Tambah Jamaah
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

          {/* TAB 1: DATA DIRI DETAIL (Informasi Pribadi & Rincian Perjalanan) */}
          {modalTab === 'data-diri' && (() => {
            const activePilgrim = selectedPilgrim || (formData.name ? (formData as Pilgrim) : pilgrims[0]);
            const matchedGroup = groups.find(g => g.name === activePilgrim?.group);
            const formatIndoDate = (dateStr?: string) => {
              if (!dateStr) return '-';
              try {
                const d = new Date(dateStr);
                if (isNaN(d.getTime())) return dateStr;
                const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
                return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
              } catch {
                return dateStr;
              }
            };

            const genderFormatted = activePilgrim?.gender === 'Perempuan' ? 'Wanita (Female)' : 'Pria (Male)';
            const birthDateFormatted = activePilgrim?.birthDate 
              ? `${formatIndoDate(activePilgrim.birthDate)} (${activePilgrim.age || 48} Thn)`
              : (activePilgrim?.age ? `14 Mei ${2026 - activePilgrim.age} (${activePilgrim.age} Thn)` : '14 Mei 1978 (48 Thn)');
            const passportFormatted = activePilgrim?.passport 
              ? (activePilgrim.passport.includes('(') ? activePilgrim.passport : `${activePilgrim.passport} (Berlaku)`)
              : 'X-99821014 (Berlaku)';
            const visaFormatted = activePilgrim?.visaNumber || 'VSA-2026-99210-SA';
            const nationalityFormatted = activePilgrim?.nationality || 'Indonesia';
            const phoneFormatted = activePilgrim?.phone || '+62 812-3456-7890';
            const emergencyFormatted = activePilgrim?.emergencyContact 
              ? (activePilgrim.emergencyContact.includes('(') ? activePilgrim.emergencyContact : `Keluarga Jamaah (${activePilgrim.emergencyContact})`)
              : 'Keluarga Jamaah (+62 811-9988-7766)';

            const groupFormatted = activePilgrim?.group || 'Kloter 4 Al-Barakah';
            const rawTl = matchedGroup?.tourLeader || activePilgrim?.tourLeader || 'Ust. H. Muhammad Ridwan';
            const tlFormatted = rawTl.includes('(TL)') ? rawTl : `${rawTl} (TL)`;
            const mutawifFormatted = matchedGroup?.mutawif || activePilgrim?.mutawifLocal || 'Ust. Ibrahim Al-Madani';
            const packageFormatted = activePilgrim?.umrahPackage || 'Multazam';
            const hotelFormatted = activePilgrim?.hotelMakkah || activePilgrim?.hotel || 'Swissôtel Al Maqam Makkah';
            const depFormatted = activePilgrim?.departureDate 
              ? `${formatIndoDate(activePilgrim.departureDate)} (CGK - JED)`
              : '10 Juli 2026 (CGK - JED)';
            const retFormatted = activePilgrim?.returnDate 
              ? `${formatIndoDate(activePilgrim.returnDate)} (MED - CGK)`
              : '22 Juli 2026 (MED - CGK)';

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
                        <span>ID Jamaah</span>
                      </div>
                      <span className="font-bold text-gray-900 text-sm text-right font-mono">
                        {activePilgrim?.id || 'PL-88210'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-3.5 sm:py-4 px-5 sm:px-6">
                      <div className="flex items-center gap-3.5 text-gray-700 text-sm font-medium">
                        <User className="w-4 h-4 text-[#782820] shrink-0" />
                        <span>Nama Lengkap</span>
                      </div>
                      <span className="font-bold text-gray-900 text-sm text-right">
                        {activePilgrim?.name || 'H. Ahmad Zaki Al-Farizi'}
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
                        <Users className="w-4 h-4 text-[#782820] shrink-0" />
                        <span>Jenis Kelamin</span>
                      </div>
                      <span className="font-bold text-gray-900 text-sm text-right">
                        {genderFormatted}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-3.5 sm:py-4 px-5 sm:px-6">
                      <div className="flex items-center gap-3.5 text-gray-700 text-sm font-medium">
                        <Calendar className="w-4 h-4 text-[#782820] shrink-0" />
                        <span>Tanggal Lahir</span>
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
                        <AlertCircle className="w-4 h-4 text-[#782820] shrink-0" />
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
                        <span>Kloter Saat Ini</span>
                      </div>
                      <span className="font-bold text-gray-900 text-sm text-right">
                        {groupFormatted}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-3.5 sm:py-4 px-5 sm:px-6">
                      <div className="flex items-center gap-3.5 text-gray-700 text-sm font-medium">
                        <UserCheck className="w-4 h-4 text-[#782820] shrink-0" />
                        <span>Pembimbing (Mutawif)</span>
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
                        <Package className="w-4 h-4 text-[#782820] shrink-0" />
                        <span>Paket Umrah</span>
                      </div>
                      <span className="font-bold text-gray-900 text-sm text-right">
                        {packageFormatted}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-3.5 sm:py-4 px-5 sm:px-6">
                      <div className="flex items-center gap-3.5 text-gray-700 text-sm font-medium">
                        <Building2 className="w-4 h-4 text-[#782820] shrink-0" />
                        <span>Hotel Penginapan</span>
                      </div>
                      <span className="font-bold text-gray-900 text-sm text-right">
                        {hotelFormatted}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-3.5 sm:py-4 px-5 sm:px-6">
                      <div className="flex items-center gap-3.5 text-gray-700 text-sm font-medium">
                        <PlaneTakeoff className="w-4 h-4 text-[#782820] shrink-0" />
                        <span>Tanggal Keberangkatan</span>
                      </div>
                      <span className="font-bold text-gray-900 text-sm text-right">
                        {depFormatted}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-3.5 sm:py-4 px-5 sm:px-6">
                      <div className="flex items-center gap-3.5 text-gray-700 text-sm font-medium">
                        <PlaneLanding className="w-4 h-4 text-[#782820] shrink-0" />
                        <span>Tanggal Kepulangan</span>
                      </div>
                      <span className="font-bold text-gray-900 text-sm text-right">
                        {retFormatted}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Tutup Button */}
                <div className="flex justify-end pt-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsFormModalOpen(false)}
                    className="rounded-xl h-10 px-6 text-sm font-semibold text-gray-700 border-gray-300 hover:bg-gray-50 cursor-pointer shadow-2xs"
                  >
                    Tutup
                  </Button>
                </div>
              </div>
            );
          })()}

          {/* TAB 2: FORM TAMBAH / EDIT JAMAAH (Matching the 2 sections: Informasi Pribadi & Rincian Perjalanan) */}
          {modalTab === 'form-edit' && (
            <div className="space-y-6">
              {/* Section 1: INFORMASI PRIBADI */}
              <div className="bg-white border border-[#cbd5e1] rounded-3xl p-5 sm:p-7 shadow-2xs">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-7 h-7 rounded-lg border border-gray-300 text-gray-800 bg-white flex items-center justify-center text-xs font-bold font-mono shadow-2xs">
                    1
                  </div>
                  <h3 className="text-base sm:text-[17px] font-black text-gray-900 uppercase tracking-wide">
                    INFORMASI PRIBADI
                  </h3>
                </div>

                <div className="space-y-4">
                  {/* ID JAMAAH */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 items-center">
                    <label className="sm:col-span-4 text-xs sm:text-[13px] font-bold text-gray-600 uppercase tracking-wider">
                      ID JAMAAH *
                    </label>
                    <div className="sm:col-span-8">
                      <Input 
                        value={formData.id || ''} 
                        onChange={(e) => setFormData({...formData, id: e.target.value})} 
                        placeholder="Cth. PL-88210" 
                        className={`h-12 sm:h-13 rounded-2xl border-gray-300 bg-white text-base ${formData.id ? 'font-bold text-gray-900' : 'font-normal text-gray-400'} placeholder:text-gray-400 placeholder:font-normal px-4 sm:px-5 focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859]`} 
                      />
                    </div>
                  </div>

                  {/* NAMA LENGKAP */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 items-center">
                    <label className="sm:col-span-4 text-xs sm:text-[13px] font-bold text-gray-600 uppercase tracking-wider">
                      NAMA LENGKAP *
                    </label>
                    <div className="sm:col-span-8">
                      <Input 
                        value={formData.name || ''} 
                        onChange={(e) => setFormData({...formData, name: e.target.value})} 
                        placeholder="Cth. H. Ahmad Zaki Al-Farizi" 
                        className={`h-12 sm:h-13 rounded-2xl border-gray-300 bg-white text-base ${formData.name ? 'font-bold text-gray-900' : 'font-normal text-gray-400'} placeholder:text-gray-400 placeholder:font-normal px-4 sm:px-5 focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859]`} 
                      />
                    </div>
                  </div>

                  {/* NOMOR PASPOR */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 items-center">
                    <label className="sm:col-span-4 text-xs sm:text-[13px] font-bold text-gray-600 uppercase tracking-wider">
                      NOMOR PASPOR
                    </label>
                    <div className="sm:col-span-8">
                      <Input 
                        value={formData.passport || ''} 
                        onChange={(e) => setFormData({...formData, passport: e.target.value})} 
                        placeholder="Cth. X-99821014" 
                        className={`h-12 sm:h-13 rounded-2xl border-gray-300 bg-white text-base ${formData.passport ? 'font-bold text-gray-900' : 'font-normal text-gray-400'} placeholder:text-gray-400 placeholder:font-normal px-4 sm:px-5 uppercase focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859]`}
                      />
                    </div>
                  </div>

                  {/* NOMOR VISA UMRAH */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 items-center">
                    <label className="sm:col-span-4 text-xs sm:text-[13px] font-bold text-gray-600 uppercase tracking-wider">
                      NOMOR VISA UMRAH
                    </label>
                    <div className="sm:col-span-8">
                      <Input 
                        value={formData.visaNumber || ''} 
                        onChange={(e) => setFormData({...formData, visaNumber: e.target.value})} 
                        placeholder="Cth. VSA-2026-99210-SA" 
                        className={`h-12 sm:h-13 rounded-2xl border-gray-300 bg-white text-base ${formData.visaNumber ? 'font-bold text-gray-900' : 'font-normal text-gray-400'} placeholder:text-gray-400 placeholder:font-normal px-4 sm:px-5 focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859]`}
                      />
                    </div>
                  </div>

                  {/* KEWARGANEGARAAN */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 items-center">
                    <label className="sm:col-span-4 text-xs sm:text-[13px] font-bold text-gray-600 uppercase tracking-wider">
                      KEWARGANEGARAAN
                    </label>
                    <div className="sm:col-span-8">
                      <Input 
                        value={formData.nationality || 'Indonesia'} 
                        onChange={(e) => setFormData({...formData, nationality: e.target.value})} 
                        placeholder="Indonesia" 
                        className={`h-12 sm:h-13 rounded-2xl border-gray-300 bg-white text-base ${formData.nationality ? 'font-bold text-gray-900' : 'font-normal text-gray-400'} placeholder:text-gray-400 placeholder:font-normal px-4 sm:px-5 focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859]`}
                      />
                    </div>
                  </div>

                  {/* JENIS KELAMIN */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 items-center">
                    <label className="sm:col-span-4 text-xs sm:text-[13px] font-bold text-gray-600 uppercase tracking-wider">
                      JENIS KELAMIN
                    </label>
                    <div className="sm:col-span-8">
                      <select 
                        value={formData.gender || ''}
                        onChange={(e) => setFormData({...formData, gender: e.target.value as any})}
                        className={`h-12 sm:h-13 w-full rounded-2xl border border-gray-300 bg-white px-4 sm:px-5 text-base ${formData.gender ? 'font-bold text-gray-900' : 'font-normal text-gray-400'} focus:outline-none focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859] cursor-pointer`}
                      >
                        <option value="" className="text-gray-400 font-normal">Pilih Jenis Kelamin</option>
                        <option value="Pria (Male)" className="text-gray-900 font-normal">Pria (Male)</option>
                        <option value="Wanita (Female)" className="text-gray-900 font-normal">Wanita (Female)</option>
                        <option value="Laki-laki" className="text-gray-900 font-normal">Laki-laki</option>
                        <option value="Perempuan" className="text-gray-900 font-normal">Perempuan</option>
                      </select>
                    </div>
                  </div>

                  {/* TANGGAL LAHIR & USIA */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 items-center">
                    <label className="sm:col-span-4 text-xs sm:text-[13px] font-bold text-gray-600 uppercase tracking-wider">
                      TANGGAL LAHIR
                    </label>
                    <div className="sm:col-span-8 grid grid-cols-1 sm:grid-cols-12 gap-3">
                      <div className="sm:col-span-7">
                        <Input 
                          type="date"
                          value={formData.birthDate || ''} 
                          onChange={(e) => {
                            const bDate = e.target.value;
                            let computedAge = formData.age;
                            if (bDate) {
                              const birthYear = new Date(bDate).getFullYear();
                              const currentYear = new Date().getFullYear();
                              if (!isNaN(birthYear) && birthYear > 1900 && birthYear <= currentYear) {
                                computedAge = currentYear - birthYear;
                              }
                            }
                            setFormData({
                              ...formData, 
                              birthDate: bDate,
                              age: computedAge
                            });
                          }} 
                          className={`h-12 sm:h-13 rounded-2xl border-gray-300 bg-white text-base ${formData.birthDate ? 'font-bold text-gray-900' : 'font-normal text-gray-400'} px-4 sm:px-5 focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859]`}
                        />
                      </div>
                      <div className="sm:col-span-5 flex items-center gap-2">
                        <Input 
                          type="number"
                          value={formData.age !== undefined && formData.age !== 0 ? formData.age : ''} 
                          onChange={(e) => setFormData({...formData, age: Number(e.target.value)})} 
                          placeholder="Usia (Thn)" 
                          className={`h-12 sm:h-13 rounded-2xl border-gray-300 bg-white text-base ${formData.age ? 'font-bold text-gray-900' : 'font-normal text-gray-400'} placeholder:text-gray-400 placeholder:font-normal px-4 focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859]`}
                        />
                        <span className="text-xs font-bold text-gray-500 whitespace-nowrap">Tahun</span>
                      </div>
                    </div>
                  </div>

                  {/* NOMOR TELEPON */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 items-center">
                    <label className="sm:col-span-4 text-xs sm:text-[13px] font-bold text-gray-600 uppercase tracking-wider">
                      NOMOR TELEPON
                    </label>
                    <div className="sm:col-span-8">
                      <Input 
                        value={formData.phone || ''} 
                        onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                        placeholder="Cth. +62 812-3456-7890" 
                        className={`h-12 sm:h-13 rounded-2xl border-gray-300 bg-white text-base ${formData.phone ? 'font-bold text-gray-900' : 'font-normal text-gray-400'} placeholder:text-gray-400 placeholder:font-normal px-4 sm:px-5 focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859]`}
                      />
                    </div>
                  </div>

                  {/* KONTAK DARURAT */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 items-center">
                    <label className="sm:col-span-4 text-xs sm:text-[13px] font-bold text-gray-600 uppercase tracking-wider">
                      KONTAK DARURAT
                    </label>
                    <div className="sm:col-span-8">
                      <Input 
                        value={formData.emergencyContact || ''} 
                        onChange={(e) => setFormData({...formData, emergencyContact: e.target.value})} 
                        placeholder="Cth. Keluarga Jamaah (+62 811-9988-7766)" 
                        className={`h-12 sm:h-13 rounded-2xl border-gray-300 bg-white text-base ${formData.emergencyContact ? 'font-bold text-gray-900' : 'font-normal text-gray-400'} placeholder:text-gray-400 placeholder:font-normal px-4 sm:px-5 focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859]`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: RINCIAN PERJALANAN */}
              <div className="bg-white border border-[#cbd5e1] rounded-3xl p-5 sm:p-7 shadow-2xs">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-7 h-7 rounded-lg border border-gray-300 text-gray-800 bg-white flex items-center justify-center text-xs font-bold font-mono shadow-2xs">
                    2
                  </div>
                  <h3 className="text-base sm:text-[17px] font-black text-gray-900 uppercase tracking-wide">
                    RINCIAN PERJALANAN
                  </h3>
                </div>

                <div className="space-y-4">
                  {/* KLOTER SAAT INI */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 items-center">
                    <label className="sm:col-span-4 text-xs sm:text-[13px] font-bold text-gray-600 uppercase tracking-wider">
                      KLOTER SAAT INI
                    </label>
                    <div className="sm:col-span-8">
                      <select 
                        value={formData.group || ''} 
                        onChange={(e) => {
                          const selectedGroupName = e.target.value;
                          const foundGrp = groups.find(g => g.name === selectedGroupName);
                          setFormData({
                            ...formData, 
                            group: selectedGroupName,
                            tourLeader: foundGrp?.tourLeader ? (foundGrp.tourLeader.includes('(TL)') ? foundGrp.tourLeader : `${foundGrp.tourLeader} (TL)`) : formData.tourLeader,
                            mutawifLocal: foundGrp?.mutawif || formData.mutawifLocal,
                          });
                        }} 
                        className={`h-12 sm:h-13 w-full rounded-2xl border border-gray-300 bg-white px-4 sm:px-5 text-base ${formData.group ? 'font-bold text-gray-900' : 'font-normal text-gray-400'} focus:outline-none focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859] cursor-pointer`}
                      >
                        <option value="" className="text-gray-400 font-normal">-- Pilih Kloter Keberangkatan --</option>
                        {groups.map(g => (
                          <option key={g.id} value={g.name} className="text-gray-900 font-normal">{g.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* PEMBIMBING (MUTAWIF) */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 items-center">
                    <label className="sm:col-span-4 text-xs sm:text-[13px] font-bold text-gray-600 uppercase tracking-wider">
                      PEMBIMBING (MUTAWIF)
                    </label>
                    <div className="sm:col-span-8">
                      <Input 
                        value={formData.tourLeader || ''} 
                        onChange={(e) => setFormData({...formData, tourLeader: e.target.value})} 
                        placeholder="Cth. Ust. H. Muhammad Ridwan (TL)" 
                        className={`h-12 sm:h-13 rounded-2xl border-gray-300 bg-white text-base ${formData.tourLeader ? 'font-bold text-gray-900' : 'font-normal text-gray-400'} placeholder:text-gray-400 placeholder:font-normal px-4 sm:px-5 focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859]`}
                      />
                    </div>
                  </div>

                  {/* MUTAWIF LOKAL */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 items-center">
                    <label className="sm:col-span-4 text-xs sm:text-[13px] font-bold text-gray-600 uppercase tracking-wider">
                      MUTAWIF LOKAL
                    </label>
                    <div className="sm:col-span-8">
                      <Input 
                        value={formData.mutawifLocal || ''} 
                        onChange={(e) => setFormData({...formData, mutawifLocal: e.target.value})} 
                        placeholder="Cth. Ust. Ibrahim Al-Madani" 
                        className={`h-12 sm:h-13 rounded-2xl border-gray-300 bg-white text-base ${formData.mutawifLocal ? 'font-bold text-gray-900' : 'font-normal text-gray-400'} placeholder:text-gray-400 placeholder:font-normal px-4 sm:px-5 focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859]`}
                      />
                    </div>
                  </div>

                  {/* PAKET UMRAH */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 items-center">
                    <label className="sm:col-span-4 text-xs sm:text-[13px] font-bold text-gray-600 uppercase tracking-wider">
                      PAKET UMRAH
                    </label>
                    <div className="sm:col-span-8">
                      <select 
                        value={formData.umrahPackage || ''} 
                        onChange={(e) => setFormData({...formData, umrahPackage: e.target.value})} 
                        className={`h-12 sm:h-13 w-full rounded-2xl border border-gray-300 bg-white px-4 sm:px-5 text-base ${formData.umrahPackage ? 'font-bold text-gray-900' : 'font-normal text-gray-400'} focus:outline-none focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859] cursor-pointer`}
                      >
                        <option value="" className="text-gray-400 font-normal">Pilih Paket Umrah</option>
                        <option value="Multazam" className="text-gray-900 font-normal">Multazam</option>
                        <option value="Raudhah" className="text-gray-900 font-normal">Raudhah</option>
                        <option value="Yamani" className="text-gray-900 font-normal">Yamani</option>
                        <option value="VIP 9 Hari" className="text-gray-900 font-normal">VIP 9 Hari</option>
                        <option value="Reguler 12 Hari" className="text-gray-900 font-normal">Reguler 12 Hari</option>
                        <option value="Reguler 9 Hari" className="text-gray-900 font-normal">Reguler 9 Hari</option>
                      </select>
                    </div>
                  </div>

                  {/* HOTEL PENGINAPAN */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 items-center">
                    <label className="sm:col-span-4 text-xs sm:text-[13px] font-bold text-gray-600 uppercase tracking-wider">
                      HOTEL PENGINAPAN
                    </label>
                    <div className="sm:col-span-8">
                      <Input 
                        value={formData.hotelMakkah || formData.hotel || ''} 
                        onChange={(e) => setFormData({...formData, hotelMakkah: e.target.value, hotel: e.target.value})} 
                        placeholder="Cth. Swissôtel Al Maqam Makkah" 
                        className={`h-12 sm:h-13 rounded-2xl border-gray-300 bg-white text-base ${(formData.hotelMakkah || formData.hotel) ? 'font-bold text-gray-900' : 'font-normal text-gray-400'} placeholder:text-gray-400 placeholder:font-normal px-4 sm:px-5 focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859]`}
                      />
                    </div>
                  </div>

                  {/* TANGGAL KEBERANGKATAN */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 items-center">
                    <label className="sm:col-span-4 text-xs sm:text-[13px] font-bold text-gray-600 uppercase tracking-wider">
                      TANGGAL KEBERANGKATAN
                    </label>
                    <div className="sm:col-span-8">
                      <Input 
                        type="date" 
                        value={formData.departureDate || ''} 
                        onChange={(e) => {
                          setFormData({...formData, departureDate: e.target.value});
                          setModifiedDates(prev => ({ ...prev, departureDate: true }));
                        }} 
                        className={`h-12 sm:h-13 rounded-2xl border-gray-300 bg-white text-base ${formData.departureDate ? 'font-bold text-gray-900' : 'font-normal text-gray-400'} px-4 sm:px-5 focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859]`} 
                      />
                    </div>
                  </div>

                  {/* TANGGAL KEPULANGAN */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 items-center">
                    <label className="sm:col-span-4 text-xs sm:text-[13px] font-bold text-gray-600 uppercase tracking-wider">
                      TANGGAL KEPULANGAN
                    </label>
                    <div className="sm:col-span-8">
                      <Input 
                        type="date" 
                        value={formData.returnDate || ''} 
                        onChange={(e) => {
                          setFormData({...formData, returnDate: e.target.value});
                          setModifiedDates(prev => ({ ...prev, returnDate: true }));
                        }} 
                        className={`h-12 sm:h-13 rounded-2xl border-gray-300 bg-white text-base ${formData.returnDate ? 'font-bold text-gray-900' : 'font-normal text-gray-400'} px-4 sm:px-5 focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859]`} 
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <Button 
                  variant="outline" 
                  onClick={() => setIsFormModalOpen(false)} 
                  className="h-12 rounded-2xl px-7 font-bold text-gray-800 border-gray-300 hover:bg-gray-50 text-base cursor-pointer shadow-2xs"
                >
                  Batal
                </Button>
                <Button 
                  onClick={savePilgrim} 
                  className="h-12 rounded-2xl px-8 bg-[#00a859] hover:bg-[#009b50] text-white font-bold text-base shadow-2xs cursor-pointer"
                >
                  {selectedPilgrim ? 'Simpan Perubahan' : 'Simpan Data Jamaah'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDeleteDialog 
        isOpen={isDeleteDialogOpen} 
        onClose={() => setIsDeleteDialogOpen(false)} 
        onConfirm={confirmDelete}
        itemCount={selectedIds.size}
      />
    </div>
  );
}
