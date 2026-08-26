const fs = require('fs');

let store = fs.readFileSync('src/core/store.ts', 'utf8');

// Add TrashItem to types
const trashItemType = `
export type TrashItem = {
  id: string;
  originalId: string;
  type: string;
  name: string;
  deletedAt: string;
  data: any;
  reason?: string;
};
`;

store = store.replace("type StoreState = {", trashItemType + "\ntype StoreState = {\n  trashItems: TrashItem[];\n  emptyTrash: () => void;\n  restoreFromTrash: (trashId: string) => void;\n  deletePermanently: (trashId: string) => void;");

// Update useStore
store = store.replace("export const useStore = create<StoreState>((set) => ({", "export const useStore = create<StoreState>((set) => ({\n  trashItems: [],\n  emptyTrash: () => set({ trashItems: [] }),\n  restoreFromTrash: (trashId) => set((state) => {\n    const item = state.trashItems.find(t => t.id === trashId);\n    if (!item) return state;\n    const newTrash = state.trashItems.filter(t => t.id !== trashId);\n    if (item.type === 'Jamaah') return { trashItems: newTrash, pilgrims: [...state.pilgrims, item.data] };\n    if (item.type === 'Kloter') return { trashItems: newTrash, groups: [...state.groups, item.data] };\n    if (item.type === 'Keluarga') return { trashItems: newTrash, families: [...state.families, item.data] };\n    if (item.type === 'Tour Leader') return { trashItems: newTrash, tourLeaders: [...state.tourLeaders, item.data] };\n    if (item.type === 'Mutawif') return { trashItems: newTrash, mutawifs: [...state.mutawifs, item.data] };\n    if (item.type === 'Jadwal') return { trashItems: newTrash, schedules: [...state.schedules, item.data] };\n    if (item.type === 'Kamar') return { trashItems: newTrash, rooms: [...state.rooms, item.data] };\n    if (item.type === 'Stok Barang') return { trashItems: newTrash, staffStocks: [...state.staffStocks, item.data] };\n    if (item.type === 'Transaksi') return { trashItems: newTrash, financeTransactions: [...state.financeTransactions, item.data] };\n    return { trashItems: newTrash };\n  }),\n  deletePermanently: (trashId) => set((state) => ({ trashItems: state.trashItems.filter(t => t.id !== trashId) })),");

// Modify delete methods
const replaceDelete = (methodName, arrayName, typeName, nameField) => {
  const regex = new RegExp(`${methodName}: \\(id\\) => set\\(\\(state\\) => \\(\\{[ \\n\\r\\t]*${arrayName}: state.${arrayName}.filter\\([^)]+\\)[ \\n\\r\\t]*\\}\\)\\),`);
  
  const replacer = `${methodName}: (id) => set((state) => {
    const item = state.${arrayName}.find(x => x.id === id);
    if (!item) return state;
    const trash: TrashItem = {
      id: \`trash-\${Date.now()}-\${Math.random()}\`,
      originalId: item.id,
      type: '${typeName}',
      name: item.${nameField} || 'Tidak bernama',
      deletedAt: new Date().toLocaleString('id-ID'),
      data: item
    };
    return {
      ${arrayName}: state.${arrayName}.filter(x => x.id !== id),
      trashItems: [trash, ...state.trashItems]
    };
  }),`;

  store = store.replace(regex, replacer);
};

replaceDelete('deletePilgrim', 'pilgrims', 'Jamaah', 'name');
replaceDelete('deleteGroup', 'groups', 'Kloter', 'name');
replaceDelete('deleteFamily', 'families', 'Keluarga', 'name');
replaceDelete('deleteTourLeader', 'tourLeaders', 'Tour Leader', 'name');
replaceDelete('deleteMutawif', 'mutawifs', 'Mutawif', 'name');
replaceDelete('deleteSchedule', 'schedules', 'Jadwal', 'title');
replaceDelete('deleteRoom', 'rooms', 'Kamar', 'roomNumber');
replaceDelete('deleteStaffStock', 'staffStocks', 'Stok Barang', 'name');

// For transaction, it's a bit different because of pilgrims sync
const txRegex = /deleteTransaction: \(id\) => set\(\(state\) => \{\s*const updatedTxs = state\.financeTransactions\.filter\(tx => tx\.id !== id\);\s*return \{\s*financeTransactions: updatedTxs,\s*pilgrims: syncPilgrimPaymentsWithTxs\(state\.pilgrims, updatedTxs\)\s*\};\s*\}\)/;
const txReplacer = `deleteTransaction: (id) => set((state) => {
    const item = state.financeTransactions.find(x => x.id === id);
    if (!item) return state;
    const trash: TrashItem = {
      id: \`trash-\${Date.now()}-\${Math.random()}\`,
      originalId: item.id,
      type: 'Transaksi',
      name: item.pilgrimName || 'Tidak bernama',
      deletedAt: new Date().toLocaleString('id-ID'),
      data: item
    };
    const updatedTxs = state.financeTransactions.filter(tx => tx.id !== id);
    return {
      financeTransactions: updatedTxs,
      pilgrims: syncPilgrimPaymentsWithTxs(state.pilgrims, updatedTxs),
      trashItems: [trash, ...state.trashItems]
    };
  })`;

store = store.replace(txRegex, txReplacer);

fs.writeFileSync('src/core/store.ts', store);
console.log('Store patched');
