const fs = require('fs');

let store = fs.readFileSync('src/core/store.ts', 'utf8');

const replaceBulkDelete = (methodName, arrayName, typeName, nameField) => {
  const regex = new RegExp(`${methodName}: \\(ids\\) => set\\(\\(state\\) => \\(\\{[ \\n\\r\\t]*${arrayName}: state.${arrayName}.filter\\([a-zA-Z0-9_]+ => !ids.includes\\([a-zA-Z0-9_]+\\.id\\)\\)[ \\n\\r\\t]*\\}\\)\\),`);
  
  const replacer = `${methodName}: (ids) => set((state) => {
    const itemsToDelete = state.${arrayName}.filter(x => ids.includes(x.id));
    const newTrashItems = itemsToDelete.map(item => ({
      id: \`trash-\${Date.now()}-\${Math.random()}-\${item.id}\`,
      originalId: item.id,
      type: '${typeName}',
      name: item.${nameField} || 'Tidak bernama',
      deletedAt: new Date().toLocaleString('id-ID'),
      data: item
    }));
    return {
      ${arrayName}: state.${arrayName}.filter(x => !ids.includes(x.id)),
      trashItems: [...newTrashItems, ...state.trashItems]
    };
  }),`;

  store = store.replace(regex, replacer);
};

replaceBulkDelete('deletePilgrims', 'pilgrims', 'Jamaah', 'name');
replaceBulkDelete('deleteGroups', 'groups', 'Kloter', 'name');
replaceBulkDelete('deleteFamilies', 'families', 'Keluarga', 'name');
replaceBulkDelete('deleteTourLeaders', 'tourLeaders', 'Tour Leader', 'name');
replaceBulkDelete('deleteMutawifs', 'mutawifs', 'Mutawif', 'name');
replaceBulkDelete('deleteSchedules', 'schedules', 'Jadwal', 'title');
replaceBulkDelete('deleteStaffStocks', 'staffStocks', 'Stok Barang', 'name');

fs.writeFileSync('src/core/store.ts', store);
console.log('Bulk patch applied 2');
