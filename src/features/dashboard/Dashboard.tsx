import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/core/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { toast } from '@/lib/toast';
import { exportMasterWorkbookToExcel } from '@/lib/export';
import { dashboardService } from '@/core/services/dashboardService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  Users, 
  Wallet, 
  AlertCircle, 
  FileSpreadsheet, 
  CheckCircle2, 
  ArrowUpRight, 
  ArrowDownRight, 
  Radio, 
  Download, 
  Compass, 
  Receipt, 
  ChevronRight, 
  UserPlus, 
  Boxes, 
  AlertTriangle, 
  UsersRound
} from 'lucide-react';

const attendanceData = [
  { name: 'Kloter 1', present: 45, missing: 0 },
  { name: 'Kloter 2', present: 48, missing: 2 },
  { name: 'Kloter 3', present: 50, missing: 0 },
  { name: 'Kloter 4', present: 42, missing: 1 },
  { name: 'Kloter 5', present: 38, missing: 0 },
  { name: 'Kloter 6', present: 40, missing: 0 },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { 
    pilgrims, 
    groups, 
    families, 
    tourLeaders, 
    mutawifs, 
    emergencies, 
    rooms, 
    staffStocks, 
    financeTransactions,
    schedules 
  } = useStore();

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [stockCategoryFilter, setStockCategoryFilter] = useState<string>('all');

  const journey = dashboardService.getJourneyStatus();

  // Core Metrics Calculations
  const totalPilgrims = pilgrims.length;
  const lunasPilgrims = pilgrims.filter(p => p.paymentOption === 'Bayar Lunas' || (p.paidAmount && p.totalAmount && p.paidAmount >= p.totalAmount)).length;
  const dpPilgrims = pilgrims.filter(p => p.paymentOption === 'DP' || (p.paidAmount && p.totalAmount && p.paidAmount < p.totalAmount && p.paidAmount > 0)).length;

  // Finance Metrics
  const totalIncome = financeTransactions
    .filter(t => t.type.startsWith('Pemasukan') && t.status === 'Berhasil')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = financeTransactions
    .filter(t => t.type === 'Pengeluaran' && t.status === 'Berhasil')
    .reduce((sum, t) => sum + t.amount, 0);

  const netBalance = totalIncome - totalExpense;

  // Receivables
  const pilgrimsWithReceivables = pilgrims.map(p => {
    const total = p.totalAmount || 30000000;
    const paid = p.paidAmount || 0;
    const remaining = Math.max(0, total - paid);
    return { ...p, calculatedTotal: total, calculatedPaid: paid, remaining };
  }).filter(p => p.remaining > 0);

  const totalReceivables = pilgrimsWithReceivables.reduce((sum, p) => sum + p.remaining, 0);

  // Groups & Staff
  const totalGroups = groups.length;
  const totalStaff = tourLeaders.length + mutawifs.length;
  const totalRooms = rooms.length;
  const totalOccupants = rooms.reduce((sum, r) => sum + r.occupants.length, 0);

  // Stock Metrics
  const totalStockItems = staffStocks.length;
  const lowStockItems = staffStocks.filter(s => s.quantity <= s.minStock);
  const activeEmergencies = emergencies.filter(e => e.status === 'Active');

  const todayStr = new Date().toISOString().split('T')[0];

  // Filtered Stock Items
  const filteredStockItems = staffStocks.filter(s => {
    if (stockCategoryFilter === 'all') return true;
    if (stockCategoryFilter === 'low') return s.quantity <= s.minStock;
    return s.category.toLowerCase().includes(stockCategoryFilter.toLowerCase());
  });

  // Attendance Statistics
  const totalPresentPilgrims = attendanceData.reduce((sum, a) => sum + a.present, 0);
  const totalMissingPilgrims = attendanceData.reduce((sum, a) => sum + a.missing, 0);
  const totalAttendancePilgrims = totalPresentPilgrims + totalMissingPilgrims;
  const attendanceRate = totalAttendancePilgrims > 0 ? Math.round((totalPresentPilgrims / totalAttendancePilgrims) * 100) : 100;

  // Journey Steps definition
  const journeySteps = [
    { name: 'Makkah', phase: 'Tawaf & Sa\'i', progressThreshold: 20 },
    { name: 'Arafah', phase: 'Wukuf', progressThreshold: 40 },
    { name: 'Muzdalifah', phase: 'Mabit', progressThreshold: 60 },
    { name: 'Mina', phase: 'Lontar Jumrah', progressThreshold: 80 },
    { name: 'Madinah', phase: 'Ziarah Raudhah', progressThreshold: 100 },
  ];

  // Master Excel Export
  const handleExportAllInOneMaster = async () => {
    setIsExporting(true);
    try {
      const summarySheet = {
        sheetName: 'Ringkasan Dashboard',
        title: 'Ringkasan Eksekutif & Statistik Sistem DNA Tour',
        data: [
          { 'Indikator': 'Total Jamaah Terdaftar', 'Jumlah': `${totalPilgrims} Jamaah`, 'Keterangan': `${lunasPilgrims} Lunas, ${dpPilgrims} DP` },
          { 'Indikator': 'Total Kloter', 'Jumlah': `${totalGroups} Kloter`, 'Keterangan': `${families.length} Group Rombongan Keluarga` },
          { 'Indikator': 'Total Pemasukan Kas', 'Jumlah': `Rp ${totalIncome.toLocaleString('id-ID')}`, 'Keterangan': 'Pemasukan DP & Pelunasan' },
          { 'Indikator': 'Total Pengeluaran Kas', 'Jumlah': `Rp ${totalExpense.toLocaleString('id-ID')}`, 'Keterangan': 'Operasional & Vendor' },
          { 'Indikator': 'Saldo Kas Bersih (Net)', 'Jumlah': `Rp ${netBalance.toLocaleString('id-ID')}`, 'Keterangan': 'Arus Kas Terkalkulasi' },
          { 'Indikator': 'Total Piutang Jamaah', 'Jumlah': `Rp ${totalReceivables.toLocaleString('id-ID')}`, 'Keterangan': `${pilgrimsWithReceivables.length} Jamaah Belum Lunas` },
          { 'Indikator': 'Room Meet Hotel', 'Jumlah': `${totalRooms} Kamar`, 'Keterangan': `${totalOccupants} Penghuni` },
          { 'Indikator': 'Stok & Inventaris Staff', 'Jumlah': `${totalStockItems} Jenis Barang`, 'Keterangan': `${lowStockItems.length} Barang Perlu Restock` },
          { 'Indikator': 'SDM & Pembimbing', 'Jumlah': `${totalStaff} Orang`, 'Keterangan': `${tourLeaders.length} Tour Leader, ${mutawifs.length} Mutawif` },
          { 'Indikator': 'Laporan SOS Darurat', 'Jumlah': `${activeEmergencies.length} Aktif`, 'Keterangan': `${emergencies.length - activeEmergencies.length} Selesai Ditangani` }
        ]
      };

      const jamaahSheet = {
        sheetName: 'Data Jamaah',
        title: 'Master Data Jamaah Umrah - DNA Tour',
        data: pilgrims.map(p => ({
          'ID Jamaah': p.id,
          'Nama Lengkap': p.name,
          'No. Paspor': p.passport,
          'No. Visa': p.visaNumber || '-',
          'Jenis Kelamin': p.gender,
          'Usia': p.age,
          'No. HP': p.phone,
          'Paket Umrah': p.umrahPackage || '-',
          'Kloter': p.group,
          'Status Pembayaran': p.paymentOption || 'Belum Lunas',
          'Total Biaya (Rp)': p.totalAmount || 30000000,
          'Telah Dibayar (Rp)': p.paidAmount || 0,
          'Sisa Tagihan (Rp)': Math.max(0, (p.totalAmount || 30000000) - (p.paidAmount || 0)),
          'Tour Leader': p.tourLeader || '-',
          'Mutawif Local': p.mutawifLocal || '-'
        }))
      };

      const kloterSheet = {
        sheetName: 'Data Kloter',
        title: 'Data Kloter Keberangkatan & Rombongan - DNA Tour',
        data: groups.map(g => ({
          'ID Kloter': g.id,
          'Nama Kloter': g.name,
          'Kode Kloter': g.kloter,
          'Jumlah Jamaah': g.pilgrims,
          'Tour Leader': g.tourLeader,
          'Mutawif': g.mutawif,
          'Status': g.status
        }))
      };

      const financeSheet = {
        sheetName: 'Keuangan & Arus Kas',
        title: 'Laporan Buku Kas & Arus Keuangan - DNA Tour',
        data: financeTransactions.map(t => ({
          'ID Transaksi': t.id,
          'Uraian Transaksi': t.pilgrimName,
          'Tipe': t.type,
          'Kategori': t.category,
          'Nominal (Rp)': t.amount,
          'Metode Pembayaran': t.paymentMethod,
          'Tanggal': t.date,
          'Status': t.status,
          'No. Ref': t.referenceNo || '-'
        }))
      };

      const roomSheet = {
        sheetName: 'Room Meet Hotel',
        title: 'Manifest Alokasi Kamar Hotel Makkah & Madinah',
        data: rooms.map(r => ({
          'ID Kamar': r.id,
          'Label Kamar': r.roomLabel,
          'No. Room': r.roomNumber || '-',
          'Tipe Kamar': r.category,
          'Lokasi Hotel': r.hotelLocation,
          'Nama Hotel': r.hotelName,
          'Kloter': r.kloter,
          'Daftar Penghuni': r.occupants.map(o => `${o.title} ${o.name}`).join('; ')
        }))
      };

      const stockSheet = {
        sheetName: 'Stok & Inventaris',
        title: 'Laporan Monitoring Stok Perlengkapan Staff',
        data: staffStocks.map(s => ({
          'ID Barang': s.id,
          'Nama Perlengkapan': s.name,
          'Kategori': s.category,
          'Jumlah Stok': s.quantity,
          'Stok Minimal': s.minStock,
          'Satuan': s.unit,
          'Lokasi Gudang': s.location || '-'
        }))
      };

      const sdmSheet = {
        sheetName: 'SDM Mutawif & TL',
        title: 'Data Petugas Tour Leader & Mutawif Local',
        data: [
          ...tourLeaders.map(t => ({ 'ID': t.id, 'Nama Pembimbing': t.name, 'Peran': 'Tour Leader (TL)', 'No. Kontak': t.phone, 'Kloter Tugas': t.group, 'Status': t.status })),
          ...mutawifs.map(m => ({ 'ID': m.id, 'Nama Pembimbing': m.name, 'Peran': 'Mutawif Local', 'No. Kontak': '-', 'Kloter Tugas': m.group, 'Status': m.status }))
        ]
      };

      const itinerarySheet = {
        sheetName: 'Agenda Itinerary',
        title: 'Jadwal Agenda Itinerary Perjalanan Ibadah',
        data: schedules.map(s => ({
          'ID Agenda': s.id,
          'Tanggal': s.date,
          'Jam': s.time,
          'Agenda Kegiatan': s.title,
          'Lokasi': s.location,
          'Penanggung Jawab': s.pic || '-'
        }))
      };

      const emergencySheet = {
        sheetName: 'Log Darurat SOS',
        title: 'Laporan Penanganan Darurat & Insiden SOS',
        data: emergencies.map(e => ({
          'ID Insiden': e.id,
          'Nama Jamaah': e.pilgrim,
          'Kloter': e.group,
          'Lokasi Kejadian': e.location,
          'Tanggal & Waktu': `${e.date} ${e.time}`,
          'Jenis Insiden': e.type,
          'Status Penanganan': e.status
        }))
      };

      await exportMasterWorkbookToExcel(
        [summarySheet, jamaahSheet, kloterSheet, financeSheet, roomSheet, stockSheet, sdmSheet, itinerarySheet, emergencySheet],
        `Master_Laporan_DNA_Tour_${todayStr}`,
        'TEMPLATE MASTER REKAPITULASI KESELURUHAN MENU SISTEM DNA TOUR'
      );

      toast("Master Excel Template All-in-One berhasil diunduh!", "success");
      setIsExportModalOpen(false);
    } catch (err) {
      console.error(err);
      toast("Gagal membuat file master Excel.", "error");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 select-none">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Operasional DNA Tour</h1>
          <p className="text-sm text-gray-500 mt-1">
            Ringkasan terpadu status jamaah, keuangan, inventaris stok, dan perjalanan ibadah.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button 
            variant="outline"
            onClick={() => setIsExportModalOpen(true)}
            className="w-full sm:w-auto text-gray-700 border-gray-300"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" /> 
            Export Excel
          </Button>

          <Button 
            onClick={() => navigate('/registration')}
            className="w-full sm:w-auto bg-[#740A03] hover:bg-[#580802] text-white"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Registrasi Baru
          </Button>
        </div>
      </div>

      {/* Top 4 KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Jamaah */}
        <Card 
          className="hover:border-emerald-400 hover:shadow-md transition-all duration-200 cursor-pointer bg-white border-gray-200 shadow-sm" 
          onClick={() => navigate('/pilgrims')}
        >
          <CardContent className="p-5 flex flex-col justify-between h-full gap-4">
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Total Jamaah
              </span>
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-gray-900 tracking-tight">{totalPilgrims}</p>
                <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  {totalGroups} Kloter
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                <span className="text-emerald-700 font-medium">{lunasPilgrims}</span> Lunas • <span className="text-amber-600 font-medium">{dpPilgrims}</span> DP
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Saldo Kas Bersih */}
        <Card 
          className="hover:border-blue-400 hover:shadow-md transition-all duration-200 cursor-pointer bg-white border-gray-200 shadow-sm" 
          onClick={() => navigate('/finance')}
        >
          <CardContent className="p-5 flex flex-col justify-between h-full gap-4">
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Saldo Kas Bersih
              </span>
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                <Wallet className="w-5 h-5" />
              </div>
            </div>
            <div>
              <p className={`text-2xl font-bold tracking-tight ${netBalance >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                Rp {netBalance.toLocaleString('id-ID')}
              </p>
              <div className="flex items-center gap-3 text-sm text-gray-500 mt-2">
                <span className="text-emerald-700 font-medium flex items-center gap-1">
                  <ArrowUpRight className="w-4 h-4" /> {(totalIncome/1000000).toFixed(1)}M
                </span>
                <span className="text-red-600 font-medium flex items-center gap-1">
                  <ArrowDownRight className="w-4 h-4" /> {(totalExpense/1000000).toFixed(1)}M
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Sisa Piutang Jamaah */}
        <Card 
          className="hover:border-amber-400 hover:shadow-md transition-all duration-200 cursor-pointer bg-white border-gray-200 shadow-sm" 
          onClick={() => navigate('/finance')}
        >
          <CardContent className="p-5 flex flex-col justify-between h-full gap-4">
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Sisa Piutang
              </span>
              <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
                <Receipt className="w-5 h-5" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 tracking-tight">
                Rp {totalReceivables.toLocaleString('id-ID')}
              </p>
              <p className="text-sm text-amber-700 mt-2 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="font-medium">{pilgrimsWithReceivables.length}</span> Jamaah Belum Lunas
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Monitoring Stok */}
        <Card 
          className="hover:border-indigo-400 hover:shadow-md transition-all duration-200 cursor-pointer bg-white border-gray-200 shadow-sm" 
          onClick={() => navigate('/staff-stock')}
        >
          <CardContent className="p-5 flex flex-col justify-between h-full gap-4">
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Monitoring Stok
              </span>
              <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                <Boxes className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-gray-900 tracking-tight">{totalStockItems}</p>
                <span className="text-sm text-gray-500">Jenis Barang</span>
              </div>
              <div className="mt-2">
                {lowStockItems.length > 0 ? (
                  <span className="text-red-700 text-sm font-medium bg-red-50 px-2.5 py-1 rounded-md border border-red-200 inline-flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" /> {lowStockItems.length} Stok Perlu Restock
                  </span>
                ) : (
                  <span className="text-emerald-700 text-sm font-medium bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                    Seluruh Stok Aman
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monitoring Stok & Inventaris Section */}
      <Card className="shadow-sm border-gray-200 bg-white rounded-xl">
        <CardHeader className="p-6 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
              <Boxes className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-lg font-semibold text-gray-900 leading-tight">
                Monitoring Stok & Inventaris Perlengkapan
              </CardTitle>
              <CardDescription className="text-sm text-gray-500">
                Pantau ketersediaan barang perlengkapan jamaah & logistik tim secara berkala
              </CardDescription>
            </div>
          </div>

          <Button 
            variant="outline" 
            onClick={() => navigate('/staff-stock')}
            className="text-gray-700 border-gray-300 w-full sm:w-auto"
          >
            Kelola Inventaris <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Stock Category Filter Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
              {[
                { id: 'all', label: 'Semua Stok' },
                { id: 'low', label: `Restock (${lowStockItems.length})` },
                { id: 'perlengkapan', label: 'Perlengkapan' },
                { id: 'seragam', label: 'Seragam & Batik' },
                { id: 'operasional', label: 'Operasional' },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setStockCategoryFilter(f.id)}
                  className={`text-xs px-3.5 py-1.5 rounded-xl font-semibold transition-all shrink-0 cursor-pointer ${
                    stockCategoryFilter === f.id
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200/60'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <span className="text-xs text-gray-500 font-normal">
              Menampilkan <span className="font-semibold text-gray-700">{filteredStockItems.length}</span> barang
            </span>
          </div>

          {/* Stock Grid Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredStockItems.slice(0, 6).map((item) => {
              const isHabis = item.quantity === 0;
              const isMenipis = item.quantity > 0 && item.quantity <= item.minStock;

              const maxGauge = Math.max(item.minStock * 2, item.quantity);
              const fillPercentage = isHabis ? 0 : Math.min(100, Math.round((item.quantity / maxGauge) * 100));

              return (
                <div 
                  key={item.id} 
                  className={`p-4 rounded-2xl border transition-all bg-white flex flex-col justify-between gap-3.5 shadow-2xs hover:shadow-xs ${
                    isHabis 
                      ? 'border-red-200 bg-red-50/15 hover:border-red-300' 
                      : isMenipis 
                      ? 'border-amber-200 bg-amber-50/15 hover:border-amber-300' 
                      : 'border-gray-200/90 hover:border-emerald-300'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-xs text-gray-900 block truncate">{item.name}</span>
                      <span className="text-[11px] text-gray-500 block font-normal truncate mt-0.5">
                        {item.category} • {item.location || 'Gudang Utama'}
                      </span>
                    </div>

                    <Badge 
                      variant="outline" 
                      className={`text-[10px] font-semibold shrink-0 px-2.5 py-0.5 rounded-lg border ${
                        isHabis 
                          ? 'bg-red-50 text-red-700 border-red-200/90' 
                          : isMenipis 
                          ? 'bg-amber-50 text-amber-800 border-amber-200/90' 
                          : 'bg-emerald-50 text-emerald-800 border-emerald-200/90'
                      }`}
                    >
                      {isHabis ? 'Stok Habis' : isMenipis ? 'Stok Menipis' : 'Stok Aman'}
                    </Badge>
                  </div>

                  {/* Stock Quantity Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500 font-normal">Tersedia</span>
                      <span className={`font-bold ${
                        isHabis 
                          ? 'text-red-600' 
                          : isMenipis 
                          ? 'text-amber-700' 
                          : 'text-gray-900'
                      }`}>
                        {item.quantity} {item.unit}
                      </span>
                    </div>

                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden p-0.5 border border-gray-200/50">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${
                          isHabis ? 'bg-red-500' : isMenipis ? 'bg-amber-500' : 'bg-emerald-600'
                        }`}
                        style={{ width: `${isHabis ? 0 : Math.max(8, fillPercentage)}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-[10px] text-gray-400 font-normal">
                      <span>Batas Min: <span className="font-semibold text-gray-600">{item.minStock} {item.unit}</span></span>
                      <span className="font-medium">
                        {isHabis ? 'Restock Segera' : isMenipis ? 'Menipis' : 'Stok Cukup'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Main Grid: Keuangan & Sisa Piutang */}
      <Card className="shadow-sm border-gray-200 bg-white rounded-xl">
        <CardHeader className="p-6 border-b border-gray-200 flex flex-row items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
              <Receipt className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-lg font-semibold text-gray-900 leading-tight">
                Ikhtisar Keuangan & Tagihan Piutang Jamaah
              </CardTitle>
              <CardDescription className="text-sm text-gray-500">
                Ringkasan arus kas terintegrasi dan sisa tagihan jamaah
              </CardDescription>
            </div>
          </div>
          <Button 
            variant="ghost" 
            onClick={() => navigate('/finance')}
            className="text-emerald-700 hover:bg-emerald-50"
          >
            Buku Keuangan <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-xl bg-white border border-gray-200 shadow-sm flex flex-col justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Pemasukan Kas</span>
              <span className="text-2xl font-bold text-emerald-700 block mt-2 tracking-tight">
                Rp {totalIncome.toLocaleString('id-ID')}
              </span>
            </div>

            <div className="p-5 rounded-xl bg-white border border-gray-200 shadow-sm flex flex-col justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Pengeluaran Operasional</span>
              <span className="text-2xl font-bold text-red-600 block mt-2 tracking-tight">
                Rp {totalExpense.toLocaleString('id-ID')}
              </span>
            </div>

            <div className="p-5 rounded-xl bg-white border border-gray-200 shadow-sm flex flex-col justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Sisa Piutang Jamaah</span>
              <span className="text-2xl font-bold text-amber-700 block mt-2 tracking-tight">
                Rp {totalReceivables.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          {/* Outstanding Receivables Table */}
          <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
            <div className="bg-gray-50 px-5 py-3 border-b border-gray-200 text-sm font-semibold text-gray-700 flex justify-between items-center">
              <span>Jamaah Belum Lunas ({pilgrimsWithReceivables.length})</span>
              <span className="uppercase tracking-wider text-xs">Sisa Tagihan</span>
            </div>

            <div className="divide-y divide-gray-100">
              {pilgrimsWithReceivables.slice(0, 3).map((p) => (
                <div key={p.id} className="p-4 sm:px-5 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="min-w-0 flex-1 pr-4">
                    <span className="font-medium text-gray-900 block truncate">{p.name}</span>
                    <span className="text-sm text-gray-500 block truncate mt-0.5">{p.group} • {p.umrahPackage}</span>
                  </div>
                  <div className="text-right flex items-center gap-4 shrink-0">
                    <div>
                      <span className="font-bold text-gray-900 block">Rp {p.remaining.toLocaleString('id-ID')}</span>
                      <span className="text-xs text-emerald-700 font-medium">DP: Rp {p.calculatedPaid.toLocaleString('id-ID')}</span>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => navigate('/finance')}
                      className="border-gray-300 text-gray-700"
                    >
                      Bayar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress Perjalanan & Presensi Kloter Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Progress Perjalanan Ibadah */}
        <Card className="shadow-sm border-gray-200 bg-white rounded-xl flex flex-col justify-between">
          <CardHeader className="p-6 border-b border-gray-200 flex flex-row items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2 leading-tight">
                <Compass className="w-5 h-5 text-emerald-600" />
                Progress Perjalanan Ibadah
              </CardTitle>
              <CardDescription className="text-sm text-gray-500">
                Tahapan keberangkatan, ibadah, dan kepulangan jamaah
              </CardDescription>
            </div>
            <Button 
              variant="ghost" 
              onClick={() => navigate('/journey')}
              className="text-emerald-700 hover:bg-emerald-50"
            >
              Detail <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {/* Status Phase Header */}
            <div className="p-5 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider block">Fase Aktif</span>
                <span className="text-lg font-bold text-emerald-950 block">
                  {journey.currentPhase}
                </span>
              </div>
              <div className="text-right">
                <span className="text-3xl font-bold text-emerald-800 tracking-tight">{journey.progress}%</span>
                <span className="text-xs text-emerald-700 font-medium block uppercase tracking-wider">Ditunaikan</span>
              </div>
            </div>

            {/* Step-by-Step Stage Visualizer */}
            <div className="space-y-3">
              <span className="text-sm font-semibold text-gray-700 block">Tahapan Rangkaian Ibadah:</span>
              <div className="grid grid-cols-5 gap-2 text-center">
                {journeySteps.map((step, idx) => {
                  const isCompleted = journey.progress >= step.progressThreshold;
                  const isCurrent = journey.progress >= (step.progressThreshold - 20) && journey.progress < step.progressThreshold;

                  return (
                    <div key={idx} className="space-y-1.5">
                      <div className={`h-2 rounded-full transition-all ${
                        isCompleted ? 'bg-emerald-600' : isCurrent ? 'bg-amber-500 animate-pulse' : 'bg-gray-200'
                      }`} />
                      <div>
                        <span className={`text-xs font-medium block ${
                          isCompleted ? 'text-emerald-900' : isCurrent ? 'text-amber-700' : 'text-gray-500'
                        }`}>
                          {step.name}
                        </span>
                        <span className="text-[10px] text-gray-500 block hidden sm:block truncate">
                          {step.phase}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Summary Pill */}
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-sm flex items-center justify-between">
              <span className="flex items-center gap-2 text-gray-600">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                Seluruh <span className="font-medium text-gray-900">{totalGroups} Kloter</span> sesuai jadwal
              </span>
              <Badge variant="outline" className="text-xs font-medium text-emerald-700 bg-white border-emerald-200 px-2 py-0.5">
                On Schedule
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Monitoring Presensi Kloter Realtime */}
        <Card className="shadow-sm border-gray-200 bg-white rounded-xl flex flex-col justify-between">
          <CardHeader className="p-6 border-b border-gray-200 flex flex-row items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2 leading-tight">
                <UsersRound className="w-5 h-5 text-blue-600" />
                Presensi & Kehadiran per Kloter
              </CardTitle>
              <CardDescription className="text-sm text-gray-500">
                Laporan tingkat kehadiran jamaah dalam setiap rombongan
              </CardDescription>
            </div>
            <Button 
              variant="ghost" 
              onClick={() => navigate('/groups')}
              className="text-blue-700 hover:bg-blue-50"
            >
              Detail <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {/* Quick Stat Highlights */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider block">Kehadiran</span>
                  <span className="text-xl font-bold text-emerald-950 block mt-1">{attendanceRate}%</span>
                </div>
                <Badge className="bg-emerald-600 text-white font-medium">
                  {totalPresentPilgrims} Hadir
                </Badge>
              </div>

              <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-blue-800 uppercase tracking-wider block">Belum Lapor</span>
                  <span className="text-xl font-bold text-blue-950 block mt-1">{totalMissingPilgrims}</span>
                </div>
                <Badge variant="outline" className="border-blue-200 text-blue-700 bg-white font-medium">
                  Monitoring
                </Badge>
              </div>
            </div>

            {/* Attendance Recharts Bar Chart */}
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attendanceData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 500, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(241, 245, 249, 0.6)' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 500 }}
                  />
                  <Bar dataKey="present" name="Hadir" fill="#059669" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="missing" name="Belum Lapor" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal: Export Master All-in-One Template */}
      <Dialog open={isExportModalOpen} onOpenChange={setIsExportModalOpen}>
        <DialogContent className="max-w-lg p-6 rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              Export Laporan Master Excel All-in-One
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 text-sm space-y-2">
              <p className="font-semibold text-emerald-900">Template Master Workbook Excel</p>
              <p className="text-emerald-800 leading-relaxed">
                Fitur ini akan mengunduh file Excel lengkap yang berisi rekapitulasi data jamaah, keuangan, serta inventaris stok sistem DNA Tour.
              </p>
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-gray-200 flex flex-col sm:flex-row gap-3">
            <Button variant="outline" onClick={() => setIsExportModalOpen(false)} className="w-full sm:w-auto border-gray-300">
              Batal
            </Button>
            <Button 
              disabled={isExporting} 
              onClick={handleExportAllInOneMaster} 
              className="bg-[#740A03] hover:bg-[#580802] text-white w-full sm:w-auto"
            >
              <Download className="w-4 h-4 mr-2" />
              {isExporting ? 'Proses Export...' : 'Download Master Excel'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
