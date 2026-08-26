import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Schedule } from '@/core/store';

export interface RoomListPdfParams {
  kloterName: string;
  hotelLocation: string;
  hotelName: string;
  periodTitle: string;
  rooms: {
    roomLabel: string;
    roomNumber?: string;
    category: string;
    occupants: {
      no: number | string;
      title: string;
      name: string;
      age?: number | string;
    }[];
  }[];
}

export function exportRoomListToPdf(params: RoomListPdfParams) {
  const { kloterName, hotelLocation, hotelName, periodTitle, rooms } = params;

  // Create A4 portrait document
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header Banner - Emerald Theme
  doc.setFillColor(4, 120, 87); // Emerald-700
  doc.rect(0, 0, pageWidth, 26, 'F');

  // Banner Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('DNA TOUR & TRAVEL', 14, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('MANIFEST ROOM MEET HOTEL (ROOM MEET LIST)', 14, 19);

  // Print Timestamp (Top Right)
  const todayDateStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  doc.setFontSize(8);
  doc.text(`Tgl Cetak: ${todayDateStr}`, pageWidth - 14, 19, { align: 'right' });

  // Sub-header Info Box
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 31, pageWidth - 28, 22, 2, 2, 'FD');

  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(`KLOTER: ${kloterName.toUpperCase()}`, 18, 38);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Lokasi Hotel: ${hotelLocation} (${hotelName})`, 18, 44);
  doc.text(`Periode: ${periodTitle}`, 18, 49);

  // Total summary info right
  let totalOccupants = 0;
  let totalRooms = rooms.length;
  rooms.forEach(r => { totalOccupants += r.occupants.length; });

  doc.setFont('helvetica', 'bold');
  doc.text(`Total Kamar: ${totalRooms}`, pageWidth - 18, 38, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.text(`Total Jamaah: ${totalOccupants} Person`, pageWidth - 18, 44, { align: 'right' });

  // Build Table Data Rows
  const tableRows: any[] = [];
  
  rooms.forEach((room) => {
    if (room.occupants.length === 0) {
      tableRows.push([
        room.roomLabel,
        room.roomNumber || '-',
        '-',
        '-',
        '(Kamar Kosong)',
        '-'
      ]);
    } else {
      room.occupants.forEach((occ) => {
        tableRows.push([
          room.roomLabel,
          room.roomNumber || '-',
          String(occ.no || '-'),
          occ.title || '-',
          occ.name || '-',
          occ.age ? `${occ.age} Thn` : '-'
        ]);
      });
    }
  });

  // Render Table using jspdf-autotable
  autoTable(doc, {
    startY: 58,
    head: [['ROOM TYPE', 'NO. ROOM', 'NO', 'TITLE', 'NAMA JAMAAH', 'USIA']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [4, 120, 87],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [30, 41, 59]
    },
    columnStyles: {
      0: { cellWidth: 32, fontStyle: 'bold', halign: 'center' },
      1: { cellWidth: 28, halign: 'center', fontStyle: 'bold' },
      2: { cellWidth: 15, halign: 'center' },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 'auto', halign: 'left' },
      5: { cellWidth: 22, halign: 'center' }
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    margin: { left: 14, right: 14, bottom: 25 },
    didDrawPage: (data) => {
      // Footer page numbering
      const totalPages = (doc as any).internal.getNumberOfPages();
      const currentPage = data.pageNumber;
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Dokumen Resmi DNA Tour & Travel  |  Halaman ${currentPage} dari ${totalPages}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }
  });

  // Signature Block at the end
  const finalY = (doc as any).lastAutoTable.finalY || 100;
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Add signature on new page if bottom margin tight
  let sigY = finalY + 12;
  if (sigY + 30 > pageHeight - 15) {
    doc.addPage();
    sigY = 25;
  }

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  
  doc.text('Dibuat Oleh,', 25, sigY);
  doc.text('Disetujui Oleh,', pageWidth - 65, sigY);

  doc.setFont('helvetica', 'normal');
  doc.text('Petugas Operasional / Mutawif', 25, sigY + 5);
  doc.text('Pimpinan DNA Tour', pageWidth - 65, sigY + 5);

  doc.text('( ......................................... )', 25, sigY + 22);
  doc.text('( ......................................... )', pageWidth - 65, sigY + 22);

  // Save the generated PDF
  const cleanKloter = kloterName.replace(/[^a-zA-Z0-9_-]/g, '_');
  const cleanHotel = hotelLocation.replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`Roomlist_${cleanKloter}_Hotel_${cleanHotel}.pdf`);
}

export interface JourneyPdfParams {
  schedules: Schedule[];
}

export function exportJourneyScheduleToPdf(params: JourneyPdfParams) {
  const { schedules } = params;

  // Create A4 landscape document
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 297mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 210mm

  // 1. Top Decorative Brand Header (Maroon #740A03) with generous padding
  const headerHeight = 26;
  doc.setFillColor(116, 10, 3); // #740A03 Brand Maroon
  doc.rect(0, 0, pageWidth, headerHeight, 'F');

  // Gold/Amber accent line
  doc.setFillColor(217, 119, 6); // Amber-600
  doc.rect(0, headerHeight, pageWidth, 1.2, 'F');

  // Header Title & Subtitle with balanced vertical spacing
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('DNA TOUR & TRAVEL', 14, 12.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(254, 226, 226); // Red-100
  doc.text('ITINERARY & JADWAL PERJALANAN UMRAH', 14, 19.5);

  // 2. Summary Info Box (Y = 33)
  const uniqueDays = Array.from(new Set(schedules.map(s => s.dayNumber || 1))).sort((a, b) => a - b);
  const minDay = uniqueDays.length > 0 ? uniqueDays[0] : 1;
  const maxDay = uniqueDays.length > 0 ? uniqueDays[uniqueDays.length - 1] : 1;

  // Calculate start and end date
  const sortedDates = [...schedules].map(s => s.date).filter(Boolean).sort();
  const startDateStr = sortedDates.length > 0 ? sortedDates[0] : '-';
  const endDateStr = sortedDates.length > 0 ? sortedDates[sortedDates.length - 1] : '-';

  const formatIndoDate = (dateStr: string) => {
    if (!dateStr || dateStr === '-') return '-';
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [year, month, day] = dateStr.split('-');
      const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ];
      const mIndex = parseInt(month, 10) - 1;
      return `${parseInt(day, 10)} ${months[mIndex] || month} ${year}`;
    }
    return dateStr;
  };

  // Info Card Container with comfortable margin
  doc.setDrawColor(226, 232, 240); // Slate-200
  doc.setFillColor(248, 250, 252); // Slate-50
  doc.roundedRect(14, 33, pageWidth - 28, 14, 1.5, 1.5, 'FD');

  // Left & Right Trip Information inside Box
  doc.setTextColor(30, 41, 59); // Slate-800
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('INFORMASI JADWAL PERJALANAN', 18, 39);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Durasi Program : ${uniqueDays.length} Hari (Hari ke-${minDay} s/d Hari ke-${maxDay})`, 18, 43.5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('PERIODE & TOTAL AGENDA', 150, 39);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Periode: ${formatIndoDate(startDateStr)} s/d ${formatIndoDate(endDateStr)}   |   Total: ${schedules.length} Agenda Kegiatan`, 150, 43.5);

  // 3. Prepare Table Data Rows (Without Status column)
  const getCategoryName = (category?: string) => {
    switch (category) {
      case 'ibadah': return 'Ibadah';
      case 'ziyarah': return 'Ziyarah / Tur';
      case 'makan': return 'Konsumsi';
      case 'transit': return 'Transit / Pesawat';
      case 'hotel': return 'Hotel & Check-in';
      case 'manasik': return 'Manasik & Briefing';
      default: return 'Kegiatan';
    }
  };

  const tableRows = schedules.map((schedule) => {
    const dayLabel = schedule.dayNumber ? `Hari ${schedule.dayNumber}` : 'Hari 1';
    const dateFormatted = formatIndoDate(schedule.date);
    const timeFormatted = schedule.time ? `${schedule.time} WIB` : '-';
    const dayAndDateTimeText = `${dayLabel}\n${dateFormatted}\n${timeFormatted}`;
    
    // Combine title and description neatly
    const activityText = schedule.keterangan 
      ? `${schedule.title}\nCatatan: ${schedule.keterangan}` 
      : schedule.title;

    const categoryText = getCategoryName(schedule.category);
    const locationText = schedule.location || '-';
    const picText = schedule.pic || '-';

    return [
      dayAndDateTimeText,
      activityText,
      categoryText,
      locationText,
      picText
    ];
  });

  // 4. Generate AutoTable with sleek modern styling
  autoTable(doc, {
    startY: 52,
    head: [[
      'HARI & WAKTU',
      'AGENDA / KEGIATAN & KETERANGAN',
      'KATEGORI',
      'LOKASI KEGIATAN',
      'PENANGGUNG JAWAB (PIC)'
    ]],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [116, 10, 3], // #740A03 Maroon
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'center',
      valign: 'middle',
      cellPadding: 3.5
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
      valign: 'top',
      cellPadding: 3.2,
      lineColor: [226, 232, 240],
      lineWidth: 0.15
    },
    columnStyles: {
      0: { cellWidth: 38, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 'auto', fontStyle: 'normal' },
      2: { cellWidth: 30, halign: 'center' },
      3: { cellWidth: 44 },
      4: { cellWidth: 34, halign: 'center' }
    },
    alternateRowStyles: {
      fillColor: [253, 248, 248] // Subtle warm white tint
    },
    margin: { left: 14, right: 14, bottom: 22 },
    didParseCell: (data) => {
      // Style Hari column badge look
      if (data.section === 'body' && data.column.index === 0) {
        data.cell.styles.textColor = [116, 10, 3];
      }
    },
    didDrawPage: (data) => {
      // Bottom footer on every page
      const totalPages = (doc as any).internal.getNumberOfPages();
      const currentPage = data.pageNumber;
      
      // Footer divider line
      doc.setDrawColor(226, 232, 240);
      doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);

      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184); // Slate-400
      
      doc.text(
        'Dokumen Resmi DNA Tour & Travel  •  Jadwal & Itinerary Perjalanan Jamaah Umrah',
        14,
        pageHeight - 7
      );

      doc.text(
        `Halaman ${currentPage} dari ${totalPages}`,
        pageWidth - 14,
        pageHeight - 7,
        { align: 'right' }
      );
    }
  });

  // 5. Signature Block
  const finalY = (doc as any).lastAutoTable.finalY || 120;
  let sigY = finalY + 10;
  
  // If not enough room for signature block, add a new page
  if (sigY + 34 > pageHeight - 16) {
    doc.addPage();
    sigY = 25;
  }

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');

  const col1X = 25;
  const col2X = (pageWidth / 2) - 25;
  const col3X = pageWidth - 75;

  doc.text('Tour Leader Pelaksana,', col1X, sigY);
  doc.text('Pembimbing Ibadah (Mutawif),', col2X, sigY);
  doc.text('Operasional & Manajemen,', col3X, sigY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Petugas Lapangan', col1X, sigY + 4.5);
  doc.text('Makkah / Madinah', col2X, sigY + 4.5);
  doc.text('DNA Tour Head Office', col3X, sigY + 4.5);

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(8);
  doc.text('( ............................................ )', col1X, sigY + 22);
  doc.text('( ............................................ )', col2X, sigY + 22);
  doc.text('( ............................................ )', col3X, sigY + 22);

  // 6. Save PDF
  doc.save(`Itinerary_Jadwal_Perjalanan_DNATour.pdf`);
}

