import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Trash2, RefreshCcw, AlertTriangle, FileBox, ShieldAlert, ChevronLeft, ChevronRight, Search, X, Clock, Calendar, Loader2 } from 'lucide-react';
import { toast } from '@/lib/toast';
import { useNavigate } from 'react-router-dom';
import { trashService, TrashItemBackend, TrashResponse } from '@/core/services/trashService';

export default function Trash() {
  const navigate = useNavigate();

  const [filter, setFilter] = useState<'all' | 'pendaftar' | 'jamaah'>('all');
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [items, setItems] = useState<TrashItemBackend[]>([]);
  const [summary, setSummary] = useState<TrashResponse['summary']>({
    total: 0,
    total_pendaftar: 0,
    total_jamaah: 0,
    total_warning: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const fetchTrash = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await trashService.getTrashItems();
      if (response && response.data) {
        setItems(response.data);
        if (response.summary) {
          setSummary(response.summary);
        }
      } else {
        setItems([]);
      }
    } catch (err: any) {
      console.error("Gagal mengambil data riwayat hapus:", err);
      toast(err?.message || "Gagal memuat riwayat hapus dari server.", "error");
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrash();
  }, [fetchTrash]);

  const handleRestore = async (item: TrashItemBackend) => {
    if (restoringId) return;
    setRestoringId(item.id);
    try {
      const res = await trashService.restoreTrashItem(item.type_key, item.original_id);
      toast(res.message || `${item.name} berhasil dipulihkan.`, "success");
      await fetchTrash();
    } catch (err: any) {
      console.error("Gagal mengembalikan data:", err);
      toast(err?.message || "Gagal memulihkan data dari server.", "error");
    } finally {
      setRestoringId(null);
    }
  };

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (filter === 'pendaftar' && item.type_key !== 'pendaftar') return false;
      if (filter === 'jamaah' && item.type_key !== 'jamaah') return false;

      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        return (
          item.name.toLowerCase().includes(query) ||
          item.type.toLowerCase().includes(query) ||
          (item.code && item.code.toLowerCase().includes(query)) ||
          (item.extra_info?.nik && item.extra_info.nik.toLowerCase().includes(query)) ||
          (item.extra_info?.phone && item.extra_info.phone.toLowerCase().includes(query))
        );
      }
      return true;
    });
  }, [items, filter, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / itemsPerPage));
  const paginatedData = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3.5">
            <button
              onClick={() => navigate(-1)}
              className="p-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all border border-gray-200/80 cursor-pointer shrink-0"
              title="Kembali"
              aria-label="Kembali"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">
                  Riwayat Penghapusan
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-red-50 text-red-700 border border-red-200/80 shadow-2xs">
                  <Trash2 className="w-3.5 h-3.5" />
                  Retensi 30 Hari
                </span>
                {summary.total_warning > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-50 text-amber-800 border border-amber-300 shadow-2xs animate-pulse">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    {summary.total_warning} Segera Dipurge
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-gray-500 font-normal mt-0.5">
                Data terhapus disimpan selama 30 hari sebelum dipurge permanen otomatis oleh sistem.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
            <Button
              variant="outline"
              onClick={fetchTrash}
              disabled={isLoading}
              className="h-9 px-4 text-xs font-bold rounded-xl border-gray-200 text-gray-700 bg-white hover:bg-gray-50 cursor-pointer transition-all shadow-2xs"
            >
              <RefreshCcw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
              Segarkan
            </Button>
          </div>
        </div>
      </div>

      {/* Main Filter & List Container */}
      <Card className="overflow-hidden border border-gray-200/80 shadow-2xs bg-white rounded-2xl">
        {/* Navigation Tabs Header */}
        <div className="border-b border-gray-100 bg-white px-4 sm:px-6 pt-3 pb-0">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto scrollbar-none pb-0">
              <button 
                onClick={() => { setFilter('all'); setCurrentPage(1); }}
                className={`relative pb-3 pt-1.5 px-3 text-xs sm:text-sm transition-all duration-200 whitespace-nowrap cursor-pointer flex items-center gap-2 select-none rounded-t-lg group ${
                  filter === 'all' 
                    ? 'font-bold text-[#740A03]' 
                    : 'font-medium text-gray-500 hover:text-gray-900'
                }`}
              >
                <span>Semua Data</span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold transition-all ${
                  filter === 'all' 
                    ? 'bg-red-100 text-[#740A03]' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {items.length}
                </span>
                {filter === 'all' && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#740A03] rounded-full" />
                )}
              </button>
              
              <button 
                onClick={() => { setFilter('pendaftar'); setCurrentPage(1); }}
                className={`relative pb-3 pt-1.5 px-3 text-xs sm:text-sm transition-all duration-200 whitespace-nowrap cursor-pointer flex items-center gap-2 select-none rounded-t-lg group ${
                  filter === 'pendaftar' 
                    ? 'font-bold text-amber-800' 
                    : 'font-medium text-gray-500 hover:text-gray-900'
                }`}
              >
                <span>Pendaftar</span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold transition-all ${
                  filter === 'pendaftar' 
                    ? 'bg-amber-100 text-amber-800' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {items.filter(i => i.type_key === 'pendaftar').length}
                </span>
                {filter === 'pendaftar' && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-amber-600 rounded-full" />
                )}
              </button>

              <button 
                onClick={() => { setFilter('jamaah'); setCurrentPage(1); }}
                className={`relative pb-3 pt-1.5 px-3 text-xs sm:text-sm transition-all duration-200 whitespace-nowrap cursor-pointer flex items-center gap-2 select-none rounded-t-lg group ${
                  filter === 'jamaah' 
                    ? 'font-bold text-blue-800' 
                    : 'font-medium text-gray-500 hover:text-gray-900'
                }`}
              >
                <span>Jamaah</span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold transition-all ${
                  filter === 'jamaah' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {items.filter(i => i.type_key === 'jamaah').length}
                </span>
                {filter === 'jamaah' && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-blue-600 rounded-full" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <Input 
              placeholder="Cari nama, kode registrasi, NIK, telepon..." 
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="pl-9.5 pr-8 h-9.5 rounded-xl border-gray-200 bg-white text-xs sm:text-sm focus:border-[#740A03] focus:ring-1 focus:ring-[#740A03]/20"
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
          <div className="flex items-center gap-3 text-xs text-gray-500 font-medium">
            <span>
              Ditemukan <strong className="text-gray-900">{filteredItems.length}</strong> data terhapus
            </span>
          </div>
        </div>

        {/* Items List */}
        <div className="p-4 sm:p-6 space-y-3 min-h-[380px] bg-gray-50/30">
          {isLoading ? (
            <div className="h-[280px] flex flex-col items-center justify-center text-gray-500 gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-[#740A03]" />
              <p className="text-sm font-semibold">Memuat riwayat penghapusan dari backend...</p>
            </div>
          ) : paginatedData.length > 0 ? (
            paginatedData.map((item) => (
              <div
                key={item.id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group relative bg-white shadow-2xs hover:shadow-xs hover:border-gray-300 ${
                  item.is_warning
                    ? 'border-l-[4px] border-l-amber-500 border-amber-200 bg-amber-50/20'
                    : 'border-l-[3.5px] border-l-red-500 border-t-gray-200/90 border-r-gray-200/90 border-b-gray-200/90'
                }`}
              >
                {/* Left Column: Icon & Content */}
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border transition-transform duration-200 group-hover:scale-105 shadow-2xs ${
                    item.is_warning 
                      ? 'bg-amber-100 text-amber-700 border-amber-300' 
                      : 'bg-red-50 text-red-600 border-red-200'
                  }`}>
                    {item.is_warning ? <AlertTriangle className="w-5 h-5" /> : <FileBox className="w-5 h-5" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className={`text-[10.5px] font-extrabold px-2.5 py-0.5 rounded-md border uppercase tracking-wider shadow-2xs ${
                        item.type_key === 'pendaftar'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-blue-50 text-blue-800 border-blue-200'
                      }`}>
                        {item.type}
                      </span>

                      {item.code && (
                        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200">
                          {item.code}
                        </span>
                      )}

                      <div className="inline-flex items-center gap-1.5 bg-gray-50 border border-gray-200/80 px-2.5 py-0.5 rounded-md text-xs font-medium text-gray-700 shadow-2xs">
                        <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="text-gray-500">Dihapus:</span>
                        <span className="font-semibold text-gray-800">{formatDateTime(item.deleted_at)}</span>
                      </div>

                      <div className="inline-flex items-center gap-1.5 bg-gray-50 border border-gray-200/80 px-2.5 py-0.5 rounded-md text-xs font-medium text-gray-700 shadow-2xs">
                        <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="text-gray-500">Tenggat Purge:</span>
                        <span className="font-semibold text-gray-800">{formatDateTime(item.retention_deadline)}</span>
                      </div>

                      {item.is_warning ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-extrabold bg-red-100 text-red-800 border border-red-300 animate-pulse">
                          <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                          Sisa {item.days_left} hari lagi!
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                          Sisa {item.days_left} hari
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm sm:text-base truncate transition-colors mb-0.5 font-bold text-gray-950">
                      {item.name}
                    </h4>

                    {item.extra_info && (
                      <p className="text-xs text-gray-500 font-normal mt-0.5 space-x-3">
                        {item.extra_info.phone && <span>Telp: <strong className="text-gray-700">{item.extra_info.phone}</strong></span>}
                        {item.extra_info.nik && <span>NIK: <strong className="text-gray-700">{item.extra_info.nik}</strong></span>}
                        {item.extra_info.status && <span>Status: <strong className="text-gray-700">{item.extra_info.status}</strong></span>}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right Column: Actions */}
                <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                  <Button 
                    variant="outline" 
                    className="flex-1 sm:flex-none h-9 text-xs font-bold text-gray-700 border-gray-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 shadow-2xs transition-colors cursor-pointer"
                    onClick={() => handleRestore(item)}
                    disabled={restoringId === item.id}
                  >
                    {restoringId === item.id ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                        Memulihkan...
                      </>
                    ) : (
                      <>
                        <RefreshCcw className="w-3.5 h-3.5 mr-1.5" />
                        Kembalikan
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="h-[280px] flex flex-col items-center justify-center text-gray-400">
              <ShieldAlert className="w-10 h-10 mb-2 text-gray-300" />
              <p className="font-bold text-gray-600">Riwayat Kosong</p>
              <p className="text-xs text-gray-400 mt-1 max-w-sm text-center">
                Tidak ada data yang dihapus saat ini. Data yang dihapus akan disimpan selama 30 hari kalender.
              </p>
            </div>
          )}
        </div>

        {/* Pagination Panel */}
        {totalPages > 0 && (
          <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs sm:text-sm font-medium text-gray-500">
              Menampilkan <span className="font-bold text-gray-900">{((currentPage - 1) * itemsPerPage) + (filteredItems.length > 0 ? 1 : 0)}</span> hingga <span className="font-bold text-gray-900">{Math.min(currentPage * itemsPerPage, filteredItems.length)}</span> dari <span className="font-bold text-gray-900">{filteredItems.length}</span> data
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-8.5 px-3 rounded-xl border-gray-200 text-gray-600 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Sebelumnya
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum = currentPage;
                  if (totalPages <= 5) pageNum = i + 1;
                  else if (currentPage <= 3) pageNum = i + 1;
                  else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                  else pageNum = currentPage - 2 + i;

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center cursor-pointer ${
                        currentPage === pageNum 
                          ? 'bg-red-600 text-white shadow-xs' 
                          : 'text-gray-500 hover:bg-gray-200 hover:text-gray-900'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="h-8.5 px-3 rounded-xl border-gray-200 text-gray-600 cursor-pointer"
              >
                Selanjutnya
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}


