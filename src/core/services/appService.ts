export const appService = {
  getJourney: () => [
    { id: 1, phase: "Makkah to Mina", status: "Completed", time: "08:00 AM", details: "All groups arrived safely." },
    { id: 2, phase: "Mina to Arafah", status: "In Progress", time: "09:00 AM", details: "Groups are currently moving. 65% completed." },
    { id: 3, phase: "Arafah to Muzdalifah", status: "Upcoming", time: "06:00 PM", details: "Awaiting sunset." },
  ],
  getSchedules: () => [
    { id: 1, title: "Morning Briefing", time: "07:00 AM", location: "Hotel Lobby", type: "Meeting" },
    { id: 2, title: "Ziyarah Madinah", time: "09:00 AM", location: "Masjid Nabawi", type: "Tour" },
    { id: 3, title: "Lunch", time: "01:00 PM", location: "Dining Hall", type: "Meal" },
  ],
  getAttendance: () => [
    { id: 1, group: "Group A-1", total: 45, present: 45, missing: 0, lastUpdated: "10 mins ago" },
    { id: 2, group: "Group A-2", total: 42, present: 41, missing: 1, lastUpdated: "5 mins ago" },
    { id: 3, group: "Group B-1", total: 50, present: 50, missing: 0, lastUpdated: "1 hour ago" },
  ],
  getEmergency: () => [
    { id: "SOS-101", pilgrim: "Muhammad Ali", group: "Group B-2", type: "Medical", location: "Arafah Tents", time: "10:30 AM", status: "Resolved" },
    { id: "SOS-102", pilgrim: "Aisha Rahman", group: "Group C-3", type: "Lost", location: "Jamarat", time: "11:45 AM", status: "Active" },
  ],
  getBroadcasts: () => [
    { id: 1, title: "Persiapan Keberangkatan Makkah", message: "Jamaah mohon mempersiapkan diri di lobi hotel 1 jam sebelum keberangkatan menuju Makkah.", target: "Kloter KLT-01", time: "08:00 AM" },
    { id: 2, title: "Pembagian Koper Tambahan", message: "Tour leader harap mengambil tag koper tambahan di ruang administrasi.", target: "Semua Tour Leader", time: "09:30 AM" },
    { id: 3, title: "Perubahan Jadwal Ziarah", message: "Ziarah Madinah diundur menjadi pukul 10:00 AM karena kepadatan lalu lintas.", target: "Group A-1", time: "06:15 AM" },
    { id: 4, title: "Cuaca Ekstrem Terik", message: "Cuaca hari ini diperkirakan sangat terik. Seluruh jamaah diwajibkan membawa payung dan botol air minum.", target: "Semua Jamaah", time: "05:00 AM" },
  ],
  getDeviceLogs: () => [
    { id: 1, device: "iPhone 13", user: "Hassan Ibrahim", action: "Login", time: "06:00 AM", status: "Success" },
    { id: 2, device: "Samsung S21", user: "Tariq Aziz", action: "Sync Data", time: "06:15 AM", status: "Success" },
    { id: 3, device: "Unknown", user: "Zaid Yasin", action: "Failed Login", time: "07:00 AM", status: "Failed" },
  ],
  getWorshipContent: () => [
    { id: 1, title: "Morning Adhkar", type: "Dzikir", language: "Arabic/English" },
    { id: 2, title: "Doa Safar", type: "Doa", language: "Arabic/Indonesian" },
    { id: 3, title: "Guide to Umrah", type: "Article", language: "English" },
  ]
};
