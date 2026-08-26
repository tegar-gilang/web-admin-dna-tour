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
  CheckCircle2, Clock, Calendar, User, UserCheck, Check, Flag,
  ChevronDown, FileText, HeartPulse, Luggage, Shield
} from 'lucide-react';
import { Checkbox } from '@/components/ui/Checkbox';
import { useStore, Pilgrim } from '@/core/store';
import { Dialog, DialogContent } from '@/components/ui/Dialog';
import { exportToExcel } from '@/lib/export';
import { PaymentMethodOptions } from '@/components/ui/PaymentMethodOptions';

export default function Registration() {
  const { 
    pilgrims, 
    addPilgrim, 
    updatePilgrim, 
    deletePilgrims, 
    groups, 
    financeTransactions, 
    addTransaction, 
    updateTransaction, 
    deleteTransaction 
  } = useStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<'all' | 'complete' | 'incomplete' | 'paid' | 'dp' | 'unpaid'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [filterGender, setFilterGender] = useState("");
  const [filterPackage, setFilterPackage] = useState("");
  const [filterGroup, setFilterGroup] = useState("");
  const [filterDepartureDate, setFilterDepartureDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'detail' | 'edit'>('edit');
  const [editingPilgrim, setEditingPilgrim] = useState<Pilgrim | null>(null);
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

  // Helper status kelengkapan
  const isDocComplete = (p: Pilgrim) => Boolean(p.passport && p.passport !== '-' && p.ktp && p.meningitis && p.photo);

  // Statistics calculation
  const totalPilgrims = pilgrims.length;
  const totalComplete = pilgrims.filter(p => isDocComplete(p)).length;
  const totalIncomplete = totalPilgrims - totalComplete;
  const totalLunas = pilgrims.filter(p => p.paymentOption === 'Bayar Lunas' || ((p.paidAmount || 0) >= (p.totalAmount || 30000000) && (p.totalAmount || 0) > 0)).length;
  const totalDP = pilgrims.filter(p => p.paymentOption === 'DP' || ((p.paidAmount || 0) > 0 && (p.paidAmount || 0) < (p.totalAmount || 30000000))).length;
  const totalBelumBayar = pilgrims.filter(p => p.paymentOption === 'Belum Bayar' || (!p.paidAmount || p.paidAmount === 0)).length;

  const uniqueDepartureDates = useMemo(() => {
    const dates = new Set<string>();
    pilgrims.forEach(p => {
      if (p.departureDate && p.departureDate.trim() && p.departureDate !== '-') {
        dates.add(p.departureDate);
      }
    });
    return Array.from(dates);
  }, [pilgrims]);

  const hasActiveFilters = Boolean(filterGender || filterPackage || filterGroup || filterDepartureDate);

  const resetFilters = () => {
    setFilterGender("");
    setFilterPackage("");
    setFilterGroup("");
    setFilterDepartureDate("");
    setSearchTerm("");
    setCurrentPage(1);
  };

  const filteredPilgrims = useMemo(() => {
    return pilgrims.filter(p => {
      // Tab filter
      if (activeTab === 'complete' && !isDocComplete(p)) return false;
      if (activeTab === 'incomplete' && isDocComplete(p)) return false;
      if (activeTab === 'paid') {
        const isPaid = p.paymentOption === 'Bayar Lunas' || ((p.paidAmount || 0) >= (p.totalAmount || 30000000) && (p.totalAmount || 0) > 0);
        if (!isPaid) return false;
      }
      if (activeTab === 'dp') {
        const isDp = p.paymentOption === 'DP' || ((p.paidAmount || 0) > 0 && (p.paidAmount || 0) < (p.totalAmount || 30000000));
        if (!isDp) return false;
      }
      if (activeTab === 'unpaid') {
        const isUnpaid = p.paymentOption === 'Belum Bayar' || (!p.paidAmount || p.paidAmount === 0);
        if (!isUnpaid) return false;
      }

      // Search matching
      const matchesSearch = 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (p.passport && p.passport.toLowerCase().includes(searchTerm.toLowerCase())) ||
        p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.formId && p.formId.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.ktp && p.ktp.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.phone && p.phone.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.group && p.group.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesGender = filterGender ? p.gender === filterGender : true;
      const matchesPackage = filterPackage ? p.umrahPackage === filterPackage : true;
      const matchesGroup = filterGroup ? p.group === filterGroup : true;
      const matchesDeparture = filterDepartureDate ? (
        p.departureDate === filterDepartureDate || 
        (p.departureDate && formatIndoDate(p.departureDate) === formatIndoDate(filterDepartureDate))
      ) : true;

      return matchesSearch && matchesGender && matchesPackage && matchesGroup && matchesDeparture;
    });
  }, [pilgrims, activeTab, searchTerm, filterGender, filterPackage, filterGroup, filterDepartureDate]);

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
    toast("Data pendaftaran berhasil dihapus.", "success");
  };

  const openAddModal = () => {
    const newFormId = `FRM-${Math.floor(100 + Math.random() * 900)}`;
    setEditingPilgrim(null);
    setModifiedDates({});
    setModalMode('edit');
    setFormData({ 
      id: '',
      formId: newFormId,
      name: '',
      gender: '', 
      age: 0,
      phone: '',
      ktp: '',
      passport: '',
      umrahPackage: '',
      group: '',
      hotelMakkah: '',
      hotelMadinah: '',
      hotel: '',
      registrationDate: todayStr,
      departureDate: '',
      returnDate: '',
      meningitis: false,
      photo: false,
      koperBesar: false,
      koperKabin: false,
      batik: false,
      bukuDomisili: false,
      kainIhram: false,
      sabuk: '',
      kerudungMerah: false,
      kerudungPutih: false,
      tasSelempang: false,
      tasSandal: false,
      syall: false,
      paymentOption: 'Belum Bayar',
      totalAmount: 0,
      paidAmount: 0,
      paymentMethod: '',
      paymentDate: todayStr,
      paymentNotes: ''
    });
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const openEditModal = (p: Pilgrim) => {
    setEditingPilgrim(p);
    setModifiedDates({
      registrationDate: !!p.registrationDate,
      departureDate: !!p.departureDate,
      paymentDate: !!p.paymentDate,
    });
    setFormData({
      ...p,
      paymentOption: p.paymentOption || 'DP',
      totalAmount: p.totalAmount || 30000000,
      paidAmount: p.paidAmount || (p.paymentOption === 'Bayar Lunas' ? 30000000 : 10000000),
      paymentMethod: p.paymentMethod || 'Transfer BCA',
      paymentDate: p.paymentDate || todayStr,
      paymentNotes: p.paymentNotes || ''
    });
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const openDetailModal = (p: Pilgrim) => {
    setEditingPilgrim(p);
    setFormData(p);
    setModalMode('detail');
    setIsModalOpen(true);
  };

  const savePilgrim = () => {
    if (!formData.id || !formData.id.trim()) {
      toast("ID Jamaah wajib diisi.", "error");
      return;
    }
    if (!formData.formId) {
      toast("Form ID wajib diisi.", "error");
      return;
    }
    if (!formData.name) {
      toast("Nama lengkap wajib diisi.", "error");
      return;
    }

    const payOption = formData.paymentOption || 'Belum Bayar';
    const totalAmt = Number(formData.totalAmount) || 30000000;
    const paidAmt = payOption === 'Bayar Lunas' ? totalAmt : (payOption === 'DP' ? (Number(formData.paidAmount) || 10000000) : 0);
    const payMethod = formData.paymentMethod || 'Transfer BCA';
    const payDate = formData.paymentDate || todayStr;
    const payNotes = formData.paymentNotes || (payOption === 'DP' ? 'DP Uang Muka Pendaftaran' : payOption === 'Bayar Lunas' ? 'Pembayaran Lunas Pendaftaran' : 'Belum Ada Pembayaran');

    if (editingPilgrim) {
      updatePilgrim(editingPilgrim.id, {
        ...formData,
        paymentOption: payOption,
        totalAmount: totalAmt,
        paidAmount: paidAmt,
        paymentMethod: payMethod,
        paymentDate: payDate,
        paymentNotes: payNotes
      });

      toast("Data pendaftar dan status pembayaran berhasil diperbarui.", "success");
    } else {
      const newId = formData.id || `REG-${Math.floor(1000 + Math.random() * 9000)}`;
      addPilgrim({
        id: newId,
        formId: formData.formId,
        name: formData.name || 'Tidak Diketahui',
        passport: formData.passport || '-',
        group: formData.group || 'Belum Ada',
        umrahPackage: formData.umrahPackage || 'Yamani',
        gender: formData.gender || 'Laki-laki',
        age: Number(formData.age) || 0,
        phone: formData.phone || '',
        registrationDate: formData.registrationDate || todayStr,
        departureDate: formData.departureDate || '',
        returnDate: formData.returnDate || '',
        hotelMakkah: formData.hotelMakkah || 'Swissôtel Al Maqam Makkah',
        hotelMadinah: formData.hotelMadinah || 'Anwar Al Madinah Movenpick',
        hotel: formData.hotel || 'Swissôtel Al Maqam Makkah',
        ktp: formData.ktp || '',
        documentInfo: formData.documentInfo || '',
        meningitis: Boolean(formData.meningitis),
        photo: Boolean(formData.photo),
        koperBesar: Boolean(formData.koperBesar),
        koperKabin: Boolean(formData.koperKabin),
        batik: Boolean(formData.batik),
        bukuDomisili: Boolean(formData.bukuDomisili),
        kainIhram: Boolean(formData.kainIhram),
        sabuk: formData.sabuk || '',
        kerudungMerah: Boolean(formData.kerudungMerah),
        kerudungPutih: Boolean(formData.kerudungPutih),
        tasSelempang: Boolean(formData.tasSelempang),
        tasSandal: Boolean(formData.tasSandal),
        syall: Boolean(formData.syall),
        paymentOption: payOption,
        totalAmount: totalAmt,
        paidAmount: paidAmt,
        paymentMethod: payMethod,
        paymentDate: payDate,
        paymentNotes: payNotes
      });

      toast("Pendaftaran jamaah baru berhasil disimpan & 1 transaksi pemasukan tercatat di Keuangan.", "success");
    }
    setIsModalOpen(false);
  };

  const handleExportExcel = () => {
    const exportData = filteredPilgrims.map(p => ({
      'ID Pendaftaran': p.id,
      'Form ID': p.formId || '-',
      'Nama Lengkap': p.name,
      'No. Paspor': p.passport || '-',
      'No. KTP': p.ktp || '-',
      'Jenis Kelamin': p.gender,
      'Usia': p.age,
      'No. Telepon': p.phone || '-',
      'Tgl. Registrasi': p.registrationDate || '-',
      'Tgl. Keberangkatan': p.departureDate || '-',
      'Paket Umrah': p.umrahPackage || '-',
      'Kloter': p.group || '-',
      'Status Pembayaran': p.paymentOption || 'Belum Lunas',
      'Total Biaya (Rp)': p.totalAmount || 30000000,
      'Telah Dibayar (Rp)': p.paidAmount || 0,
      'Sisa Tagihan (Rp)': Math.max(0, (p.totalAmount || 30000000) - (p.paidAmount || 0)),
      'Info Dokumen': p.documentInfo || '-',
      'Vaksin Meningitis': p.meningitis ? 'Sudah' : 'Belum',
      'Pas Foto 4x6': p.photo ? 'Sudah' : 'Belum',
      'Koper Besar': p.koperBesar ? 'Ada' : 'Belum',
      'Koper Kabin': p.koperKabin ? 'Ada' : 'Belum',
      'Seragam Batik': p.batik ? 'Ada' : 'Belum',
      'Buku Panduan': p.bukuDomisili ? 'Ada' : 'Belum',
      'Kain Ihram': p.kainIhram ? 'Ada' : 'Belum',
      'Sabuk Ihram': p.sabuk || '-',
      'Kerudung Merah': p.kerudungMerah ? 'Ada' : 'Belum',
      'Kerudung Putih': p.kerudungPutih ? 'Ada' : 'Belum',
      'Tas Selempang': p.tasSelempang ? 'Ada' : 'Belum',
      'Tas Sandal': p.tasSandal ? 'Ada' : 'Belum',
      'Syall': p.syall ? 'Ada' : 'Belum',
    }));
    exportToExcel(exportData, 'Data_Pendaftaran_Jamaah', 'Laporan Pendaftaran Jamaah & Administrasi - DNA Tour');
  };

  const totalPages = Math.max(1, Math.ceil(filteredPilgrims.length / itemsPerPage));
  const paginatedData = filteredPilgrims.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getDocStatusBadge = (p: Pilgrim) => {
    const isComplete = isDocComplete(p);
    if (isComplete) {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-300 shadow-2xs whitespace-nowrap shrink-0">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          Lengkap
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-300 shadow-2xs whitespace-nowrap shrink-0">
        <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
        Kurang
      </span>
    );
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Header Banner Container - Clean & Consistent */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">
              Pendaftaran Jamaah
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 font-normal mt-1">
              Daftar pendaftar baru, status administrasi dokumen, dan verifikasi pembayaran awal
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
              Pendaftaran Baru
            </Button>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid Container */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Pendaftar */}
        <Card 
          onClick={() => { setActiveTab('all'); setCurrentPage(1); }}
          className={`rounded-2xl border bg-white shadow-2xs cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.98] ${
            activeTab === 'all' 
              ? 'border-[#782820] ring-2 ring-[#782820]/20 bg-[#fefcfc]' 
              : 'border-gray-200/80 hover:border-gray-300'
          }`}
        >
          <CardContent className="p-5 flex flex-col justify-between h-full gap-3">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">TOTAL PENDAFTAR</p>
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
              <span>Database Pendaftaran Aktif</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Dokumen Lengkap */}
        <Card 
          onClick={() => { setActiveTab('complete'); setCurrentPage(1); }}
          className={`rounded-2xl border bg-white shadow-2xs cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.98] ${
            activeTab === 'complete' 
              ? 'border-emerald-600 ring-2 ring-emerald-600/20 bg-emerald-50/20' 
              : 'border-gray-200/80 hover:border-gray-300'
          }`}
        >
          <CardContent className="p-5 flex flex-col justify-between h-full gap-3">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">BERKAS LENGKAP</p>
                <p className="text-2xl sm:text-[26px] font-bold tracking-tight text-emerald-800">
                  {totalComplete} Jamaah
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 shadow-2xs">
                <FileCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
              <Check className="w-3.5 h-3.5 shrink-0" />
              <span>Paspor, KTP, Vaksin & Foto Terpenuhi</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Dokumen Kurang */}
        <Card 
          onClick={() => { setActiveTab('incomplete'); setCurrentPage(1); }}
          className={`rounded-2xl border bg-white shadow-2xs cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.98] ${
            activeTab === 'incomplete' 
              ? 'border-amber-600 ring-2 ring-amber-600/20 bg-amber-50/20' 
              : 'border-gray-200/80 hover:border-gray-300'
          }`}
        >
          <CardContent className="p-5 flex flex-col justify-between h-full gap-3">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">BERKAS KURANG</p>
                <p className="text-2xl sm:text-[26px] font-bold tracking-tight text-amber-800">
                  {totalIncomplete} Jamaah
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#fdf6e7] text-[#c27803] flex items-center justify-center shrink-0 shadow-2xs">
                <AlertCircle className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-[#b45309]">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span>Menunggu Kelengkapan Syarat</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Pembayaran Lunas */}
        <Card 
          onClick={() => { setActiveTab('paid'); setCurrentPage(1); }}
          className={`rounded-2xl border bg-white shadow-2xs cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.98] ${
            activeTab === 'paid' 
              ? 'border-blue-600 ring-2 ring-blue-600/20 bg-blue-50/20' 
              : 'border-gray-200/80 hover:border-gray-300'
          }`}
        >
          <CardContent className="p-5 flex flex-col justify-between h-full gap-3">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">PEMBAYARAN LUNAS</p>
                <p className="text-2xl sm:text-[26px] font-bold tracking-tight text-blue-900">
                  {totalLunas} Jamaah
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#edf5ff] text-[#2563eb] flex items-center justify-center shrink-0 shadow-2xs">
                <CreditCard className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-[#2563eb]">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>Biaya Pendaftaran 100% Selesai</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card Container with Integrated Tabs */}
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
              <span>Semua Pendaftar</span>
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
              onClick={() => { setActiveTab('complete'); setCurrentPage(1); }}
              className={`relative pb-3 pt-2 px-2.5 text-xs sm:text-sm transition-all duration-200 whitespace-nowrap cursor-pointer flex items-center gap-1.5 select-none rounded-t-lg group active:scale-[0.96] ${
                activeTab === 'complete' 
                  ? 'font-bold text-emerald-800' 
                  : 'font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50/80'
              }`}
            >
              <span>Berkas Lengkap</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold transition-all duration-200 ${
                activeTab === 'complete' 
                  ? 'bg-emerald-100 text-emerald-800 scale-105' 
                  : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200/80'
              }`}>
                {totalComplete}
              </span>
              {activeTab === 'complete' && (
                <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-emerald-600 rounded-full animate-tab-indicator" />
              )}
            </button>

            <button 
              onClick={() => { setActiveTab('incomplete'); setCurrentPage(1); }}
              className={`relative pb-3 pt-2 px-2.5 text-xs sm:text-sm transition-all duration-200 whitespace-nowrap cursor-pointer flex items-center gap-1.5 select-none rounded-t-lg group active:scale-[0.96] ${
                activeTab === 'incomplete' 
                  ? 'font-bold text-amber-800' 
                  : 'font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50/80'
              }`}
            >
              <span>Berkas Kurang</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold transition-all duration-200 ${
                activeTab === 'incomplete' 
                  ? 'bg-amber-100 text-amber-800 scale-105' 
                  : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200/80'
              }`}>
                {totalIncomplete}
              </span>
              {activeTab === 'incomplete' && (
                <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-amber-600 rounded-full animate-tab-indicator" />
              )}
            </button>

            <button 
              onClick={() => { setActiveTab('paid'); setCurrentPage(1); }}
              className={`relative pb-3 pt-2 px-2.5 text-xs sm:text-sm transition-all duration-200 whitespace-nowrap cursor-pointer flex items-center gap-1.5 select-none rounded-t-lg group active:scale-[0.96] ${
                activeTab === 'paid' 
                  ? 'font-bold text-emerald-800' 
                  : 'font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50/80'
              }`}
            >
              <span>Lunas</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold transition-all duration-200 ${
                activeTab === 'paid' 
                  ? 'bg-emerald-100 text-emerald-800 scale-105' 
                  : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200/80'
              }`}>
                {totalLunas}
              </span>
              {activeTab === 'paid' && (
                <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-emerald-600 rounded-full animate-tab-indicator" />
              )}
            </button>

            <button 
              onClick={() => { setActiveTab('dp'); setCurrentPage(1); }}
              className={`relative pb-3 pt-2 px-2.5 text-xs sm:text-sm transition-all duration-200 whitespace-nowrap cursor-pointer flex items-center gap-1.5 select-none rounded-t-lg group active:scale-[0.96] ${
                activeTab === 'dp' 
                  ? 'font-bold text-amber-800' 
                  : 'font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50/80'
              }`}
            >
              <span>Uang Muka (DP)</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold transition-all duration-200 ${
                activeTab === 'dp' 
                  ? 'bg-amber-100 text-amber-800 scale-105' 
                  : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200/80'
              }`}>
                {totalDP}
              </span>
              {activeTab === 'dp' && (
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
              <span>Belum Bayar</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold transition-all duration-200 ${
                activeTab === 'unpaid' 
                  ? 'bg-red-100 text-red-800 scale-105' 
                  : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200/80'
              }`}>
                {totalBelumBayar}
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
              placeholder="Cari pendaftar, ID, paspor, KTP, HP..." 
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="pl-9.5 pr-8 h-9.5 rounded-xl border-gray-200 bg-white text-xs sm:text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 cursor-pointer"
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
                className="text-xs h-9 font-semibold text-red-600 border-red-200 hover:bg-red-50 px-3.5 rounded-xl cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                Hapus Terpilih ({selectedIds.size})
              </Button>
            )}

            <Button 
              variant={showFilters || hasActiveFilters ? "secondary" : "outline"} 
              className={`text-xs h-9 font-semibold px-3.5 rounded-xl cursor-pointer ${
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
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex flex-wrap gap-4 items-end animate-fade-in">
            <div className="space-y-1.5 w-full sm:w-48">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Jenis Kelamin</label>
              <select 
                className="flex h-9 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                value={filterGender}
                onChange={(e) => { setFilterGender(e.target.value); setCurrentPage(1); }}
              >
                <option value="">Semua Gender</option>
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
            </div>

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

            <div className="space-y-1.5 w-full sm:w-52">
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

            <div className="space-y-1.5 w-full sm:w-52">
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
                size="sm"
                className="h-9 text-xs text-gray-500 hover:text-gray-900 rounded-xl cursor-pointer"
                onClick={resetFilters}
              >
                Reset Filter
              </Button>
            )}
          </div>
        )}

        {/* Table View */}
        <div className="w-full overflow-x-auto touch-pan-x scrollbar-thin">
          <Table className="min-w-[1050px] w-full">
            <TableHeader className="bg-gray-50/80">
              <TableRow className="hover:bg-transparent border-b-gray-200">
                <TableHead className="w-12 text-center pl-4 py-3 whitespace-nowrap">
                  <Checkbox 
                    checked={selectedIds.size > 0 && selectedIds.size === filteredPilgrims.length}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Pilih semua"
                  />
                </TableHead>
                <TableHead className="text-[11px] font-bold text-gray-500 uppercase tracking-wider h-11 whitespace-nowrap min-w-[110px]">ID JAMAAH</TableHead>
                <TableHead className="text-[11px] font-bold text-gray-500 uppercase tracking-wider h-11 whitespace-nowrap min-w-[220px]">Pendaftar</TableHead>
                <TableHead className="text-[11px] font-bold text-gray-500 uppercase tracking-wider h-11 whitespace-nowrap min-w-[160px]">Paket</TableHead>
                <TableHead className="text-[11px] font-bold text-gray-500 uppercase tracking-wider h-11 whitespace-nowrap min-w-[140px]">Status Dokumen</TableHead>
                <TableHead className="text-[11px] font-bold text-gray-500 uppercase tracking-wider h-11 whitespace-nowrap min-w-[180px]">Status Pembayaran</TableHead>
                <TableHead className="text-right pr-6 text-[11px] font-bold text-gray-500 uppercase tracking-wider h-11 whitespace-nowrap min-w-[110px]">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody key={activeTab} className="animate-fade-in">
              {paginatedData.map((pilgrim) => {
                const totalAmt = pilgrim.totalAmount || 30000000;
                const paidAmt = pilgrim.paidAmount || 0;
                const isLunas = pilgrim.paymentOption === 'Bayar Lunas' || paidAmt >= totalAmt;
                const isDP = pilgrim.paymentOption === 'DP' || (paidAmt > 0 && paidAmt < totalAmt);
                const remaining = Math.max(0, totalAmt - paidAmt);

                return (
                  <TableRow 
                    key={pilgrim.id} 
                    className={`${selectedIds.has(pilgrim.id) ? "bg-emerald-50/40" : ""} hover:bg-gray-50/80 transition-colors group cursor-pointer`}
                    onClick={(e) => {
                      if ((e.target as HTMLElement).closest('input[type="checkbox"], button')) return;
                      openDetailModal(pilgrim);
                    }}
                  >
                    <TableCell className="pl-4 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <Checkbox 
                        checked={selectedIds.has(pilgrim.id)}
                        onCheckedChange={() => toggleSelect(pilgrim.id)}
                        aria-label={`Pilih ${pilgrim.name}`}
                      />
                    </TableCell>

                    {/* ID JAMAAH */}
                    <TableCell className="py-4 whitespace-nowrap">
                      <div className="font-bold text-sm tracking-tight text-[#480c0c] whitespace-nowrap">
                        {pilgrim.id}
                      </div>
                    </TableCell>

                    {/* Nama Pendaftar */}
                    <TableCell className="py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center font-bold text-emerald-800 text-xs shrink-0 border border-emerald-200">
                          {pilgrim.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900 text-sm whitespace-nowrap">{pilgrim.name}</span>
                          <span className="text-xs text-gray-500 mt-0.5 font-medium whitespace-nowrap">
                            {pilgrim.gender}, {pilgrim.age} thn • {pilgrim.phone || '-'}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Paket Umrah */}
                    <TableCell className="py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold text-[#782820] bg-[#fcedea] border border-[#f5d0cb] shadow-2xs tracking-wide uppercase">
                        {pilgrim.umrahPackage || 'Yamani'}
                      </span>
                    </TableCell>

                    {/* Status Dokumen */}
                    <TableCell className="py-4 whitespace-nowrap">
                      {getDocStatusBadge(pilgrim)}
                    </TableCell>

                    {/* Status Pembayaran */}
                    <TableCell className="py-4 whitespace-nowrap">
                      {isLunas ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-300 shadow-2xs">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          LUNAS (100%)
                        </span>
                      ) : isDP ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-300 shadow-2xs">
                          <CreditCard className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          UANG MUKA (DP)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 bg-rose-50 px-3 py-1 rounded-full border border-rose-300 shadow-2xs">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                          BELUM BAYAR
                        </span>
                      )}
                    </TableCell>

                    {/* Aksi */}
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
                          title="Edit Pendaftaran"
                          onClick={() => openEditModal(pilgrim)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="w-8 h-8 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors shrink-0" 
                          title="Hapus Data"
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
                  <TableCell colSpan={7} className="h-56 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-3 border border-gray-200">
                        <Users className="w-5 h-5 text-gray-400" />
                      </div>
                      <p className="font-semibold text-gray-900">Tidak ada data pendaftaran ditemukan</p>
                      <p className="text-xs text-gray-500 mt-1 max-w-sm">
                        Ubah filter pencarian atau gunakan tombol tambah untuk mendaftarkan jamaah baru.
                      </p>
                      {hasActiveFilters && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-3 text-xs rounded-xl cursor-pointer"
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
            Menampilkan <span className="font-semibold text-gray-900">{filteredPilgrims.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> - <span className="font-semibold text-gray-900">{Math.min(currentPage * itemsPerPage, filteredPilgrims.length)}</span> dari <span className="font-semibold text-gray-900">{filteredPilgrims.length}</span> pendaftar
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

      {/* Modal Dialog for Data Diri & Form Edit - Matches Pilgrim Reference Design */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent hideClose className="w-[95vw] max-w-2xl sm:w-full max-h-[92vh] bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border-0 overflow-y-auto hide-scrollbar">
          {/* Top Bar Header with Tabs */}
          <div className="flex justify-between items-center pb-5 border-b border-gray-100 mb-6">
            <div className="flex items-center gap-2.5">
              {editingPilgrim ? (
                <>
                  <button
                    type="button"
                    onClick={() => setModalMode('detail')}
                    className={`px-6 py-2.5 rounded-full text-sm sm:text-base font-bold transition-all duration-200 cursor-pointer active:scale-95 select-none ${
                      modalMode === 'detail'
                        ? 'bg-[#00a859] text-white shadow-xs'
                        : 'bg-white text-gray-800 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Data Diri Jamaah
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalMode('edit')}
                    className={`px-6 py-2.5 rounded-full text-sm sm:text-base font-bold transition-all duration-200 cursor-pointer active:scale-95 select-none ${
                      modalMode === 'edit'
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
              onClick={() => setIsModalOpen(false)}
              className="text-gray-400 hover:text-gray-700 p-1.5 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* TAB 1: DATA DETAIL PENDAFTARAN (4 Bagian Terpadu) */}
          {modalMode === 'detail' && (() => {
            const activePilgrim = editingPilgrim || (formData.name ? (formData as Pilgrim) : pilgrims[0]);

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

            return (
              <div className="space-y-7 animate-fade-in">
                {/* Card 1: Informasi Diri Jamaah */}
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-3">
                    1. Informasi Diri Jamaah
                  </h2>

                  <div className="bg-white border border-[#cbd5e1] rounded-3xl overflow-hidden divide-y divide-[#e2e8f0] shadow-2xs">
                    <div className="flex items-center justify-between py-3.5 sm:py-4 px-5 sm:px-6">
                      <div className="flex items-center gap-3.5 text-gray-700 text-sm font-medium">
                        <CreditCard className="w-4 h-4 text-[#782820] shrink-0" />
                        <span>ID Jamaah</span>
                      </div>
                      <span className="font-bold text-gray-900 text-sm text-right font-mono">
                        {activePilgrim?.id || '-'}
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
                        <span>Nomor Paspor</span>
                      </div>
                      <span className="font-bold text-gray-900 text-sm text-right">
                        {activePilgrim?.passport || '-'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-3.5 sm:py-4 px-5 sm:px-6">
                      <div className="flex items-center gap-3.5 text-gray-700 text-sm font-medium">
                        <FileText className="w-4 h-4 text-[#782820] shrink-0" />
                        <span>Nomor KTP</span>
                      </div>
                      <span className="font-bold text-gray-900 text-sm text-right">
                        {activePilgrim?.ktp || '-'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-3.5 sm:py-4 px-5 sm:px-6">
                      <div className="flex items-center gap-3.5 text-gray-700 text-sm font-medium">
                        <Phone className="w-4 h-4 text-[#782820] shrink-0" />
                        <span>Nomor Telepon</span>
                      </div>
                      <span className="font-bold text-gray-900 text-sm text-right">
                        {activePilgrim?.phone || '-'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-3.5 sm:py-4 px-5 sm:px-6">
                      <div className="flex items-center gap-3.5 text-gray-700 text-sm font-medium">
                        <Calendar className="w-4 h-4 text-[#782820] shrink-0" />
                        <span>Usia</span>
                      </div>
                      <span className="font-bold text-gray-900 text-sm text-right">
                        {activePilgrim?.age ? `${activePilgrim.age} Tahun` : '-'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-3.5 sm:py-4 px-5 sm:px-6">
                      <div className="flex items-center gap-3.5 text-gray-700 text-sm font-medium">
                        <Users className="w-4 h-4 text-[#782820] shrink-0" />
                        <span>Jenis Kelamin</span>
                      </div>
                      <span className="font-bold text-gray-900 text-sm text-right">
                        {activePilgrim?.gender || '-'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card 2: Administrasi */}
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-3">
                    2. Administrasi
                  </h2>

                  <div className="bg-white border border-[#cbd5e1] rounded-3xl overflow-hidden divide-y divide-[#e2e8f0] shadow-2xs">
                    <div className="flex items-center justify-between py-3.5 sm:py-4 px-5 sm:px-6">
                      <div className="flex items-center gap-3.5 text-gray-700 text-sm font-medium">
                        <Calendar className="w-4 h-4 text-[#782820] shrink-0" />
                        <span>Tanggal Pendaftaran</span>
                      </div>
                      <span className="font-bold text-gray-900 text-sm text-right">
                        {formatIndoDate(activePilgrim?.registrationDate)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-3.5 sm:py-4 px-5 sm:px-6">
                      <div className="flex items-center gap-3.5 text-gray-700 text-sm font-medium">
                        <PlaneTakeoff className="w-4 h-4 text-[#782820] shrink-0" />
                        <span>Tanggal Keberangkatan</span>
                      </div>
                      <span className="font-bold text-gray-900 text-sm text-right">
                        {formatIndoDate(activePilgrim?.departureDate)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-3.5 sm:py-4 px-5 sm:px-6">
                      <div className="flex items-center gap-3.5 text-gray-700 text-sm font-medium">
                        <Package className="w-4 h-4 text-[#782820] shrink-0" />
                        <span>Pilihan Paket Umrah</span>
                      </div>
                      <span className="font-bold text-gray-900 text-sm text-right">
                        {activePilgrim?.umrahPackage || '-'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-3.5 sm:py-4 px-5 sm:px-6">
                      <div className="flex items-center gap-3.5 text-gray-700 text-sm font-medium">
                        <Users className="w-4 h-4 text-[#782820] shrink-0" />
                        <span>Kloter Keberangkatan</span>
                      </div>
                      <span className="font-bold text-gray-900 text-sm text-right">
                        {activePilgrim?.group || '-'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-3.5 sm:py-4 px-5 sm:px-6">
                      <div className="flex items-center gap-3.5 text-gray-700 text-sm font-medium">
                        <HeartPulse className="w-4 h-4 text-[#782820] shrink-0" />
                        <span>Vaksin Meningitis</span>
                      </div>
                      <span className={`font-bold text-sm text-right ${activePilgrim?.meningitis ? 'text-[#00a859]' : 'text-amber-600'}`}>
                        {activePilgrim?.meningitis ? 'Sudah Vaksin' : 'Belum Vaksin'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-3.5 sm:py-4 px-5 sm:px-6">
                      <div className="flex items-center gap-3.5 text-gray-700 text-sm font-medium">
                        <FileCheck className="w-4 h-4 text-[#782820] shrink-0" />
                        <span>Pas Foto 4x6</span>
                      </div>
                      <span className={`font-bold text-sm text-right ${activePilgrim?.photo ? 'text-[#00a859]' : 'text-amber-600'}`}>
                        {activePilgrim?.photo ? 'Sudah Ada' : 'Belum Ada'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card 3: Perlengkapan */}
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-3">
                    3. Perlengkapan
                  </h2>

                  <div className="bg-white border border-[#cbd5e1] rounded-3xl overflow-hidden divide-y divide-[#e2e8f0] shadow-2xs">
                    {[
                      { key: 'koperBesar', label: 'Koper Besar 24"' },
                      { key: 'koperKabin', label: 'Koper Kabin 20"' },
                      { key: 'batik', label: 'Seragam Batik' },
                      { key: 'bukuDomisili', label: 'Buku Panduan & Doa' },
                      { key: 'kainIhram', label: 'Kain Ihram' },
                      { key: 'kerudungMerah', label: 'Kerudung Merah' },
                      { key: 'kerudungPutih', label: 'Kerudung Putih' },
                      { key: 'tasSelempang', label: 'Tas Selempang' },
                      { key: 'tasSandal', label: 'Tas Sandal' },
                      { key: 'syall', label: 'Syall' },
                    ].map(item => {
                      const isChecked = !!(activePilgrim as any)?.[item.key];
                      return (
                        <div key={item.key} className="flex items-center justify-between py-3.5 sm:py-4 px-5 sm:px-6">
                          <div className="flex items-center gap-3.5 text-gray-700 text-sm font-medium">
                            <Luggage className="w-4 h-4 text-[#782820] shrink-0" />
                            <span>{item.label}</span>
                          </div>
                          <span className={`font-bold text-sm text-right flex items-center gap-1.5 ${isChecked ? 'text-[#00a859]' : 'text-gray-400'}`}>
                            {isChecked ? (
                              <>
                                <Check className="w-4 h-4 stroke-[3]" />
                                Sudah Diterima
                              </>
                            ) : (
                              'Belum'
                            )}
                          </span>
                        </div>
                      );
                    })}

                    <div className="flex items-center justify-between py-3.5 sm:py-4 px-5 sm:px-6">
                      <div className="flex items-center gap-3.5 text-gray-700 text-sm font-medium">
                        <Shield className="w-4 h-4 text-[#782820] shrink-0" />
                        <span>Ukuran Sabuk</span>
                      </div>
                      <span className="font-bold text-gray-900 text-sm text-right">
                        {activePilgrim?.sabuk ? `Ukuran ${activePilgrim.sabuk}` : '-'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card 4: Informasi & Skema Pembayaran */}
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-3">
                    4. Informasi & Skema Pembayaran
                  </h2>

                  <div className="bg-white border border-[#cbd5e1] rounded-3xl overflow-hidden divide-y divide-[#e2e8f0] shadow-2xs">
                    <div className="flex items-center justify-between py-3.5 sm:py-4 px-5 sm:px-6">
                      <div className="flex items-center gap-3.5 text-gray-700 text-sm font-medium">
                        <CreditCard className="w-4 h-4 text-[#782820] shrink-0" />
                        <span>Status Pembayaran</span>
                      </div>
                      <span className={`font-bold text-sm text-right ${
                        activePilgrim?.paymentOption === 'Bayar Lunas' 
                          ? 'text-[#00a859]' 
                          : activePilgrim?.paymentOption === 'DP' 
                          ? 'text-blue-600' 
                          : 'text-rose-600'
                      }`}>
                        {activePilgrim?.paymentOption || 'Belum Bayar'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-3.5 sm:py-4 px-5 sm:px-6">
                      <div className="flex items-center gap-3.5 text-gray-700 text-sm font-medium">
                        <CreditCard className="w-4 h-4 text-[#782820] shrink-0" />
                        <span>Total Biaya Paket</span>
                      </div>
                      <span className="font-bold text-gray-900 text-sm text-right font-mono">
                        {activePilgrim?.totalAmount ? `Rp ${activePilgrim.totalAmount.toLocaleString('id-ID')}` : 'Rp 0'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-3.5 sm:py-4 px-5 sm:px-6">
                      <div className="flex items-center gap-3.5 text-gray-700 text-sm font-medium">
                        <CreditCard className="w-4 h-4 text-[#782820] shrink-0" />
                        <span>Nominal Telah Dibayar</span>
                      </div>
                      <span className="font-bold text-[#00a859] text-sm text-right font-mono">
                        {activePilgrim?.paidAmount ? `Rp ${activePilgrim.paidAmount.toLocaleString('id-ID')}` : 'Rp 0'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-3.5 sm:py-4 px-5 sm:px-6">
                      <div className="flex items-center gap-3.5 text-gray-700 text-sm font-medium">
                        <AlertCircle className="w-4 h-4 text-[#782820] shrink-0" />
                        <span>Sisa Tagihan</span>
                      </div>
                      <span className="font-bold text-rose-600 text-sm text-right font-mono">
                        {activePilgrim?.totalAmount ? `Rp ${Math.max(0, (activePilgrim.totalAmount || 0) - (activePilgrim.paidAmount || 0)).toLocaleString('id-ID')}` : 'Rp 0'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-3.5 sm:py-4 px-5 sm:px-6">
                      <div className="flex items-center gap-3.5 text-gray-700 text-sm font-medium">
                        <CreditCard className="w-4 h-4 text-[#782820] shrink-0" />
                        <span>Metode Pembayaran</span>
                      </div>
                      <span className="font-bold text-gray-900 text-sm text-right">
                        {activePilgrim?.paymentMethod || '-'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-3.5 sm:py-4 px-5 sm:px-6">
                      <div className="flex items-center gap-3.5 text-gray-700 text-sm font-medium">
                        <Calendar className="w-4 h-4 text-[#782820] shrink-0" />
                        <span>Tanggal Pembayaran</span>
                      </div>
                      <span className="font-bold text-gray-900 text-sm text-right">
                        {formatIndoDate(activePilgrim?.paymentDate || activePilgrim?.registrationDate)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-3.5 sm:py-4 px-5 sm:px-6">
                      <div className="flex items-center gap-3.5 text-gray-700 text-sm font-medium">
                        <FileText className="w-4 h-4 text-[#782820] shrink-0" />
                        <span>Catatan Pembayaran</span>
                      </div>
                      <span className="font-bold text-gray-900 text-sm text-right">
                        {activePilgrim?.paymentNotes || '-'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Tutup Button */}
                <div className="flex justify-end pt-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsModalOpen(false)} 
                    className="rounded-xl h-10 px-6 text-sm font-semibold text-gray-700 border-gray-300 hover:bg-gray-50 cursor-pointer shadow-2xs"
                  >
                    Tutup
                  </Button>
                </div>
              </div>
            );
          })()}

          {/* TAB 2: FORM EDIT (Exact Match to Pilgrims Form Edit) */}
          {modalMode === 'edit' && (
            <div className="space-y-6">
                                {/* Section 1: INFORMASI DIRI JAMAAH */}
                  <div className="bg-white border border-[#cbd5e1] rounded-3xl p-5 sm:p-7 shadow-2xs">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-7 h-7 rounded-lg border border-gray-300 text-gray-800 bg-white flex items-center justify-center text-xs font-bold font-mono shadow-2xs">1</div>
                      <h3 className="text-base sm:text-[17px] font-black text-gray-900 uppercase tracking-wide">INFORMASI DIRI JAMAAH</h3>
                    </div>
                    <div className="space-y-4">
                      {/* ID JAMAAH */}
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 items-center">
                        <label className="sm:col-span-4 text-xs sm:text-[13px] font-bold text-gray-600 uppercase tracking-wider">ID JAMAAH *</label>
                        <div className="sm:col-span-8">
                          <Input value={formData.id || ''} onChange={(e) => setFormData({...formData, id: e.target.value})} placeholder="Cth. REG-1001 / PL-88210" className={`h-12 sm:h-13 rounded-2xl border-gray-300 bg-white text-base ${formData.id ? 'font-bold text-gray-900' : 'font-normal text-gray-400'} placeholder:text-gray-400 placeholder:font-normal px-4 sm:px-5 focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859]`} />
                        </div>
                      </div>
                      {/* NAMA LENGKAP */}
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 items-center">
                        <label className="sm:col-span-4 text-xs sm:text-[13px] font-bold text-gray-600 uppercase tracking-wider">NAMA LENGKAP *</label>
                        <div className="sm:col-span-8">
                          <Input value={formData.name || ''} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Cth. Ahmad Hidayat" className={`h-12 sm:h-13 rounded-2xl border-gray-300 bg-white text-base ${formData.name ? 'font-bold text-gray-900' : 'font-normal text-gray-400'} placeholder:text-gray-400 placeholder:font-normal px-4 sm:px-5 focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859]`} />
                        </div>
                      </div>
                      {/* NO. PASPOR */}
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 items-center">
                        <label className="sm:col-span-4 text-xs sm:text-[13px] font-bold text-gray-600 uppercase tracking-wider">NO. PASPOR</label>
                        <div className="sm:col-span-8">
                          <Input value={formData.passport || ''} onChange={(e) => setFormData({...formData, passport: e.target.value})} placeholder="Cth. A1234567" className={`h-12 sm:h-13 rounded-2xl border-gray-300 bg-white text-base ${formData.passport ? 'font-bold text-gray-900' : 'font-normal text-gray-400'} placeholder:text-gray-400 placeholder:font-normal px-4 sm:px-5 uppercase focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859]`} />
                        </div>
                      </div>
                      {/* NO. KTP */}
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 items-center">
                        <label className="sm:col-span-4 text-xs sm:text-[13px] font-bold text-gray-600 uppercase tracking-wider">NO. KTP</label>
                        <div className="sm:col-span-8">
                          <Input value={formData.ktp || ''} onChange={(e) => setFormData({...formData, ktp: e.target.value})} placeholder="16 Digit NIK KTP" className={`h-12 sm:h-13 rounded-2xl border-gray-300 bg-white text-base ${formData.ktp ? 'font-bold text-gray-900' : 'font-normal text-gray-400'} placeholder:text-gray-400 placeholder:font-normal px-4 sm:px-5 focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859]`} />
                        </div>
                      </div>
                      {/* NO. TELEPON */}
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 items-center">
                        <label className="sm:col-span-4 text-xs sm:text-[13px] font-bold text-gray-600 uppercase tracking-wider">NO. TELEPON</label>
                        <div className="sm:col-span-8">
                          <Input value={formData.phone || ''} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="Cth. +62 812..." className={`h-12 sm:h-13 rounded-2xl border-gray-300 bg-white text-base ${formData.phone ? 'font-bold text-gray-900' : 'font-normal text-gray-400'} placeholder:text-gray-400 placeholder:font-normal px-4 sm:px-5 focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859]`} />
                        </div>
                      </div>
                      {/* USIA */}
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 items-center">
                        <label className="sm:col-span-4 text-xs sm:text-[13px] font-bold text-gray-600 uppercase tracking-wider">USIA</label>
                        <div className="sm:col-span-8">
                          <Input type="number" value={formData.age !== undefined && formData.age !== 0 ? formData.age : ''} onChange={(e) => setFormData({...formData, age: Number(e.target.value)})} placeholder="45" className={`h-12 sm:h-13 rounded-2xl border-gray-300 bg-white text-base ${formData.age ? 'font-bold text-gray-900' : 'font-normal text-gray-400'} placeholder:text-gray-400 placeholder:font-normal px-4 sm:px-5 focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859]`} />
                        </div>
                      </div>
                      {/* JENIS KELAMIN */}
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 items-center">
                        <label className="sm:col-span-4 text-xs sm:text-[13px] font-bold text-gray-600 uppercase tracking-wider">JENIS KELAMIN</label>
                        <div className="sm:col-span-8">
                          <select value={formData.gender || ''} onChange={(e) => setFormData({...formData, gender: e.target.value as any})} className={`h-12 sm:h-13 w-full rounded-2xl border border-gray-300 bg-white px-4 sm:px-5 text-base ${formData.gender ? 'font-bold text-gray-900' : 'font-normal text-gray-400'} focus:outline-none focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859] cursor-pointer`}>
                            <option value="" className="text-gray-400 font-normal">Pilih Jenis Kelamin</option>
                            <option value="Laki-laki" className="text-gray-900 font-normal">Laki-laki</option>
                            <option value="Perempuan" className="text-gray-900 font-normal">Perempuan</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: ADMINISTRASI */}
                  <div className="bg-white border border-[#cbd5e1] rounded-3xl p-5 sm:p-7 shadow-2xs">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-7 h-7 rounded-lg border border-gray-300 text-gray-800 bg-white flex items-center justify-center text-xs font-bold font-mono shadow-2xs">2</div>
                      <h3 className="text-base sm:text-[17px] font-black text-gray-900 uppercase tracking-wide">ADMINISTRASI</h3>
                    </div>
                    <div className="space-y-4">
                      {/* TANGGAL PENDAFTARAN */}
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 items-center">
                        <label className="sm:col-span-4 text-xs sm:text-[13px] font-bold text-gray-600 uppercase tracking-wider">TANGGAL PENDAFTARAN</label>
                        <div className="sm:col-span-8">
                          <Input 
                            type="date" 
                            value={formData.registrationDate || todayStr} 
                            onChange={(e) => {
                              setFormData({...formData, registrationDate: e.target.value});
                              setModifiedDates(prev => ({ ...prev, registrationDate: true }));
                            }} 
                            className={`h-12 sm:h-13 rounded-2xl border-gray-300 bg-white text-base ${modifiedDates.registrationDate && formData.registrationDate ? 'font-bold text-gray-900' : 'font-normal text-gray-400'} px-4 sm:px-5 focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859]`} 
                          />
                        </div>
                      </div>
                      {/* TANGGAL KEBERANGKATAN */}
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 items-center">
                        <label className="sm:col-span-4 text-xs sm:text-[13px] font-bold text-gray-600 uppercase tracking-wider">TANGGAL KEBERANGKATAN</label>
                        <div className="sm:col-span-8">
                          <Input 
                            type="date" 
                            value={formData.departureDate || ''} 
                            onChange={(e) => {
                              setFormData({...formData, departureDate: e.target.value});
                              setModifiedDates(prev => ({ ...prev, departureDate: true }));
                            }} 
                            className={`h-12 sm:h-13 rounded-2xl border-gray-300 bg-white text-base ${modifiedDates.departureDate && formData.departureDate ? 'font-bold text-gray-900' : 'font-normal text-gray-400'} px-4 sm:px-5 focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859]`} 
                          />
                        </div>
                      </div>
                      {/* PILIHAN PAKET UMRAH */}
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 items-center">
                        <label className="sm:col-span-4 text-xs sm:text-[13px] font-bold text-gray-600 uppercase tracking-wider">PILIHAN PAKET UMRAH</label>
                        <div className="sm:col-span-8">
                          <select value={formData.umrahPackage || ''} onChange={(e) => setFormData({...formData, umrahPackage: e.target.value})} className={`h-12 sm:h-13 w-full rounded-2xl border border-gray-300 bg-white px-4 sm:px-5 text-base ${formData.umrahPackage ? 'font-bold text-gray-900' : 'font-normal text-gray-400'} focus:outline-none focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859] cursor-pointer`}>
                            <option value="" className="text-gray-400 font-normal">Pilih Paket Umrah</option>
                            <option value="Reguler 9 Hari" className="text-gray-900 font-normal">Reguler 9 Hari</option>
                            <option value="Reguler 12 Hari" className="text-gray-900 font-normal">Reguler 12 Hari</option>
                            <option value="VIP 9 Hari" className="text-gray-900 font-normal">VIP 9 Hari</option>
                            <option value="Yamani" className="text-gray-900 font-normal">Yamani</option>
                            <option value="Raudhah" className="text-gray-900 font-normal">Raudhah</option>
                            <option value="Multazam" className="text-gray-900 font-normal">Multazam</option>
                          </select>
                        </div>
                      </div>
                      {/* KLOTER KEBERANGKATAN */}
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 items-center">
                        <label className="sm:col-span-4 text-xs sm:text-[13px] font-bold text-gray-600 uppercase tracking-wider">KLOTER KEBERANGKATAN</label>
                        <div className="sm:col-span-8">
                          <select value={formData.group || ''} onChange={(e) => setFormData({...formData, group: e.target.value})} className={`h-12 sm:h-13 w-full rounded-2xl border border-gray-300 bg-white px-4 sm:px-5 text-base ${formData.group ? 'font-bold text-gray-900' : 'font-normal text-gray-400'} focus:outline-none focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859] cursor-pointer`}>
                            <option value="" className="text-gray-400 font-normal">-- Pilih Kloter / Group --</option>
                            {groups.map(g => (
                              <option key={g.id} value={g.name} className="text-gray-900 font-normal">{g.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      {/* VAKSIN MENINGITIS */}
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 items-center">
                        <label className="sm:col-span-4 text-xs sm:text-[13px] font-bold text-gray-600 uppercase tracking-wider">VAKSIN MENINGITIS</label>
                        <div className="sm:col-span-8">
                          <select value={formData.meningitis ? 'Sudah Vaksin' : 'Belum Vaksin'} onChange={(e) => setFormData({...formData, meningitis: e.target.value === 'Sudah Vaksin'})} className={`h-12 sm:h-13 w-full rounded-2xl border border-gray-300 bg-white px-4 sm:px-5 text-base ${formData.meningitis ? 'font-bold text-gray-900' : 'font-normal text-gray-400'} focus:outline-none focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859] cursor-pointer`}>
                            <option value="Belum Vaksin" className="text-gray-400 font-normal">Belum Vaksin</option>
                            <option value="Sudah Vaksin" className="text-gray-900 font-normal">Sudah Vaksin</option>
                          </select>
                        </div>
                      </div>
                      {/* PAS FOTO 4X6 */}
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 items-center">
                        <label className="sm:col-span-4 text-xs sm:text-[13px] font-bold text-gray-600 uppercase tracking-wider">PAS FOTO 4X6</label>
                        <div className="sm:col-span-8">
                          <select value={formData.photo ? 'Sudah Ada' : 'Belum Ada'} onChange={(e) => setFormData({...formData, photo: e.target.value === 'Sudah Ada'})} className={`h-12 sm:h-13 w-full rounded-2xl border border-gray-300 bg-white px-4 sm:px-5 text-base ${formData.photo ? 'font-bold text-gray-900' : 'font-normal text-gray-400'} focus:outline-none focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859] cursor-pointer`}>
                            <option value="Belum Ada" className="text-gray-400 font-normal">Belum Ada</option>
                            <option value="Sudah Ada" className="text-gray-900 font-normal">Sudah Ada</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 3: PERLENGKAPAN */}
                  <div className="bg-white border border-[#cbd5e1] rounded-3xl p-5 sm:p-7 shadow-2xs">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-7 h-7 rounded-lg border border-gray-300 text-gray-800 bg-white flex items-center justify-center text-xs font-bold font-mono shadow-2xs">3</div>
                      <h3 className="text-base sm:text-[17px] font-black text-gray-900 uppercase tracking-wide">PERLENGKAPAN</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        { id: 'koperBesar', label: 'Koper Besar' },
                        { id: 'koperKabin', label: 'Koper Kabin' },
                        { id: 'batik', label: 'Seragam Batik' },
                        { id: 'bukuDomisili', label: 'Buku Panduan' },
                        { id: 'kainIhram', label: 'Kain Ihram' },
                        { id: 'kerudungMerah', label: 'Kerudung Merah' },
                        { id: 'kerudungPutih', label: 'Kerudung Putih' },
                        { id: 'tasSelempang', label: 'Tas Selempang' },
                        { id: 'tasSandal', label: 'Tas Sandal' },
                        { id: 'syall', label: 'Syall' },
                      ].map(item => (
                        <div key={item.id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-2xl bg-white shadow-2xs cursor-pointer hover:border-[#00a859] transition-colors" onClick={() => {
                          const currentVal = !!formData[item.id as keyof Pilgrim];
                          setFormData({ ...formData, [item.id]: !currentVal });
                        }}>
                          <Checkbox checked={!!formData[item.id as keyof Pilgrim]} onCheckedChange={(val) => setFormData({ ...formData, [item.id]: val })} />
                          <span className="font-bold text-gray-900">{item.label}</span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 p-4 border border-gray-200 rounded-2xl bg-gray-50">
                      <label className="block text-sm font-bold text-gray-700 mb-2">Ukuran Sabuk</label>
                      <select 
                        value={formData.sabuk || ''} 
                        onChange={(e) => setFormData({...formData, sabuk: e.target.value})} 
                        className={`h-12 w-full sm:w-1/2 rounded-xl border border-gray-300 bg-white px-4 text-sm ${formData.sabuk ? 'font-bold text-gray-900' : 'font-normal text-gray-400'} focus:outline-none focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859] cursor-pointer`}
                      >
                        <option value="" className="text-gray-400 font-normal">Pilih Ukuran Sabuk</option>
                        <option value="S" className="text-gray-900 font-normal">S</option>
                        <option value="M" className="text-gray-900 font-normal">M</option>
                        <option value="L" className="text-gray-900 font-normal">L</option>
                        <option value="XL" className="text-gray-900 font-normal">XL</option>
                        <option value="XXL" className="text-gray-900 font-normal">XXL</option>
                      </select>
                    </div>
                  </div>

                  {/* Section 4: PEMBAYARAN */}
                  <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-sm">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 border-b border-gray-100 pb-5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-[#00a859] text-white flex items-center justify-center text-sm font-bold shadow-sm">4</div>
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">Informasi & Skema Pembayaran</h3>
                      </div>
                      <p className="text-sm text-gray-500 font-medium">Pilih status pembayaran awal pendaftaran</p>
                    </div>

                    {/* Cards Selection */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                      {/* DP Card */}
                      <div 
                        onClick={() => setFormData({...formData, paymentOption: 'DP'})}
                        className={`relative p-3 sm:p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-2 ${
                          formData.paymentOption === 'DP' 
                            ? 'border-[#00a859] bg-[#f0fdf4]' 
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          formData.paymentOption === 'DP' ? 'bg-[#00a859] text-white' : 'bg-gray-100 text-gray-500'
                        }`}>
                          <CreditCard className="w-5 h-5" />
                        </div>
                        <h4 className={`text-sm whitespace-nowrap ${formData.paymentOption === 'DP' ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>Uang Muka</h4>
                      </div>
                      
                      {/* Lunas Card */}
                      <div 
                        onClick={() => setFormData({...formData, paymentOption: 'Bayar Lunas'})}
                        className={`relative p-3 sm:p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-2 ${
                          formData.paymentOption === 'Bayar Lunas' 
                            ? 'border-[#00a859] bg-[#f0fdf4]' 
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          formData.paymentOption === 'Bayar Lunas' ? 'bg-[#00a859] text-white' : 'bg-gray-100 text-gray-500'
                        }`}>
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <h4 className={`text-sm whitespace-nowrap ${formData.paymentOption === 'Bayar Lunas' ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>Bayar Lunas</h4>
                      </div>

                      {/* Belum Bayar Card */}
                      <div 
                        onClick={() => setFormData({...formData, paymentOption: 'Belum Bayar'})}
                        className={`relative p-3 sm:p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-2 ${
                          formData.paymentOption === 'Belum Bayar' 
                            ? 'border-[#00a859] bg-[#f0fdf4]' 
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          formData.paymentOption === 'Belum Bayar' ? 'bg-[#00a859] text-white' : 'bg-gray-100 text-gray-500'
                        }`}>
                          <Clock className="w-5 h-5" />
                        </div>
                        <h4 className={`text-sm whitespace-nowrap ${formData.paymentOption === 'Belum Bayar' ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>Belum Bayar</h4>
                      </div>
                    </div>

                    {/* Sub-form when DP or Lunas is selected */}
                    {formData.paymentOption !== 'Belum Bayar' && (
                      <div className="border border-gray-200 rounded-2xl p-5 sm:p-6 bg-white shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#dcfce7] text-[#166534] border border-[#bbf7d0] text-sm font-bold uppercase tracking-wide">
                            <CreditCard className="w-4 h-4" />
                            {formData.paymentOption === 'DP' ? 'UANG MUKA' : 'LUNAS'}
                          </span>
                          <span className="text-sm text-gray-500 font-medium">Otomatis mencatat transaksi di Keuangan</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-6 sm:gap-y-7 mb-6">
                          {/* Total Biaya Paket */}
                          <div className="flex flex-col gap-2.5 sm:gap-3">
                            <label className="text-sm font-bold text-gray-700">Total Biaya Paket (Rp) *</label>
                            <Input 
                              type="number" 
                              value={formData.totalAmount || ''} 
                              onChange={(e) => setFormData({...formData, totalAmount: Number(e.target.value)})}
                              placeholder="30000000"
                              className={`h-12 rounded-xl text-lg ${formData.totalAmount ? 'font-bold text-gray-900' : 'font-normal text-gray-400'} border-gray-200 focus:border-[#00a859] focus:ring-[#00a859] placeholder:font-normal placeholder:text-gray-400`}
                            />
                          </div>

                          {/* Nominal Dibayarkan */}
                          <div className="flex flex-col gap-2.5 sm:gap-3">
                            <label className="text-sm font-bold text-gray-700">
                              {formData.paymentOption === 'DP' ? 'Nominal DP Dibayarkan (Rp) *' : 'Nominal Lunas (Rp) *'}
                            </label>
                            <Input 
                              type="number" 
                              value={formData.paidAmount || ''} 
                              onChange={(e) => setFormData({...formData, paidAmount: Number(e.target.value)})}
                              placeholder="10000000"
                              className={`h-12 rounded-xl text-lg ${formData.paidAmount ? 'font-bold text-gray-900 border-[#00a859] bg-[#f0fdf4]' : 'font-normal text-gray-400 border-gray-200 focus:border-[#00a859]'} border-2 focus:ring-[#00a859] placeholder:font-normal placeholder:text-gray-400`}
                            />
                          </div>

                          {/* Metode Pembayaran */}
                          <div className="flex flex-col gap-2.5 sm:gap-3">
                            <label className="text-sm font-bold text-gray-700">Metode Pembayaran</label>
                            <div className="relative">
                              <select 
                                value={(formData as any).paymentMethod || ''}
                                onChange={(e) => setFormData({...formData, paymentMethod: e.target.value} as any)}
                                className={`w-full h-12 rounded-xl border border-gray-200 bg-white px-4 text-sm ${(formData as any).paymentMethod ? 'font-bold text-gray-900' : 'font-normal text-gray-400'} focus:border-[#00a859] focus:ring-1 focus:ring-[#00a859] appearance-none cursor-pointer`}
                              >
                                <PaymentMethodOptions />
                              </select>
                              <ChevronDown className="w-5 h-5 text-gray-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                          </div>

                          {/* Tanggal Pembayaran */}
                          <div className="flex flex-col gap-2.5 sm:gap-3">
                            <label className="text-sm font-bold text-gray-700">Tanggal Pembayaran</label>
                            <div className="relative">
                              <Input 
                                type="date"
                                value={(formData as any).paymentDate || todayStr}
                                onChange={(e) => {
                                  setFormData({...formData, paymentDate: e.target.value} as any);
                                  setModifiedDates(prev => ({ ...prev, paymentDate: true }));
                                }}
                                className={`h-12 rounded-xl border-gray-200 text-sm ${modifiedDates.paymentDate && (formData as any).paymentDate ? 'font-bold text-gray-900' : 'font-normal text-gray-400'} w-full`}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Sisa Tagihan Info Box */}
                        <div className="bg-[#fffbeb] border border-[#fde68a] rounded-xl p-4 flex items-center justify-between mb-6">
                          <div className="flex items-center gap-2 text-[#b45309]">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            <span className="font-bold text-sm">Sisa Tagihan Pelunasan:</span>
                          </div>
                          <span className="text-lg font-black text-[#92400e]">
                            Rp {Math.max(0, (formData.totalAmount || 0) - (formData.paidAmount || 0)).toLocaleString('id-ID')}
                          </span>
                        </div>

                        {/* Catatan */}
                        <div className="flex flex-col gap-2.5 sm:gap-3">
                          <label className="text-sm font-bold text-gray-700">Catatan</label>
                          <Input 
                            value={(formData as any).paymentNotes || (formData.paymentOption === 'DP' ? 'Uang Muka Pendaftaran' : 'Pelunasan Pendaftaran')}
                            onChange={(e) => setFormData({...formData, paymentNotes: e.target.value} as any)}
                            className={`h-12 rounded-xl border-gray-200 text-sm ${(formData as any).paymentNotes ? 'font-bold text-gray-900' : 'font-normal text-gray-400'} placeholder:text-gray-400 placeholder:font-normal`}
                            placeholder="Tambahkan catatan pembayaran..."
                          />
                        </div>
                      </div>
                    )}
                  </div>
                
{/* ACTION BUTTONS */}
              {/* ACTION BUTTONS */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <Button 
                  variant="outline" 
                  onClick={() => setIsModalOpen(false)} 
                  className="h-12 rounded-2xl px-7 font-bold text-gray-800 border-gray-300 hover:bg-gray-50 text-base cursor-pointer shadow-2xs"
                >
                  Batal
                </Button>
                <Button 
                  onClick={savePilgrim} 
                  className="h-12 rounded-2xl px-8 font-bold text-white bg-[#00a859] hover:bg-[#008f4c] text-base cursor-pointer shadow-2xs"
                >
                  {editingPilgrim ? 'Simpan Perubahan' : 'Simpan Pendaftaran'}
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
