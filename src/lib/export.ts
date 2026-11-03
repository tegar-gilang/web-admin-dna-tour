import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

// Helpers for smart column classification & formatting in Excel
const isCurrencyColumn = (keyName: string) => {
  const lower = keyName.toLowerCase();
  return lower.includes('(rp)') || lower.includes('nominal') || lower.includes('biaya') || 
         lower.includes('harga') || lower.includes('total') || lower.includes('amount') || 
         lower.includes('sisa') || lower.includes('dp') || lower.includes('dibayar') ||
         lower.includes('tagihan') || lower.includes('saldo') || lower.includes('pemasukan') ||
         lower.includes('pengeluaran') || lower.includes('pembayaran') || lower.includes('tarif') ||
         lower.includes('bayar') || lower.includes('terbayar');
};

const isCenterColumn = (keyName: string) => {
  const lower = keyName.toLowerCase();
  return lower === 'no' || lower === 'id' || lower === 'no.' || lower.includes('id ') ||
         lower.includes('status') || lower.includes('tanggal') || lower.includes('tgl') || 
         lower.includes('waktu') || lower.includes('jam') || lower.includes('gender') || 
         lower.includes('paspor') || lower.includes('visa') || lower.includes('ktp') ||
         lower.includes('jenis kelamin') || lower.includes('no. hp') || lower.includes('kontak') || 
         lower.includes('ref') || lower.includes('kewarganegaraan') || lower.includes('tipe') ||
         lower.includes('peran') || lower.includes('satuan') || lower.includes('kode') ||
         lower.includes('room') || lower.includes('kamar') || lower.includes('vaksin') ||
         lower.includes('foto') || lower.includes('koper') || lower.includes('batik') ||
         lower.includes('ihram') || lower.includes('syall') || lower.includes('tas');
};

const getStatusStyle = (valueStr: string) => {
  const lower = valueStr.toLowerCase().trim();
  
  // Green status (Success / Positive)
  if (
    lower.includes('berhasil') || lower.includes('lunas') || lower.includes('ready') || 
    lower.includes('selesai') || lower.includes('aktif') || lower.includes('hadir') || 
    lower.includes('on schedule') || lower.includes('sesuai') || lower.includes('lengkap') ||
    lower === 'sudah' || lower === 'ada'
  ) {
    return {
      fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFDCFCE7' } }, // Green-100
      font: { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF15803D' } } // Green-700
    };
  }
  
  // Yellow status (Warning / Pending / Partial)
  if (
    lower.includes('pending') || lower.includes('belum lunas') || lower.includes('proses') || 
    lower.includes('sebagian') || lower.includes('dp') || lower.includes('monitoring') || 
    lower.includes('kurang') || lower.includes('berkas belum lengkap')
  ) {
    return {
      fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFFEF9C3' } }, // Yellow-100
      font: { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFA16207' } } // Yellow-700
    };
  }
  
  // Red status (Error / Negative / Urgent)
  if (
    lower.includes('batal') || lower.includes('gagal') || lower.includes('darurat') || 
    lower.includes('sos') || lower.includes('belum lapor') || lower.includes('critical') || 
    lower.includes('habis') || lower === 'belum' || lower === 'tidak'
  ) {
    return {
      fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFFEE2E2' } }, // Red-100
      font: { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFB91C1C' } } // Red-700
    };
  }
  
  return null;
};

/**
 * Format title banner and header row for an Excel worksheet
 */
function applyWorksheetStyling(
  worksheet: ExcelJS.Worksheet,
  keys: string[],
  data: any[],
  title: string,
  startRow: number
) {
  const formattedDate = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const totalCols = Math.max(keys.length, 1);

  // Row 1: Header Banner Title
  worksheet.mergeCells(1, 1, 1, totalCols);
  const titleCell = worksheet.getCell(1, 1);
  titleCell.value = title.toUpperCase();
  titleCell.font = { name: 'Segoe UI', size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF064E3B' } // Emerald-900
  };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  worksheet.getRow(1).height = 36;

  // Row 2: Metadata Subtitle
  worksheet.mergeCells(2, 1, 2, totalCols);
  const subTitleCell = worksheet.getCell(2, 1);
  subTitleCell.value = `DNA TOUR & TRAVEL  |  Tanggal Cetak: ${formattedDate}  |  Total Records: ${data.length} Data`;
  subTitleCell.font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: 'FF065F46' } };
  subTitleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFECFDF5' } // Emerald-50
  };
  subTitleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  worksheet.getRow(2).height = 24;

  // Row 3: Spacer Row
  worksheet.getRow(3).height = 10;

  // Row 4 (or startRow): Table Header
  const headerRow = worksheet.getRow(startRow);
  headerRow.height = 28;

  keys.forEach((key, index) => {
    const headerText = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
    const cell = headerRow.getCell(index + 1);
    cell.value = headerText;
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF047857' } // Emerald-700
    };
    cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.border = {
      top: { style: 'medium', color: { argb: 'FF064E3B' } },
      bottom: { style: 'medium', color: { argb: 'FF064E3B' } },
      left: { style: 'thin', color: { argb: 'FF059669' } },
      right: { style: 'thin', color: { argb: 'FF059669' } }
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  });
}

