export const managementService = {
  getFamilies: () => [
    { id: "F-001", name: "Abdullah Family", head: "Ahmad Abdullah", members: 4, group: "Group A-1", status: "Complete" },
    { id: "F-002", name: "Rahman Family", head: "Kareem Rahman", members: 2, group: "Group C-3", status: "Separated" },
    { id: "F-003", name: "Farooq Family", head: "Omar Farooq", members: 5, group: "Group A-2", status: "Complete" },
  ],
  getGroups: () => [
    { id: "G-A1", name: "Group A-1", kloter: "KLT-01", pilgrims: 45, tourLeader: "TL-01", mutawif: "MT-01", status: "Active" },
    { id: "G-A2", name: "Group A-2", kloter: "KLT-01", pilgrims: 42, tourLeader: "TL-02", mutawif: "MT-02", status: "Active" },
    { id: "G-B1", name: "Group B-1", kloter: "KLT-02", pilgrims: 50, tourLeader: "TL-03", mutawif: "MT-03", status: "Moving" },
  ],
  getTourLeaders: () => [
    { id: "TL-01", name: "Hassan Ibrahim", phone: "+966 50 111 2222", group: "Group A-1", performance: "Excellent", status: "Active" },
    { id: "TL-02", name: "Tariq Aziz", phone: "+966 50 222 3333", group: "Group A-2", performance: "Good", status: "Active" },
    { id: "TL-03", name: "Zaid Yasin", phone: "+966 50 333 4444", group: "Group B-1", performance: "Needs Review", status: "Offline" },
  ],
  getMutawifs: () => [
    { id: "MT-01", name: "Sheikh Abdullah", language: "English, Arabic", group: "Group A-1", experience: "10 Years", status: "Active" },
    { id: "MT-02", name: "Sheikh Khalid", language: "Urdu, Arabic", group: "Group A-2", experience: "5 Years", status: "Active" },
    { id: "MT-03", name: "Sheikh Yasir", language: "French, Arabic", group: "Group B-1", experience: "8 Years", status: "Active" },
  ]
};
