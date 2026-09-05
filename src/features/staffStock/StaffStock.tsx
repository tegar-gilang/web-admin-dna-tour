import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { 
  Search, Plus, Filter, Download, Trash2, Edit2, AlertTriangle, 
  CheckCircle2, XCircle, Boxes, ArrowUpDown, PlusCircle, MinusCircle, 
  RefreshCw, MapPin, Package, AlertCircle, Sparkles, ChevronLeft, ChevronRight,
  Info, SlidersHorizontal, Check, Eye, X
} from 'lucide-react';
import { Checkbox } from '@/components/ui/Checkbox';
import { useStore, StaffStockItem } from '@/core/store';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { ConfirmDeleteDialog } from '@/components/ui/ConfirmDeleteDialog';
import { exportToExcel } from '@/lib/export';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';

export default function StaffStock() {

// ==========================================
// FITUR: STAFFSTOCK
// Komponen utama untuk fitur STAFFSTOCK
// ==========================================

  const { staffStocks, addStaffStock, updateStaffStock, deleteStaffStock, deleteStaffStocks, adjustStockQuantity } = useStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [activeTab, setActiveTab] = useState<'all' | 'safe' | 'warning' | 'danger'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'detail' | 'edit'>('detail');
  const [selectedItem, setSelectedItem] = useState<StaffStockItem | null>(null);
  const [formData, setFormData] = useState<Partial<StaffStockItem>>({});

  // Quick adjust modal
  const [adjustModalItem, setAdjustModalItem] = useState<StaffStockItem | null>(null);
  const [adjustDelta, setAdjustDelta] = useState<number>(1);
  const [adjustAction, setAdjustAction] = useState<'add' | 'subtract'>('add');

  // Derive categories for filter
  const categories = Array.from(new Set(staffStocks.map(s => s.category)));

  // Helper to determine status
  const getStockStatus = (item: StaffStockItem) => {
    if (item.quantity === 0) return { label: 'Habis', type: 'danger', variant: 'destructive' as const, color: 'text-red-700 bg-red-50 border-red-200' };
    if (item.quantity <= item.minStock) return { label: 'Menipis', type: 'warning', variant: 'warning' as const, color: 'text-amber-800 bg-amber-50 border-amber-200' };
    return { label: 'Aman', type: 'safe', variant: 'success' as const, color: 'text-emerald-800 bg-emerald-50 border-emerald-200' };
  };

  // KPI Statistics
  const totalItemsCount = staffStocks.length;
  const totalUnits = staffStocks.reduce((sum, item) => sum + item.quantity, 0);
  const safeStockCount = staffStocks.filter(item => item.quantity > item.minStock).length;
  const lowStockCount = staffStocks.filter(item => item.quantity > 0 && item.quantity <= item.minStock).length;
  const outOfStockCount = staffStocks.filter(item => item.quantity === 0).length;

  // Filter items based on search, category filter, and tab
  const filteredItems = staffStocks.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.location && item.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.id && item.id.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = categoryFilter ? item.category === categoryFilter : true;
    
    let matchesTab = true;
    if (activeTab === 'safe') {
      matchesTab = item.quantity > item.minStock;
    } else if (activeTab === 'warning') {
      matchesTab = item.quantity > 0 && item.quantity <= item.minStock;
    } else if (activeTab === 'danger') {
      matchesTab = item.quantity === 0;
    }

    return matchesSearch && matchesCategory && matchesTab;
  });

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredItems.length && filteredItems.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredItems.map(item => item.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleDeleteSelected = () => {
    setDeleteItemId(null);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteSingle = (id: string) => {
    setDeleteItemId(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (deleteItemId) {
      deleteStaffStock(deleteItemId);
      setDeleteItemId(null);
      toast("Data stok berhasil dihapus.", "success");
    } else {
      deleteStaffStocks(Array.from(selectedIds));
      setSelectedIds(new Set());
      toast("Data stok berhasil dihapus.", "success");
    }
  };

  const openAddModal = () => {
    setSelectedItem(null);
    setModalMode('edit');
    setFormData({
      name: '',
      category: 'Perlengkapan Jamaah',
      quantity: 10,
      minStock: 5,
      unit: 'Pcs',
      location: 'Gudang Utama Jakarta',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const openDetailModal = (item: StaffStockItem) => {
    setSelectedItem(item);
    setFormData({ ...item });
    setModalMode('detail');
    setIsModalOpen(true);
  };

  const openEditModal = (item: StaffStockItem) => {
    setSelectedItem(item);
    setFormData({ ...item });
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleSaveItem = () => {
    if (!formData.name?.trim()) {
      toast("Nama barang wajib diisi.", "error");
      return;
    }

    const qty = Number(formData.quantity) >= 0 ? Number(formData.quantity) : 0;
    const minStk = Number(formData.minStock) >= 0 ? Number(formData.minStock) : 0;

    if (selectedItem) {
      updateStaffStock(selectedItem.id, {
        name: formData.name,
        category: formData.category || 'Lainnya',
        quantity: qty,
        minStock: minStk,
        unit: formData.unit || 'Pcs',
        location: formData.location || 'Gudang Utama',
        notes: formData.notes || '',
      });
      toast("Data barang berhasil diperbarui.", "success");
    } else {
      addStaffStock({
        id: `STK-${Date.now().toString().slice(-4)}`,
        name: formData.name,
        category: formData.category || 'Perlengkapan Jamaah',
        quantity: qty,
        minStock: minStk,
        unit: formData.unit || 'Pcs',
        location: formData.location || 'Gudang Utama',
        lastUpdated: new Date().toISOString().split('T')[0],
        notes: formData.notes || '',
      });
      toast("Barang baru berhasil ditambahkan ke stok.", "success");
    }
    setIsModalOpen(false);
  };

  const handleQuickAdjust = (id: string, delta: number, itemName: string) => {
    adjustStockQuantity(id, delta);
    if (delta > 0) {
      toast(`Stok "${itemName}" ditambah +${delta}`, "success");
    } else {
      toast(`Stok "${itemName}" dikurangi ${delta}`, "info");
    }
  };

  const handleSaveAdjustModal = () => {
    if (!adjustModalItem) return;
    const finalDelta = adjustAction === 'add' ? adjustDelta : -adjustDelta;
    adjustStockQuantity(adjustModalItem.id, finalDelta);
    toast(`Stok "${adjustModalItem.name}" berhasil disesuaikan (${adjustAction === 'add' ? '+' : '-'}${adjustDelta}).`, "success");
    setAdjustModalItem(null);
  };

  const handleExportExcel = () => {
    const exportData = filteredItems.map(item => {
      const status = item.quantity === 0 ? 'Habis' : item.quantity <= item.minStock ? 'Menipis' : 'Aman';
      return {
        'Kode/ID': item.id,
        'Nama Barang': item.name,
        'Kategori': item.category,
        'Stok Fisik': item.quantity,
        'Batas Min Stok': item.minStock,
        'Satuan': item.unit,
        'Status Stok': status,
        'Lokasi Gudang': item.location || '-',
        'Tanggal Terakhir Update': item.lastUpdated || '-',
        'Catatan / Spesifikasi': item.notes || '-'
      };
    });
    exportToExcel(exportData, 'Laporan_Monitoring_Stok', 'Laporan Monitoring Stok Perlengkapan & Logistik - DNA Tour');
  };

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / itemsPerPage));
  const paginatedData = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-5 pb-10">
      {/* Top Banner Header */}
      <div className="bg-white rounded-2xl border border-gray-200/90 p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 leading-tight">
              Monitoring Stok & Inventaris
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 font-normal mt-1 max-w-2xl">
              Pantau dan kelola ketersediaan perlengkapan jamaah, seragam staf, serta logistik operasional.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            <Button 
              variant="outline" 
              onClick={handleExportExcel}
              className="text-xs h-9 font-semibold text-gray-700 border-gray-200 hover:bg-gray-50 flex-1 sm:flex-none justify-center px-3.5 rounded-xl cursor-pointer active:scale-95 transition-all duration-200"
            >
              <Download className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
              Excel
            </Button>

            <Button 
              onClick={openAddModal} 
              className="bg-[#740A03] hover:bg-[#580802] text-white font-semibold text-xs h-9 px-4 rounded-xl shadow-2xs flex-1 sm:flex-none justify-center cursor-pointer active:scale-95 transition-all duration-200"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Tambah Barang
            </Button>
          </div>
        </div>
      </div>

      {/* Interactive Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Jenis Barang */}
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
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Total Item Barang</p>
                <p className="text-2xl font-black tracking-tight text-gray-900">
                  {totalItemsCount} Variasi
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#edf5ff] text-[#2563eb] flex items-center justify-center shrink-0 shadow-2xs">
                <Boxes className="w-5 h-5" />
              </div>
            </div>
            <p className="text-xs text-gray-500 font-medium flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-blue-600" />
              Total {totalUnits.toLocaleString('id-ID')} unit fisik stok
            </p>
          </CardContent>
        </Card>

        {/* Card 2: Stok Aman */}
        <Card 
          onClick={() => { setActiveTab('safe'); setCurrentPage(1); }}
          className={`rounded-2xl border bg-white shadow-2xs cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.98] ${
            activeTab === 'safe' 
              ? 'border-emerald-600 ring-2 ring-emerald-600/20 bg-emerald-50/20' 
              : 'border-gray-200/80 hover:border-gray-300'
          }`}
        >
          <CardContent className="p-5 flex flex-col justify-between h-full gap-3">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Stok Aman</p>
                <p className="text-2xl font-black tracking-tight text-emerald-800">
                  {safeStockCount} Barang
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 shadow-2xs">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <p className="text-xs text-emerald-700 font-medium">
              Stok berada di atas batas minimum
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Stok Menipis */}
        <Card 
          onClick={() => { setActiveTab('warning'); setCurrentPage(1); }}
          className={`rounded-2xl border bg-white shadow-2xs cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.98] ${
            activeTab === 'warning' 
              ? 'border-amber-600 ring-2 ring-amber-600/20 bg-amber-50/20' 
              : 'border-gray-200/80 hover:border-gray-300'
          }`}
        >
          <CardContent className="p-5 flex flex-col justify-between h-full gap-3">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Stok Menipis</p>
                <p className="text-2xl font-black tracking-tight text-amber-800">
                  {lowStockCount} Barang
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#fdf6e7] text-[#c27803] flex items-center justify-center shrink-0 shadow-2xs">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
            <p className="text-xs text-amber-700 font-medium">
              &le; Batas alert minimum stok
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Stok Habis */}
        <Card 
          onClick={() => { setActiveTab('danger'); setCurrentPage(1); }}
          className={`rounded-2xl border bg-white shadow-2xs cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.98] ${
            activeTab === 'danger' 
              ? 'border-red-600 ring-2 ring-red-600/20 bg-red-50/20' 
              : 'border-gray-200/80 hover:border-gray-300'
          }`}
        >
          <CardContent className="p-5 flex flex-col justify-between h-full gap-3">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-red-600 uppercase tracking-wider">Stok Habis</p>
                <p className="text-2xl font-black tracking-tight text-red-700">
                  {outOfStockCount} Barang
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0 shadow-2xs">
                <XCircle className="w-5 h-5" />
              </div>
            </div>
            <p className="text-xs text-red-600 font-medium">
              Jumlah 0, perlu pengadaan segera
            </p>
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
              <span>Semua Stok Barang</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold transition-all duration-200 ${
                activeTab === 'all' 
                  ? 'bg-emerald-100 text-emerald-800 scale-105' 
                  : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200/80'
              }`}>
                {staffStocks.length}
              </span>
              {activeTab === 'all' && (
                <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-emerald-600 rounded-full animate-tab-indicator" />
              )}
            </button>
            
            <button 
              onClick={() => { setActiveTab('safe'); setCurrentPage(1); }}
              className={`relative pb-3 pt-2 px-2.5 text-xs sm:text-sm transition-all duration-200 whitespace-nowrap cursor-pointer flex items-center gap-1.5 select-none rounded-t-lg group active:scale-[0.96] ${
                activeTab === 'safe' 
                  ? 'font-bold text-emerald-800' 
                  : 'font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50/80'
              }`}
            >
              <span>Stok Aman</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold transition-all duration-200 ${
                activeTab === 'safe' 
                  ? 'bg-emerald-100 text-emerald-800 scale-105' 
                  : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200/80'
              }`}>
                {safeStockCount}
              </span>
              {activeTab === 'safe' && (
                <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-emerald-600 rounded-full animate-tab-indicator" />
              )}
            </button>

            <button 
              onClick={() => { setActiveTab('warning'); setCurrentPage(1); }}
              className={`relative pb-3 pt-2 px-2.5 text-xs sm:text-sm transition-all duration-200 whitespace-nowrap cursor-pointer flex items-center gap-1.5 select-none rounded-t-lg group active:scale-[0.96] ${
                activeTab === 'warning' 
                  ? 'font-bold text-amber-800' 
                  : 'font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50/80'
              }`}
            >
              <span>Stok Menipis</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold transition-all duration-200 ${
                activeTab === 'warning' 
                  ? 'bg-amber-100 text-amber-800 scale-105' 
                  : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200/80'
              }`}>
                {lowStockCount}
              </span>
              {activeTab === 'warning' && (
                <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-amber-600 rounded-full animate-tab-indicator" />
              )}
            </button>

            <button 
              onClick={() => { setActiveTab('danger'); setCurrentPage(1); }}
              className={`relative pb-3 pt-2 px-2.5 text-xs sm:text-sm transition-all duration-200 whitespace-nowrap cursor-pointer flex items-center gap-1.5 select-none rounded-t-lg group active:scale-[0.96] ${
                activeTab === 'danger' 
                  ? 'font-bold text-red-800' 
                  : 'font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50/80'
              }`}
            >
              <span>Stok Habis</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold transition-all duration-200 ${
                activeTab === 'danger' 
                  ? 'bg-red-100 text-red-800 scale-105' 
                  : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200/80'
              }`}>
                {outOfStockCount}
              </span>
              {activeTab === 'danger' && (
                <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-red-600 rounded-full animate-tab-indicator" />
              )}
            </button>
          </div>
        </div>

        {/* Search & Actions Bar */}
        <div className="p-4 sm:p-5 border-b border-gray-100 bg-gray-50/40">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3.5">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input 
                placeholder="Cari nama barang, kategori, kode, atau gudang..." 
                className="pl-10 h-10 bg-white border-gray-200 rounded-xl text-xs focus:border-emerald-500 focus:ring-emerald-500/20 font-normal"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              />
            </div>

            <div className="flex items-center gap-2.5 w-full md:w-auto">
              {selectedIds.size > 0 && (
                <Button 
                  onClick={handleDeleteSelected} 
                  variant="outline" 
                  className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 font-semibold text-xs h-10 px-4 rounded-xl flex-1 md:flex-none cursor-pointer active:scale-95 transition-all duration-200"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                  Hapus ({selectedIds.size})
                </Button>
              )}
              <Button 
                variant={showFilters ? "default" : "outline"} 
                className={`font-semibold text-xs h-10 px-4 rounded-xl flex-1 md:flex-none transition-all cursor-pointer active:scale-95 duration-200 ${
                  showFilters ? "bg-[#740A03] hover:bg-[#580802] text-white shadow-2xs" : "border-gray-200 text-gray-700 hover:bg-gray-50"
                }`} 
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-3.5 h-3.5 mr-1.5" />
                Filter Kategori
              </Button>
            </div>
          </div>

          {showFilters && (
            <div className="pt-4 mt-4 border-t border-gray-200/70 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
              <div className="flex flex-col space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Filter Kategori</label>
                <select 
                  className="flex h-10 w-full rounded-xl border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/20 hover:bg-white cursor-pointer"
                  value={categoryFilter}
                  onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
                >
                  <option value="">Semua Kategori</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-gray-500 hover:text-gray-900 w-full sm:w-auto h-10 rounded-xl cursor-pointer active:scale-95 transition-all duration-200"
                  onClick={() => {
                    setSearchTerm('');
                    setCategoryFilter('');
                    setActiveTab('all');
                    setCurrentPage(1);
                  }}
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-2" />
                  Reset Filter
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Table Content */}
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="min-w-[900px]">
              <TableHeader>
                <TableRow className="bg-gray-50/70 hover:bg-gray-50/70">
                  <TableHead className="w-12 text-center pl-4">
                    <Checkbox 
                      checked={selectedIds.size > 0 && selectedIds.size === filteredItems.length}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Pilih semua"
                    />
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-gray-500 uppercase tracking-wider h-11">
                    Nama Barang
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-gray-500 uppercase tracking-wider h-11">
                    Kategori
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-gray-500 uppercase tracking-wider h-11 text-center">
                    Stok Saat Ini
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-gray-500 uppercase tracking-wider h-11 text-center whitespace-nowrap">
                    Min Stok
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-gray-500 uppercase tracking-wider h-11">
                    Satuan
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-gray-500 uppercase tracking-wider h-11">
                    Gudang Lokasi
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-gray-500 uppercase tracking-wider h-11">
                    Status
                  </TableHead>
                  <TableHead className="text-right pr-6 text-[11px] font-bold text-gray-500 uppercase tracking-wider h-11 whitespace-nowrap min-w-[120px]">
                    Aksi
                  </TableHead>
                </TableRow>
              </TableHeader>
              
              <TableBody key={activeTab} className="divide-y divide-gray-100 animate-fade-in">
                {paginatedData.map((item) => {
                  const statusInfo = getStockStatus(item);
                  const stockRatio = item.minStock > 0 ? Math.min(100, Math.round((item.quantity / (item.minStock * 2)) * 100)) : 100;
                  
                  return (
                    <TableRow key={item.id} className={selectedIds.has(item.id) ? "bg-emerald-50/40" : "hover:bg-gray-50/60"}>
                      <TableCell className="pl-4">
                        <Checkbox 
                          checked={selectedIds.has(item.id)}
                          onCheckedChange={() => toggleSelect(item.id)}
                          aria-label={`Pilih ${item.name}`}
                        />
                      </TableCell>

                      <TableCell className="font-medium text-gray-900 py-3.5">
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900 text-sm hover:text-emerald-700 cursor-pointer" onClick={() => openDetailModal(item)}>
                            {item.name}
                          </span>
                          {item.notes && (
                            <span className="text-[11px] text-gray-500 truncate max-w-[240px] mt-0.5" title={item.notes}>
                              {item.notes}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <span className={cn(
                          "inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap",
                          "bg-slate-50 text-slate-700 border border-slate-200/80 shadow-2xs"
                        )}>
                          {item.category}
                        </span>
                      </TableCell>

                      {/* Stok Saat Ini with quick tactile +/- buttons */}
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button 
                            type="button"
                            onClick={() => handleQuickAdjust(item.id, -1, item.name)}
                            disabled={item.quantity <= 0}
                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-150 active:scale-90 disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-gray-400 cursor-pointer disabled:cursor-not-allowed"
                            title="Kurangi 1 unit"
                          >
                            <MinusCircle className="w-4 h-4" />
                          </button>

                          <div className="w-12 text-center">
                            <span className={`text-base font-black tracking-tight ${
                              item.quantity === 0 ? 'text-red-600' : item.quantity <= item.minStock ? 'text-amber-600' : 'text-gray-900'
                            }`}>
                              {item.quantity}
                            </span>
                          </div>

                          <button 
                            type="button"
                            onClick={() => handleQuickAdjust(item.id, 1, item.name)}
                            className="p-1 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all duration-150 active:scale-90 cursor-pointer"
                            title="Tambah 1 unit"
                          >
                            <PlusCircle className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Visual stock meter bar */}
                        <div className="w-20 bg-gray-200/80 h-1.5 rounded-full mx-auto mt-1 overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-300 ${
                              item.quantity === 0 ? 'bg-red-500' : item.quantity <= item.minStock ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${item.quantity === 0 ? 0 : Math.max(10, stockRatio)}%` }}
                          />
                        </div>
                      </TableCell>

                      {/* Min Stok */}
                      <TableCell className="text-center font-semibold text-gray-700">
                        <span className="px-2 py-0.5 bg-gray-50 border border-gray-200 rounded-md font-mono text-xs text-gray-600">
                          {item.minStock}
                        </span>
                      </TableCell>

                      <TableCell className="text-gray-600 text-xs font-medium">{item.unit}</TableCell>

                      <TableCell className="text-gray-600 text-xs">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span className="font-medium text-gray-700 truncate max-w-[140px]">{item.location || 'Gudang Utama'}</span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge variant={statusInfo.variant} className="font-semibold text-[11px] shadow-2xs">
                          {statusInfo.label}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right pr-6">
                        <div className="flex items-center justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg cursor-pointer active:scale-95 transition-all duration-200"
                            onClick={() => openDetailModal(item)}
                            title="Lihat Detail Barang"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-gray-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg cursor-pointer active:scale-95 transition-all duration-200"
                            onClick={() => openEditModal(item)}
                            title="Edit Barang"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer active:scale-95 transition-all duration-200"
                            onClick={() => handleDeleteSingle(item.id)}
                            title="Hapus Barang"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}

                {filteredItems.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="h-44 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Boxes className="w-9 h-9 text-gray-300" />
                        <p className="font-bold text-gray-700 text-sm">Tidak ada data barang yang sesuai.</p>
                        <p className="text-xs text-gray-400">Coba ubah kata kunci pencarian atau bersihkan filter.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Footer */}
          <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white">
            <span className="text-xs font-medium text-gray-500">
              Menampilkan <span className="font-bold text-gray-900">{filteredItems.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}</span> - <span className="font-bold text-gray-900">{Math.min(currentPage * itemsPerPage, filteredItems.length)}</span> dari <span className="font-bold text-gray-900">{filteredItems.length}</span> barang stok
            </span>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 sm:flex-none text-xs rounded-xl cursor-pointer active:scale-95 transition-all duration-200" 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                Sebelumnya
              </Button>
              <div className="flex items-center px-2 text-xs font-semibold text-gray-700">
                {currentPage} / {totalPages}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 sm:flex-none text-xs rounded-xl cursor-pointer active:scale-95 transition-all duration-200" 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                disabled={currentPage === totalPages}
              >
                Selanjutnya
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>      {/* Detail / Edit Dialog Modal with Uniform Top Pill Tabs and Registration Form Style */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent hideClose className="w-[95vw] max-w-2xl sm:w-full max-h-[92vh] bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border-0 overflow-y-auto hide-scrollbar">
          {/* Top Bar Header with Tabs */}
          <div className="flex justify-between items-center pb-5 border-b border-gray-100 mb-6">
            <div className="flex items-center gap-2.5">
              {selectedItem ? (
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
                    Data Barang
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
                  Tambah Barang
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

          {/* TAB 1: DATA BARANG (DETAIL) */}
          {modalMode === 'detail' && (
            (() => {
              const activeItem = selectedItem || staffStocks[0];
              const statusInfo = activeItem ? getStockStatus(activeItem) : { label: 'Aman', type: 'safe' };

              return (
                <div className="space-y-7 animate-fade-in text-left">
                  {/* Card 1: Informasi Utama & Kategori Barang */}
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-3">
                      Informasi Utama & Kategori Barang
                    </h2>

                    <div className="bg-white border border-[#cbd5e1] rounded-3xl overflow-hidden divide-y divide-[#e2e8f0] shadow-2xs">
                      <div className="flex items-center justify-between py-3.5 sm:py-4 px-5 sm:px-6">
                        <div className="flex items-center gap-3.5 text-gray-700 text-sm font-medium">
                          <Package className="w-4 h-4 text-[#782820] shrink-0" />
                          <span>Nama Barang</span>
                        </div>
                        <span className="font-bold text-gray-900 text-sm text-right">
                          {activeItem?.name || 'Kain Ihram Pria Standard'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between py-3.5 sm:py-4 px-5 sm:px-6">
                        <div className="flex items-center gap-3.5 text-gray-700 text-sm font-medium">
                          <Boxes className="w-4 h-4 text-[#782820] shrink-0" />
                          <span>Kategori Barang</span>
                        </div>
                        <span className="font-bold text-gray-900 text-sm text-right">
                          {activeItem?.category || 'Perlengkapan Jamaah'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between py-3.5 sm:py-4 px-5 sm:px-6">
                        <div className="flex items-center gap-3.5 text-gray-700 text-sm font-medium">
                          <SlidersHorizontal className="w-4 h-4 text-[#782820] shrink-0" />
                          <span>Satuan Unit</span>
                        </div>
                        <span className="font-bold text-gray-900 text-sm text-right">
                          {activeItem?.unit || 'Set'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between py-3.5 sm:py-4 px-5 sm:px-6">
                        <div className="flex items-center gap-3.5 text-gray-700 text-sm font-medium">
                          <CheckCircle2 className="w-4 h-4 text-[#782820] shrink-0" />
                          <span>Status Ketersediaan</span>
                        </div>
                        <span className="font-bold text-sm text-right">
                          {statusInfo.type === 'safe' ? (
                            <span className="text-[#00a859] font-bold">Stok Aman ({activeItem?.quantity || 0} {activeItem?.unit || 'Pcs'})</span>
                          ) : statusInfo.type === 'warning' ? (
                            <span className="text-amber-700 font-bold">Stok Menipis ({activeItem?.quantity || 0} {activeItem?.unit || 'Pcs'})</span>
                          ) : (
                            <span className="text-red-600 font-bold">Stok Habis (0 {activeItem?.unit || 'Pcs'})</span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Rincian Kuantitas & Lokasi Gudang */}
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-3">
                      Rincian Kuantitas & Lokasi Gudang
                    </h2>

                    <div className="bg-white border border-[#cbd5e1] rounded-3xl overflow-hidden divide-y divide-[#e2e8f0] shadow-2xs">
                      <div className="flex items-center justify-between py-3.5 sm:py-4 px-5 sm:px-6">
                        <div className="flex items-center gap-3.5 text-gray-700 text-sm font-medium">
                          <Package className="w-4 h-4 text-[#782820] shrink-0" />
                          <span>Stok Fisik Saat Ini</span>
                        </div>
                        <span className="font-black text-gray-900 text-base text-right">
                          {activeItem?.quantity || 0} {activeItem?.unit || 'Pcs'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between py-3.5 sm:py-4 px-5 sm:px-6">
                        <div className="flex items-center gap-3.5 text-gray-700 text-sm font-medium">
                          <AlertTriangle className="w-4 h-4 text-[#782820] shrink-0" />
                          <span>Batas Minimum Stok (Alert)</span>
                        </div>
                        <span className="font-bold text-gray-900 text-sm text-right">
                          {activeItem?.minStock || 0} {activeItem?.unit || 'Pcs'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between py-3.5 sm:py-4 px-5 sm:px-6">
                        <div className="flex items-center gap-3.5 text-gray-700 text-sm font-medium">
                          <MapPin className="w-4 h-4 text-[#782820] shrink-0" />
                          <span>Lokasi Penyimpanan / Gudang</span>
                        </div>
                        <span className="font-bold text-gray-900 text-sm text-right">
                          {activeItem?.location || 'Gudang Utama Jakarta'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between py-3.5 sm:py-4 px-5 sm:px-6">
                        <div className="flex items-center gap-3.5 text-gray-700 text-sm font-medium">
                          <RefreshCw className="w-4 h-4 text-[#782820] shrink-0" />
                          <span>Terakhir Diperbarui</span>
                        </div>
                        <span className="font-bold text-gray-900 text-sm text-right">
                          {activeItem?.lastUpdated || '2026-08-20'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between py-3.5 sm:py-4 px-5 sm:px-6">
                        <div className="flex items-center gap-3.5 text-gray-700 text-sm font-medium">
                          <Info className="w-4 h-4 text-[#782820] shrink-0" />
                          <span>Catatan Tambahan / Spesifikasi</span>
                        </div>
                        <span className="font-medium text-gray-700 text-xs sm:text-sm text-right max-w-[280px]">
                          {activeItem?.notes || 'Kualitas premium katun tebal & nyaman digunakan'}
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
            })()
          )}

          {/* TAB 2: FORM EDIT (Exact Match to Registration Form Style) */}
          {modalMode === 'edit' && (
            <div className="space-y-6 animate-fade-in text-left">
              {/* Section 1: INFORMASI UTAMA & KATEGORI BARANG */}
              <div className="bg-white border border-[#cbd5e1] rounded-3xl p-5 sm:p-7 shadow-2xs">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-7 h-7 rounded-lg border border-gray-300 text-gray-800 bg-white flex items-center justify-center text-xs font-bold font-mono shadow-2xs">
                    1
                  </div>
                  <h3 className="text-base sm:text-[17px] font-black text-gray-900 uppercase tracking-wide">
                    INFORMASI UTAMA & KATEGORI BARANG
                  </h3>
                </div>

                <div className="space-y-4">
                  {/* NAMA BARANG */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 items-center">
                    <label className="sm:col-span-4 text-xs sm:text-[13px] font-bold text-gray-600 uppercase tracking-wider">
                      NAMA BARANG *
                    </label>
                    <div className="sm:col-span-8">
                      <Input 
                        value={formData.name || ''} 
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                        placeholder="Cth. Kain Ihram Pria Standard" 
                        className="h-12 sm:h-13 rounded-2xl border-gray-300 bg-white text-base font-bold text-gray-900 placeholder:text-gray-400 placeholder:font-normal px-4 sm:px-5 focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859]"
                      />
                    </div>
                  </div>

                  {/* KATEGORI BARANG */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 items-center">
                    <label className="sm:col-span-4 text-xs sm:text-[13px] font-bold text-gray-600 uppercase tracking-wider">
                      KATEGORI BARANG *
                    </label>
                    <div className="sm:col-span-8">
                      <select
                        value={formData.category || 'Perlengkapan Jamaah'}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="h-12 sm:h-13 w-full rounded-2xl border border-gray-300 bg-white px-4 sm:px-5 text-base font-bold text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859] cursor-pointer"
                      >
                        <option value="Perlengkapan Jamaah">Perlengkapan Jamaah</option>
                        <option value="Seragam Staf">Seragam Staf</option>
                        <option value="Peralatan Operasional">Peralatan Operasional</option>
                        <option value="Dokumen & Identitas">Dokumen & Identitas</option>
                        <option value="Kesehatan">Kesehatan</option>
                        <option value="Lainnya">Lainnya</option>
                      </select>
                    </div>
                  </div>

                  {/* SATUAN UNIT */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 items-center">
                    <label className="sm:col-span-4 text-xs sm:text-[13px] font-bold text-gray-600 uppercase tracking-wider">
                      SATUAN UNIT *
                    </label>
                    <div className="sm:col-span-8">
                      <Input 
                        value={formData.unit || ''} 
                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })} 
                        placeholder="Cth. Pcs, Set, Unit, Box, Pasang" 
                        className="h-12 sm:h-13 rounded-2xl border-gray-300 bg-white text-base font-bold text-gray-900 placeholder:text-gray-400 placeholder:font-normal px-4 sm:px-5 focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: RINCIAN KUANTITAS & LOKASI GUDANG */}
              <div className="bg-white border border-[#cbd5e1] rounded-3xl p-5 sm:p-7 shadow-2xs">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-7 h-7 rounded-lg border border-gray-300 text-gray-800 bg-white flex items-center justify-center text-xs font-bold font-mono shadow-2xs">
                    2
                  </div>
                  <h3 className="text-base sm:text-[17px] font-black text-gray-900 uppercase tracking-wide">
                    RINCIAN KUANTITAS & LOKASI GUDANG
                  </h3>
                </div>

                <div className="space-y-4">
                  {/* STOK FISIK SAAT INI */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 items-center">
                    <label className="sm:col-span-4 text-xs sm:text-[13px] font-bold text-gray-600 uppercase tracking-wider">
                      STOK FISIK SAAT INI *
                    </label>
                    <div className="sm:col-span-8">
                      <Input 
                        type="number"
                        min="0"
                        value={formData.quantity ?? 0} 
                        onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })} 
                        placeholder="0" 
                        className="h-12 sm:h-13 rounded-2xl border-gray-300 bg-white text-base font-bold text-gray-900 placeholder:text-gray-400 placeholder:font-normal px-4 sm:px-5 focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859]"
                      />
                    </div>
                  </div>

                  {/* BATAS MINIMUM STOK */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 items-center">
                    <label className="sm:col-span-4 text-xs sm:text-[13px] font-bold text-gray-600 uppercase tracking-wider">
                      BATAS MINIMUM STOK *
                    </label>
                    <div className="sm:col-span-8">
                      <Input 
                        type="number"
                        min="0"
                        value={formData.minStock ?? 5} 
                        onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value) || 0 })} 
                        placeholder="5" 
                        className="h-12 sm:h-13 rounded-2xl border-gray-300 bg-white text-base font-bold text-gray-900 placeholder:text-gray-400 placeholder:font-normal px-4 sm:px-5 focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859]"
                      />
                    </div>
                  </div>

                  {/* LOKASI PENYIMPANAN / GUDANG */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 items-center">
                    <label className="sm:col-span-4 text-xs sm:text-[13px] font-bold text-gray-600 uppercase tracking-wider">
                      LOKASI PENYIMPANAN
                    </label>
                    <div className="sm:col-span-8">
                      <Input 
                        value={formData.location || ''} 
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })} 
                        placeholder="Cth. Gudang Utama Jakarta, Gudang Makkah" 
                        className="h-12 sm:h-13 rounded-2xl border-gray-300 bg-white text-base font-bold text-gray-900 placeholder:text-gray-400 placeholder:font-normal px-4 sm:px-5 focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859]"
                      />
                    </div>
                  </div>

                  {/* CATATAN TAMBAHAN */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 items-center">
                    <label className="sm:col-span-4 text-xs sm:text-[13px] font-bold text-gray-600 uppercase tracking-wider">
                      CATATAN / SPESIFIKASI
                    </label>
                    <div className="sm:col-span-8">
                      <Input 
                        value={formData.notes || ''} 
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })} 
                        placeholder="Cth. Bahan premium, ukuran campur L/XL" 
                        className="h-12 sm:h-13 rounded-2xl border-gray-300 bg-white text-base font-bold text-gray-900 placeholder:text-gray-400 placeholder:font-normal px-4 sm:px-5 focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <Button 
                  variant="outline" 
                  onClick={() => setIsModalOpen(false)} 
                  className="h-12 rounded-2xl px-7 font-bold text-gray-800 border-gray-300 hover:bg-gray-50 text-base cursor-pointer shadow-2xs"
                >
                  Batal
                </Button>
                <Button 
                  onClick={handleSaveItem} 
                  className="h-12 rounded-2xl px-8 font-bold text-white bg-[#00a859] hover:bg-[#008f4c] text-base cursor-pointer shadow-2xs"
                >
                  {selectedItem ? 'Simpan Perubahan' : 'Simpan Data Barang'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <ConfirmDeleteDialog 
        isOpen={isDeleteDialogOpen} 
        onClose={() => setIsDeleteDialogOpen(false)} 
        onConfirm={confirmDelete}
        itemCount={deleteItemId ? 1 : selectedIds.size}
      />
    </div>
  );
}
