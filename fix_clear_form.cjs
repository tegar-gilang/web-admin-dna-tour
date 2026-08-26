const fs = require('fs');
const path = 'src/features/registration/Registration.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace setFormData in openAddModal
const oldSetFormData = `    setFormData({ 
      id: newId,
      formId: newFormId,
      name: '',
      gender: 'Laki-laki', 
      age: 45,
      phone: '',
      ktp: '',
      passport: '',
      umrahPackage: 'Yamani',
      group: groups[0]?.name || 'Kloter 1 Al-Madinah',
      hotelMakkah: 'Swissôtel Al Maqam Makkah',
      hotelMadinah: 'Anwar Al Madinah Movenpick',
      hotel: 'Swissôtel Al Maqam Makkah',
      registrationDate: todayStr,
      departureDate: '',
      returnDate: '',
      meningitis: false,
      photo: false,
      koperBesar: false,
      koperKabin: false,
      batik: false,
      bukuDomisili: false,
      kainIhram: false,
      sabuk: 'L',
      kerudungMerah: false,
      kerudungPutih: false,
      tasSelempang: false,
      tasSandal: false,
      syall: false,
      paymentOption: 'DP',
      totalAmount: 30000000,
      paidAmount: 10000000,
      paymentMethod: 'Transfer BCA',
      paymentDate: todayStr,
      paymentNotes: 'Uang Muka Pendaftaran'
    });`;

const newSetFormData = `    setFormData({ 
      id: newId,
      formId: newFormId,
      name: '',
      gender: '', 
      age: 0,
      phone: '',
      ktp: '',
      passport: '',
      umrahPackage: '',
      group: '',
      hotelMakkah: '',
      hotelMadinah: '',
      hotel: '',
      registrationDate: todayStr,
      departureDate: '',
      returnDate: '',
      meningitis: false,
      photo: false,
      koperBesar: false,
      koperKabin: false,
      batik: false,
      bukuDomisili: false,
      kainIhram: false,
      sabuk: '',
      kerudungMerah: false,
      kerudungPutih: false,
      tasSelempang: false,
      tasSandal: false,
      syall: false,
      paymentOption: '',
      totalAmount: 0,
      paidAmount: 0,
      paymentMethod: '',
      paymentDate: todayStr,
      paymentNotes: ''
    });`;

if (content.includes(oldSetFormData)) {
    content = content.replace(oldSetFormData, newSetFormData);
    fs.writeFileSync(path, content, 'utf8');
    console.log("Fixed openAddModal successfully.");
} else {
    console.log("Could not find the exact oldSetFormData block. Trying a more robust regex replacement.");
    // Wait, let's use a simpler replace block
}