export async function exportToExcel(data: any[], filename: string, title?: string) {
  if (!data || !data.length) return;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'DNA Tour & Travel System';
  workbook.lastModifiedBy = 'DNA Tour & Travel System';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Laporan Data', {
    views: [{ showGridLines: true }]
  });

  const keysSet = new Set<string>();
  data.forEach(item => {
    Object.keys(item).forEach(key => keysSet.add(key));
  });
  const keys = Array.from(keysSet);

  worksheet.columns = keys.map(key => ({
    key: key,
    width: 22
  }));

  const bannerTitle = title || 'LAPORAN SISTEM DNA TOUR & TRAVEL';
  const startRow = 4;

  applyWorksheetStyling(worksheet, keys, data, bannerTitle, startRow);

  const columnSums: { [colIndex: number]: number } = {};

  // Populate Data Rows
  let currentRow = startRow + 1;
  data.forEach((item, index) => {
    const row = worksheet.getRow(currentRow);
    row.height = 23;

    keys.forEach((key, colIndex) => {
      const cell = row.getCell(colIndex + 1);
      const rawVal = item[key];

      cell.font = { name: 'Segoe UI', size: 10, color: { argb: 'FF1E293B' } };

      // Zebra striping
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: index % 2 === 1 ? 'FFF8FAFC' : 'FFFFFFFF' }
      };

      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
      };

      if (typeof rawVal === 'number') {
        cell.value = rawVal;
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
        if (isCurrencyColumn(key)) {
          cell.numFmt = 'Rp #,##0';
          cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF047857' } };
        } else {
          cell.numFmt = '#,##0';
        }
        columnSums[colIndex + 1] = (columnSums[colIndex + 1] || 0) + rawVal;
      } else if (rawVal !== null && rawVal !== undefined) {
        const strVal = String(rawVal);
        cell.value = strVal;

        // Apply status highlight style if applicable
        const isStatusCol = key.toLowerCase().includes('status') || 
                            key.toLowerCase().includes('pembayaran') || 
                            key.toLowerCase().includes('kelengkapan') ||
                            key.toLowerCase().includes('penanganan');

        if (isStatusCol) {
          const statusStyle = getStatusStyle(strVal);
          if (statusStyle) {
            cell.fill = statusStyle.fill;
            cell.font = statusStyle.font;
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
          } else {
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
          }
        } else if (isCenterColumn(key)) {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        } else {
          cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
        }
      } else {
        cell.value = '-';
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      }
    });
    currentRow++;
  });

  // Summary Footer Row
  const summaryRow = worksheet.getRow(currentRow);
  summaryRow.height = 26;
  keys.forEach((key, colIndex) => {
    const cell = summaryRow.getCell(colIndex + 1);
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFECFDF5' } // Emerald-50
    };
    cell.border = {
      top: { style: 'medium', color: { argb: 'FF047857' } },
      bottom: { style: 'double', color: { argb: 'FF047857' } },
      left: { style: 'thin', color: { argb: 'FFA7F3D0' } },
      right: { style: 'thin', color: { argb: 'FFA7F3D0' } }
    };

    if (colIndex === 0) {
      cell.value = `TOTAL: ${data.length} Data`;
      cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF065F46' } };
      cell.alignment = { vertical: 'middle', horizontal: 'left' };
    } else if (columnSums[colIndex + 1] !== undefined) {
      const sumVal = columnSums[colIndex + 1];
      cell.value = sumVal;
      cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF065F46' } };
      cell.alignment = { vertical: 'middle', horizontal: 'right' };
      if (isCurrencyColumn(key)) {
        cell.numFmt = 'Rp #,##0';
      } else {
        cell.numFmt = '#,##0';
      }
    } else {
      cell.value = '';
    }
  });

  // Auto-fit Column Widths cleanly
  worksheet.columns.forEach((column) => {
    let maxLength = 0;
    column.eachCell({ includeEmpty: true }, (cell) => {
      if (Number(cell.row) >= startRow) {
        let strVal = '';
        if (cell.value !== null && cell.value !== undefined) {
          if (typeof cell.value === 'number') {
            strVal = isCurrencyColumn(column.key as string) 
              ? `Rp ${cell.value.toLocaleString('id-ID')}` 
              : cell.value.toLocaleString('id-ID');
          } else {
            strVal = String(cell.value);
          }
        }
        if (strVal.length > maxLength) maxLength = strVal.length;
      }
    });
    column.width = Math.min(Math.max(maxLength + 4, 16), 55);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `${filename}.xlsx`);
}

export type MasterExportSheet = {
  sheetName: string;
  title: string;
  data: any[];
};

