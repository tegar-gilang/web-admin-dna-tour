export const dashboardService = {
  getStats: () => ({
    totalPilgrims: 12500,
    activeFamilies: 3200,
    groups: 150,
    tourLeaders: 120,
    mutawifs: 80,
    sosAlerts: 2,
  }),
  getJourneyStatus: () => ({
    currentPhase: "Arafah",
    progress: 65,
    nextCheckpoint: "Muzdalifah",
    estimatedArrival: "18:00 AST"
  }),
  getAttendanceSummary: () => ({
    present: 12450,
    late: 45,
    missing: 5,
  }),
  getRecentActivities: () => [
    { id: 1, title: "Group A-12 arrived at hotel", time: "10 mins ago", type: "location" },
    { id: 2, title: "Broadcast sent: Evening prayer schedule", time: "1 hour ago", type: "broadcast" },
    { id: 3, title: "SOS Alert resolved by Leader #45", time: "2 hours ago", type: "emergency" },
    { id: 4, title: "Medical update for Pilgrim #1029", time: "3 hours ago", type: "medical" },
  ],
  getPrayerTimes: () => ({
    fajr: "04:30",
    dhuhr: "12:15",
    asr: "15:45",
    maghrib: "18:30",
    isha: "20:00",
    next: "Dhuhr",
    timeUntilNext: "2h 15m"
  })
};
