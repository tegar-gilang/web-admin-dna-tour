import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface ConfirmDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  itemCount: number;
  isLoading?: boolean;
}

export function ConfirmDeleteDialog({ isOpen, onClose, onConfirm, itemCount, isLoading }: ConfirmDeleteDialogProps) {
  const handleConfirm = async () => {
    await onConfirm();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isLoading && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600 text-xl font-bold">
            <AlertTriangle className="w-5 h-5" />
            Konfirmasi Hapus Data
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-2">
          <div className="space-y-3 text-slate-700">
            <p className="text-base font-medium leading-relaxed">
              Apakah Anda yakin ingin menghapus <strong>{itemCount}</strong> data yang dipilih?
            </p>
            <p className="text-sm text-slate-500 font-medium">
              Data yang dihapus akan dilepas dari penugasan kloter dan dihapus permanen dari server. Lanjutkan?
            </p>
          </div>
        </div>

        <DialogFooter className="pt-5 flex flex-row justify-end gap-3 items-center">
          <Button 
            variant="outline" 
            disabled={isLoading}
            onClick={onClose}
            className="font-bold border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-xl px-5 cursor-pointer"
          >
            Batal
          </Button>
          <Button 
            disabled={isLoading}
            onClick={handleConfirm} 
            className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 shadow-sm shadow-red-200 rounded-xl cursor-pointer flex items-center gap-2"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{isLoading ? 'Menghapus...' : 'Ya, Hapus'}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