export async function exportMasterWorkbookToExcel(
  sheets: MasterExportSheet[],
  filename: string,
  masterTitle: string = 'LAPORAN MASTER REKAPITULASI ALL-IN-ONE - DNA TOUR'
) {
  if (!sheets || !sheets.length) return;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'DNA Tour & Travel System';
  workbook.lastModifiedBy = 'DNA Tour & Travel System';
  workbook.created = new Date();

  sheets.forEach((sheetDef) => {
    const data = sheetDef.data || [];
    const safeSheetName = sheetDef.sheetName.replace(/[*?:/\\\[\]]/g, '').slice(0, 30);
    const worksheet = workbook.addWorksheet(safeSheetName, {
      views: [{ showGridLines: true }]
    });

    if (!data.length) {
      worksheet.mergeCells(1, 1, 1, 4);
      const c = worksheet.getCell(1, 1);
      c.value = `[ ${sheetDef.title.toUpperCase()} - TIDAK ADA DATA RECORD ]`;
      c.font = { name: 'Segoe UI', size: 11, italic: true, color: { argb: 'FF6B7280' } };
      return;
    }

    const keysSet = new Set<string>();
    data.forEach(item => {
      Object.keys(item).forEach(k => keysSet.add(k));
    });
    const keys = Array.from(keysSet);

    worksheet.columns = keys.map(k => ({ key: k, width: 22 }));

    const startRow = 4;
    applyWorksheetStyling(worksheet, keys, data, sheetDef.title, startRow);

    const columnSums: { [colIndex: number]: number } = {};

    let currentRow = startRow + 1;
    data.forEach((item, index) => {
      const row = worksheet.getRow(currentRow);
      row.height = 23;

      keys.forEach((key, colIndex) => {
        const cell = row.getCell(colIndex + 1);
        const rawVal = item[key];

        cell.font = { name: 'Segoe UI', size: 10, color: { argb: 'FF1E293B' } };

        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: index % 2 === 1 ? 'FFF8FAFC' : 'FFFFFFFF' }
        };

        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
        };

        if (typeof rawVal === 'number') {
          cell.value = rawVal;
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
          if (isCurrencyColumn(key)) {
            cell.numFmt = 'Rp #,##0';
            cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF047857' } };
          } else {
            cell.numFmt = '#,##0';
          }
          columnSums[colIndex + 1] = (columnSums[colIndex + 1] || 0) + rawVal;
        } else if (rawVal !== null && rawVal !== undefined) {
          const strVal = String(rawVal);
          cell.value = strVal;

          const isStatusCol = key.toLowerCase().includes('status') || 
                              key.toLowerCase().includes('pembayaran') || 
                              key.toLowerCase().includes('kelengkapan') ||
                              key.toLowerCase().includes('penanganan');

          if (isStatusCol) {
            const statusStyle = getStatusStyle(strVal);
            if (statusStyle) {
              cell.fill = statusStyle.fill;
              cell.font = statusStyle.font;
              cell.alignment = { vertical: 'middle', horizontal: 'center' };
            } else {
              cell.alignment = { vertical: 'middle', horizontal: 'center' };
            }
          } else if (isCenterColumn(key)) {
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
          } else {
            cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
          }
        } else {
          cell.value = '-';
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        }
      });
      currentRow++;
    });

    // Summary Footer
    const summaryRow = worksheet.getRow(currentRow);
    summaryRow.height = 26;
    keys.forEach((key, colIndex) => {
      const cell = summaryRow.getCell(colIndex + 1);
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFECFDF5' }
      };
      cell.border = {
        top: { style: 'medium', color: { argb: 'FF047857' } },
        bottom: { style: 'double', color: { argb: 'FF047857' } },
        left: { style: 'thin', color: { argb: 'FFA7F3D0' } },
        right: { style: 'thin', color: { argb: 'FFA7F3D0' } }
      };

      if (colIndex === 0) {
        cell.value = `TOTAL: ${data.length} Data`;
        cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF065F46' } };
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
      } else if (columnSums[colIndex + 1] !== undefined) {
        const sumVal = columnSums[colIndex + 1];
        cell.value = sumVal;
        cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF065F46' } };
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
        if (isCurrencyColumn(key)) {
          cell.numFmt = 'Rp #,##0';
        } else {
          cell.numFmt = '#,##0';
        }
      } else {
        cell.value = '';
      }
    });

    // Auto-fit Column Widths
    worksheet.columns.forEach((column) => {
      let maxLength = 0;
      column.eachCell({ includeEmpty: true }, (cell) => {
        if (Number(cell.row) >= startRow) {
          let strVal = '';
          if (cell.value !== null && cell.value !== undefined) {
            if (typeof cell.value === 'number') {
              strVal = isCurrencyColumn(column.key as string) 
                ? `Rp ${cell.value.toLocaleString('id-ID')}` 
                : cell.value.toLocaleString('id-ID');
            } else {
              strVal = String(cell.value);
            }
          }
          if (strVal.length > maxLength) maxLength = strVal.length;
        }
      });
      column.width = Math.min(Math.max(maxLength + 4, 16), 55);
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `${filename}.xlsx`);
}
