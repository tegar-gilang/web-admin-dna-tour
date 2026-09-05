import React, { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Trash2, RefreshCcw, AlertTriangle, FileBox, ShieldAlert, ChevronLeft, ChevronRight, Search, X, Clock, Target, Inbox, Calendar } from 'lucide-react';
import { toast } from '@/lib/toast';
import { useStore } from '@/core/store';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

export default function Trash() {

// ==========================================
// FITUR: TRASH
// Komponen utama untuk fitur TRASH
// ==========================================

  const navigate = useNavigate();
  const { trashItems, restoreFromTrash, deletePermanently, emptyTrash } = useStore();

  const [filter, setFilter] = useState<'all' | 'jamaah' | 'finance' | 'operational'>('all');
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const handleRestore = (id: string) => {
    restoreFromTrash(id);
    toast("Item berhasil dikembalikan ke sistem.", "success");
  };

  const handlePermanentDelete = (id: string) => {
    deletePermanently(id);
    toast("Item telah dihapus secara permanen.", "success");
  };

  const handleEmptyTrash = () => {
    emptyTrash();
    toast("Semua isi riwayat hapus telah dibersihkan.", "success");
  };

  const filteredItems = useMemo(() => {
    return trashItems.filter(item => {
      if (filter === 'jamaah') {
        if (!['Jamaah', 'Kloter', 'Group Keluarga', 'Alokasi Kamar', 'Penghuni Kamar'].includes(item.type)) return false;
      }
      if (filter === 'finance') {
        if (item.type !== 'Transaksi Kas') return false;
      }
      if (filter === 'operational') {
        if (!['Stok Barang', 'Pembimbing', 'Agenda', 'Laporan SOS', 'Siaran', 'Pengumuman'].includes(item.type)) return false;
      }
      
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        return (
          item.name.toLowerCase().includes(query) ||
          item.type.toLowerCase().includes(query) ||
          (item.reason && item.reason.toLowerCase().includes(query))
        );
      }
      return true;
    });
  }, [trashItems, filter, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / itemsPerPage));
  const paginatedData = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const totalJamaah = trashItems.filter(item => ['Jamaah', 'Kloter', 'Group Keluarga', 'Alokasi Kamar', 'Penghuni Kamar'].includes(item.type)).length;
  const totalFinance = trashItems.filter(item => item.type === 'Transaksi Kas').length;
  const totalOperational = trashItems.filter(item => ['Stok Barang', 'Pembimbing', 'Agenda', 'Laporan SOS', 'Siaran', 'Pengumuman'].includes(item.type)).length;

  return (
    <div className="space-y-6 pb-12 animate-fade-in max-w-7xl mx-auto">
      {/* Header Banner - Modern & Clean */}
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
                  Tong Sampah
                </span>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 font-normal mt-0.5">
                Data yang dihapus akan disimpan di sini sementara sebelum dihapus permanen
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
            <Button
              variant="outline"
              onClick={handleEmptyTrash}
              disabled={trashItems.length === 0}
              className="h-9 px-4 text-xs font-bold rounded-xl border-red-200 text-red-700 bg-red-50 hover:bg-red-100/70 cursor-pointer transition-all shadow-2xs w-full sm:w-auto"
            >
              <AlertTriangle className="w-3.5 h-3.5 mr-1.5" />
              Kosongkan Semua
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
                  {trashItems.length}
                </span>
                {filter === 'all' && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#740A03] rounded-full" />
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
                <span>Jamaah & Kloter</span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold transition-all ${
                  filter === 'jamaah' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {totalJamaah}
                </span>
                {filter === 'jamaah' && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-blue-600 rounded-full" />
                )}
              </button>

              <button 
                onClick={() => { setFilter('finance'); setCurrentPage(1); }}
                className={`relative pb-3 pt-1.5 px-3 text-xs sm:text-sm transition-all duration-200 whitespace-nowrap cursor-pointer flex items-center gap-2 select-none rounded-t-lg group ${
                  filter === 'finance' 
                    ? 'font-bold text-emerald-800' 
                    : 'font-medium text-gray-500 hover:text-gray-900'
                }`}
              >
                <span>Keuangan</span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold transition-all ${
                  filter === 'finance' 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {totalFinance}
                </span>
                {filter === 'finance' && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-emerald-600 rounded-full" />
                )}
              </button>

              <button 
                onClick={() => { setFilter('operational'); setCurrentPage(1); }}
                className={`relative pb-3 pt-1.5 px-3 text-xs sm:text-sm transition-all duration-200 whitespace-nowrap cursor-pointer flex items-center gap-2 select-none rounded-t-lg group ${
                  filter === 'operational' 
                    ? 'font-bold text-amber-800' 
                    : 'font-medium text-gray-500 hover:text-gray-900'
                }`}
              >
                <span>Operasional</span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold transition-all ${
                  filter === 'operational' 
                    ? 'bg-amber-100 text-amber-800' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {totalOperational}
                </span>
                {filter === 'operational' && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-amber-500 rounded-full" />
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
              placeholder="Cari nama, tipe data, alasan hapus..." 
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

        {/* Items List matching Notifications design */}
        <div className="p-4 sm:p-6 space-y-3 min-h-[380px] bg-gray-50/30">
          {paginatedData.length > 0 ? (
            paginatedData.map((item) => (
              <div
                key={item.id}
                className="p-4 sm:p-5 rounded-2xl border transition-all duration-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group relative bg-white border-l-[3.5px] border-l-red-500 border-t-gray-200/90 border-r-gray-200/90 border-b-gray-200/90 shadow-2xs hover:shadow-xs hover:border-gray-300"
              >
                {/* Left Column: Icon & Content */}
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border transition-transform duration-200 group-hover:scale-105 shadow-2xs bg-red-50 text-red-600 border-red-200">
                    <FileBox className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2.5">
                      <span className="text-[10.5px] font-extrabold px-2.5 py-0.5 rounded-md border uppercase tracking-wider shadow-2xs bg-gray-50 text-gray-700 border-gray-200">
                        {item.type}
                      </span>

                      <div className="inline-flex items-center gap-1.5 bg-gray-50 border border-gray-200/80 px-2.5 py-0.5 rounded-md text-xs font-medium text-gray-700 shadow-2xs">
                        <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="font-mono font-bold text-gray-900">Dihapus Pada:</span>
                        <span className="text-gray-600">{item.deletedAt}</span>
                      </div>
                    </div>

                    <h4 className="text-sm sm:text-base truncate transition-colors mb-0.5 font-bold text-gray-950">
                      {item.name}
                    </h4>

                    {item.reason && (
                      <p className="text-xs sm:text-sm line-clamp-2 leading-snug text-red-600 font-medium mt-1">
                        <AlertTriangle className="w-3.5 h-3.5 inline-block mr-1 -mt-0.5" />
                        Alasan: {item.reason}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right Column: Actions */}
                <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                  <Button 
                    variant="outline" 
                    className="flex-1 sm:flex-none h-9 text-xs font-bold text-gray-700 border-gray-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 shadow-2xs transition-colors"
                    onClick={() => handleRestore(item.id)}
                  >
                    <RefreshCcw className="w-3.5 h-3.5 mr-1.5" />
                    Kembalikan
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1 sm:flex-none h-9 text-xs font-bold text-red-700 border-red-200 bg-red-50 hover:bg-red-100 hover:text-red-800 shadow-2xs transition-colors"
                    onClick={() => handlePermanentDelete(item.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                    Hapus Permanen
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="h-[280px] flex flex-col items-center justify-center text-gray-400">
              <ShieldAlert className="w-10 h-10 mb-2 text-gray-300" />
              <p className="font-bold text-gray-600">Riwayat Kosong</p>
              <p className="text-xs text-gray-400 mt-1 max-w-sm text-center">
                Tidak ada data yang cocok dengan kriteria filter saat ini.
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

