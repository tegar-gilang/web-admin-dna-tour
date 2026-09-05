import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { 
  Download, Filter, Calendar, Users, Wallet, Building2, 
  UserCheck, Package, ShieldAlert, Sparkles, Search, 
  Layers, RotateCcw, Radio, FileSpreadsheet, ChevronRight,
  FolderArchive, CheckCircle2, ClipboardList
} from 'lucide-react';
import { useStore } from '@/core/store';
import { exportToExcel, exportMasterWorkbookToExcel } from '@/lib/export';
import { toast } from '@/lib/toast';

export default function Reports() {
  // ==========================================
  // FITUR: STATE & VARIABLE INITIALIZATION
  // ==========================================
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('2026-01-01');
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedGroup, setSelectedGroup] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const [isExportingMaster, setIsExportingMaster] = useState(false);
  const [activeExportId, setActiveExportId] = useState<string | null>(null);

  // ==========================================
  // FITUR: DATA SOURCE & GLOBAL STATE
  // ==========================================
  const { 
    pilgrims, 
    groups, 
    tourLeaders, 
    mutawifs, 
    schedules, 
    emergencies, 
    rooms, 
    staffStocks, 
    financeTransactions,
    broadcasts
  } = useStore();

  const todayStr = new Date().toISOString().split('T')[0];

  // ==========================================
  // FITUR: DATA FILTERING & PROCESSING
  // Memproses data berdasarkan filter yang aktif
  // ==========================================
  
  // Unique groups dropdown list
  const availableGroups = useMemo(() => {
    const list = groups.map(g => g.name || g.kloter).filter(Boolean);
    return Array.from(new Set(list));
  }, [groups]);

  // Synchronized Filtered Data Sets
  const filteredBroadcasts = useMemo(() => {
    return broadcasts.filter(b => {
      const matchesSearch = !searchQuery.trim() || 
        b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.target.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [broadcasts, searchQuery]);

  const filteredPilgrims = useMemo(() => {
    return pilgrims.filter(p => {
      const matchesGroup = selectedGroup === 'ALL' || p.group === selectedGroup || p.group.includes(selectedGroup);
      const matchesStatus = selectedStatus === 'ALL' || 
        (selectedStatus === 'LUNAS' && (p.paymentOption === 'Bayar Lunas' || p.paymentOption === 'DP')) ||
        (selectedStatus === 'BELUM_LUNAS' && p.paymentOption === 'Belum Bayar') ||
        (selectedStatus === 'BERHASIL' && p.paymentOption === 'Bayar Lunas');
      const matchesSearch = !searchQuery.trim() || 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.passport.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.phone.includes(searchQuery) ||
        p.group.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesGroup && matchesStatus && matchesSearch;
    });
  }, [pilgrims, selectedGroup, selectedStatus, searchQuery]);

  const filteredGroups = useMemo(() => {
    return groups.filter(g => {
      const matchesGroup = selectedGroup === 'ALL' || g.name === selectedGroup || g.kloter === selectedGroup;
      const matchesStatus = selectedStatus === 'ALL' || g.status.toLowerCase().includes(selectedStatus.toLowerCase());
      const matchesSearch = !searchQuery.trim() || 
        g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.kloter.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.tourLeader.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.mutawif.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesGroup && matchesStatus && matchesSearch;
    });
  }, [groups, selectedGroup, selectedStatus, searchQuery]);

  const filteredFinance = useMemo(() => {
    return financeTransactions.filter(t => {
      const matchesDate = (!startDate || t.date >= startDate) && (!endDate || t.date <= endDate);
      const pilgrim = pilgrims.find(p => p.id === t.pilgrimId || p.name.trim().toLowerCase() === t.pilgrimName.trim().toLowerCase());
      const pilgrimGroup = pilgrim ? pilgrim.group : '';
      const matchesGroup = selectedGroup === 'ALL' || (pilgrimGroup && pilgrimGroup.includes(selectedGroup));
      const matchesStatus = selectedStatus === 'ALL' || 
        (selectedStatus === 'BERHASIL' && t.status === 'Berhasil') ||
        (selectedStatus === 'LUNAS' && t.status === 'Berhasil') ||
        (selectedStatus === 'PENDING' && t.status === 'Pending') ||
        (selectedStatus === 'BATAL' && t.status === 'Batal');
      const matchesSearch = !searchQuery.trim() ||
        t.pilgrimName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.referenceNo && t.referenceNo.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesDate && matchesGroup && matchesStatus && matchesSearch;
    });
  }, [financeTransactions, startDate, endDate, pilgrims, selectedGroup, selectedStatus, searchQuery]);

  const filteredRooms = useMemo(() => {
    return rooms.filter(r => {
      const matchesGroup = selectedGroup === 'ALL' || r.kloter === selectedGroup || r.kloter.includes(selectedGroup);
      const matchesSearch = !searchQuery.trim() ||
        r.hotelName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.roomLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.kloter.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.occupants.some(o => o.name.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesGroup && matchesSearch;
    });
  }, [rooms, selectedGroup, searchQuery]);

  const filteredSdm = useMemo(() => {
    const tls = tourLeaders.filter(t => {
      const matchesGroup = selectedGroup === 'ALL' || t.group === selectedGroup;
      const matchesStatus = selectedStatus === 'ALL' || t.status.toLowerCase().includes(selectedStatus.toLowerCase());
      const matchesSearch = !searchQuery.trim() || t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.phone.includes(searchQuery);
      return matchesGroup && matchesStatus && matchesSearch;
    });
    const mws = mutawifs.filter(m => {
      const matchesGroup = selectedGroup === 'ALL' || m.group === selectedGroup;
      const matchesStatus = selectedStatus === 'ALL' || m.status.toLowerCase().includes(selectedStatus.toLowerCase());
      const matchesSearch = !searchQuery.trim() || m.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesGroup && matchesStatus && matchesSearch;
    });
    return { tls, mws, total: tls.length + mws.length };
  }, [tourLeaders, mutawifs, selectedGroup, selectedStatus, searchQuery]);

  const filteredStocks = useMemo(() => {
    return staffStocks.filter(s => {
      const matchesSearch = !searchQuery.trim() ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.location && s.location.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesSearch;
    });
  }, [staffStocks, searchQuery]);

  const filteredSchedules = useMemo(() => {
    return schedules.filter(s => {
      const matchesDate = (!startDate || s.date >= startDate) && (!endDate || s.date <= endDate);
      const matchesSearch = !searchQuery.trim() ||
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.pic && s.pic.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesDate && matchesSearch;
    });
  }, [schedules, startDate, endDate, searchQuery]);

  const filteredEmergencies = useMemo(() => {
    return emergencies.filter(e => {
      const matchesDate = (!startDate || e.date >= startDate) && (!endDate || e.date <= endDate);
      const matchesGroup = selectedGroup === 'ALL' || e.group === selectedGroup || e.group.includes(selectedGroup);
      const matchesStatus = selectedStatus === 'ALL' || e.status.toLowerCase().includes(selectedStatus.toLowerCase());
      const matchesSearch = !searchQuery.trim() ||
        e.pilgrim.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.type.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesDate && matchesGroup && matchesStatus && matchesSearch;
    });
  }, [emergencies, startDate, endDate, selectedGroup, selectedStatus, searchQuery]);

  // ==========================================
  // FITUR: FINANCIAL CALCULATIONS
  // Menghitung total pemasukan dan pengeluaran
  // ==========================================
  // Financial calculations on filtered dataset
  const totalIncome = useMemo(() => {
    return filteredFinance
      .filter(t => t.type.startsWith('Pemasukan') && t.status === 'Berhasil')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [filteredFinance]);

  const totalExpense = useMemo(() => {
    return filteredFinance
      .filter(t => t.type === 'Pengeluaran' && t.status === 'Berhasil')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [filteredFinance]);

  const netBalance = totalIncome - totalExpense;

  // ==========================================
  // FITUR: FILTER ACTIONS
  // ==========================================
  // Reset Filters Function
  const handleResetFilters = () => {
    setSelectedCategory('ALL');
    setStartDate('2026-01-01');
    setEndDate(todayStr);
    setSelectedGroup('ALL');
    setSelectedStatus('ALL');
    setSearchQuery('');
    toast("Filter telah direset ke default.", "success");
  };

  // ==========================================
  // FITUR: EXPORT TO EXCEL (MASTER)
  // Ekspor seluruh data yang terfilter ke Excel
  // ==========================================
  // Master All-in-One Export Handler (Exports Filtered Records)
  const handleExportMasterAllInOne = async () => {
    setIsExportingMaster(true);
    try {
      const masterSheets = [
        {
          sheetName: 'Ringkasan Dashboard',
          title: 'Ringkasan Eksekutif & Master Index System (Filtered)',
          data: [
            { 'Modul': 'Data Pendaftaran', 'Total Data': `${filteredPilgrims.length} Registrasi`, 'Catatan Status': 'Hasil Filter Pendaftaran' },
            { 'Modul': 'Data Jamaah', 'Total Data': `${filteredPilgrims.length} Jamaah`, 'Catatan Status': 'Hasil Filter Registrasi & Paspor' },
            { 'Modul': 'Data Kloter', 'Total Data': `${filteredGroups.length} Kloter`, 'Catatan Status': 'Rombongan Keberangkatan' },
            { 'Modul': 'Buku Kas Keuangan', 'Total Data': `${filteredFinance.length} Transaksi`, 'Catatan Status': `Net Saldo: Rp ${netBalance.toLocaleString('id-ID')}` },
            { 'Modul': 'Room Meet Hotel', 'Total Data': `${filteredRooms.length} Kamar`, 'Catatan Status': 'Hotel Makkah & Madinah' },
            { 'Modul': 'Stok & Inventaris Staff', 'Total Data': `${filteredStocks.length} Items`, 'Catatan Status': 'Perlengkapan Staff & Gudang' },
            { 'Modul': 'SDM Mutawif & TL', 'Total Data': `${filteredSdm.total} SDM`, 'Catatan Status': 'Tour Leader & Mutawif Local' },
            { 'Modul': 'Itinerary & Agenda', 'Total Data': `${filteredSchedules.length} Kegiatan`, 'Catatan Status': 'Jadwal Agenda Ibadah' },
            { 'Modul': 'Log Darurat SOS', 'Total Data': `${filteredEmergencies.length} Insiden`, 'Catatan Status': 'Riwayat Insiden SOS' },
            { 'Modul': 'Siaran Pengumuman', 'Total Data': `${filteredBroadcasts.length} Pesan Siaran`, 'Catatan Status': 'Riwayat Siaran Broadcast' }
          ]
        },
        {
          sheetName: 'Data Pendaftaran',
          title: 'Master Data Pendaftaran Jamaah Umrah - DNA Tour',
          data: filteredPilgrims.map(p => ({
            'ID Jamaah': p.id,
            'Tanggal Daftar': p.registrationDate || '-',
            'Nama Lengkap': p.name,
            'No. HP': p.phone,
            'Paket Umrah': p.umrahPackage || '-',
            'Rencana Kloter': p.group,
            'Status Pembayaran': p.paymentOption || 'Belum Lunas',
            'Total Biaya (Rp)': p.totalAmount || 30000000,
            'Telah Dibayar (Rp)': p.paidAmount || 0,
            'Sisa Tagihan (Rp)': Math.max(0, (p.totalAmount || 30000000) - (p.paidAmount || 0)),
            'Keterangan / Notes': p.paymentNotes || '-'
          }))
        },
        {
          sheetName: 'Data Jamaah',
          title: 'Master Data Jamaah Umrah & Administrasi - DNA Tour',
          data: filteredPilgrims.map(p => ({
            'ID Jamaah': p.id,
            'Nama Lengkap': p.name,
            'No. Paspor': p.passport,
            'No. Visa': p.visaNumber || '-',
            'NIK': p.ktp || '-',
            'Jenis Kelamin': p.gender,
            'Usia': p.age,
            'No. HP': p.phone,
            'Kontak Darurat': p.emergencyContact || '-',
            'Tgl. Keberangkatan': p.departureDate || '-',
            'Paket Umrah': p.umrahPackage || '-',
            'Kloter': p.group,
            'Tour Leader': p.tourLeader || '-',
            'Mutawif Local': p.mutawifLocal || '-',
            'Status Pembayaran': p.paymentOption || 'Belum Lunas',
            'Total Biaya (Rp)': p.totalAmount || 30000000,
            'Telah Dibayar (Rp)': p.paidAmount || 0,
            'Sisa Tagihan (Rp)': Math.max(0, (p.totalAmount || 30000000) - (p.paidAmount || 0)),
            'Vaksin Meningitis': p.meningitis ? 'Sudah' : 'Belum',
            'Pas Foto 4x6': p.photo ? 'Sudah' : 'Belum',
            'Kelengkapan Berkas': p.documentInfo || '-',
            'Kelengkapan Perlengkapan': [(p.koperBesar || p.koperKabin) && 'Koper', p.batik && 'Batik', p.kainIhram && 'Ihram', p.tasSandal && 'Tas Sandal', p.syall && 'Syall'].filter(Boolean).join(', ') || 'Belum Lengkap'
          }))
        },
        {
          sheetName: 'Data Kloter',
          title: 'Data Kloter & Group Keberangkatan - DNA Tour',
          data: filteredGroups.map(g => ({
            'ID Kloter': g.id,
            'Nama Kloter': g.name,
            'Kode Kloter': g.kloter,
            'Jumlah Jamaah': g.pilgrims,
            'Tour Leader': g.tourLeader,
            'Mutawif': g.mutawif,
            'Status Kloter': g.status
          }))
        },
        {
          sheetName: 'Keuangan & Arus Kas',
          title: 'Laporan Keuangan & Buku Kas Transaksi - DNA Tour',
          data: filteredFinance.map(t => ({
            'ID Transaksi': t.id,
            'Uraian Transaksi': t.pilgrimName,
            'Tipe Transaksi': t.type,
            'Kategori': t.category,
            'Nominal (Rp)': t.amount,
            'Metode Pembayaran': t.paymentMethod,
            'Tanggal': t.date,
            'Status': t.status,
            'No. Referensi': t.referenceNo || '-'
          }))
        },
        {
          sheetName: 'Room Meet Hotel',
          title: 'Manifest Alokasi Kamar Hotel Makkah & Madinah',
          data: filteredRooms.map(r => ({
            'ID Kamar': r.id,
            'Label Kamar': r.roomLabel,
            'No. Room': r.roomNumber || '-',
            'Tipe Kamar': r.category,
            'Lokasi Hotel': r.hotelLocation,
            'Nama Hotel': r.hotelName,
            'Kloter': r.kloter,
            'Daftar Penghuni': r.occupants.map(o => `${o.title} ${o.name}`).join('; ')
          }))
        },
        {
          sheetName: 'Stok & Inventaris',
          title: 'Stok Perlengkapan Staff & Gudang - DNA Tour',
          data: filteredStocks.map(s => ({
            'ID Barang': s.id,
            'Nama Perlengkapan': s.name,
            'Kategori': s.category,
            'Jumlah Stok': s.quantity,
            'Stok Minimal': s.minStock,
            'Satuan': s.unit,
            'Lokasi Gudang': s.location || '-'
          }))
        },
        {
          sheetName: 'SDM Mutawif & TL',
          title: 'SDM Tour Leader & Mutawif Local - DNA Tour',
          data: [
            ...filteredSdm.tls.map(t => ({ 'ID SDM': t.id, 'Nama Pembimbing': t.name, 'Peran SDM': 'Tour Leader (TL)', 'No. Kontak': t.phone, 'Kloter Tugas': t.group, 'Status Pembimbing': t.status })),
            ...filteredSdm.mws.map(m => ({ 'ID SDM': m.id, 'Nama Pembimbing': m.name, 'Peran SDM': 'Mutawif Local', 'No. Kontak': '-', 'Kloter Tugas': m.group, 'Status Pembimbing': m.status }))
          ]
        },
        {
          sheetName: 'Agenda Itinerary',
          title: 'Jadwal Agenda Itinerary Perjalanan - DNA Tour',
          data: filteredSchedules.map(s => ({
            'ID Agenda': s.id,
            'Tanggal': s.date,
            'Waktu': s.time,
            'Agenda Kegiatan': s.title,
            'Lokasi': s.location,
            'Penanggung Jawab': s.pic || '-'
          }))
        },
        {
          sheetName: 'Log Darurat SOS',
          title: 'Log Laporan Penanganan Darurat SOS - DNA Tour',
          data: filteredEmergencies.map(e => ({
            'ID Insiden': e.id,
            'Nama Jamaah': e.pilgrim,
            'Kloter': e.group,
            'Lokasi Kejadian': e.location,
            'Tanggal & Waktu': `${e.date} ${e.time}`,
            'Jenis Insiden': e.type,
            'Status Penanganan': e.status
          }))
        },
        {
          sheetName: 'Riwayat Siaran',
          title: 'Riwayat Pengumuman & Siaran Broadcast - DNA Tour',
          data: filteredBroadcasts.map(b => ({
            'ID Siaran': b.id,
            'Waktu Siaran': b.time,
            'Target Sasaran': b.target,
            'Judul Pengumuman': b.title,
            'Isi Pesan': b.message
          }))
        }
      ];

      await exportMasterWorkbookToExcel(
        masterSheets,
        `Master_Laporan_Filtered_${todayStr}`,
        'MASTER LAPORAN REKAPITULASI ALL-IN-ONE SYSTEM - DNA TOUR'
      );

      toast("Master Excel Workbook All-in-One berhasil diunduh!", "success");
    } catch (err) {
      console.error(err);
      toast("Gagal mengunduh Master Excel.", "error");
    } finally {
      setIsExportingMaster(false);
    }
  };

  // ==========================================
  // FITUR: EXPORT TO EXCEL (INDIVIDUAL)
  // Ekspor laporan spesifik per modul
  // ==========================================
  // Individual Export Action Handlers
  const handleExportIndividual = async (id: string) => {
    setActiveExportId(id);
    try {
      if (id === 'pendaftaran') {
        const data = filteredPilgrims.map(p => ({
          'ID Jamaah': p.id,
          'Tanggal Daftar': p.registrationDate || '-',
          'Nama Lengkap': p.name,
          'No. HP': p.phone,
          'Paket Umrah': p.umrahPackage || '-',
          'Rencana Kloter': p.group,
          'Status Pembayaran': p.paymentOption || 'Belum Lunas',
          'Total Biaya (Rp)': p.totalAmount || 30000000,
          'Telah Dibayar (Rp)': p.paidAmount || 0,
          'Sisa Tagihan (Rp)': Math.max(0, (p.totalAmount || 30000000) - (p.paidAmount || 0)),
          'Keterangan / Notes': p.paymentNotes || '-'
        }));
        await exportToExcel(data, `Laporan_Data_Pendaftaran_${todayStr}`, 'LAPORAN DATA PENDAFTARAN JAMAAH - DNA TOUR');
        toast("Laporan Data Pendaftaran berhasil diunduh!", "success");
      }
      else if (id === 'jamaah') {
        const data = filteredPilgrims.map(p => ({
          'ID Jamaah': p.id,
          'Nama Lengkap': p.name,
          'No. Paspor': p.passport,
          'No. Visa': p.visaNumber || '-',
          'NIK': p.ktp || '-',
          'Jenis Kelamin': p.gender,
          'Usia': p.age,
          'No. HP': p.phone,
          'Kontak Darurat': p.emergencyContact || '-',
          'Tgl. Keberangkatan': p.departureDate || '-',
          'Paket Umrah': p.umrahPackage || '-',
          'Kloter': p.group,
          'Tour Leader': p.tourLeader || '-',
          'Mutawif Local': p.mutawifLocal || '-',
          'Status Pembayaran': p.paymentOption || 'Belum Lunas',
          'Total Biaya (Rp)': p.totalAmount || 30000000,
          'Telah Dibayar (Rp)': p.paidAmount || 0,
          'Sisa Tagihan (Rp)': Math.max(0, (p.totalAmount || 30000000) - (p.paidAmount || 0)),
          'Vaksin Meningitis': p.meningitis ? 'Sudah' : 'Belum',
          'Pas Foto 4x6': p.photo ? 'Sudah' : 'Belum',
          'Kelengkapan Berkas': p.documentInfo || '-',
          'Kelengkapan Perlengkapan': [(p.koperBesar || p.koperKabin) && 'Koper', p.batik && 'Batik', p.kainIhram && 'Ihram', p.tasSandal && 'Tas Sandal', p.syall && 'Syall'].filter(Boolean).join(', ') || 'Belum Lengkap'
        }));
        await exportToExcel(data, `Laporan_Data_Jamaah_${todayStr}`, 'LAPORAN DATA JAMAAH & REGISTRASI - DNA TOUR');
        toast("Laporan Data Jamaah berhasil diunduh!", "success");
      } 
      else if (id === 'kloter') {
        const data = filteredGroups.map(g => ({
          'ID Kloter': g.id,
          'Nama Kloter': g.name,
          'Kode Kloter': g.kloter,
          'Jumlah Jamaah': g.pilgrims,
          'Tour Leader': g.tourLeader,
          'Mutawif': g.mutawif,
          'Status Kloter': g.status
        }));
        await exportToExcel(data, `Laporan_Kloter_Keberangkatan_${todayStr}`, 'LAPORAN KLOTER KEBERANGKATAN - DNA TOUR');
        toast("Laporan Data Kloter berhasil diunduh!", "success");
      }
      else if (id === 'keuangan') {
        const data = filteredFinance.map(t => ({
          'ID Transaksi': t.id,
          'Uraian Transaksi': t.pilgrimName,
          'Tipe Transaksi': t.type,
          'Kategori': t.category,
          'Nominal (Rp)': t.amount,
          'Metode Pembayaran': t.paymentMethod,
          'Tanggal': t.date,
          'Status': t.status,
          'No. Referensi': t.referenceNo || '-'
        }));
        await exportToExcel(data, `Laporan_Keuangan_Kas_${todayStr}`, 'LAPORAN BUKU KAS & ARUS KEUANGAN - DNA TOUR');
        toast("Laporan Keuangan berhasil diunduh!", "success");
      }
      else if (id === 'kamar') {
        const data = filteredRooms.map(r => ({
          'ID Kamar': r.id,
          'Label Kamar': r.roomLabel,
          'No. Room': r.roomNumber || '-',
          'Tipe Kamar': r.category,
          'Lokasi Hotel': r.hotelLocation,
          'Nama Hotel': r.hotelName,
          'Kloter': r.kloter,
          'Daftar Penghuni': r.occupants.map(o => `${o.title} ${o.name}`).join('; ')
        }));
        await exportToExcel(data, `Laporan_Manifest_Kamar_Hotel_${todayStr}`, 'LAPORAN MANIFEST KAMAR HOTEL - DNA TOUR');
        toast("Laporan Manifest Kamar berhasil diunduh!", "success");
      }
      else if (id === 'sdm') {
        const data = [
          ...filteredSdm.tls.map(t => ({ 'ID SDM': t.id, 'Nama Pembimbing': t.name, 'Peran SDM': 'Tour Leader (TL)', 'No. Kontak': t.phone, 'Kloter Tugas': t.group, 'Status Pembimbing': t.status })),
          ...filteredSdm.mws.map(m => ({ 'ID SDM': m.id, 'Nama Pembimbing': m.name, 'Peran SDM': 'Mutawif Local', 'No. Kontak': '-', 'Kloter Tugas': m.group, 'Status Pembimbing': m.status }))
        ];
        await exportToExcel(data, `Laporan_SDM_Mutawif_TL_${todayStr}`, 'LAPORAN SDM TOUR LEADER & MUTAWIF - DNA TOUR');
        toast("Laporan SDM Pembimbing berhasil diunduh!", "success");
      }
      else if (id === 'stok') {
        const data = filteredStocks.map(s => ({
          'ID Barang': s.id,
          'Nama Perlengkapan': s.name,
          'Kategori': s.category,
          'Jumlah Stok': s.quantity,
          'Stok Minimal': s.minStock,
          'Satuan': s.unit,
          'Lokasi Gudang': s.location || '-'
        }));
        await exportToExcel(data, `Laporan_Stok_Inventaris_${todayStr}`, 'LAPORAN STOK PERLENGKAPAN STAFF - DNA TOUR');
        toast("Laporan Stok Inventaris berhasil diunduh!", "success");
      }
      else if (id === 'itinerary') {
        const data = filteredSchedules.map(s => ({
          'ID Agenda': s.id,
          'Tanggal': s.date,
          'Waktu': s.time,
          'Agenda Kegiatan': s.title,
          'Lokasi': s.location,
          'Penanggung Jawab': s.pic || '-'
        }));
        await exportToExcel(data, `Laporan_Itinerary_Jadwal_${todayStr}`, 'LAPORAN ITINERARY & AGENDA PERJALANAN - DNA TOUR');
        toast("Laporan Itinerary berhasil diunduh!", "success");
      }
      else if (id === 'sos') {
        const data = filteredEmergencies.map(e => ({
          'ID Insiden': e.id,
          'Nama Jamaah': e.pilgrim,
          'Kloter': e.group,
          'Lokasi Kejadian': e.location,
          'Tanggal & Waktu': `${e.date} ${e.time}`,
          'Jenis Insiden': e.type,
          'Status Penanganan': e.status
        }));
        await exportToExcel(data, `Laporan_Insiden_SOS_${todayStr}`, 'LAPORAN INSIDEN & LOG DARURAT SOS - DNA TOUR');
        toast("Laporan Insiden SOS berhasil diunduh!", "success");
      }
      else if (id === 'siaran') {
        const data = filteredBroadcasts.map(b => ({
          'ID Siaran': b.id,
          'Waktu Siaran': b.time,
          'Target Sasaran': b.target,
          'Judul Pengumuman': b.title,
          'Isi Pesan': b.message
        }));
        await exportToExcel(data, `Laporan_Riwayat_Siaran_${todayStr}`, 'LAPORAN RIWAYAT PENGUMUMAN & SIARAN - DNA TOUR');
        toast("Laporan Riwayat Siaran berhasil diunduh!", "success");
      }
    } catch (err) {
      console.error(err);
      toast("Gagal mengunduh laporan Excel.", "error");
    } finally {
      setActiveExportId(null);
    }
  };

  // ==========================================
  // FITUR: REPORT CATEGORIES & STRUCTURE
  // Mendefinisikan struktur kartu laporan
  // ==========================================
  // Structured Categorized Report Groups
  const categoryContainers = [
    {
      key: 'OPERASIONAL',
      title: 'Operasional Jamaah & Keberangkatan',
      description: 'Laporan administratif jamaah, kloter rombongan, agenda perjalanan, serta riwayat siaran.',
      icon: Users,
      badge: '5 Modul Laporan',
      reports: [
        {
          id: 'pendaftaran',
          title: 'Laporan Pendaftaran Jamaah',
          desc: 'Data pendaftaran jamaah baru, pilihan paket umrah, status pembayaran awal, dan nominal tagihan.',
          badgeText: 'Pendaftaran & Tagihan',
          icon: ClipboardList,
          countLabel: `${filteredPilgrims.length} Registrasi`,
        },
        {
          id: 'jamaah',
          title: 'Laporan Master Data Jamaah & Paspor',
          desc: 'Rekapitulasi profil jamaah, nomor paspor, paket umrah, status pembayaran, serta alokasi kloter.',
          badgeText: 'Registrasi & Paspor',
          icon: Users,
          countLabel: `${filteredPilgrims.length} Jamaah Terdaftar`,
        },
        {
          id: 'kloter',
          title: 'Laporan Kloter & Group Rombongan',
          desc: 'Daftar kloter aktif, pembimbing Tour Leader, Mutawif lokal, serta total kapasitas anggota rombongan.',
          badgeText: 'Kloter & Rombongan',
          icon: Layers,
          countLabel: `${filteredGroups.length} Kloter Keberangkatan`,
        },
        {
          id: 'itinerary',
          title: 'Laporan Schedule & Itinerary Agenda',
          desc: 'Jadwal rangkaian kegiatan ibadah, ziarah Makkah & Madinah, serta jadwal penerbangan rombongan.',
          badgeText: 'Agenda Ibadah',
          icon: Calendar,
          countLabel: `${filteredSchedules.length} Kegiatan Terjadwal`,
        },
        {
          id: 'siaran',
          title: 'Laporan Riwayat Siaran Pengumuman',
          desc: 'Rekapitulasi pesan siaran (broadcast) yang telah dikirim beserta target audiens dan waktu penyampaian.',
          badgeText: 'Siaran Informasi',
          icon: Radio,
          countLabel: `${filteredBroadcasts.length} Pesan Siaran`,
        },
      ]
    },
    {
      key: 'KEUANGAN',
      title: 'Keuangan & Buku Kas Transaksi',
      description: 'Laporan arus kas masuk pembayaran paket jamaah, pengeluaran operasional, dan saldo bersih.',
      icon: Wallet,
      badge: '1 Modul Laporan',
      reports: [
        {
          id: 'keuangan',
          title: 'Laporan Buku Kas & Arus Keuangan',
          desc: 'Rincian transaksi pemasukan pembayaran jamaah, pengeluaran operasional, serta saldo bersih kas transaksi.',
          badgeText: 'Buku Kas & Transaksi',
          icon: Wallet,
          countLabel: `${filteredFinance.length} Transaksi (Net Rp ${netBalance.toLocaleString('id-ID')})`,
        }
      ]
    },
    {
      key: 'LOGISTIK',
      title: 'Logistik & Akomodasi Hotel',
      description: 'Laporan manifest alokasi kamar hotel serta monitoring persediaan stok perlengkapan staff.',
      icon: Building2,
      badge: '2 Modul Laporan',
      reports: [
        {
          id: 'kamar',
          title: 'Laporan Manifest Kamar Hotel',
          desc: 'Alokasi rooming list kamar hotel Makkah dan Madinah beserta rincian nama penghuni per kamar.',
          badgeText: 'Manifest Rooming',
          icon: Building2,
          countLabel: `${filteredRooms.length} Kamar Terisi`,
        },
        {
          id: 'stok',
          title: 'Laporan Stok Perlengkapan Staff',
          desc: 'Monitoring inventaris koper, seragam batik, perlengkapan jamaah, serta batas minimal stok gudang.',
          badgeText: 'Inventaris Gudang',
          icon: Package,
          countLabel: `${filteredStocks.length} Item Perlengkapan`,
        }
      ]
    },
    {
      key: 'SDM',
      title: 'SDM Pembimbing & Keselamatan',
      description: 'Laporan personel Tour Leader, Mutawif pembimbing, serta rekap penanganan log darurat SOS.',
      icon: UserCheck,
      badge: '2 Modul Laporan',
      reports: [
        {
          id: 'sdm',
          title: 'Laporan SDM Tour Leader & Mutawif',
          desc: 'Data seluruh Tour Leader dan Mutawif pembimbing, kontak darurat, serta penugasan kloter jamaah.',
          badgeText: 'Petugas & Pembimbing',
          icon: UserCheck,
          countLabel: `${filteredSdm.total} Personel SDM`,
        },
        {
          id: 'sos',
          title: 'Laporan Insiden & Log Darurat SOS',
          desc: 'Riwayat laporan darurat jamaah, titik lokasi kejadian, jenis insiden, serta status respon penanganan.',
          badgeText: 'Respon Darurat',
          icon: ShieldAlert,
          countLabel: `${filteredEmergencies.length} Log Kejadian SOS`,
        }
      ]
    }
  ];

  // Filter categories according to selection & search
  const visibleCategories = useMemo(() => {
    return categoryContainers
      .filter(cat => selectedCategory === 'ALL' || cat.key === selectedCategory)
      .map(cat => {
        const filteredReports = cat.reports.filter(r => {
          if (!searchQuery.trim()) return true;
          return r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                 r.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
                 r.badgeText.toLowerCase().includes(searchQuery.toLowerCase());
        });
        return {
          ...cat,
          reports: filteredReports
        };
      })
      .filter(cat => cat.reports.length > 0);
  }, [selectedCategory, searchQuery, categoryContainers]);

  const totalFilteredReportsCount = useMemo(() => {
    return visibleCategories.reduce((sum, cat) => sum + cat.reports.length, 0);
  }, [visibleCategories]);

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      {/* Red/Maroon Master Banner & All-in-One Download Container */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#740A03] via-[#782820] to-[#580802] text-white p-6 sm:p-8 lg:p-10 shadow-lg shadow-red-950/15 border border-[#8a2f26]">
        {/* Subtle decorative background pattern */}
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-80 h-80 bg-red-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-20 w-64 h-64 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-red-100 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Pusat Laporan Terpadu DNA Tour</span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Pusat Laporan & Ekspor Data
            </h1>
            
            <p className="text-sm sm:text-base text-red-100/90 leading-relaxed font-normal">
              Unduh rekapitulasi data per modul atau ekspor seluruh 9 modul data operasional ke dalam satu Master Workbook Excel yang terstruktur rapi.
            </p>
          </div>

          <div className="w-full lg:w-auto shrink-0">
            <Button 
              onClick={handleExportMasterAllInOne}
              disabled={isExportingMaster}
              className="w-full lg:w-auto h-auto py-4 px-7 rounded-2xl bg-white hover:bg-red-50 text-[#740A03] font-bold text-sm sm:text-base shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-3 cursor-pointer border border-white/30 group"
            >
              <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center text-[#740A03] group-hover:scale-105 transition-transform shrink-0">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="leading-tight">
                  {isExportingMaster ? 'Memproses Master...' : 'Download Master (9 Sheet)'}
                </div>
                <div className="text-[11px] font-medium text-red-800/80">
                  Format Excel Workbook (.xlsx)
                </div>
              </div>
              <Download className="w-4 h-4 text-[#740A03] ml-1 group-hover:translate-y-0.5 transition-transform" />
            </Button>
          </div>
        </div>
      </div>

      {/* Comprehensive Filter Controls with Red/Maroon Styling */}
      <div className="bg-white rounded-3xl border border-red-100/80 p-5 sm:p-6 shadow-xs space-y-5">
        {/* Top Row: Category Tabs & Search Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar -mx-2 px-2">
            {[
              { key: 'ALL', label: 'Semua Kategori' },
              { key: 'OPERASIONAL', label: 'Operasional Jamaah' },
              { key: 'KEUANGAN', label: 'Keuangan Kas' },
              { key: 'LOGISTIK', label: 'Logistik & Hotel' },
              { key: 'SDM', label: 'SDM & Keselamatan' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setSelectedCategory(tab.key)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === tab.key
                    ? 'bg-[#740A03] text-white shadow-xs'
                    : 'bg-red-50/50 text-gray-700 hover:bg-red-50 border border-red-100/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-auto md:min-w-[300px]">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama laporan, modul, kata kunci..."
              className="pl-10 h-10 text-xs sm:text-sm bg-gray-50/80 border-gray-200 rounded-xl w-full focus:bg-white focus:border-[#740A03] focus:ring-1 focus:ring-[#740A03]"
            />
          </div>
        </div>

        {/* Bottom Row: Multi-Filter Controls (Date Range, Group, Status, Reset) */}
        <div className="pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          {/* Filter 1: Date Range */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#740A03]" /> Rentang Tanggal
            </label>
            <div className="flex items-center gap-2 bg-gray-50/80 px-3 py-1.5 h-10 rounded-xl border border-gray-200 focus-within:border-[#740A03] focus-within:bg-white">
              <input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-xs text-gray-700 font-medium focus:outline-none w-full appearance-none" 
              />
              <span className="text-gray-400 font-medium hidden sm:inline text-center shrink-0">-</span>
              <input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent text-xs text-gray-700 font-medium focus:outline-none w-full appearance-none" 
              />
            </div>
          </div>

          {/* Filter 2: Kloter / Group Filter */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#740A03]" /> Kloter Keberangkatan
            </label>
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="w-full h-10 bg-gray-50/80 border border-gray-200 rounded-xl px-3 text-xs font-medium text-gray-700 focus:outline-none focus:bg-white focus:border-[#740A03]"
            >
              <option value="ALL">Semua Kloter Keberangkatan</option>
              {availableGroups.map((g, idx) => (
                <option key={idx} value={g}>{g}</option>
              ))}
            </select>
          </div>

          {/* Filter 3: Status Filter */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-[#740A03]" /> Status Operasional
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full h-10 bg-gray-50/80 border border-gray-200 rounded-xl px-3 text-xs font-medium text-gray-700 focus:outline-none focus:bg-white focus:border-[#740A03]"
            >
              <option value="ALL">Semua Status Operasional</option>
              <option value="LUNAS">Lunas</option>
              <option value="BELUM_LUNAS">Belum Lunas</option>
              <option value="BATAL">Batal</option>
            </select>
          </div>

          {/* Action: Reset Filter Button */}
          <div className="space-y-1.5 flex flex-col justify-end">
            <Button 
              size="sm" 
              variant="outline"
              onClick={handleResetFilters}
              className="h-10 text-xs text-gray-700 border-gray-200 hover:bg-red-50 hover:text-[#740A03] hover:border-red-200 rounded-xl flex items-center justify-center gap-1.5 font-bold w-full cursor-pointer shadow-2xs transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#740A03]" /> Reset Filter Data
            </Button>
          </div>
        </div>
      </div>

      {/* Categorized Report Containers List */}
      <div className="space-y-8">
        {visibleCategories.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center space-y-3 shadow-xs">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-red-50 flex items-center justify-center text-[#740A03]">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Tidak Ada Laporan yang Cocok</h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              Tidak ditemukan modul laporan yang sesuai dengan kata kunci pencarian atau filter yang dipilih.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              className="mt-2 rounded-xl text-xs font-bold text-[#740A03] border-red-200 hover:bg-red-50"
            >
              Reset Filter
            </Button>
          </div>
        ) : (
          visibleCategories.map((category) => {
            const CategoryIcon = category.icon;
            
            return (
              <div 
                key={category.key} 
                className="bg-white rounded-[2rem] border border-gray-100 p-6 sm:p-8 shadow-sm hover:shadow-md transition-all duration-300 space-y-6"
              >
                {/* Category Container Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-gray-100">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-50 to-red-100/50 border border-red-100 flex items-center justify-center text-[#740A03] shrink-0 shadow-sm">
                      <CategoryIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                        {category.title}
                      </h2>
                      <p className="text-sm text-gray-500 font-medium mt-0.5">
                        {category.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-gray-50 text-gray-600 border border-gray-200">
                      <FolderArchive className="w-3.5 h-3.5 text-gray-400" />
                      {category.reports.length} Modul
                    </span>
                  </div>
                </div>

                {/* Report Cards Grid inside this Category Container */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-4 sm:gap-6">
                  {category.reports.map((card) => {
                    const CardIcon = card.icon;
                    const isCurrentExporting = activeExportId === card.id;

                    return (
                      <Card 
                        key={card.id} 
                        className="bg-white border border-[#740A03] hover:border-[#740A03] rounded-2xl overflow-hidden flex flex-col group transition-all duration-300 hover:shadow-lg hover:-translate-y-1 relative"
                      >
                        {/* Hover accent top line */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#740A03] to-red-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        
                        <CardContent className="p-0 flex-1 flex flex-col justify-between pt-1">
                          <div className="p-5 sm:p-6 space-y-4">
                            {/* Card Top Row */}
                            <div className="flex items-start justify-between gap-3">
                              <div className="w-12 h-12 rounded-2xl bg-gray-50 group-hover:bg-red-50 border border-gray-100 group-hover:border-red-100/70 text-gray-400 group-hover:text-[#740A03] flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-110">
                                <CardIcon className="w-5 h-5" />
                              </div>
                              <span className="text-[11px] font-bold px-3 py-1.5 rounded-lg bg-gray-50 text-gray-600 border border-gray-200/80 whitespace-nowrap group-hover:bg-red-50/50 group-hover:text-red-700 group-hover:border-red-100 transition-colors">
                                {card.badgeText}
                              </span>
                            </div>

                            {/* Card Title & Desc */}
                            <div className="space-y-2">
                              <h3 className="font-bold text-lg text-gray-900 group-hover:text-[#740A03] transition-colors leading-tight">
                                {card.title}
                              </h3>
                              <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">
                                {card.desc}
                              </p>
                            </div>
                          </div>

                          {/* Card Footer Bar */}
                          <div className="px-5 sm:px-6 py-4 bg-gray-50/50 group-hover:bg-red-50/30 border-t border-gray-100 flex items-center justify-between gap-3 transition-colors">
                            <div className="flex flex-col min-w-0">
                              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">
                                Total Rekap Data
                              </span>
                              <span className="font-bold text-gray-800 text-sm truncate">
                                {card.countLabel}
                              </span>
                            </div>

                            <Button
                              size="sm"
                              onClick={() => handleExportIndividual(card.id)}
                              disabled={isCurrentExporting}
                              className="shrink-0 h-10 px-5 rounded-xl bg-gray-900 hover:bg-[#740A03] text-white flex items-center gap-2 font-bold shadow-sm cursor-pointer transition-all duration-300"
                            >
                              <Download className="w-4 h-4" />
                              <span>{isCurrentExporting ? 'Proses...' : 'Unduh'}</span>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

