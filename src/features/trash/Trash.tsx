import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import {
  Trash2,
  RefreshCcw,
  AlertTriangle,
  FileBox,
  ShieldAlert,
  Loader2,
  Calendar,
  Phone,
  CreditCard,
  User,
  Clock,
  Search
} from 'lucide-react';
import { toast } from '@/lib/toast';
import { trashService, TrashItemData, TrashSummary } from '@/core/services/trashService';

export default function Trash() {
  // Local state untuk data dan filter tampilan
  const [items, setItems] = useState<TrashItemData[]>([]);
  const [summary, setSummary] = useState<TrashSummary>({
    total: 0,
    total_pendaftar: 0,
    total_jamaah: 0,
    total_warning: 0,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('all');

  // State untuk pencegahan double-submission dan loading per-item
  const [processingRestoreId, setProcessingRestoreId] = useState<string | null>(null);
  const [isProcessingBulk, setIsProcessingBulk] = useState<boolean>(false);
  const [isPreparingEmpty, setIsPreparingEmpty] = useState<boolean>(false);

  // Target item khusus untuk fitur Empty All (diambil independen dari filter tampilan)
  const [emptyAllTargets, setEmptyAllTargets] = useState<TrashItemData[]>([]);

  // State untuk Dialog Konfirmasi
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    mode: 'single' | 'empty';
    targetItem?: TrashItemData;
    isSubmitting: boolean;
  }>({
    isOpen: false,
    mode: 'single',
    isSubmitting: false,
  });

  // Request sequencing ref untuk mencegah race condition pada pencarian cepat
  const latestRequestIdRef = useRef<number>(0);

  // Fetch daftar Trash dari backend
  const fetchTrash = useCallback(async (isRefresh = false) => {
    const currentRequestId = ++latestRequestIdRef.current;

    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const res = await trashService.getTrashItems({
        type: filterType !== 'all' ? filterType : undefined,
        q: searchQuery.trim() || undefined,
      });

      // Abaikan jika ada request yang lebih baru telah dipicu
      if (currentRequestId !== latestRequestIdRef.current) {
        return;
      }

      setItems(res.data || []);
      if (res.summary) {
        setSummary(res.summary);
      }
    } catch (err: any) {
      if (currentRequestId === latestRequestIdRef.current) {
        toast(err.message || 'Gagal memuat data Riwayat Penghapusan.', 'error');
      }
    } finally {
      if (currentRequestId === latestRequestIdRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [filterType, searchQuery]);

  // Load awal dan saat filter/pencarian berubah
  useEffect(() => {
    fetchTrash();
  }, [fetchTrash]);

  // Handler Restore
  const handleRestore = async (item: TrashItemData) => {
    if (processingRestoreId || isProcessingBulk || isPreparingEmpty) return;

    setProcessingRestoreId(item.original_id);
    try {
      const res = await trashService.restoreTrashItem(item.type_key, item.original_id);
      toast(res.message || `Data ${item.name} berhasil dipulihkan ke sistem.`, 'success');
      await fetchTrash(true);
    } catch (err: any) {
      toast(err.message || 'Gagal memulihkan data.', 'error');
    } finally {
      setProcessingRestoreId(null);
    }
  };

  // Buka Dialog Hapus Permanen Satu Item
  const openSingleDeleteDialog = (item: TrashItemData) => {
    if (processingRestoreId || isProcessingBulk || isPreparingEmpty) return;
    setConfirmDialog({
      isOpen: true,
      mode: 'single',
      targetItem: item,
      isSubmitting: false,
    });
  };

  // Buka Dialog Kosongkan Semua (Mengambil SELURUH data backend tanpa filter/search)
  const openEmptyTrashDialog = async () => {
    if (processingRestoreId || isProcessingBulk || isPreparingEmpty) return;

    setIsPreparingEmpty(true);
    try {
      // Ambil seluruh data trash tanpa parameter type maupun q
      const res = await trashService.getTrashItems();
      const allItems = res.data || [];

      if (allItems.length === 0) {
        toast('Riwayat penghapusan sudah kosong.', 'info');
        setItems([]);
        if (res.summary) setSummary(res.summary);
        return;
      }

      setEmptyAllTargets(allItems);
      setConfirmDialog({
        isOpen: true,
        mode: 'empty',
        isSubmitting: false,
      });
    } catch (err: any) {
      toast(err.message || 'Gagal menyiapkan data untuk pengosongan riwayat hapus.', 'error');
    } finally {
      setIsPreparingEmpty(false);
    }
  };

  // Tutup Dialog Konfirmasi
  const closeConfirmDialog = () => {
    if (confirmDialog.isSubmitting) return;
    setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
  };

  // Eksekusi Konfirmasi Hapus
  const handleConfirmAction = async () => {
    if (confirmDialog.mode === 'single' && confirmDialog.targetItem) {
      const target = confirmDialog.targetItem;
      setConfirmDialog((prev) => ({ ...prev, isSubmitting: true }));
      try {
        const res = await trashService.deleteTrashPermanently(target.type_key, target.original_id);
        toast(res.message || `Data ${target.name} telah dihapus secara permanen.`, 'success');
        setConfirmDialog({ isOpen: false, mode: 'single', isSubmitting: false });
        await fetchTrash(true);
      } catch (err: any) {
        toast(err.message || 'Gagal menghapus data secara permanen.', 'error');
        setConfirmDialog((prev) => ({ ...prev, isSubmitting: false }));
      }
    } else if (confirmDialog.mode === 'empty') {
      // Gunakan seluruh target yang telah dimuat dari backend secara unfiltered
      const targets = emptyAllTargets;
      if (!targets || targets.length === 0) {
        toast('Tidak ada data riwayat penghapusan untuk dibersihkan.', 'info');
        setConfirmDialog({ isOpen: false, mode: 'empty', isSubmitting: false });
        return;
      }

      setConfirmDialog((prev) => ({ ...prev, isSubmitting: true }));
      setIsProcessingBulk(true);

      try {
        const payloadItems = targets.map((item) => ({
          type: item.type_key,
          id: item.original_id,
        }));

        const res = await trashService.bulkDeleteTrash(payloadItems);
        const { success, failed } = res.summary;

        if (failed === 0) {
          toast(`Semua ${success} data riwayat hapus berhasil dibersihkan permanen.`, 'success');
        } else if (success > 0 && failed > 0) {
          toast(`${success} data berhasil dihapus permanen, namun ${failed} data gagal diproses.`, 'error');
        } else {
          toast(`Gagal mengosongkan riwayat hapus: ${failed} data gagal dihapus.`, 'error');
        }

        setConfirmDialog({ isOpen: false, mode: 'empty', isSubmitting: false });
      } catch (err: any) {
        // Tangani jika terjadi pemutusan batch karena 401 atau 403
        if (err.status === 401 || err.status === 403) {
          toast(err.message || 'Proses dihentikan karena masalah otorisasi.', 'error');
        } else {
          toast(err.message || 'Terjadi kesalahan saat mengosongkan riwayat penghapusan.', 'error');
        }
        setConfirmDialog({ isOpen: false, mode: 'empty', isSubmitting: false });
      } finally {
        setIsProcessingBulk(false);
        // Refresh daftar data sesuai filter aktif pengguna
        await fetchTrash(true);
      }
    }
  };

  // Format tanggal ramah pengguna
  const formatDate = (isoString?: string) => {
    if (!isoString) return '-';
    try {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-6 pb-10 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-2xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <Trash2 className="w-6 h-6 text-red-500" />
            Riwayat Penghapusan
          </h1>
          <p className="text-sm text-gray-500 font-medium mt-1">
            Data yang dihapus akan disimpan di sini sementara sebelum dibersihkan permanen oleh sistem setelah 30 hari.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <Button
            variant="outline"
            className="border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl px-4 h-11 font-medium whitespace-nowrap"
            onClick={() => fetchTrash(true)}
            disabled={isLoading || isRefreshing || isProcessingBulk || isPreparingEmpty}
            title="Refresh Data"
          >
            <RefreshCcw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            variant="outline"
            className="bg-red-50 hover:bg-red-100 text-red-600 border-red-200 hover:text-red-700 shadow-sm rounded-xl px-5 h-11 font-medium whitespace-nowrap"
            onClick={openEmptyTrashDialog}
            disabled={isLoading || isProcessingBulk || isPreparingEmpty || summary.total === 0}
          >
            {isPreparingEmpty ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Menyiapkan...
              </>
            ) : isProcessingBulk ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Mengosongkan...
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4 mr-2" />
                Kosongkan Semua ({summary.total})
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-2xs flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama atau nomor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50/70 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              filterType === 'all'
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Semua ({summary.total})
          </button>
          <button
            onClick={() => setFilterType('pendaftar')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              filterType === 'pendaftar'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Pendaftar ({summary.total_pendaftar})
          </button>
          <button
            onClick={() => setFilterType('jamaah')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              filterType === 'jamaah'
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Jamaah ({summary.total_jamaah})
          </button>
        </div>
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-16 bg-white rounded-2xl border border-gray-100 shadow-2xs">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin mb-3" />
          <p className="text-sm font-medium text-gray-500">Memuat riwayat penghapusan dari server...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-14 bg-white rounded-2xl border border-gray-100 shadow-2xs">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
            <ShieldAlert className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Riwayat Kosong</h3>
          <p className="text-gray-500 text-sm mt-1 text-center max-w-sm">
            {searchQuery || filterType !== 'all'
              ? 'Tidak ada data terhapus yang cocok dengan filter atau kata kunci pencarian.'
              : 'Tidak ada data di tempat sampah. Data yang terhapus dapat dipulihkan di sini sebelum melewati masa retensi.'}
          </p>
          {(searchQuery || filterType !== 'all') && (
            <Button
              variant="outline"
              size="sm"
              className="mt-4 text-xs rounded-xl"
              onClick={() => {
                setSearchQuery('');
                setFilterType('all');
              }}
            >
              Reset Filter
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {items.map((item) => {
            const isRestoring = processingRestoreId === item.original_id;
            const isPendaftar = item.type_key === 'pendaftar';

            return (
              <Card
                key={item.id}
                className={`border-gray-200/80 shadow-2xs rounded-2xl overflow-hidden hover:border-gray-300 transition-colors ${
                  item.is_warning ? 'bg-amber-50/20 border-amber-200/70' : ''
                }`}
              >
                <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border ${
                      isPendaftar
                        ? 'bg-blue-50 border-blue-100 text-blue-600'
                        : 'bg-emerald-50 border-emerald-100 text-emerald-600'
                    }`}>
                      <FileBox className="w-5 h-5" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                          isPendaftar
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {item.type}
                        </span>

                        <span className="text-xs font-mono font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                          {item.code}
                        </span>

                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Dihapus {formatDate(item.deleted_at)}
                        </span>
                      </div>

                      <h4 className="text-base font-bold text-gray-900">{item.name}</h4>

                      {/* Extra metadata info */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 pt-0.5">
                        {item.extra_info?.nik && (
                          <span className="flex items-center gap-1">
                            <CreditCard className="w-3 h-3 text-gray-400" />
                            NIK: {item.extra_info.nik}
                          </span>
                        )}
                        {item.extra_info?.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-gray-400" />
                            {item.extra_info.phone}
                          </span>
                        )}
                        {item.extra_info?.status && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3 text-gray-400" />
                            Status: <span className="font-medium text-gray-700">{item.extra_info.status}</span>
                          </span>
                        )}
                        <span className={`flex items-center gap-1 font-medium ${
                          item.days_left <= 3 ? 'text-red-600' : item.is_warning ? 'text-amber-600' : 'text-gray-500'
                        }`}>
                          <Clock className="w-3 h-3" />
                          Sisa retensi: {item.days_left} hari
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 pt-2 sm:pt-0">
                    <Button
                      variant="outline"
                      className="flex-1 sm:flex-none h-9 text-xs font-semibold text-gray-700 border-gray-200 hover:bg-gray-50 hover:text-gray-900 rounded-xl"
                      onClick={() => handleRestore(item)}
                      disabled={isRestoring || isProcessingBulk || isPreparingEmpty || processingRestoreId !== null}
                    >
                      {isRestoring ? (
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

                    <Button
                      variant="outline"
                      className="flex-1 sm:flex-none h-9 text-xs font-semibold text-red-600 border-red-100 bg-red-50 hover:bg-red-100 hover:text-red-700 hover:border-red-200 rounded-xl"
                      onClick={() => openSingleDeleteDialog(item)}
                      disabled={isRestoring || isProcessingBulk || isPreparingEmpty}
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                      Hapus Permanen
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialog Konfirmasi Hapus Permanen */}
      <Dialog open={confirmDialog.isOpen} onOpenChange={(open) => !open && closeConfirmDialog()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600 text-xl font-bold">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
              {confirmDialog.mode === 'single'
                ? 'Konfirmasi Hapus Permanen'
                : 'Kosongkan Semua Riwayat Hapus'}
            </DialogTitle>
          </DialogHeader>

          <div className="py-2">
            <div className="space-y-3 text-slate-700">
              {confirmDialog.mode === 'single' && confirmDialog.targetItem ? (
                <>
                  <p className="text-base font-medium leading-relaxed">
                    Apakah Anda yakin ingin menghapus data{' '}
                    <strong className="text-gray-900">{confirmDialog.targetItem.name}</strong>{' '}
                    ({confirmDialog.targetItem.code}) secara permanen?
                  </p>
                  <p className="text-sm text-red-600/90 font-medium bg-red-50 p-3 rounded-xl border border-red-100">
                    Perhatian: Tindakan ini tidak dapat dibatalkan. Seluruh relasi data akan dihapus permanen dari basis data.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-base font-medium leading-relaxed">
                    Apakah Anda yakin ingin menghapus seluruh{' '}
                    <strong className="text-gray-900">{emptyAllTargets.length} data</strong> di riwayat penghapusan?
                  </p>
                  <p className="text-sm text-red-600/90 font-medium bg-red-50 p-3 rounded-xl border border-red-100">
                    Peringatan: Seluruh data Jamaah dan Pendaftar yang ada di tempat sampah saat ini akan dimusnahkan secara permanen dan tidak dapat dipulihkan kembali.
                  </p>
                </>
              )}
            </div>
          </div>

          <DialogFooter className="pt-5 flex flex-row justify-end gap-3 items-center">
            <Button
              variant="outline"
              onClick={closeConfirmDialog}
              disabled={confirmDialog.isSubmitting}
              className="font-bold border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-xl px-5"
            >
              Batal
            </Button>
            <Button
              onClick={handleConfirmAction}
              disabled={confirmDialog.isSubmitting}
              className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 shadow-sm shadow-red-200 rounded-xl"
            >
              {confirmDialog.isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Memproses...
                </>
              ) : (
                'Ya, Hapus Permanen'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
