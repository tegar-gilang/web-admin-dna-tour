const fs = require('fs');
const path = 'src/features/registration/Registration.tsx';
let content = fs.readFileSync(path, 'utf8');

const oldSetFormData = `    setFormData({ 
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
      paymentOption: 'Belum Bayar',
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
    console.log("Could not find the block.");
}
