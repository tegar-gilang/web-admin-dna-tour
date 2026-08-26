import React, { useState, useMemo } from 'react';
import { useStore, FinanceTransaction, Pilgrim } from '@/core/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ConfirmDeleteButton } from '@/components/ui/ConfirmDeleteButton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { toast } from '@/lib/toast';
import { exportToExcel } from '@/lib/export';
import { PaymentMethodOptions } from '@/components/ui/PaymentMethodOptions';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  CreditCard, 
  Plus, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Receipt, 
  ArrowUpRight, 
  ArrowDownRight,
  Printer,
  Trash2,
  FileSpreadsheet,
  Eye,
  Edit2,
  FileText,
  Building2,
  Tag,
  Check,
  Filter,
  DollarSign,
  User,
  BookOpen,
  FileCheck,
  Flag,
  UserCheck,
  Phone,
  Users,
  Package,
  PlaneTakeoff,
  PlaneLanding,
  Calendar,
  Layers,
  Info,
  Luggage,
  ShieldCheck,
  X
} from 'lucide-react';

export default function Finance() {
  const { financeTransactions, pilgrims, addTransaction, updateTransaction, deleteTransaction, updatePilgrim } = useStore();

  const [activeTab, setActiveTab] = useState<'all' | 'income' | 'receivables' | 'expense'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMethod, setFilterMethod] = useState('');
  const [filterExpenseCategory, setFilterExpenseCategory] = useState('');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isTxDetailModalOpen, setIsTxDetailModalOpen] = useState(false);
  const [isReceivableDetailModalOpen, setIsReceivableDetailModalOpen] = useState(false);

  // Delete Confirmation State
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleDeleteClick = (id: string) => {
    setDeleteItemId(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (deleteItemId) {
      deleteTransaction(deleteItemId);
      toast("Data berhasil dihapus.", "success");
      setDeleteItemId(null);
      setIsDeleteDialogOpen(false);
    }
  };

  // Selected Data State
  const [selectedPilgrimForPay, setSelectedPilgrimForPay] = useState<Pilgrim | null>(null);
  const [selectedDetailExpense, setSelectedDetailExpense] = useState<FinanceTransaction | null>(null);
  const [selectedDetailTx, setSelectedDetailTx] = useState<FinanceTransaction | null>(null);
  const [selectedDetailReceivable, setSelectedDetailReceivable] = useState<(Pilgrim & { calculatedTotal: number; calculatedPaid: number; remaining: number }) | null>(null);
  const [receivableModalTab, setReceivableModalTab] = useState<'data-diri' | 'tagihan-keuangan'>('data-diri');
  const [txDetailModalTab, setTxDetailModalTab] = useState<'transaksi' | 'data-diri'>('transaksi');
  const [editingTxId, setEditingTxId] = useState<string | null>(null);

  // Pilgrim Payment Edit State
  const [isEditPilgrimPaymentModalOpen, setIsEditPilgrimPaymentModalOpen] = useState(false);
  const [selectedPilgrimForEditPay, setSelectedPilgrimForEditPay] = useState<Pilgrim | null>(null);
  const [editPilgrimPayForm, setEditPilgrimPayForm] = useState<{
    totalAmount: number;
    paidAmount: number;
    paymentOption: 'Bayar Lunas' | 'DP' | 'Belum Bayar';
    paymentMethod: string;
    paymentDate: string;
    paymentNotes: string;
  }>({
    totalAmount: 30000000,
    paidAmount: 10000000,
    paymentOption: 'DP',
    paymentMethod: 'Transfer BCA',
    paymentDate: '',
    paymentNotes: ''
  });

  const handleEditTransaction = (tx: FinanceTransaction) => {
    setEditingTxId(tx.id);
    setTxForm({
      pilgrimId: tx.pilgrimId || '',
      pilgrimName: tx.pilgrimName,
      type: tx.type,
      category: tx.category,
      amount: tx.amount,
      paymentMethod: tx.paymentMethod,
      date: tx.date || todayStr,
      status: tx.status || 'Berhasil',
      referenceNo: tx.referenceNo || '',
      notes: tx.notes || ''
    });
    setIsTxDetailModalOpen(false);
    setIsAddModalOpen(true);
  };

  const handleOpenEditPilgrimPayment = (p: Pilgrim) => {
    setSelectedPilgrimForEditPay(p);
    setEditPilgrimPayForm({
      totalAmount: p.totalAmount || 30000000,
      paidAmount: p.paidAmount || 0,
      paymentOption: (p.paymentOption as 'Bayar Lunas' | 'DP' | 'Belum Bayar') || 'DP',
      paymentMethod: p.paymentMethod || 'Transfer BCA',
      paymentDate: p.paymentDate || p.registrationDate || todayStr,
      paymentNotes: p.paymentNotes || ''
    });
    setIsReceivableDetailModalOpen(false);
    setIsEditPilgrimPaymentModalOpen(true);
  };

  const handleSavePilgrimPayment = () => {
    if (!selectedPilgrimForEditPay) return;
    const newTotal = Number(editPilgrimPayForm.totalAmount) || 30000000;
    const newPaid = Number(editPilgrimPayForm.paidAmount) || 0;
    const isLunas = newPaid >= newTotal && newTotal > 0;
    const payOpt: 'Bayar Lunas' | 'DP' | 'Belum Bayar' = isLunas ? 'Bayar Lunas' : (newPaid > 0 ? 'DP' : 'Belum Bayar');

    // Synchronize or create matching transaction
    const existingTx = financeTransactions.find(t => 
      (t.pilgrimId && t.pilgrimId === selectedPilgrimForEditPay.id) || 
      (t.referenceNo && t.referenceNo === `REG-${selectedPilgrimForEditPay.id}`) ||
      (t.pilgrimName && t.pilgrimName.trim().toLowerCase() === selectedPilgrimForEditPay.name.trim().toLowerCase())
    );

    if (existingTx) {
      if (newPaid <= 0) {
        deleteTransaction(existingTx.id);
      } else {
        updateTransaction(existingTx.id, {
          pilgrimId: selectedPilgrimForEditPay.id,
          pilgrimName: selectedPilgrimForEditPay.name,
          amount: newPaid,
          type: isLunas ? 'Pemasukan (Lunas)' : 'Pemasukan (DP)',
          paymentMethod: editPilgrimPayForm.paymentMethod || existingTx.paymentMethod,
          date: editPilgrimPayForm.paymentDate || existingTx.date,
          notes: editPilgrimPayForm.paymentNotes || existingTx.notes,
          referenceNo: `REG-${selectedPilgrimForEditPay.id}`
        });
      }
    } else if (newPaid > 0) {
      addTransaction({
        id: `TRX-${Date.now().toString().slice(-6)}`,
        pilgrimId: selectedPilgrimForEditPay.id,
        pilgrimName: selectedPilgrimForEditPay.name,
        type: isLunas ? 'Pemasukan (Lunas)' : 'Pemasukan (DP)',
        category: 'Pendaftaran Umrah',
        amount: newPaid,
        paymentMethod: editPilgrimPayForm.paymentMethod || 'Transfer BCA',
        date: editPilgrimPayForm.paymentDate || todayStr,
        status: 'Berhasil',
        notes: editPilgrimPayForm.paymentNotes || 'Penyesuaian Data Pembayaran Jamaah',
        referenceNo: `REG-${selectedPilgrimForEditPay.id}`
      });
    }

    updatePilgrim(selectedPilgrimForEditPay.id, {
      totalAmount: newTotal,
      paidAmount: newPaid,
      paymentOption: payOpt,
      paymentMethod: editPilgrimPayForm.paymentMethod,
      paymentDate: editPilgrimPayForm.paymentDate || todayStr,
      paymentNotes: editPilgrimPayForm.paymentNotes
    });

    toast(`Data pembayaran & piutang untuk ${selectedPilgrimForEditPay.name} berhasil diperbarui!`, "success");
    setIsEditPilgrimPaymentModalOpen(false);
  };

  const handleViewTransactionDetail = (tx: FinanceTransaction) => {
    setSelectedDetailTx(tx);
    setTxDetailModalTab('transaksi');
    setIsTxDetailModalOpen(true);
  };

  const handleViewReceivableDetail = (p: Pilgrim & { calculatedTotal: number; calculatedPaid: number; remaining: number }) => {
    setSelectedDetailReceivable(p);
    setReceivableModalTab('data-diri');
    setIsReceivableDetailModalOpen(true);
  };

  const todayStr = new Date().toISOString().split('T')[0];

  // General Transaction Form State
  const [txForm, setTxForm] = useState<{
    pilgrimId?: string;
    pilgrimName?: string;
    type?: string;
    category?: string;
    amount?: number;
    paymentMethod?: string;
    date?: string;
    status?: string;
    referenceNo?: string;
    notes?: string;
  }>({
    type: '',
    category: '',
    paymentMethod: '',
    date: '',
    status: '',
    amount: undefined,
    pilgrimName: '',
    referenceNo: '',
    notes: ''
  });

  // Dedicated Expense Form State
  const [expenseForm, setExpenseForm] = useState({
    id: '',
    vendorName: '',
    category: '',
    amount: undefined as number | undefined,
    paymentMethod: '',
    date: '',
    referenceNo: '',
    notes: ''
  });

  // Quick Pay State
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<string>('Transfer BCA');
  const [payNotes, setPayNotes] = useState<string>('Pelunasan Sisa Tagihan Umrah');

  // Core Calculations
  const totalIncome = financeTransactions
    .filter(t => t.type.startsWith('Pemasukan') && t.status === 'Berhasil')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = financeTransactions
    .filter(t => t.type === 'Pengeluaran' && t.status === 'Berhasil')
    .reduce((sum, t) => sum + t.amount, 0);

  const netBalance = totalIncome - totalExpense;

  // Expense Breakdown Calculations
  const expenseByCategory = financeTransactions
    .filter(t => t.type === 'Pengeluaran' && t.status === 'Berhasil')
    .reduce((acc, t) => {
      const cat = t.category || 'Lain-lain';
      acc[cat] = (acc[cat] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  // Pilgrims with outstanding balances
  const allReceivables = useMemo(() => {
    return pilgrims.map(p => {
      const total = p.totalAmount || 30000000;
      const paid = p.paidAmount || 0;
      const remaining = Math.max(0, total - paid);
      return { ...p, calculatedTotal: total, calculatedPaid: paid, remaining };
    }).filter(p => p.remaining > 0);
  }, [pilgrims]);

  const pilgrimsWithReceivables = useMemo(() => {
    if (!searchTerm.trim() || activeTab !== 'receivables') {
      return allReceivables;
    }
    const term = searchTerm.toLowerCase();
    return allReceivables.filter(p => (
      p.name.toLowerCase().includes(term) ||
      p.id.toLowerCase().includes(term) ||
      (p.formId && p.formId.toLowerCase().includes(term)) ||
      (p.passport && p.passport.toLowerCase().includes(term)) ||
      (p.phone && p.phone.toLowerCase().includes(term)) ||
      (p.group && p.group.toLowerCase().includes(term)) ||
      (p.umrahPackage && p.umrahPackage.toLowerCase().includes(term))
    ));
  }, [allReceivables, searchTerm, activeTab]);

  const totalReceivables = allReceivables.reduce((sum, p) => sum + p.remaining, 0);

  // Filtered Transactions
  const filteredTransactions = financeTransactions.filter(t => {
    const pId = t.pilgrimId || pilgrims.find(p => p.name === t.pilgrimName)?.id || '';
    const matchesSearch = 
      t.pilgrimName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.referenceNo && t.referenceNo.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.notes && t.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesMethod = filterMethod ? t.paymentMethod === filterMethod : true;
    const matchesCategory = filterExpenseCategory ? t.category === filterExpenseCategory : true;

    if (activeTab === 'income') {
      return matchesSearch && matchesMethod && t.type.startsWith('Pemasukan');
    }
    if (activeTab === 'expense') {
      return matchesSearch && matchesMethod && matchesCategory && t.type === 'Pengeluaran';
    }
    return matchesSearch && matchesMethod && matchesCategory;
  });

  // Save General Transaction (Pemasukan / General)
  const handleSaveTransaction = () => {
    if (!txForm.pilgrimName) {
      toast("Nama transaksi wajib diisi.", "error");
      return;
    }
    if (!txForm.amount || txForm.amount <= 0) {
      toast("Nominal transaksi harus lebih besar dari 0.", "error");
      return;
    }

    const matchedPilgrim = pilgrims.find(p => p.name.toLowerCase() === txForm.pilgrimName?.toLowerCase());
    const matchedId = matchedPilgrim ? matchedPilgrim.id : txForm.pilgrimId;

    if (editingTxId) {
      updateTransaction(editingTxId, {
        pilgrimId: matchedId,
        pilgrimName: txForm.pilgrimName,
        type: (txForm.type || 'Pemasukan (DP)') as any,
        category: (txForm.category || 'Pendaftaran Umrah') as any,
        amount: Number(txForm.amount),
        paymentMethod: txForm.paymentMethod || 'Transfer BCA',
        date: txForm.date || todayStr,
        notes: txForm.notes || '',
        referenceNo: txForm.referenceNo || `REF-${Math.floor(1000 + Math.random() * 9000)}`
      });
      toast("Transaksi berhasil diperbarui.", "success");
      setEditingTxId(null);
    } else {
      const newTx: FinanceTransaction = {
        id: `TRX-${Date.now().toString().slice(-6)}`,
        pilgrimId: matchedId,
        pilgrimName: txForm.pilgrimName,
        type: (txForm.type || 'Pemasukan (DP)') as any,
        category: (txForm.category || 'Pendaftaran Umrah') as any,
        amount: Number(txForm.amount),
        paymentMethod: txForm.paymentMethod || 'Transfer BCA',
        date: txForm.date || todayStr,
        status: (txForm.status || 'Berhasil') as any,
        notes: txForm.notes || '',
        referenceNo: txForm.referenceNo || `REF-${Math.floor(1000 + Math.random() * 9000)}`
      };
      addTransaction(newTx);
      toast("Pemasukan baru berhasil dicatat.", "success");
    }
    setIsAddModalOpen(false);
  };

  // Save Dedicated Expense Note
  const handleSaveExpenseNote = () => {
    if (!expenseForm.vendorName) {
      toast("Nama penerima pengeluaran wajib diisi.", "error");
      return;
    }
    if (!expenseForm.amount || expenseForm.amount <= 0) {
      toast("Nominal pengeluaran harus lebih besar dari Rp 0.", "error");
      return;
    }

    if (expenseForm.id) {
      updateTransaction(expenseForm.id, {
        pilgrimName: expenseForm.vendorName,
        category: expenseForm.category as any,
        amount: Number(expenseForm.amount),
        paymentMethod: expenseForm.paymentMethod,
        date: expenseForm.date,
        referenceNo: expenseForm.referenceNo || `KWT-${Math.floor(1000 + Math.random() * 9000)}`,
        notes: expenseForm.notes
      });
      toast("Catatan pengeluaran berhasil diperbarui.", "success");
    } else {
      const newExpense: FinanceTransaction = {
        id: `EXP-${Date.now().toString().slice(-6)}`,
        pilgrimName: expenseForm.vendorName,
        type: 'Pengeluaran',
        category: expenseForm.category as any,
        amount: Number(expenseForm.amount),
        paymentMethod: expenseForm.paymentMethod,
        date: expenseForm.date || todayStr,
        status: 'Berhasil',
        notes: expenseForm.notes,
        referenceNo: expenseForm.referenceNo || `KWT-${Math.floor(1000 + Math.random() * 9000)}`
      };
      addTransaction(newExpense);
      toast("Catatan pengeluaran berhasil disimpan & disinkronkan ke Keuangan!", "success");
    }

    setIsExpenseModalOpen(false);
  };

  // Open Expense Modal for Edit
  const handleEditExpense = (tx: FinanceTransaction) => {
    setExpenseForm({
      id: tx.id,
      vendorName: tx.pilgrimName,
      category: tx.category || 'Operasional',
      amount: tx.amount,
      paymentMethod: tx.paymentMethod || 'Transfer BCA',
      date: tx.date || todayStr,
      referenceNo: tx.referenceNo || '',
      notes: tx.notes || ''
    });
    setIsExpenseModalOpen(true);
  };

  // Quick Pay Modal
  const handleOpenQuickPay = (p: Pilgrim) => {
    const total = p.totalAmount || 30000000;
    const paid = p.paidAmount || 0;
    const remaining = Math.max(0, total - paid);
    setSelectedPilgrimForPay(p);
    setPayAmount(remaining);
    setPayMethod('Transfer BCA');
    setPayNotes(`Pelunasan tagihan sisa Umrah a/n ${p.name}`);
    setIsPayModalOpen(true);
  };

  const handleConfirmQuickPay = () => {
    if (!selectedPilgrimForPay || payAmount <= 0) {
      toast("Nominal pelunasan tidak valid.", "error");
      return;
    }

    const currentPaid = selectedPilgrimForPay.paidAmount || 0;
    const newPaid = currentPaid + payAmount;
    const total = selectedPilgrimForPay.totalAmount || 30000000;
    const isLunas = newPaid >= total;

    updatePilgrim(selectedPilgrimForPay.id, {
      paidAmount: newPaid,
      paymentOption: isLunas ? 'Bayar Lunas' : 'DP',
      paymentMethod: payMethod,
      paymentDate: todayStr,
      paymentNotes: payNotes
    });

    addTransaction({
      id: `TRX-${Date.now().toString().slice(-6)}`,
      pilgrimId: selectedPilgrimForPay.id,
      pilgrimName: selectedPilgrimForPay.name,
      type: isLunas ? 'Pemasukan (Lunas)' : 'Pemasukan (Pelunasan)',
      category: 'Pelunasan Umrah',
      amount: payAmount,
      paymentMethod: payMethod,
      date: todayStr,
      status: 'Berhasil',
      notes: payNotes,
      referenceNo: `SETTLE-${selectedPilgrimForPay.id}`
    });

    toast(`Pelunasan sebesar Rp ${payAmount.toLocaleString('id-ID')} berhasil dicatat!`, "success");
    setIsPayModalOpen(false);
  };

  // Export Excel
  const handleExportExcel = () => {
    const data = filteredTransactions.map(t => ({
      'ID Transaksi': t.id,
      'Nama Penerima': t.pilgrimName,
      'Tipe Transaksi': t.type,
      'Kategori': t.category,
      'Nominal (Rp)': t.amount,
      'Metode Pembayaran': t.paymentMethod,
      'Tanggal': t.date,
      'Status': t.status,
      'No. Referensi': t.referenceNo || '-',
      'Catatan Rincian': t.notes || '-'
    }));

    exportToExcel(data, `Laporan_Keuangan_Umrah_${todayStr}`, 'Laporan Keuangan & Arus Kas - DNA Tour');
    toast("Laporan keuangan berhasil diexport ke Excel.", "success");
  };

  return (
    <div className="space-y-5 pb-10">
      {/* Refined Header Banner */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">
              Keuangan
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 font-normal mt-1">
              Pencatatan arus kas jamaah dan operasional
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
              onClick={() => {
                setExpenseForm({
                  id: '',
                  vendorName: '',
                  category: '',
                  amount: undefined,
                  paymentMethod: '',
                  date: '',
                  referenceNo: '',
                  notes: ''
                });
                setIsExpenseModalOpen(true);
              }}
              variant="outline"
              className="text-xs h-10 font-semibold text-red-700 border-red-200 bg-white hover:bg-red-50 flex-1 sm:flex-none justify-center px-4 rounded-xl cursor-pointer shadow-2xs"
            >
              <Receipt className="w-4 h-4 mr-1.5" /> 
              Catat Pengeluaran
            </Button>

            <Button 
              onClick={() => {
                setEditingTxId(null);
                setTxForm({
                  type: '',
                  category: '',
                  paymentMethod: '',
                  date: '',
                  status: '',
                  amount: undefined,
                  pilgrimName: '',
                  referenceNo: '',
                  notes: ''
                });
                setIsAddModalOpen(true);
              }}
              className="bg-[#740A03] hover:bg-[#580802] text-white font-semibold text-xs h-10 px-4 rounded-xl shadow-2xs flex-1 sm:flex-none justify-center cursor-pointer"
            >
              <Plus className="w-4 h-4 mr-1.5" /> 
              Catat Pemasukan
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards Grid - Interactive & Tactile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Pemasukan Kas */}
        <Card 
          onClick={() => setActiveTab('income')}
          className={`rounded-2xl border bg-white shadow-2xs cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.98] ${
            activeTab === 'income' 
              ? 'border-emerald-600 ring-2 ring-emerald-600/20 bg-emerald-50/20' 
              : 'border-gray-200/80 hover:border-gray-300'
          }`}
        >
          <CardContent className="p-5 flex flex-col justify-between h-full gap-3">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">TOTAL PEMASUKAN KAS</p>
                <p className="text-2xl sm:text-[26px] font-bold tracking-tight text-gray-900">
                  Rp {totalIncome.toLocaleString('id-ID')}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 shadow-2xs">
                <ArrowUpRight className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>Pemasukan DP & Pelunasan</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Total Piutang Jamaah */}
        <Card 
          onClick={() => setActiveTab('receivables')}
          className={`rounded-2xl border bg-white shadow-2xs cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.98] ${
            activeTab === 'receivables' 
              ? 'border-amber-600 ring-2 ring-amber-600/20 bg-amber-50/20' 
              : 'border-gray-200/80 hover:border-gray-300'
          }`}
        >
          <CardContent className="p-5 flex flex-col justify-between h-full gap-3">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">TOTAL PIUTANG JAMAAH</p>
                <p className="text-2xl sm:text-[26px] font-bold tracking-tight text-amber-900">
                  Rp {totalReceivables.toLocaleString('id-ID')}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 shadow-2xs">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-amber-700">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{pilgrimsWithReceivables.length} Jamaah Belum Lunas</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Total Pengeluaran Kas */}
        <Card 
          onClick={() => setActiveTab('expense')}
          className={`rounded-2xl border bg-white shadow-2xs cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.98] ${
            activeTab === 'expense' 
              ? 'border-red-600 ring-2 ring-red-600/20 bg-red-50/20' 
              : 'border-gray-200/80 hover:border-gray-300'
          }`}
        >
          <CardContent className="p-5 flex flex-col justify-between h-full gap-3">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">TOTAL PENGELUARAN KAS</p>
                <p className="text-2xl sm:text-[26px] font-bold tracking-tight text-gray-900">
                  Rp {totalExpense.toLocaleString('id-ID')}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0 shadow-2xs">
                <TrendingDown className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-red-600">
              <Receipt className="w-3.5 h-3.5 shrink-0" />
              <span>{financeTransactions.filter(t => t.type === 'Pengeluaran').length} Catatan Pengeluaran</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Saldo Bersih */}
        <Card 
          onClick={() => setActiveTab('all')}
          className={`rounded-2xl border bg-white shadow-2xs cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.98] ${
            activeTab === 'all' 
              ? 'border-[#740A03] ring-2 ring-[#740A03]/20 bg-[#fefcfc]' 
              : 'border-gray-200/80 hover:border-gray-300'
          }`}
        >
          <CardContent className="p-5 flex flex-col justify-between h-full gap-3">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">SALDO BERSIH (NET KAS)</p>
                <p className={`text-2xl sm:text-[26px] font-bold tracking-tight ${netBalance >= 0 ? 'text-emerald-800' : 'text-red-600'}`}>
                  Rp {netBalance.toLocaleString('id-ID')}
                </p>
              </div>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-2xs ${netBalance >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                <Wallet className="w-5 h-5" />
              </div>
            </div>
            <div className={`flex items-center gap-1.5 text-xs font-medium ${netBalance >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>Arus Kas Bersih Terkalkulasi</span>
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
              onClick={() => setActiveTab('all')}
              className={`relative pb-3 pt-2 px-2.5 text-xs sm:text-sm transition-all duration-200 whitespace-nowrap cursor-pointer flex items-center gap-1.5 select-none rounded-t-lg group active:scale-[0.96] ${
                activeTab === 'all' 
                  ? 'font-bold text-emerald-800' 
                  : 'font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50/80'
              }`}
            >
              <span>Semua Transaksi</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold transition-all duration-200 ${
                activeTab === 'all' 
                  ? 'bg-emerald-100 text-emerald-800 scale-105' 
                  : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200/80'
              }`}>
                {financeTransactions.length}
              </span>
              {activeTab === 'all' && (
                <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-emerald-600 rounded-full animate-tab-indicator" />
              )}
            </button>
            <button 
              onClick={() => setActiveTab('income')}
              className={`relative pb-3 pt-2 px-2.5 text-xs sm:text-sm transition-all duration-200 whitespace-nowrap cursor-pointer flex items-center gap-1.5 select-none rounded-t-lg group active:scale-[0.96] ${
                activeTab === 'income' 
                  ? 'font-bold text-emerald-800' 
                  : 'font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50/80'
              }`}
            >
              <span>Pemasukan Jamaah</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold transition-all duration-200 ${
                activeTab === 'income' 
                  ? 'bg-emerald-100 text-emerald-800 scale-105' 
                  : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200/80'
              }`}>
                {financeTransactions.filter(t => t.type.startsWith('Pemasukan')).length}
              </span>
              {activeTab === 'income' && (
                <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-emerald-600 rounded-full animate-tab-indicator" />
              )}
            </button>
            <button 
              onClick={() => setActiveTab('receivables')}
              className={`relative pb-3 pt-2 px-2.5 text-xs sm:text-sm transition-all duration-200 whitespace-nowrap cursor-pointer flex items-center gap-1.5 select-none rounded-t-lg group active:scale-[0.96] ${
                activeTab === 'receivables' 
                  ? 'font-bold text-amber-800' 
                  : 'font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50/80'
              }`}
            >
              <span>Piutang Jamaah</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold transition-all duration-200 ${
                activeTab === 'receivables' 
                  ? 'bg-amber-100 text-amber-800 scale-105' 
                  : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200/80'
              }`}>
                {pilgrimsWithReceivables.length}
              </span>
              {activeTab === 'receivables' && (
                <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-amber-600 rounded-full animate-tab-indicator" />
              )}
            </button>
            <button 
              onClick={() => setActiveTab('expense')}
              className={`relative pb-3 pt-2 px-2.5 text-xs sm:text-sm transition-all duration-200 whitespace-nowrap cursor-pointer flex items-center gap-1.5 select-none rounded-t-lg group active:scale-[0.96] ${
                activeTab === 'expense' 
                  ? 'font-bold text-red-800' 
                  : 'font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50/80'
              }`}
            >
              <Receipt className="w-3.5 h-3.5 mr-1" />
              <span>Catatan Pengeluaran</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold transition-all duration-200 ${
                activeTab === 'expense' 
                  ? 'bg-red-100 text-red-800 scale-105' 
                  : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200/80'
              }`}>
                {financeTransactions.filter(t => t.type === 'Pengeluaran').length}
              </span>
              {activeTab === 'expense' && (
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
              placeholder={
                activeTab === 'expense' 
                  ? "Cari vendor, ref, rincian..." 
                  : activeTab === 'receivables' 
                    ? "Cari jamaah piutang, ID, paket, kloter..." 
                    : "Cari transaksi, jamaah, ref..."
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            {activeTab === 'expense' && (
              <select 
                value={filterExpenseCategory}
                onChange={(e) => setFilterExpenseCategory(e.target.value)}
                className="h-9 rounded-xl border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 cursor-pointer"
              >
                <option value="">Semua Kategori</option>
                <option value="Akomodasi & Tiket">Akomodasi & Tiket</option>
                <option value="Perlengkapan">Perlengkapan</option>
                <option value="Operasional">Operasional</option>
                <option value="Transportasi & Bus">Transportasi & Bus</option>
                <option value="Honor & SDM">Honor & SDM</option>
                <option value="Visa & Asuransi">Visa & Asuransi</option>
                <option value="Catering & Konsumsi">Catering & Konsumsi</option>
                <option value="Lain-lain">Lain-lain</option>
              </select>
            )}

            {activeTab !== 'receivables' && (
              <select 
                value={filterMethod}
                onChange={(e) => setFilterMethod(e.target.value)}
                className="h-9 rounded-xl border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 cursor-pointer"
              >
                <option value="">Semua Metode Pembayaran</option>
                <PaymentMethodOptions />
              </select>
            )}

            {activeTab === 'receivables' && (
              <div className="text-xs text-amber-900 bg-amber-100/80 px-3 py-1.5 rounded-xl font-medium border border-amber-200/60 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <span>Total Piutang: <strong>Rp {totalReceivables.toLocaleString('id-ID')}</strong> ({allReceivables.length} Jamaah)</span>
              </div>
            )}
          </div>
        </div>

        {/* Tab 4: Specialized Expense Management View */}
        {activeTab === 'expense' && (
          <div className="p-4 sm:p-6 space-y-6">
            {/* Category Expense Summary Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-gray-50/80 p-4 rounded-2xl border border-gray-200/80">
              <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-2xs flex flex-col justify-between">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Akomodasi & Tiket</span>
                <span className="text-base font-bold text-gray-900 block mt-1 tracking-tight font-mono">
                  Rp {(expenseByCategory['Akomodasi & Tiket'] || 0).toLocaleString('id-ID')}
                </span>
                <span className="text-xs text-gray-500 font-normal block mt-1">Hotel & Tiket Pesawat</span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-2xs flex flex-col justify-between">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Perlengkapan</span>
                <span className="text-base font-bold text-gray-900 block mt-1 tracking-tight font-mono">
                  Rp {(expenseByCategory['Perlengkapan'] || 0).toLocaleString('id-ID')}
                </span>
                <span className="text-xs text-gray-500 font-normal block mt-1">Koper, Batik, Ihram</span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-2xs flex flex-col justify-between">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Operasional & Bus</span>
                <span className="text-base font-bold text-gray-900 block mt-1 tracking-tight font-mono">
                  Rp {((expenseByCategory['Operasional'] || 0) + (expenseByCategory['Transportasi & Bus'] || 0)).toLocaleString('id-ID')}
                </span>
                <span className="text-xs text-gray-500 font-normal block mt-1">Bus, Catering & SDM</span>
              </div>

              <div className="bg-red-50/60 p-4 rounded-xl border border-red-100 shadow-2xs flex flex-col justify-between">
                <span className="text-[11px] font-bold text-red-700 uppercase tracking-wider block">Total Pengeluaran</span>
                <span className="text-base font-bold text-red-900 block mt-1 tracking-tight font-mono">
                  Rp {totalExpense.toLocaleString('id-ID')}
                </span>
                <span className="text-xs text-red-700 block mt-1 font-medium">Pengeluaran Terverifikasi</span>
              </div>
            </div>

            {/* Expense Table */}
            <div className="overflow-x-auto rounded-2xl border border-gray-200/80 bg-white">
              <Table className="w-full min-w-[850px]">
                <TableHeader className="bg-gray-50/80">
                  <TableRow className="border-b-gray-200">
                    <TableHead className="text-[11px] font-bold text-gray-500 uppercase tracking-wider h-11 whitespace-nowrap px-4 min-w-[130px]">NO. REFERENSI</TableHead>
                    <TableHead className="text-[11px] font-bold text-gray-500 uppercase tracking-wider h-11 whitespace-nowrap px-4 min-w-[220px]">PENERIMA</TableHead>
                    <TableHead className="text-[11px] font-bold text-gray-500 uppercase tracking-wider h-11 whitespace-nowrap px-4 min-w-[140px]">KATEGORI</TableHead>
                    <TableHead className="text-[11px] font-bold text-gray-500 uppercase tracking-wider h-11 whitespace-nowrap px-4 text-right min-w-[140px]">NOMINAL (RP)</TableHead>
                    <TableHead className="text-[11px] font-bold text-gray-500 uppercase tracking-wider h-11 whitespace-nowrap px-4 min-w-[160px]">METODE & TANGGAL</TableHead>
                    <TableHead className="text-center text-[11px] font-bold text-gray-500 uppercase tracking-wider h-11 whitespace-nowrap px-4 min-w-[120px]">AKSI</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 animate-fade-in">
                  {filteredTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-gray-400 text-xs font-normal">
                        Belum ada catatan pengeluaran yang cocok dengan filter.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTransactions.map((tx) => (
                      <TableRow key={tx.id} className="hover:bg-gray-50/80 transition-colors">
                        <TableCell className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 font-bold text-sm tracking-tight text-gray-900">
                            <Receipt className="w-3.5 h-3.5 text-red-500 shrink-0" />
                            {tx.id}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-4">
                          <div className="font-bold text-sm text-gray-900 leading-snug">{tx.pilgrimName}</div>
                          {tx.notes && <div className="text-xs text-gray-500 font-normal mt-0.5 max-w-xs line-clamp-2">{tx.notes}</div>}
                        </TableCell>
                        <TableCell className="px-4 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold text-red-800 bg-red-50 border border-red-200 tracking-wide uppercase shadow-2xs">
                            <Tag className="w-3 h-3 mr-1" /> {tx.category}
                          </span>
                        </TableCell>
                        <TableCell className="font-bold text-sm text-right text-red-600 px-4 py-4 whitespace-nowrap font-mono">
                          - Rp {tx.amount.toLocaleString('id-ID')}
                        </TableCell>
                        <TableCell className="px-4 py-4 whitespace-nowrap">
                          <div className="font-bold text-sm text-gray-900">{tx.paymentMethod}</div>
                          <div className="text-xs text-gray-400 font-normal mt-0.5">{tx.date}</div>
                        </TableCell>
                        <TableCell className="text-center px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => {
                                setSelectedDetailExpense(tx);
                                setIsDetailModalOpen(true);
                              }} 
                              title="Lihat Bukti Voucher"
                              className="h-8 w-8 p-0 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleEditExpense(tx)} 
                              title="Edit Catatan"
                              className="h-8 w-8 p-0 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              onClick={() => handleDeleteClick(tx.id)} 
                              title="Hapus Pengeluaran"
                              className="h-8 w-8 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Tab 1 & 2: General Transactions Table */}
        {(activeTab === 'all' || activeTab === 'income') && (
          <div className="overflow-x-auto w-full">
            <Table className="w-full min-w-[950px]">
              <TableHeader className="bg-gray-50/80">
                <TableRow className="border-b-gray-200">
                  <TableHead className="text-[11px] font-bold text-gray-500 uppercase tracking-wider h-11 whitespace-nowrap px-4 min-w-[130px]">ID TRANSAKSI</TableHead>
                  <TableHead className="text-[11px] font-bold text-gray-500 uppercase tracking-wider h-11 whitespace-nowrap px-4 min-w-[240px]">NAMA JAMAAH</TableHead>
                  <TableHead className="text-[11px] font-bold text-gray-500 uppercase tracking-wider h-11 whitespace-nowrap px-4 min-w-[160px]">TIPE & KATEGORI</TableHead>
                  <TableHead className="text-[11px] font-bold text-gray-500 uppercase tracking-wider h-11 whitespace-nowrap px-4 text-right min-w-[150px]">NOMINAL (RP)</TableHead>
                  <TableHead className="text-[11px] font-bold text-gray-500 uppercase tracking-wider h-11 whitespace-nowrap px-4 min-w-[160px]">METODE & TANGGAL</TableHead>
                  <TableHead className="text-[11px] font-bold text-gray-500 uppercase tracking-wider h-11 whitespace-nowrap px-4 min-w-[120px]">STATUS</TableHead>
                  <TableHead className="text-center text-[11px] font-bold text-gray-500 uppercase tracking-wider h-11 whitespace-nowrap px-4 min-w-[110px]">AKSI</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 animate-fade-in">
                {filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-gray-400 text-xs font-normal">
                      Tidak ada data transaksi keuangan yang ditemukan.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map((tx) => {
                    const isIncome = tx.type.startsWith('Pemasukan');
                    const pilgrimIdDisplay = tx.pilgrimId || pilgrims.find(p => p.name.toLowerCase() === tx.pilgrimName.toLowerCase())?.id || tx.id;
                    return (
                      <TableRow key={tx.id} className="hover:bg-gray-50/80 transition-colors">
                        <TableCell className="px-4 py-4 whitespace-nowrap">
                          <div className="font-bold text-sm tracking-tight text-[#480c0c] whitespace-nowrap">{pilgrimIdDisplay}</div>
                        </TableCell>
                        <TableCell className="px-4 py-4">
                          <div className="font-bold text-sm text-gray-900 leading-snug whitespace-nowrap">{tx.pilgrimName}</div>
                          {tx.notes && <div className="text-xs text-gray-500 font-normal truncate max-w-xs mt-0.5">{tx.notes}</div>}
                        </TableCell>
                        <TableCell className="px-4 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase shadow-2xs ${
                            isIncome 
                              ? 'text-emerald-800 bg-emerald-50 border border-emerald-300' 
                              : 'text-red-800 bg-red-50 border border-red-300'
                          }`}>
                            {tx.type}
                          </span>
                          <div className="text-xs text-gray-500 mt-1 font-normal">{tx.category}</div>
                        </TableCell>
                        <TableCell className={`font-bold text-sm text-right px-4 py-4 whitespace-nowrap font-mono ${isIncome ? 'text-emerald-800' : 'text-red-700'}`}>
                          {isIncome ? '+ ' : '- '}Rp {tx.amount.toLocaleString('id-ID')}
                        </TableCell>
                        <TableCell className="px-4 py-4 whitespace-nowrap">
                          <div className="font-bold text-sm text-gray-900">{tx.paymentMethod}</div>
                          <div className="text-xs text-gray-400 font-normal mt-0.5">{tx.date}</div>
                        </TableCell>
                        <TableCell className="px-4 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border shadow-2xs ${
                            tx.status === 'Berhasil' ? 'text-emerald-800 bg-emerald-50 border-emerald-300' :
                            tx.status === 'Pending' ? 'text-amber-800 bg-amber-50 border-amber-300' :
                            'text-rose-700 bg-rose-50 border-rose-300'
                          }`}>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> {tx.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-center px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleViewTransactionDetail(tx)} 
                              title="Lihat Detail Transaksi"
                              className="h-8 w-8 p-0 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleEditTransaction(tx)} 
                              title="Edit Isian Transaksi"
                              className="h-8 w-8 p-0 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              onClick={() => handleDeleteClick(tx.id)} 
                              title="Hapus Transaksi"
                              className="h-8 w-8 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Tab 3: Receivables & Pilgrim Balance Settlements */}
        {activeTab === 'receivables' && (
          <div className="p-4 sm:p-6 space-y-4">
            <div className="bg-amber-50/80 p-4 rounded-xl border border-amber-200/80 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 leading-relaxed">
                <p className="font-bold">Daftar Jamaah dengan Sisa Tagihan (Piutang Belum Lunas)</p>
                <p className="mt-0.5 text-amber-800 font-normal">
                  Berikut adalah seluruh jamaah yang telah melakukan pendaftaran skema DP namun belum melunasi sisa pembayaran. Klik icon <strong className="font-semibold">Mata</strong> untuk melihat rincian piutang, atau <strong className="font-semibold">"Catat Pelunasan"</strong> untuk mencatat pembayaran langsung.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-gray-200/80 bg-white">
              <Table className="w-full min-w-[850px]">
                <TableHeader className="bg-gray-50/80">
                  <TableRow className="border-b-gray-200">
                    <TableHead className="text-[11px] font-bold text-gray-500 uppercase tracking-wider h-11 whitespace-nowrap px-4 min-w-[220px]">NAMA JAMAAH</TableHead>
                    <TableHead className="text-[11px] font-bold text-gray-500 uppercase tracking-wider h-11 whitespace-nowrap px-4 min-w-[180px]">PAKET & KLOTER</TableHead>
                    <TableHead className="text-[11px] font-bold text-gray-500 uppercase tracking-wider h-11 whitespace-nowrap px-4 text-right min-w-[140px]">TOTAL BIAYA</TableHead>
                    <TableHead className="text-[11px] font-bold text-gray-500 uppercase tracking-wider h-11 whitespace-nowrap px-4 text-right min-w-[150px]">TELAH DIBAYAR (DP)</TableHead>
                    <TableHead className="text-[11px] font-bold text-gray-500 uppercase tracking-wider h-11 whitespace-nowrap px-4 text-right min-w-[150px]">SISA TAGIHAN</TableHead>
                    <TableHead className="text-center text-[11px] font-bold text-gray-500 uppercase tracking-wider h-11 whitespace-nowrap px-4 min-w-[180px]">AKSI</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 animate-fade-in">
                  {pilgrimsWithReceivables.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-emerald-800 font-bold text-xs">
                        <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-600" />
                        Alhamdulillah, seluruh jamaah sudah lunas 100%! Tidak ada piutang tertunggak.
                      </TableCell>
                    </TableRow>
                  ) : (
                    pilgrimsWithReceivables.map((p) => (
                      <TableRow key={p.id} className="hover:bg-gray-50/80 transition-colors">
                        <TableCell className="px-4 py-4">
                          <div className="font-bold text-sm text-gray-900 leading-snug whitespace-nowrap">{p.name}</div>
                          <div className="text-xs text-gray-400 font-mono font-normal mt-0.5">{p.id} • {p.phone || '-'}</div>
                        </TableCell>
                        <TableCell className="px-4 py-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold text-[#782820] bg-[#fcedea] border border-[#f5d0cb] shadow-2xs tracking-wide uppercase">
                            {p.umrahPackage || 'Yamani'}
                          </span>
                          <div className="text-xs text-gray-500 font-normal mt-1">{p.group || 'Tanpa Group'}</div>
                        </TableCell>
                        <TableCell className="font-bold text-sm text-gray-900 text-right px-4 py-4 whitespace-nowrap font-mono">
                          Rp {p.calculatedTotal.toLocaleString('id-ID')}
                        </TableCell>
                        <TableCell className="font-bold text-sm text-emerald-800 text-right px-4 py-4 whitespace-nowrap font-mono">
                          Rp {p.calculatedPaid.toLocaleString('id-ID')}
                        </TableCell>
                        <TableCell className="font-bold text-sm text-amber-950 text-right bg-amber-50/70 px-4 py-4 whitespace-nowrap font-mono">
                          Rp {p.remaining.toLocaleString('id-ID')}
                        </TableCell>
                        <TableCell className="text-center px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleViewReceivableDetail(p)} 
                              title="Lihat Detail Piutang & Jamaah"
                              className="h-8 w-8 p-0 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleOpenEditPilgrimPayment(p)} 
                              title="Edit Data Keuangan & Pembayaran Jamaah"
                              className="h-8 w-8 p-0 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button 
                              onClick={() => handleOpenQuickPay(p)}
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs h-8 px-3 rounded-lg cursor-pointer"
                            >
                              <CreditCard className="w-3.5 h-3.5 mr-1" /> Catat Pelunasan
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </Card>

      {/* Modal: Catat Pengeluaran Baru (Dedicated Expense Modal) */}
      <Dialog open={isExpenseModalOpen} onOpenChange={setIsExpenseModalOpen}>
        <DialogContent hideClose className="w-[95vw] max-w-2xl sm:w-full max-h-[92vh] bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border-0 overflow-y-auto hide-scrollbar">
          {/* Top Bar Header */}
          <div className="flex justify-between items-center pb-5 border-b border-gray-100 mb-6">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                className="px-6 py-2.5 rounded-full text-sm sm:text-base font-bold bg-[#dc2626] text-white shadow-xs cursor-default select-none"
              >
                {expenseForm.id ? 'Edit Pengeluaran' : 'Catat Pengeluaran'}
              </button>
            </div>

            <button
              onClick={() => setIsExpenseModalOpen(false)}
              className="text-gray-400 hover:text-gray-700 p-1.5 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6 animate-fade-in text-left">
            {/* Section 1: INFORMASI PENGELUARAN */}
            <div className="bg-white border border-[#cbd5e1] rounded-3xl p-5 sm:p-7 shadow-2xs">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-7 h-7 rounded-lg border border-gray-300 text-gray-800 bg-white flex items-center justify-center text-xs font-bold font-mono shadow-2xs">
                  1
                </div>
                <h3 className="text-base sm:text-[17px] font-black text-gray-900 uppercase tracking-wide">
                  INFORMASI PENGELUARAN
                </h3>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 items-center">
                  <label className="sm:col-span-4 text-xs sm:text-[13px] font-bold text-gray-600 uppercase tracking-wider">
                    VENDOR *
                  </label>
                  <div className="sm:col-span-8">
                    <Input 
                      value={expenseForm.vendorName || ''}
                      onChange={(e) => setExpenseForm({ ...expenseForm, vendorName: e.target.value })}
                      placeholder="Cth. PT Sinar Busana, Swissôtel Makkah, Ust. Ibrahim"
                      className={`h-12 sm:h-13 rounded-2xl border-gray-300 bg-white text-base ${expenseForm.vendorName ? 'font-bold text-gray-900' : 'font-normal text-gray-400'} placeholder:text-gray-400 placeholder:font-normal px-4 sm:px-5 focus:ring-1 focus:ring-[#dc2626] focus:border-[#dc2626] w-full`}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 items-center">
                  <label className="sm:col-span-4 text-xs sm:text-[13px] font-bold text-gray-600 uppercase tracking-wider">
                    KATEGORI PENGELUARAN *
                  </label>
                  <div className="sm:col-span-8 relative">
                    <Input 
                      list="expense-categories"
                      value={expenseForm.category || ''}
                      onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                      placeholder="Pilih atau ketik kategori pengeluaran..."
                      className={`h-12 sm:h-13 rounded-2xl border-gray-300 bg-white text-base ${expenseForm.category ? 'font-bold text-gray-900' : 'font-normal text-gray-400'} placeholder:text-gray-400 placeholder:font-normal px-4 sm:px-5 focus:ring-1 focus:ring-[#dc2626] focus:border-[#dc2626] w-full`}
                    />
                    <datalist id="expense-categories">
                      <option value="Operasional">Operasional Kantor</option>
                      <option value="Akomodasi & Tiket">Akomodasi & Tiket</option>
                      <option value="Perlengkapan">Perlengkapan Jamaah</option>
                      <option value="Transportasi & Bus">Transportasi & Bus</option>
                      <option value="Honor & SDM">Honor & Bisyarah SDM</option>
                      <option value="Visa & Asuransi">Visa & Asuransi</option>
                      <option value="Catering & Konsumsi">Catering & Konsumsi</option>
                      <option value="Lain-lain">Lain-lain</option>
                    </datalist>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 items-center">
                  <label className="sm:col-span-4 text-xs sm:text-[13px] font-bold text-gray-600 uppercase tracking-wider">
                    NOMINAL (Rp) *
                  </label>
                  <div className="sm:col-span-8">
                    <Input 
                      type="number"
                      value={expenseForm.amount !== undefined && expenseForm.amount > 0 ? expenseForm.amount : ''}
                      onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value ? Number(e.target.value) : undefined })}
                      placeholder="Cth. 5000000"
                      className={`h-12 sm:h-13 rounded-2xl border-gray-300 bg-white text-base ${expenseForm.amount !== undefined && expenseForm.amount > 0 ? 'font-bold text-gray-900' : 'font-normal text-gray-400'} placeholder:text-gray-400 placeholder:font-normal px-4 sm:px-5 focus:ring-1 focus:ring-[#dc2626] focus:border-[#dc2626] w-full`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 items-center">
                  <label className="sm:col-span-4 text-xs sm:text-[13px] font-bold text-gray-600 uppercase tracking-wider">
                    METODE PEMBAYARAN KAS
                  </label>
                  <div className="sm:col-span-8">
                    <select 
                      value={expenseForm.paymentMethod || ''}
                      onChange={(e) => setExpenseForm({ ...expenseForm, paymentMethod: e.target.value })}
                      className={`h-12 sm:h-13 w-full rounded-2xl border border-gray-300 bg-white px-4 sm:px-5 text-base ${expenseForm.paymentMethod ? 'font-bold text-gray-900' : 'font-normal text-gray-400'} focus:outline-none focus:ring-1 focus:ring-[#dc2626] focus:border-[#dc2626] cursor-pointer`}
                    >
                      <PaymentMethodOptions />
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: ADMINISTRASI */}
            <div className="bg-white border border-[#cbd5e1] rounded-3xl p-5 sm:p-7 shadow-2xs">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-7 h-7 rounded-lg border border-gray-300 text-gray-800 bg-white flex items-center justify-center text-xs font-bold font-mono shadow-2xs">
                  2
                </div>
                <h3 className="text-base sm:text-[17px] font-black text-gray-900 uppercase tracking-wide">
                  ADMINISTRASI
                </h3>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 items-center">
                  <label className="sm:col-span-4 text-xs sm:text-[13px] font-bold text-gray-600 uppercase tracking-wider">
                    TANGGAL PENGELUARAN
                  </label>
                  <div className="sm:col-span-8">
                    <Input 
                      type="date"
                      value={expenseForm.date || todayStr}
                      onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                      className={`h-12 sm:h-13 rounded-2xl border-gray-300 bg-white text-base ${expenseForm.date ? 'font-bold text-gray-900' : 'font-normal text-gray-400'} focus:ring-1 focus:ring-[#dc2626] focus:border-[#dc2626] w-full`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 items-center">
                  <label className="sm:col-span-4 text-xs sm:text-[13px] font-bold text-gray-600 uppercase tracking-wider">
                    BUKTI REFERENSI
                  </label>
                  <div className="sm:col-span-8">
                    <Input 
                      value={expenseForm.referenceNo || ''}
                      onChange={(e) => setExpenseForm({ ...expenseForm, referenceNo: e.target.value })}
                      placeholder="Cth. KWT-2026-0811 atau INV-SINAR-99"
                      className={`h-12 sm:h-13 rounded-2xl border-gray-300 bg-white text-base ${expenseForm.referenceNo ? 'font-bold text-gray-900' : 'font-normal text-gray-400'} placeholder:text-gray-400 placeholder:font-normal px-4 sm:px-5 focus:ring-1 focus:ring-[#dc2626] focus:border-[#dc2626] w-full`}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 items-center">
                  <label className="sm:col-span-4 text-xs sm:text-[13px] font-bold text-gray-600 uppercase tracking-wider">
                    CATATAN RINCIAN
                  </label>
                  <div className="sm:col-span-8">
                    <Input 
                      value={expenseForm.notes || ''}
                      onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                      placeholder="Cth. Detail peruntukan pengeluaran operasional / bus jamaah..."
                      className={`h-12 sm:h-13 rounded-2xl border-gray-300 bg-white text-base ${expenseForm.notes ? 'font-bold text-gray-900' : 'font-normal text-gray-400'} placeholder:text-gray-400 placeholder:font-normal px-4 sm:px-5 focus:ring-1 focus:ring-[#dc2626] focus:border-[#dc2626] w-full`}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <Button 
                variant="outline" 
                onClick={() => setIsExpenseModalOpen(false)} 
                className="h-12 rounded-2xl px-7 font-bold text-gray-800 border-gray-300 hover:bg-gray-50 text-base cursor-pointer shadow-2xs"
              >
                Batal
              </Button>
              <Button 
                onClick={handleSaveExpenseNote} 
                className="h-12 rounded-2xl px-8 font-bold text-white bg-[#dc2626] hover:bg-[#b91c1c] text-base cursor-pointer shadow-2xs"
              >
                {expenseForm.id ? 'Simpan Perubahan' : 'Simpan Pengeluaran'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal: Add General Transaction (Pemasukan) */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent hideClose className="w-[95vw] max-w-2xl sm:w-full max-h-[92vh] bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border-0 overflow-y-auto hide-scrollbar">
          {/* Top Bar Header with Tabs */}
          <div className="flex justify-between items-center pb-5 border-b border-gray-100 mb-6">
            <div className="flex items-center gap-2.5">
              {editingTxId ? (
                <button
                  type="button"
                  className="px-6 py-2.5 rounded-full text-sm sm:text-base font-bold bg-[#00a859] text-white shadow-xs cursor-default select-none"
                >
                  Form Edit
                </button>
              ) : (
                <button
                  type="button"
                  className="px-6 py-2.5 rounded-full text-sm sm:text-base font-bold bg-[#00a859] text-white shadow-xs cursor-default select-none"
                >
                  {txForm.type === 'Pengeluaran' ? 'Catat Pengeluaran' : 'Catat Pemasukan'}
                </button>
              )}
            </div>

            <button
              onClick={() => setIsAddModalOpen(false)}
              className="text-gray-400 hover:text-gray-700 p-1.5 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6 animate-fade-in text-left">
            {/* Section 1: INFORMASI TRANSAKSI */}
            <div className="bg-white border border-[#cbd5e1] rounded-3xl p-5 sm:p-7 shadow-2xs">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-7 h-7 rounded-lg border border-gray-300 text-gray-800 bg-white flex items-center justify-center text-xs font-bold font-mono shadow-2xs">
                  1
                </div>
                <h3 className="text-base sm:text-[17px] font-black text-gray-900 uppercase tracking-wide">
                  INFORMASI TRANSAKSI
                </h3>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 items-center">
                  <label className="sm:col-span-4 text-xs sm:text-[13px] font-bold text-gray-600 uppercase tracking-wider">
                    TIPE TRANSAKSI *
                  </label>
                  <div className="sm:col-span-8">
                    <select 
                      value={txForm.type || ''}
                      onChange={(e) => setTxForm({ ...txForm, type: e.target.value as any })}
                      className={`h-12 sm:h-13 w-full rounded-2xl border border-gray-300 bg-white px-4 sm:px-5 text-base ${txForm.type ? 'font-bold text-gray-900' : 'font-normal text-gray-400'} focus:outline-none focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859] cursor-pointer`}
                    >
                      <option value="" className="text-gray-400 font-normal">Pilih Tipe Transaksi</option>
                      <option value="Pemasukan (DP)">Pemasukan (DP Uang Muka)</option>
                      <option value="Pemasukan (Pelunasan)">Pemasukan (Pelunasan Umrah)</option>
                      <option value="Pemasukan (Lunas)">Pemasukan (Lunas Direct)</option>
                      <option value="Pemasukan Lain">Pemasukan Lain-lain</option>
                      <option value="Pengeluaran">Pengeluaran Operasional</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 items-center">
                  <label className="sm:col-span-4 text-xs sm:text-[13px] font-bold text-gray-600 uppercase tracking-wider">
                    NAMA JAMAAH *
                  </label>
                  <div className="sm:col-span-8 relative">
                    <Input 
                      list="pilgrim-datalist-finance"
                      value={txForm.pilgrimName || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        const matched = pilgrims.find(p => p.name.toLowerCase() === val.toLowerCase() || `${p.id} - ${p.name}`.toLowerCase() === val.toLowerCase());
                        if (matched) {
                          setTxForm({ ...txForm, pilgrimName: matched.name, pilgrimId: matched.id });
                        } else {
                          setTxForm({ ...txForm, pilgrimName: val });
                        }
                      }}
                      placeholder="Cth. Ahmad Hidayat"
                      className={`h-12 sm:h-13 rounded-2xl border-gray-300 bg-white text-base ${txForm.pilgrimName ? 'font-bold text-gray-900' : 'font-normal text-gray-400'} placeholder:text-gray-400 placeholder:font-normal px-4 sm:px-5 focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859] w-full`}
                    />
                    <datalist id="pilgrim-datalist-finance">
                      {pilgrims.map(p => (
                        <option key={p.id} value={p.name}>{p.id} - {p.name} ({p.paymentOption || 'Belum Lunas'})</option>
                      ))}
                    </datalist>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 items-center">
                  <label className="sm:col-span-4 text-xs sm:text-[13px] font-bold text-gray-600 uppercase tracking-wider">
                    NOMINAL (Rp) *
                  </label>
                  <div className="sm:col-span-8">
                    <Input 
                      type="number"
                      value={txForm.amount !== undefined && txForm.amount > 0 ? txForm.amount : ''}
                      onChange={(e) => setTxForm({ ...txForm, amount: e.target.value ? Number(e.target.value) : undefined })}
                      placeholder="Cth. 10000000"
                      className={`h-12 sm:h-13 rounded-2xl border-gray-300 bg-white text-base ${txForm.amount !== undefined && txForm.amount > 0 ? 'font-bold text-gray-900' : 'font-normal text-gray-400'} placeholder:text-gray-400 placeholder:font-normal px-4 sm:px-5 focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859]`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 items-center">
                  <label className="sm:col-span-4 text-xs sm:text-[13px] font-bold text-gray-600 uppercase tracking-wider">
                    METODE PEMBAYARAN
                  </label>
                  <div className="sm:col-span-8">
                    <select 
                      value={txForm.paymentMethod || ''}
                      onChange={(e) => setTxForm({ ...txForm, paymentMethod: e.target.value })}
                      className={`h-12 sm:h-13 w-full rounded-2xl border border-gray-300 bg-white px-4 sm:px-5 text-base ${txForm.paymentMethod ? 'font-bold text-gray-900' : 'font-normal text-gray-400'} focus:outline-none focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859] cursor-pointer`}
                    >
                      <PaymentMethodOptions />
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 items-center">
                  <label className="sm:col-span-4 text-xs sm:text-[13px] font-bold text-gray-600 uppercase tracking-wider">
                    KATEGORI TRANSAKSI
                  </label>
                  <div className="sm:col-span-8 relative">
                    <Input 
                      list="income-categories"
                      value={txForm.category || ''}
                      onChange={(e) => setTxForm({ ...txForm, category: e.target.value as any })}
                      placeholder="Cth. Pendaftaran Umrah"
                      className={`h-12 sm:h-13 rounded-2xl border-gray-300 bg-white text-base ${txForm.category ? 'font-bold text-gray-900' : 'font-normal text-gray-400'} placeholder:text-gray-400 placeholder:font-normal px-4 sm:px-5 focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859] w-full`}
                    />
                    <datalist id="income-categories">
                      <option value="Pendaftaran Umrah">Pendaftaran Umrah</option>
                      <option value="Pelunasan Umrah">Pelunasan Umrah</option>
                      <option value="Perlengkapan">Perlengkapan</option>
                      <option value="Akomodasi & Tiket">Akomodasi & Tiket</option>
                      <option value="Operasional">Operasional</option>
                      <option value="Lain-lain">Lain-lain</option>
                    </datalist>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 items-center">
                  <label className="sm:col-span-4 text-xs sm:text-[13px] font-bold text-gray-600 uppercase tracking-wider">
                    STATUS TRANSAKSI
                  </label>
                  <div className="sm:col-span-8">
                    <select 
                      value={txForm.status || ''}
                      onChange={(e) => setTxForm({ ...txForm, status: e.target.value as any })}
                      className={`h-12 sm:h-13 w-full rounded-2xl border border-gray-300 bg-white px-4 sm:px-5 text-base ${txForm.status ? 'font-bold text-gray-900' : 'font-normal text-gray-400'} focus:outline-none focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859] cursor-pointer`}
                    >
                      <option value="" className="text-gray-400 font-normal">Pilih Status Transaksi</option>
                      <option value="Berhasil">Berhasil</option>
                      <option value="Pending">Pending</option>
                      <option value="Gagal">Dibatalkan</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: ADMINISTRASI */}
            <div className="bg-white border border-[#cbd5e1] rounded-3xl p-5 sm:p-7 shadow-2xs">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-7 h-7 rounded-lg border border-gray-300 text-gray-800 bg-white flex items-center justify-center text-xs font-bold font-mono shadow-2xs">
                  2
                </div>
                <h3 className="text-base sm:text-[17px] font-black text-gray-900 uppercase tracking-wide">
                  ADMINISTRASI
                </h3>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 items-center">
                  <label className="sm:col-span-4 text-xs sm:text-[13px] font-bold text-gray-600 uppercase tracking-wider">
                    TANGGAL TRANSAKSI
                  </label>
                  <div className="sm:col-span-8">
                    <Input 
                      type="date"
                      value={txForm.date || todayStr}
                      onChange={(e) => setTxForm({ ...txForm, date: e.target.value })}
                      className={`h-12 sm:h-13 rounded-2xl border-gray-300 bg-white text-base ${txForm.date ? 'font-bold text-gray-900' : 'font-normal text-gray-400'} focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859]`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 items-center">
                  <label className="sm:col-span-4 text-xs sm:text-[13px] font-bold text-gray-600 uppercase tracking-wider">
                    BUKTI REFERENSI
                  </label>
                  <div className="sm:col-span-8">
                    <Input 
                      value={txForm.referenceNo || ''}
                      onChange={(e) => setTxForm({ ...txForm, referenceNo: e.target.value })}
                      placeholder="Cth. REF-881029"
                      className={`h-12 sm:h-13 rounded-2xl border-gray-300 bg-white text-base ${txForm.referenceNo ? 'font-bold text-gray-900' : 'font-normal text-gray-400'} placeholder:text-gray-400 placeholder:font-normal px-4 sm:px-5 focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859]`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-4 items-center">
                  <label className="sm:col-span-4 text-xs sm:text-[13px] font-bold text-gray-600 uppercase tracking-wider">
                    CATATAN RINCIAN
                  </label>
                  <div className="sm:col-span-8">
                    <Input 
                      value={txForm.notes || ''}
                      onChange={(e) => setTxForm({ ...txForm, notes: e.target.value })}
                      placeholder="Cth. Transfer via BCA Rekening Utama"
                      className={`h-12 sm:h-13 rounded-2xl border-gray-300 bg-white text-base ${txForm.notes ? 'font-bold text-gray-900' : 'font-normal text-gray-400'} placeholder:text-gray-400 placeholder:font-normal px-4 sm:px-5 focus:ring-1 focus:ring-[#00a859] focus:border-[#00a859]`}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <Button 
                variant="outline" 
                onClick={() => setIsAddModalOpen(false)} 
                className="h-12 rounded-2xl px-7 font-bold text-gray-800 border-gray-300 hover:bg-gray-50 text-base cursor-pointer shadow-2xs"
              >
                Batal
              </Button>
              <Button 
                onClick={handleSaveTransaction} 
                className="h-12 rounded-2xl px-8 font-bold text-white bg-[#00a859] hover:bg-[#008f4c] text-base cursor-pointer shadow-2xs"
              >
                {editingTxId ? 'Simpan Perubahan' : (txForm.type === 'Pengeluaran' ? 'Simpan Pengeluaran' : 'Simpan Pemasukan')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal: Quick Balance Settlement (Pelunasan Jamaah) */}
      <Dialog open={isPayModalOpen} onOpenChange={setIsPayModalOpen}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" /> Form Pelunasan Sisa Tagihan
            </DialogTitle>
          </DialogHeader>

          {selectedPilgrimForPay && (
            <div className="space-y-4 py-2">
              <div className="bg-emerald-50 p-3.5 rounded-xl border border-emerald-200">
                <span className="text-[11px] uppercase tracking-wider text-emerald-800 font-semibold block">Jamaah</span>
                <span className="text-sm font-bold text-emerald-950 block">{selectedPilgrimForPay.name}</span>
                <span className="text-xs text-emerald-800 font-medium block mt-0.5">{selectedPilgrimForPay.umrahPackage}</span>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1 block">Nominal Pelunasan (Rp) *</label>
                <Input 
                  type="number"
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="h-10 font-bold text-emerald-900 text-sm focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1 block">Metode Pembayaran Pelunasan</label>
                <select 
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="flex h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  <PaymentMethodOptions />
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1 block">Catatan Pelunasan</label>
                <Input 
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="h-10 text-xs font-normal"
                />
              </div>
            </div>
          )}

          <DialogFooter className="pt-3 border-t border-gray-100 flex gap-2">
            <Button variant="outline" className="font-semibold text-xs" onClick={() => setIsPayModalOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleConfirmQuickPay} className="bg-green-700 hover:bg-green-800 text-white font-semibold text-xs">
              Proses Pelunasan Lunas
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: View General / Income / Expense Transaction Detail */}
      <Dialog open={isTxDetailModalOpen} onOpenChange={setIsTxDetailModalOpen}>
        <DialogContent hideClose className="w-[95vw] max-w-2xl sm:w-full max-h-[90vh] bg-white rounded-2xl p-4 sm:p-6 overflow-hidden flex flex-col shadow-xl border border-gray-100">
          <DialogHeader className="border-b border-gray-100 pb-3 flex flex-row items-center justify-between">
            <DialogTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-700" />
              Detail Transaksi Keuangan
            </DialogTitle>
            {selectedDetailTx && (
              <Badge 
                variant={
                  selectedDetailTx.status === 'Berhasil' ? "success" : 
                  selectedDetailTx.status === 'Pending' ? "warning" : "destructive"
                } 
                className="text-[10px] font-semibold"
              >
                <CheckCircle2 className="w-3 h-3 mr-1" />
                {selectedDetailTx.status}
              </Badge>
            )}
          </DialogHeader>

          {selectedDetailTx && (() => {
            const isIncome = selectedDetailTx.type.startsWith('Pemasukan');
            const matchedPilgrim = pilgrims.find(p => 
              (selectedDetailTx.pilgrimId && p.id === selectedDetailTx.pilgrimId) || 
              p.name.toLowerCase() === selectedDetailTx.pilgrimName.toLowerCase()
            );

            return (
              <div className="space-y-4 py-2 overflow-y-auto max-h-[72vh] pr-1">
                {matchedPilgrim && (
                  <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                    <Button 
                      variant={txDetailModalTab === 'transaksi' ? 'default' : 'outline'} 
                      size="sm" 
                      className={`text-xs font-semibold cursor-pointer transition-all duration-200 active:scale-95 select-none ${
                        txDetailModalTab === 'transaksi' ? 'bg-emerald-700 text-white hover:bg-emerald-800' : 'text-gray-600'
                      }`}
                      onClick={() => setTxDetailModalTab('transaksi')}
                    >
                      <Receipt className="w-3.5 h-3.5 mr-1.5" />
                      Bukti Transaksi
                    </Button>
                    <Button 
                      variant={txDetailModalTab === 'data-diri' ? 'default' : 'outline'} 
                      size="sm" 
                      className={`text-xs font-semibold cursor-pointer transition-all duration-200 active:scale-95 select-none ${
                        txDetailModalTab === 'data-diri' ? 'bg-emerald-700 text-white hover:bg-emerald-800' : 'text-gray-600'
                      }`}
                      onClick={() => setTxDetailModalTab('data-diri')}
                    >
                      <User className="w-3.5 h-3.5 mr-1.5" />
                      Data Diri Jamaah (Pendaftaran)
                    </Button>
                  </div>
                )}

                {txDetailModalTab === 'transaksi' ? (
                  <>
                    {/* Amount Banner */}
                    <div className={`text-center p-4 rounded-xl border space-y-1.5 shadow-2xs ${
                      isIncome 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-red-50 border-red-200'
                    }`}>
                      <p className={`text-[11px] font-semibold uppercase tracking-wider ${
                        isIncome ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {isIncome ? 'Nominal Pemasukan Kas' : 'Nominal Pengeluaran Kas'}
                      </p>
                      <p className={`text-2xl font-bold tracking-tight ${
                        isIncome ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {isIncome ? '+ ' : '- '}Rp {selectedDetailTx.amount.toLocaleString('id-ID')}
                      </p>
                    </div>

                    {/* Primary Transaction Attributes */}
                    <div className="space-y-2 text-xs divide-y divide-gray-100 bg-white p-3.5 rounded-xl border border-gray-100 shadow-2xs">
                      <div className="flex justify-between py-1.5 items-center">
                        <span className="text-gray-500 font-medium">Nama</span>
                        <span className="font-bold text-gray-900">{selectedDetailTx.pilgrimName}</span>
                      </div>
                      <div className="flex justify-between py-1.5 items-center">
                        <span className="text-gray-500 font-medium">Tipe Transaksi</span>
                        <Badge variant={isIncome ? "success" : "destructive"} className="text-[10px] font-semibold">
                          {selectedDetailTx.type}
                        </Badge>
                      </div>
                      <div className="flex justify-between py-1.5 items-center">
                        <span className="text-gray-500 font-medium">Kategori</span>
                        <span className="font-semibold text-gray-900">{selectedDetailTx.category}</span>
                      </div>
                      <div className="flex justify-between py-1.5 items-center">
                        <span className="text-gray-500 font-medium">Metode</span>
                        <span className="font-semibold text-gray-900">{selectedDetailTx.paymentMethod}</span>
                      </div>
                      <div className="flex justify-between py-1.5 items-center">
                        <span className="text-gray-500 font-medium">Tanggal Transaksi</span>
                        <span className="font-semibold text-gray-900">{selectedDetailTx.date}</span>
                      </div>
                      <div className="flex justify-between py-1.5 items-center">
                        <span className="text-gray-500 font-medium">Bukti</span>
                        <span className="font-mono text-gray-700 font-medium">{selectedDetailTx.referenceNo || '-'}</span>
                      </div>
                    </div>

                    {/* Quick Link to Pilgrim Information */}
                    {matchedPilgrim && (
                      <div className="bg-slate-50/80 p-4 rounded-xl border border-gray-200/80 space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-gray-200/70">
                          <span className="font-bold text-gray-900 text-xs flex items-center gap-2">
                            <span className="w-5 h-5 rounded-md bg-emerald-100 flex items-center justify-center text-emerald-800">
                              <User className="w-3.5 h-3.5" />
                            </span>
                            Informasi Jamaah Terkait
                          </span>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 text-xs text-emerald-700 font-semibold px-2 hover:bg-emerald-50"
                            onClick={() => setTxDetailModalTab('data-diri')}
                          >
                            Lihat Data Lengkap &rarr;
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs">
                          <div className="space-y-0.5">
                            <span className="text-gray-500 text-[11px] font-medium block">ID Jamaah</span>
                            <span className="font-semibold text-gray-900 block leading-tight">{matchedPilgrim.id}</span>
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-gray-500 text-[11px] font-medium block">Paket Umrah</span>
                            <span className="font-semibold text-gray-900 block leading-tight">{matchedPilgrim.umrahPackage || '-'}</span>
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-gray-500 text-[11px] font-medium block">Kloter</span>
                            <span className="font-semibold text-gray-900 block leading-tight">{matchedPilgrim.group || 'Tanpa Group'}</span>
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-gray-500 text-[11px] font-medium block">No. HP</span>
                            <span className="font-semibold text-gray-900 block leading-tight">{matchedPilgrim.phone || '-'}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Notes Section */}
                    {selectedDetailTx.notes && (
                      <div className="text-xs space-y-1">
                        <span className="text-gray-500 font-medium block">Keterangan:</span>
                        <p className="p-3 bg-gray-50 rounded-xl text-gray-700 italic border border-gray-200/80 leading-relaxed font-normal">
                          "{selectedDetailTx.notes}"
                        </p>
                      </div>
                    )}
                  </>
                ) : matchedPilgrim && (
                  <div className="space-y-5">
                    {/* Section 1: Informasi Diri & Identitas */}
                    <div>
                      <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2.5 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-bold">1</span>
                        Informasi Pribadi & Identitas
                      </h4>
                      <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100 text-xs">
                        {matchedPilgrim.formId && (
                          <div className="flex justify-between p-2.5 items-center">
                            <span className="text-gray-600 font-semibold flex items-center gap-2">
                              <FileCheck className="w-3.5 h-3.5 text-emerald-700" /> Form ID
                            </span>
                            <span className="font-bold text-gray-900">{matchedPilgrim.formId}</span>
                          </div>
                        )}
                        <div className="flex justify-between p-2.5 items-center">
                          <span className="text-gray-600 font-semibold flex items-center gap-2">
                            <CreditCard className="w-3.5 h-3.5 text-emerald-700" /> ID Jamaah
                          </span>
                          <span className="font-bold text-gray-900">{matchedPilgrim.id}</span>
                        </div>
                        <div className="flex justify-between p-2.5 items-center">
                          <span className="text-gray-600 font-semibold flex items-center gap-2">
                            <User className="w-3.5 h-3.5 text-emerald-700" /> Nama Lengkap
                          </span>
                          <span className="font-bold text-gray-900">{matchedPilgrim.name}</span>
                        </div>
                        <div className="flex justify-between p-2.5 items-center">
                          <span className="text-gray-600 font-semibold flex items-center gap-2">
                            <BookOpen className="w-3.5 h-3.5 text-emerald-700" /> No. Paspor
                          </span>
                          <span className="font-bold text-gray-900">{matchedPilgrim.passport || 'X-99821014'} <span className="text-gray-500 font-normal">(Berlaku)</span></span>
                        </div>
                        <div className="flex justify-between p-2.5 items-center">
                          <span className="text-gray-600 font-semibold flex items-center gap-2">
                            <FileCheck className="w-3.5 h-3.5 text-emerald-700" /> No. KTP / NIK
                          </span>
                          <span className="font-bold text-gray-900">{matchedPilgrim.ktp || '3201234567890001'}</span>
                        </div>
                        <div className="flex justify-between p-2.5 items-center">
                          <span className="text-gray-600 font-semibold flex items-center gap-2">
                            <FileCheck className="w-3.5 h-3.5 text-emerald-700" /> No. Visa Umrah
                          </span>
                          <span className="font-bold text-gray-900">{matchedPilgrim.visaNumber || 'VSA-2026-99210-SA'}</span>
                        </div>
                        <div className="flex justify-between p-2.5 items-center">
                          <span className="text-gray-600 font-semibold flex items-center gap-2">
                            <UserCheck className="w-3.5 h-3.5 text-emerald-700" /> Jenis Kelamin
                          </span>
                          <span className="font-bold text-gray-900">{matchedPilgrim.gender}</span>
                        </div>
                        <div className="flex justify-between p-2.5 items-center">
                          <span className="text-gray-600 font-semibold flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-emerald-700" /> Usia / Tgl Lahir
                          </span>
                          <span className="font-bold text-gray-900">{matchedPilgrim.age || 48} Thn ({matchedPilgrim.birthDate || '14 Mei 1978'})</span>
                        </div>
                        <div className="flex justify-between p-2.5 items-center">
                          <span className="text-gray-600 font-semibold flex items-center gap-2">
                            <Phone className="w-3.5 h-3.5 text-emerald-700" /> No. Telepon
                          </span>
                          <span className="font-bold text-gray-900">{matchedPilgrim.phone || '-'}</span>
                        </div>
                        <div className="flex justify-between p-2.5 items-center">
                          <span className="text-gray-600 font-semibold flex items-center gap-2">
                            <AlertCircle className="w-3.5 h-3.5 text-emerald-700" /> Kontak Darurat
                          </span>
                          <span className="font-bold text-gray-900">{matchedPilgrim.emergencyContact || 'Keluarga Jamaah (+62 811-9988-7766)'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Administrasi & Rincian Perjalanan */}
                    <div>
                      <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2.5 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-bold">2</span>
                        Rincian Pendaftaran & Perjalanan
                      </h4>
                      <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100 text-xs">
                        <div className="flex justify-between p-2.5 items-center">
                          <span className="text-gray-600 font-semibold">Tanggal Pendaftaran</span>
                          <span className="font-bold text-gray-900">{matchedPilgrim.registrationDate || '10 Jan 2026'}</span>
                        </div>
                        <div className="flex justify-between p-2.5 items-center">
                          <span className="text-gray-600 font-semibold">Pilihan Paket Umrah</span>
                          <Badge variant="secondary" className="font-bold text-emerald-800 bg-emerald-50 border border-emerald-200">
                            {matchedPilgrim.umrahPackage || 'Yamani'}
                          </Badge>
                        </div>
                        <div className="flex justify-between p-2.5 items-center">
                          <span className="text-gray-600 font-semibold">Kloter Keberangkatan</span>
                          <span className="font-bold text-gray-900">{matchedPilgrim.group || 'Kloter 4 Al-Barakah'}</span>
                        </div>
                        <div className="flex justify-between p-2.5 items-center">
                          <span className="text-gray-600 font-semibold">Tour Leader (TL)</span>
                          <span className="font-semibold text-gray-800">{matchedPilgrim.tourLeader || 'Ust. H. Muhammad Ridwan (TL)'}</span>
                        </div>
                        <div className="flex justify-between p-2.5 items-center">
                          <span className="text-gray-600 font-semibold">Mutawif Lokal</span>
                          <span className="font-semibold text-gray-800">{matchedPilgrim.mutawifLocal || 'Ust. Ibrahim Al-Madani'}</span>
                        </div>
                        <div className="flex justify-between p-2.5 items-center">
                          <span className="text-gray-600 font-semibold">Hotel Makkah</span>
                          <span className="font-semibold text-gray-800">{matchedPilgrim.hotelMakkah || matchedPilgrim.hotel || 'Swissôtel Al Maqam Makkah'}</span>
                        </div>
                        <div className="flex justify-between p-2.5 items-center">
                          <span className="text-gray-600 font-semibold">Hotel Madinah</span>
                          <span className="font-semibold text-gray-800">{matchedPilgrim.hotelMadinah || 'Anwar Al Madinah Movenpick'}</span>
                        </div>
                        <div className="flex justify-between p-2.5 items-center">
                          <span className="text-gray-600 font-semibold">Jadwal Keberangkatan</span>
                          <span className="font-bold text-gray-900">{matchedPilgrim.departureDate || '10 Juli 2026'} <span className="text-gray-500 font-normal">(CGK - JED)</span></span>
                        </div>
                        <div className="flex justify-between p-2.5 items-center">
                          <span className="text-gray-600 font-semibold">Jadwal Kepulangan</span>
                          <span className="font-bold text-gray-900">{matchedPilgrim.returnDate || '22 Juli 2026'} <span className="text-gray-500 font-normal">(MED - CGK)</span></span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          <DialogFooter className="pt-3 border-t border-gray-100 flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              className="font-semibold text-xs border-gray-200"
              onClick={() => {
                window.print();
                toast("Mencetak kuitansi transaksi...", "info");
              }}
            >
              <Printer className="w-4 h-4 mr-1.5" /> Cetak Bukti Kuitansi
            </Button>
            {selectedDetailTx && (
              <Button 
                variant="outline"
                className="font-semibold text-xs text-blue-700 border-blue-200 hover:bg-blue-50"
                onClick={() => handleEditTransaction(selectedDetailTx)}
              >
                <Edit2 className="w-3.5 h-3.5 mr-1.5 text-blue-600" /> Edit Isian Transaksi
              </Button>
            )}
            <Button className="font-semibold text-xs bg-[#740A03] hover:bg-[#580802] text-white" onClick={() => setIsTxDetailModalOpen(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: View Pilgrim Receivable & Complete Registration Detail */}
      <Dialog open={isReceivableDetailModalOpen} onOpenChange={setIsReceivableDetailModalOpen}>
        <DialogContent hideClose className="w-[95vw] max-w-3xl sm:w-full max-h-[92vh] bg-white rounded-2xl p-4 sm:p-6 overflow-hidden flex flex-col shadow-xl border border-gray-100">
          <DialogHeader className="border-b border-gray-100 pb-3 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Button 
                variant={receivableModalTab === 'data-diri' ? 'default' : 'outline'} 
                size="sm"
                className={`text-xs font-semibold cursor-pointer transition-all duration-200 active:scale-95 select-none ${
                  receivableModalTab === 'data-diri' ? 'bg-emerald-700 text-white hover:bg-emerald-800' : 'text-gray-600'
                }`}
                onClick={() => setReceivableModalTab('data-diri')}
              >
                <User className="w-3.5 h-3.5 mr-1.5" />
                Data Diri Lengkap Jamaah
              </Button>
              <Button 
                variant={receivableModalTab === 'tagihan-keuangan' ? 'default' : 'outline'} 
                size="sm"
                className={`text-xs font-semibold cursor-pointer transition-all duration-200 active:scale-95 select-none ${
                  receivableModalTab === 'tagihan-keuangan' ? 'bg-emerald-700 text-white hover:bg-emerald-800' : 'text-gray-600'
                }`}
                onClick={() => setReceivableModalTab('tagihan-keuangan')}
              >
                <CreditCard className="w-3.5 h-3.5 mr-1.5" />
                Rincian Tagihan & Transaksi
              </Button>
            </div>
            {selectedDetailReceivable && (
              <Badge variant="warning" className="text-[10px] font-semibold shrink-0">
                <Clock className="w-3 h-3 mr-1" />
                BELUM LUNAS
              </Badge>
            )}
          </DialogHeader>

          {selectedDetailReceivable && (() => {
            const pilgrimTxList = financeTransactions.filter(t => 
              (t.pilgrimId && t.pilgrimId === selectedDetailReceivable.id) ||
              t.pilgrimName.toLowerCase() === selectedDetailReceivable.name.toLowerCase()
            );

            const percentPaid = selectedDetailReceivable.calculatedTotal > 0
              ? Math.min(100, Math.round((selectedDetailReceivable.calculatedPaid / selectedDetailReceivable.calculatedTotal) * 100))
              : 0;

            return (
              <div className="space-y-6 py-3 overflow-y-auto max-h-[74vh] pr-1.5">
                {receivableModalTab === 'data-diri' ? (
                  <div className="space-y-6">
                    {/* Header Banner Identity */}
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-700 text-white flex items-center justify-center font-bold text-base shadow-xs">
                          {selectedDetailReceivable.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-gray-900">{selectedDetailReceivable.name}</h3>
                            <Badge variant="outline" className="font-mono text-[10px] bg-white text-gray-700 border-gray-300">
                              {selectedDetailReceivable.id}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-600 font-medium mt-0.5">
                            {selectedDetailReceivable.gender} • {selectedDetailReceivable.age || 48} Tahun • {selectedDetailReceivable.phone || '-'}
                          </p>
                        </div>
                      </div>
                      <div className="text-left sm:text-right">
                        <span className="text-[10px] uppercase tracking-wider font-semibold text-emerald-800 block">Paket Umrah</span>
                        <span className="font-bold text-emerald-900 text-xs">{selectedDetailReceivable.umrahPackage || 'Yamani'}</span>
                      </div>
                    </div>

                    {/* Section 1: Informasi Diri & Identitas Lengkap */}
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold">1</span>
                        Informasi Pribadi & Identitas Pendaftaran
                      </h4>
                      <div className="bg-white border border-gray-200/90 rounded-2xl shadow-2xs overflow-hidden divide-y divide-gray-100">
                        {selectedDetailReceivable.formId && (
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 gap-1 sm:gap-4 hover:bg-gray-50/50 transition-colors">
                            <div className="flex items-center gap-3 text-gray-600 font-semibold text-xs shrink-0">
                              <FileCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                              <span>Form ID Pendaftaran</span>
                            </div>
                            <span className="font-bold text-gray-900 text-xs sm:text-right break-words">{selectedDetailReceivable.formId}</span>
                          </div>
                        )}

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 gap-1 sm:gap-4 hover:bg-gray-50/50 transition-colors">
                          <div className="flex items-center gap-3 text-gray-600 font-semibold text-xs shrink-0">
                            <CreditCard className="w-4 h-4 text-emerald-700 shrink-0" />
                            <span>ID Jamaah</span>
                          </div>
                          <span className="font-bold text-gray-900 text-xs sm:text-right break-words">{selectedDetailReceivable.id}</span>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 gap-1 sm:gap-4 hover:bg-gray-50/50 transition-colors">
                          <div className="flex items-center gap-3 text-gray-600 font-semibold text-xs shrink-0">
                            <User className="w-4 h-4 text-emerald-700 shrink-0" />
                            <span>Nama Lengkap (Sesuai KTP)</span>
                          </div>
                          <span className="font-bold text-gray-900 text-xs sm:text-right break-words">{selectedDetailReceivable.name}</span>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 gap-1 sm:gap-4 hover:bg-gray-50/50 transition-colors">
                          <div className="flex items-center gap-3 text-gray-600 font-semibold text-xs shrink-0">
                            <FileCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                            <span>Nomor Induk Kependudukan (NIK)</span>
                          </div>
                          <span className="font-bold text-gray-900 text-xs sm:text-right break-words">{selectedDetailReceivable.ktp || '3201234567890001'}</span>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 gap-1 sm:gap-4 hover:bg-gray-50/50 transition-colors">
                          <div className="flex items-center gap-3 text-gray-600 font-semibold text-xs shrink-0">
                            <BookOpen className="w-4 h-4 text-emerald-700 shrink-0" />
                            <span>Nomor Paspor</span>
                          </div>
                          <span className="font-bold text-gray-900 text-xs sm:text-right break-words">
                            {selectedDetailReceivable.passport || 'X-99821014'} <span className="text-gray-500 font-normal">(Berlaku s/d 2031)</span>
                          </span>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 gap-1 sm:gap-4 hover:bg-gray-50/50 transition-colors">
                          <div className="flex items-center gap-3 text-gray-600 font-semibold text-xs shrink-0">
                            <FileCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                            <span>Nomor Visa Umrah</span>
                          </div>
                          <span className="font-bold text-gray-900 text-xs sm:text-right break-words">{selectedDetailReceivable.visaNumber || 'VSA-2026-99210-SA'}</span>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 gap-1 sm:gap-4 hover:bg-gray-50/50 transition-colors">
                          <div className="flex items-center gap-3 text-gray-600 font-semibold text-xs shrink-0">
                            <Flag className="w-4 h-4 text-emerald-700 shrink-0" />
                            <span>Kewarganegaraan</span>
                          </div>
                          <span className="font-bold text-gray-900 text-xs sm:text-right break-words">{selectedDetailReceivable.nationality || 'Indonesia (WNI)'}</span>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 gap-1 sm:gap-4 hover:bg-gray-50/50 transition-colors">
                          <div className="flex items-center gap-3 text-gray-600 font-semibold text-xs shrink-0">
                            <UserCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                            <span>Jenis Kelamin</span>
                          </div>
                          <span className="font-bold text-gray-900 text-xs sm:text-right break-words">
                            {selectedDetailReceivable.gender === 'Laki-laki' ? 'Laki-laki (Pria)' : 'Perempuan (Wanita)'}
                          </span>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 gap-1 sm:gap-4 hover:bg-gray-50/50 transition-colors">
                          <div className="flex items-center gap-3 text-gray-600 font-semibold text-xs shrink-0">
                            <Calendar className="w-4 h-4 text-emerald-700 shrink-0" />
                            <span>Tanggal Lahir & Usia</span>
                          </div>
                          <span className="font-bold text-gray-900 text-xs sm:text-right break-words">
                            {selectedDetailReceivable.birthDate || '14 Mei 1978'} <span className="text-gray-500 font-normal">({selectedDetailReceivable.age || 48} Tahun)</span>
                          </span>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 gap-1 sm:gap-4 hover:bg-gray-50/50 transition-colors">
                          <div className="flex items-center gap-3 text-gray-600 font-semibold text-xs shrink-0">
                            <Phone className="w-4 h-4 text-emerald-700 shrink-0" />
                            <span>Nomor WhatsApp</span>
                          </div>
                          <span className="font-bold text-gray-900 text-xs sm:text-right break-words">{selectedDetailReceivable.phone || '+62 812-3456-7890'}</span>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 gap-1 sm:gap-4 hover:bg-gray-50/50 transition-colors">
                          <div className="flex items-center gap-3 text-gray-600 font-semibold text-xs shrink-0">
                            <AlertCircle className="w-4 h-4 text-emerald-700 shrink-0" />
                            <span>Kontak Darurat Keluarga</span>
                          </div>
                          <span className="font-bold text-gray-900 text-xs sm:text-right break-words">{selectedDetailReceivable.emergencyContact || 'Keluarga Jamaah (+62 811-9988-7766)'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Rincian Paket & Perjalanan */}
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold">2</span>
                        Rincian Pendaftaran, Paket & Perjalanan
                      </h4>
                      <div className="bg-white border border-gray-200/90 rounded-2xl shadow-2xs overflow-hidden divide-y divide-gray-100">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 gap-1 sm:gap-4 hover:bg-gray-50/50 transition-colors">
                          <div className="flex items-center gap-3 text-gray-600 font-semibold text-xs shrink-0">
                            <Calendar className="w-4 h-4 text-emerald-700 shrink-0" />
                            <span>Tanggal Pendaftaran</span>
                          </div>
                          <span className="font-bold text-gray-900 text-xs sm:text-right break-words">{selectedDetailReceivable.registrationDate || '10 Jan 2026'}</span>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 gap-1 sm:gap-4 hover:bg-gray-50/50 transition-colors">
                          <div className="flex items-center gap-3 text-gray-600 font-semibold text-xs shrink-0">
                            <Package className="w-4 h-4 text-emerald-700 shrink-0" />
                            <span>Paket Umrah Terpilih</span>
                          </div>
                          <Badge variant="secondary" className="font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 text-xs">
                            {selectedDetailReceivable.umrahPackage || 'Yamani'}
                          </Badge>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 gap-1 sm:gap-4 hover:bg-gray-50/50 transition-colors">
                          <div className="flex items-center gap-3 text-gray-600 font-semibold text-xs shrink-0">
                            <Users className="w-4 h-4 text-emerald-700 shrink-0" />
                            <span>Kloter Keberangkatan</span>
                          </div>
                          <span className="font-bold text-gray-900 text-xs sm:text-right break-words">{selectedDetailReceivable.group || 'Kloter 4 Al-Barakah'}</span>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 gap-1 sm:gap-4 hover:bg-gray-50/50 transition-colors">
                          <div className="flex items-center gap-3 text-gray-600 font-semibold text-xs shrink-0">
                            <UserCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                            <span>Tour Leader</span>
                          </div>
                          <span className="font-semibold text-gray-800 text-xs sm:text-right break-words">{selectedDetailReceivable.tourLeader || 'Ust. H. Muhammad Ridwan (TL)'}</span>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 gap-1 sm:gap-4 hover:bg-gray-50/50 transition-colors">
                          <div className="flex items-center gap-3 text-gray-600 font-semibold text-xs shrink-0">
                            <User className="w-4 h-4 text-emerald-700 shrink-0" />
                            <span>Mutawif Lokal</span>
                          </div>
                          <span className="font-semibold text-gray-800 text-xs sm:text-right break-words">{selectedDetailReceivable.mutawifLocal || 'Ust. Ibrahim Al-Madani'}</span>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 gap-1 sm:gap-4 hover:bg-gray-50/50 transition-colors">
                          <div className="flex items-center gap-3 text-gray-600 font-semibold text-xs shrink-0">
                            <Building2 className="w-4 h-4 text-emerald-700 shrink-0" />
                            <span>Hotel Makkah</span>
                          </div>
                          <span className="font-semibold text-gray-800 text-xs sm:text-right break-words">{selectedDetailReceivable.hotelMakkah || selectedDetailReceivable.hotel || 'Swissôtel Al Maqam Makkah'}</span>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 gap-1 sm:gap-4 hover:bg-gray-50/50 transition-colors">
                          <div className="flex items-center gap-3 text-gray-600 font-semibold text-xs shrink-0">
                            <Building2 className="w-4 h-4 text-emerald-700 shrink-0" />
                            <span>Hotel Madinah</span>
                          </div>
                          <span className="font-semibold text-gray-800 text-xs sm:text-right break-words">{selectedDetailReceivable.hotelMadinah || 'Anwar Al Madinah Movenpick'}</span>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 gap-1 sm:gap-4 hover:bg-gray-50/50 transition-colors">
                          <div className="flex items-center gap-3 text-gray-600 font-semibold text-xs shrink-0">
                            <PlaneTakeoff className="w-4 h-4 text-emerald-700 shrink-0" />
                            <span>Jadwal Keberangkatan</span>
                          </div>
                          <span className="font-bold text-gray-900 text-xs sm:text-right break-words">
                            {selectedDetailReceivable.departureDate || '10 Juli 2026'} <span className="text-gray-500 font-normal">(CGK - JED)</span>
                          </span>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 gap-1 sm:gap-4 hover:bg-gray-50/50 transition-colors">
                          <div className="flex items-center gap-3 text-gray-600 font-semibold text-xs shrink-0">
                            <PlaneLanding className="w-4 h-4 text-emerald-700 shrink-0" />
                            <span>Jadwal Kepulangan</span>
                          </div>
                          <span className="font-bold text-gray-900 text-xs sm:text-right break-words">
                            {selectedDetailReceivable.returnDate || '22 Juli 2026'} <span className="text-gray-500 font-normal">(MED - CGK)</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Section 3: Status Berkas & Kelengkapan Dokumen */}
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold">3</span>
                        Status Kelengkapan Dokumen & Vaksin
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-4 rounded-2xl border border-gray-200/90 shadow-2xs">
                        <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50/70 border border-gray-100">
                          <div className="flex items-center gap-2.5">
                            <ShieldCheck className="w-4 h-4 text-emerald-700" />
                            <span className="text-xs font-semibold text-gray-800">Vaksin Meningitis</span>
                          </div>
                          {selectedDetailReceivable.meningitis ? (
                            <Badge className="bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold text-[10px] px-2 py-0.5">
                              <Check className="w-3 h-3 mr-1 text-emerald-600" /> Sudah Vaksin
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300 font-bold text-[10px] px-2 py-0.5">
                              <AlertCircle className="w-3 h-3 mr-1 text-amber-600" /> Belum Vaksin
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50/70 border border-gray-100">
                          <div className="flex items-center gap-2.5">
                            <FileCheck className="w-4 h-4 text-emerald-700" />
                            <span className="text-xs font-semibold text-gray-800">Pas Foto 4x6</span>
                          </div>
                          {selectedDetailReceivable.photo ? (
                            <Badge className="bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold text-[10px] px-2 py-0.5">
                              <Check className="w-3 h-3 mr-1 text-emerald-600" /> Diserahkan
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300 font-bold text-[10px] px-2 py-0.5">
                              <AlertCircle className="w-3 h-3 mr-1 text-amber-600" /> Belum Ada
                            </Badge>
                          )}
                        </div>

                        <div className="sm:col-span-2 flex items-center justify-between p-3 rounded-xl bg-gray-50/70 border border-gray-100">
                          <div className="flex items-center gap-2.5">
                            <BookOpen className="w-4 h-4 text-emerald-700" />
                            <span className="text-xs font-semibold text-gray-800">Dokumen Pendukung (KK, Akta, Buku Nikah)</span>
                          </div>
                          <span className="text-xs font-bold text-gray-800">
                            {selectedDetailReceivable.documentInfo || 'Lengkap Terverifikasi'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Section 4: Status Perlengkapan Pendaftaran */}
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold">4</span>
                        Status Perlengkapan Jamaah Saat Pendaftaran
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 bg-white p-4 rounded-2xl border border-gray-200/90 shadow-2xs">
                        {[
                          { key: 'koperBesar', label: 'Koper Besar' },
                          { key: 'koperKabin', label: 'Koper Kabin' },
                          { key: 'batik', label: 'Seragam Batik' },
                          { key: 'bukuDomisili', label: 'Buku Manasik & Doa' },
                          { key: 'kainIhram', label: 'Kain Ihram' },
                          { key: 'tasSelempang', label: 'Tas Selempang' },
                          { key: 'tasSandal', label: 'Tas Sandal' },
                          { key: 'syall', label: 'Syal Jamaah' },
                          { key: 'kerudungMerah', label: 'Kerudung' },
                        ].map(item => {
                          const isReceived = Boolean(selectedDetailReceivable[item.key as keyof Pilgrim]);
                          return (
                            <div key={item.key} className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50/70 border border-gray-100 text-xs">
                              <span className="font-semibold text-gray-700 truncate pr-1">{item.label}</span>
                              {isReceived ? (
                                <Badge className="bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold text-[9px] px-1.5 py-0.5 shrink-0">
                                  <Check className="w-2.5 h-2.5 mr-0.5 text-emerald-600" /> Siap
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-300 font-medium text-[9px] px-1.5 py-0.5 shrink-0">
                                  Pending
                                </Badge>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {/* Financial Summary Cards */}
                    <div className="bg-amber-50/70 p-5 rounded-2xl border border-amber-200 space-y-4 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-amber-800 tracking-wider">Status Piutang Jamaah</span>
                          <h4 className="text-base font-bold text-gray-900">{selectedDetailReceivable.name}</h4>
                          <p className="text-xs text-gray-500 font-mono font-medium">{selectedDetailReceivable.id} • {selectedDetailReceivable.phone || '-'}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] uppercase font-bold text-amber-800 tracking-wider">Sisa Tagihan Belum Lunas</span>
                          <p className="text-xl font-bold text-amber-900 tracking-tight">
                            Rp {selectedDetailReceivable.remaining.toLocaleString('id-ID')}
                          </p>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold text-gray-700">
                          <span>Kemajuan Pembayaran</span>
                          <span className="font-bold text-gray-900">{percentPaid}% Terbayar</span>
                        </div>
                        <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                            style={{ width: `${percentPaid}%` }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-amber-200/70 text-xs">
                        <div className="bg-white p-3 rounded-xl border border-amber-200 shadow-2xs">
                          <span className="text-[11px] text-gray-500 font-semibold block">Total Biaya Paket Umrah</span>
                          <span className="font-bold text-gray-900 text-sm">Rp {selectedDetailReceivable.calculatedTotal.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-amber-200 shadow-2xs">
                          <span className="text-[11px] text-emerald-800 font-semibold block">Telah Dibayar (DP)</span>
                          <span className="font-bold text-emerald-700 text-sm">Rp {selectedDetailReceivable.calculatedPaid.toLocaleString('id-ID')}</span>
                        </div>
                      </div>
                    </div>

                    {/* Skema & Catatan Pembayaran Awal */}
                    <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100 text-xs shadow-2xs">
                      <div className="flex justify-between p-3 items-center">
                        <span className="text-gray-500 font-medium">Skema Pembayaran Awal</span>
                        <Badge variant="outline" className="font-bold text-emerald-800 bg-emerald-50 border-emerald-200 text-xs">
                          {selectedDetailReceivable.paymentOption || 'DP (Uang Muka)'}
                        </Badge>
                      </div>
                      <div className="flex justify-between p-3 items-center">
                        <span className="text-gray-500 font-medium">Metode Pembayaran Awal</span>
                        <span className="font-bold text-gray-900">{selectedDetailReceivable.paymentMethod || 'Transfer BCA'}</span>
                      </div>
                      <div className="flex justify-between p-3 items-center">
                        <span className="text-gray-500 font-medium">Tanggal Pembayaran Awal</span>
                        <span className="font-bold text-gray-900">{selectedDetailReceivable.paymentDate || selectedDetailReceivable.registrationDate || '10 Jan 2026'}</span>
                      </div>
                      {selectedDetailReceivable.paymentNotes && (
                        <div className="p-3">
                          <span className="text-gray-500 font-medium block mb-1">Catatan Pembayaran:</span>
                          <p className="p-2.5 bg-gray-50 rounded-lg text-gray-700 italic border border-gray-100 font-normal">
                            "{selectedDetailReceivable.paymentNotes}"
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Payment History for this pilgrim */}
                    <div className="space-y-2.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-900 block text-sm">Riwayat Transaksi Kas Pembayaran Jamaah:</span>
                        <Button 
                          size="sm"
                          variant="outline"
                          className="h-7 text-[11px] font-semibold text-emerald-800 border-emerald-200 hover:bg-emerald-50"
                          onClick={() => {
                            setIsReceivableDetailModalOpen(false);
                            setEditingTxId(null);
                            setTxForm({
                              pilgrimId: selectedDetailReceivable.id,
                              pilgrimName: selectedDetailReceivable.name,
                              type: 'Pemasukan (Pelunasan)',
                              category: 'Pelunasan Umrah',
                              paymentMethod: 'Transfer BCA',
                              date: todayStr,
                              status: 'Berhasil',
                              amount: selectedDetailReceivable.remaining,
                              referenceNo: '',
                              notes: `Pembayaran pelunasan a/n ${selectedDetailReceivable.name}`
                            });
                            setIsAddModalOpen(true);
                          }}
                        >
                          <Plus className="w-3 h-3 mr-1" /> Tambah Transaksi
                        </Button>
                      </div>
                      {pilgrimTxList.length === 0 ? (
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-center text-gray-400 text-xs font-normal">
                          Belum ada catatan riwayat transaksi pembayaran tambahan.
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {pilgrimTxList.map(tx => (
                            <div key={tx.id} className="bg-white p-3 rounded-xl border border-gray-200 shadow-2xs flex items-center justify-between gap-2">
                              <div>
                                <span className="font-bold text-gray-900 block text-xs">{tx.type}</span>
                                <span className="text-[11px] text-gray-500 font-mono font-medium">{tx.id} • {tx.date} • {tx.paymentMethod}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-emerald-700 text-sm">
                                  + Rp {tx.amount.toLocaleString('id-ID')}
                                </span>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleEditTransaction(tx)} 
                                  title="Edit Transaksi Ini"
                                  className="h-7 w-7 p-0 text-gray-400 hover:text-blue-700 hover:bg-blue-50 rounded-lg cursor-pointer"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          <DialogFooter className="pt-3 border-t border-gray-100 flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              className="font-semibold text-xs flex-1 sm:flex-none border-gray-200"
              onClick={() => {
                window.print();
                toast("Mencetak lembar rincian tagihan & data diri...", "info");
              }}
            >
              <Printer className="w-4 h-4 mr-1.5" /> Cetak Lembar Data & Tagihan
            </Button>
            {selectedDetailReceivable && (
              <>
                <Button 
                  variant="outline"
                  className="font-semibold text-xs text-blue-700 border-blue-200 hover:bg-blue-50 flex-1 sm:flex-none"
                  onClick={() => handleOpenEditPilgrimPayment(selectedDetailReceivable)}
                >
                  <Edit2 className="w-3.5 h-3.5 mr-1.5 text-blue-600" /> Edit Data Keuangan Jamaah
                </Button>
                <Button 
                  onClick={() => {
                    const p = selectedDetailReceivable;
                    setIsReceivableDetailModalOpen(false);
                    handleOpenQuickPay(p);
                  }}
                  className="bg-[#740A03] hover:bg-[#580802] text-white font-semibold text-xs flex-1 sm:flex-none"
                >
                  <CreditCard className="w-3.5 h-3.5 mr-1.5" /> Catat Pelunasan
                </Button>
              </>
            )}
            <Button variant="ghost" onClick={() => setIsReceivableDetailModalOpen(false)} className="font-semibold text-xs flex-1 sm:flex-none">
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: View Expense Voucher Detail */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent hideClose className="max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-gray-900 flex items-center justify-between border-b border-gray-100 pb-3">
              <span className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-red-600" />
                Voucher Bukti Pengeluaran
              </span>
              <Badge variant="success" className="text-[10px] font-semibold">VERIFIED</Badge>
            </DialogTitle>
          </DialogHeader>

          {selectedDetailExpense && (
            <div className="space-y-4 py-2">
              <div className="text-center bg-red-50 p-4 rounded-xl border border-red-200 space-y-1.5 shadow-2xs">
                <p className="text-[11px] text-red-800 font-semibold uppercase tracking-wider">Nominal Pengeluaran Kas</p>
                <p className="text-2xl font-bold text-red-700 tracking-tight">
                  - Rp {selectedDetailExpense.amount.toLocaleString('id-ID')}
                </p>
              </div>

              <div className="space-y-2 text-xs divide-y divide-gray-100">
                <div className="flex justify-between py-1.5">
                  <span className="text-gray-500 font-medium">Penerima</span>
                  <span className="font-bold text-gray-900">{selectedDetailExpense.pilgrimName}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-gray-500 font-medium">Kategori Pengeluaran</span>
                  <span className="font-semibold text-gray-900">{selectedDetailExpense.category}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-gray-500 font-medium">Metode Kas</span>
                  <span className="font-semibold text-gray-900">{selectedDetailExpense.paymentMethod}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-gray-500 font-medium">Tanggal Transaksi</span>
                  <span className="font-semibold text-gray-900">{selectedDetailExpense.date}</span>
                </div>
                {selectedDetailExpense.notes && (
                  <div className="py-2">
                    <span className="text-gray-500 font-medium block mb-1">Catatan:</span>
                    <p className="p-2.5 bg-gray-50 rounded-lg text-gray-700 italic border border-gray-100 font-normal">
                      "{selectedDetailExpense.notes}"
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="pt-3 border-t border-gray-100 flex flex-nowrap overflow-x-auto justify-end gap-2 items-center w-full pb-1 hide-scrollbar">
            <Button 
              variant="outline" 
              className="font-semibold text-xs border-gray-200 shrink-0 whitespace-nowrap"
              onClick={() => {
                window.print();
                toast("Mencetak voucher pengeluaran...", "info");
              }}
            >
              <Printer className="w-4 h-4 mr-1.5 shrink-0" /> Cetak Voucher
            </Button>
            {selectedDetailExpense && (
              <Button 
                variant="outline"
                className="font-semibold text-xs text-blue-700 border-blue-200 hover:bg-blue-50 shrink-0 whitespace-nowrap"
                onClick={() => {
                  setIsDetailModalOpen(false);
                  handleEditExpense(selectedDetailExpense);
                }}
              >
                <Edit2 className="w-3.5 h-3.5 mr-1.5 text-blue-600 shrink-0" /> Edit Isian Pengeluaran
              </Button>
            )}
            <Button className="font-semibold text-xs bg-[#740A03] hover:bg-[#580802] text-white shrink-0 whitespace-nowrap" onClick={() => setIsDetailModalOpen(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Edit Data Keuangan / Tagihan Jamaah */}
      <Dialog open={isEditPilgrimPaymentModalOpen} onOpenChange={setIsEditPilgrimPaymentModalOpen}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Edit2 className="w-4 h-4 text-blue-600" /> 
              Edit Data Keuangan & Pembayaran Jamaah
            </DialogTitle>
          </DialogHeader>

          {selectedPilgrimForEditPay && (
            <div className="space-y-4 py-2">
              <div className="bg-emerald-50 p-3.5 rounded-xl border border-emerald-200">
                <span className="text-[10px] uppercase tracking-wider text-emerald-800 font-bold block">Identitas Jamaah</span>
                <span className="text-sm font-bold text-emerald-950 block">{selectedPilgrimForEditPay.name}</span>
                <span className="text-xs text-emerald-800 font-medium block mt-0.5">{selectedPilgrimForEditPay.id} • {selectedPilgrimForEditPay.umrahPackage}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">Total Biaya Paket (Rp) *</label>
                  <Input 
                    type="number"
                    value={editPilgrimPayForm.totalAmount}
                    onChange={(e) => setEditPilgrimPayForm({ ...editPilgrimPayForm, totalAmount: Number(e.target.value) })}
                    className="h-10 font-bold text-gray-900 text-xs focus:ring-[#740A03]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">Telah Dibayar (Rp) *</label>
                  <Input 
                    type="number"
                    value={editPilgrimPayForm.paidAmount}
                    onChange={(e) => setEditPilgrimPayForm({ ...editPilgrimPayForm, paidAmount: Number(e.target.value) })}
                    className="h-10 font-bold text-emerald-800 text-xs focus:ring-[#740A03]"
                  />
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex justify-between items-center text-xs">
                <span className="text-amber-800 font-medium">Kalkulasi Sisa Tagihan:</span>
                <span className="font-bold text-amber-950 text-sm">
                  Rp {Math.max(0, Number(editPilgrimPayForm.totalAmount) - Number(editPilgrimPayForm.paidAmount)).toLocaleString('id-ID')}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">Skema Pembayaran</label>
                  <select 
                    value={editPilgrimPayForm.paymentOption}
                    onChange={(e) => setEditPilgrimPayForm({ ...editPilgrimPayForm, paymentOption: e.target.value as 'Bayar Lunas' | 'DP' | 'Belum Bayar' })}
                    className="flex h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#740A03]/20 cursor-pointer"
                  >
                    <option value="DP">DP (Uang Muka)</option>
                    <option value="Bayar Lunas">Bayar Lunas</option>
                    <option value="Belum Bayar">Belum Bayar</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">Metode Pembayaran</label>
                  <select 
                    value={editPilgrimPayForm.paymentMethod}
                    onChange={(e) => setEditPilgrimPayForm({ ...editPilgrimPayForm, paymentMethod: e.target.value })}
                    className="flex h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#740A03]/20 cursor-pointer"
                  >
                    <PaymentMethodOptions />
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1 block">Tanggal Pembayaran Terakhir</label>
                <Input 
                  type="date" 
                  value={editPilgrimPayForm.paymentDate || todayStr}
                  onChange={(e) => setEditPilgrimPayForm({ ...editPilgrimPayForm, paymentDate: e.target.value })}
                  className="h-10 text-xs font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1 block">Catatan Pembayaran</label>
                <Input 
                  value={editPilgrimPayForm.paymentNotes}
                  onChange={(e) => setEditPilgrimPayForm({ ...editPilgrimPayForm, paymentNotes: e.target.value })}
                  placeholder="Catatan tambahan mengenai bukti transfer..."
                  className="h-10 text-xs font-normal"
                />
              </div>
            </div>
          )}

          <DialogFooter className="pt-3 border-t border-gray-100 flex gap-2">
            <Button variant="outline" className="font-semibold text-xs" onClick={() => setIsEditPilgrimPaymentModalOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSavePilgrimPayment} className="bg-[#740A03] hover:bg-[#580802] text-white font-semibold text-xs">
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent hideClose className="sm:max-w-[400px] p-0 overflow-hidden border-0 shadow-2xl rounded-2xl">
          <div className="bg-red-50/80 px-6 py-8 flex flex-col items-center justify-center text-center">
             <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mb-4 shadow-sm">
                <AlertCircle className="w-7 h-7 text-red-600" />
             </div>
             <DialogTitle className="text-xl font-bold text-red-900 mb-1">
                Konfirmasi Hapus
             </DialogTitle>
             <p className="text-red-700/90 font-medium text-sm">Apakah benar data ini akan dihapus?</p>
          </div>
          <div className="px-6 py-5 bg-white flex flex-col items-center text-center">
            <p className="text-sm text-gray-500 mb-6 leading-relaxed font-normal">
              Data yang dihapus akan dipindahkan ke <strong className="font-semibold text-gray-800">Riwayat Hapus</strong> dan masih dapat dikembalikan nanti jika Anda berubah pikiran.
            </p>
            <DialogFooter className="flex w-full gap-3 sm:gap-3 sm:space-x-0">
              <Button variant="outline" className="flex-1 rounded-xl h-11 border-gray-200 font-semibold text-gray-600 hover:bg-gray-50 hover:text-gray-900 text-xs" onClick={() => setIsDeleteDialogOpen(false)}>
                Batal
              </Button>
              <Button className="flex-1 rounded-xl h-11 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs shadow-sm" onClick={confirmDelete}>
                Ya, Hapus Data
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
