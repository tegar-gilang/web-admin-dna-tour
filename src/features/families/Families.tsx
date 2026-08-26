import { toast } from '@/lib/toast';
import { ConfirmDeleteDialog } from '@/components/ui/ConfirmDeleteDialog';
import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Search, Filter, MoreHorizontal, UsersRound, ArrowUpDown, Download, Trash2, Edit2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/Checkbox';
import { useStore, Family } from '@/core/store';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { exportToExcel } from '@/lib/export';

export default function Families() {
  const { families, addFamily, updateFamily, deleteFamilies } = useStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterValue, setFilterValue] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingFamily, setViewingFamily] = useState<Family | null>(null);
  const [editingFamily, setEditingFamily] = useState<Family | null>(null);
  const [formData, setFormData] = useState<Partial<Family>>({});

  const filteredFamilies = families.filter(f => 
    (f.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    f.head.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (filterValue ? f.status === filterValue : true)
  );

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredFamilies.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredFamilies.map(f => f.id)));
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
    deleteFamilies(Array.from(selectedIds));
    setSelectedIds(new Set());
    toast("Data berhasil dihapus.", "success");
  };

  const openAddModal = () => {
    setEditingFamily(null);
    setFormData({ status: 'Complete' });
    setIsModalOpen(true);
  };

  const openEditModal = (f: Family) => {
    setEditingFamily(f);
    setFormData(f);
    setIsModalOpen(true);
  };

  const saveFamily = () => {
    if (editingFamily) {
      updateFamily(editingFamily.id, formData);
    } else {
      addFamily({
        id: `F-${Math.floor(100 + Math.random() * 900)}`,
        name: formData.name || 'Unnamed',
        head: formData.head || 'Unknown',
        members: Number(formData.members) || 1,
        group: formData.group || 'Unassigned',
        status: formData.status || 'Complete',
      });
    }
    setIsModalOpen(false);
  };

  const handleExportExcel = () => {
    const exportData = filteredFamilies.map(f => ({
      'ID Keluarga': f.id,
      'Nama Keluarga': f.name,
      'Kepala Keluarga': f.head,
      'Jumlah Anggota': f.members,
      'Kloter': f.group,
      'Status Dokumen': f.status,
    }));
    exportToExcel(exportData, 'Data_Keluarga', 'Laporan Data Keluarga - DNA Tour');
  };

  const totalPages = Math.max(1, Math.ceil(filteredFamilies.length / itemsPerPage));
  const paginatedData = filteredFamilies.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-5 pb-10">
      {/* Refined Header Banner */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">
              Keluarga & Rombongan
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">
              Kelola unit keluarga, kelompok hubungan, dan anggotanya.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <Button 
              variant="outline" 
              onClick={handleExportExcel}
              className="text-xs h-9 font-semibold text-gray-700 border-gray-200 hover:bg-gray-50 flex-1 sm:flex-none justify-center px-3.5 rounded-xl"
            >
              <Download className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
              Excel
            </Button>

            <Button 
              onClick={openAddModal} 
              className="bg-[#740A03] hover:bg-[#580802] text-white font-semibold text-xs h-9 px-4 rounded-xl shadow-2xs flex-1 sm:flex-none justify-center"
            >
              <UsersRound className="w-3.5 h-3.5 mr-1.5" />
              Tambah Keluarga
            </Button>
          </div>
        </div>
      </div>

      <Card className="shadow-2xs border-gray-200/90 bg-white rounded-2xl">
        <CardHeader className="pb-4 border-b border-gray-100">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input 
                placeholder="Cari keluarga atau kepala keluarga..." 
                className="pl-10 bg-gray-50 border-gray-200"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              {selectedIds.size > 0 && (
                <Button onClick={handleDeleteSelected} variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 flex-1 md:flex-none">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Hapus ({selectedIds.size})
                </Button>
              )}
              <Button variant={showFilters ? "default" : "outline"} className={showFilters ? "flex-1 md:flex-none" : "bg-gray-50 text-gray-700 flex-1 md:flex-none"} onClick={() => setShowFilters(!showFilters)}>
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
            </div>
          </div>
          {showFilters && (
            <div className="pt-4 mt-4 border-t border-gray-100 flex flex-wrap gap-4">
              <div className="flex flex-col space-y-1.5 w-full sm:w-auto">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Filter Status Dokumen</label>
                <select 
                  className="flex h-10 w-full sm:w-[200px] rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-1 text-xs font-semibold text-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/20 hover:bg-white"
                  value={filterValue}
                  onChange={(e) => setFilterValue(e.target.value)}
                >
                  <option value="">Semua Status</option>
                  <option value="Complete">Lengkap (Complete)</option>
                  <option value="Incomplete">Belum Lengkap (Incomplete)</option>
                </select>
              </div>
            </div>
          )}


        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
          <Table className="min-w-[800px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-center pl-4">
                  <Checkbox 
                    checked={selectedIds.size > 0 && selectedIds.size === filteredFamilies.length}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Pilih semua"
                  />
                </TableHead>
                <TableHead className="w-[100px]">
                  <div className="flex items-center gap-1 cursor-pointer hover:text-gray-700">
                    ID <ArrowUpDown className="w-3 h-3" />
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-1 cursor-pointer hover:text-gray-700">
                    Nama Keluarga <ArrowUpDown className="w-3 h-3" />
                  </div>
                </TableHead>
                <TableHead>Kepala Keluarga</TableHead>
                <TableHead>Anggota (Pax)</TableHead>
                <TableHead>Kloter</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right pr-4">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((family) => (
                <TableRow key={family.id} className={`${selectedIds.has(family.id) ? "bg-emerald-50/50" : ""} cursor-pointer hover:bg-gray-50`} onClick={() => setViewingFamily(family)}>
                  <TableCell className="pl-4">
                    <Checkbox 
                      checked={selectedIds.has(family.id)}
                      onClick={(e) => e.stopPropagation()} onCheckedChange={() => toggleSelect(family.id)}
                      aria-label={`Pilih ${family.name}`}
                    />
                  </TableCell>
                  <TableCell className="font-mono text-xs font-bold text-gray-500">{family.id}</TableCell>
                  <TableCell>
                    <span className="font-bold text-gray-900">{family.name}</span>
                  </TableCell>
                  <TableCell className="font-medium text-gray-700">{family.head}</TableCell>
                  <TableCell className="font-bold text-gray-900">{family.members}</TableCell>
                  <TableCell className="text-gray-600">{family.group}</TableCell>
                  <TableCell>
                    <Badge variant={family.status === 'Complete' ? 'success' : 'destructive'}>
                      {family.status === 'Complete' ? 'Lengkap' : 'Belum Lengkap'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-4">
                    <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-900" onClick={(e) => { e.stopPropagation(); openEditModal(family); }}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredFamilies.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-gray-500">
                    Tidak ada keluarga ditemukan.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          </div>
          <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs font-medium text-gray-500">
              Menampilkan <span className="font-bold text-gray-900">{filteredFamilies.length}</span> hasil
            </span>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button variant="outline" size="sm" className="flex-1 sm:flex-none" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Sebelumnya</Button>
              <Button variant="outline" size="sm" className="flex-1 sm:flex-none" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Selanjutnya</Button>
            </div>
          </div>

        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingFamily ? 'Edit Keluarga' : 'Tambah Keluarga Baru'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nama Keluarga</label>
                <Input value={formData.name || ''} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Cth. Keluarga Ahmad" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Kepala Keluarga</label>
                <Input value={formData.head || ''} onChange={(e) => setFormData({...formData, head: e.target.value})} placeholder="Cth. Ahmad Abdullah" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Kloter</label>
                <Input value={formData.group || ''} onChange={(e) => setFormData({...formData, group: e.target.value})} placeholder="Cth. Kloter A-1" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Anggota (Pax)</label>
                <Input type="number" value={formData.members || ''} onChange={(e) => setFormData({...formData, members: Number(e.target.value)})} placeholder="4" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <select 
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  value={formData.status || ''}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                >
                  <option value="Complete">Lengkap</option>
                  <option value="Incomplete">Belum Lengkap</option>
                </select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
            <Button onClick={saveFamily}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={!!viewingFamily} onOpenChange={(open) => !open && setViewingFamily(null)}>
        <DialogContent className="max-w-md w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Keluarga - {viewingFamily?.name}</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {viewingFamily && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">ID Keluarga</p>
                    <p className="text-base font-bold text-gray-900">{viewingFamily.id}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Kloter</p>
                    <p className="text-base font-bold text-gray-900">{viewingFamily.group}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Kepala Keluarga</p>
                  <p className="text-base font-bold text-gray-900">{viewingFamily.head}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Jumlah Anggota</p>
                  <p className="text-base font-bold text-gray-900">{viewingFamily.members} Orang</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Status Dokumen</p>
                  <Badge variant={viewingFamily.status === "Complete" ? "success" : "destructive"}>
                    {viewingFamily.status === "Complete" ? "Lengkap" : "Belum Lengkap"}
                  </Badge>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
      <ConfirmDeleteDialog 
        isOpen={isDeleteDialogOpen} 
        onClose={() => setIsDeleteDialogOpen(false)} 
        onConfirm={confirmDelete}
        itemCount={selectedIds.size}
      />
    </div>
  );
}