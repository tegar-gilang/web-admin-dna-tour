const fs = require('fs');

let store = fs.readFileSync('src/core/store.ts', 'utf8');

const regex = /removeOccupantFromRoom: \(roomId, occupantId\) => set\(\(state\) => \(\{\s*rooms: state\.rooms\.map\(r => r\.id === roomId \? \{ \.\.\.r, occupants: r\.occupants\.filter\(o => o\.id !== occupantId\) \} : r\)\s*\}\)\),/;

const replacer = `removeOccupantFromRoom: (roomId, occupantId) => set((state) => {
    const room = state.rooms.find(r => r.id === roomId);
    if (!room) return state;
    const occupant = room.occupants.find(o => o.id === occupantId);
    if (!occupant) return state;
    
    const trash = {
      id: \`trash-\${Date.now()}-\${Math.random()}\`,
      originalId: occupantId,
      type: 'Penghuni Kamar',
      name: \`\${occupant.name} (dari \${room.roomLabel})\`,
      deletedAt: new Date().toLocaleString('id-ID'),
      data: { roomId, occupant }
    };
    
    return {
      rooms: state.rooms.map(r => r.id === roomId ? { ...r, occupants: r.occupants.filter(o => o.id !== occupantId) } : r),
      trashItems: [trash, ...state.trashItems]
    };
  }),`;

store = store.replace(regex, replacer);

// And update restore logic for 'Penghuni Kamar'
store = store.replace("if (item.type === 'Kamar') return { trashItems: newTrash, rooms: [...state.rooms, item.data] };", "if (item.type === 'Kamar') return { trashItems: newTrash, rooms: [...state.rooms, item.data] };\n    if (item.type === 'Penghuni Kamar') {\n      return { \n        trashItems: newTrash, \n        rooms: state.rooms.map(r => r.id === item.data.roomId ? { ...r, occupants: [...r.occupants, item.data.occupant] } : r)\n      };\n    }");

fs.writeFileSync('src/core/store.ts', store);
console.log('Occupant patch applied');
