import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx-js-style';

@Injectable({
  providedIn: 'root'
})
export class ExportService {

  /**
   * Export data to Excel (.xlsx) using the xlsx library
   * @param data Array of objects to export. Supports _rowType for styling/merging.
   * @param columns Array of column definitions { field: string, header: string }
   * @param fileName Name of the file (without extension)
   * @param reportHeaders Optional array of strings to show as merged rows on top
   * @param columnHeader Optional custom column header rows with relative merge ranges
   */
  exportToExcel(
    data: any[],
    columns: { field: string, header: string }[],
    fileName: string,
    reportHeaders: string[] = [],
    columnHeader?: { rows: any[][]; merges?: XLSX.Range[] },
  ) {
    if (!data || data.length === 0) {
      console.warn('No data to export');
      return;
    }

    const worksheetData: any[][] = [];
    const merges: XLSX.Range[] = [];
    let currentRowIndex = 0;

    // 1. Add Report Headers (Merged rows on top)
    reportHeaders.forEach((headerText) => {
      const headerRow = new Array(columns.length).fill('');
      headerRow[0] = headerText;
      worksheetData.push(headerRow);

      merges.push({
        s: { r: currentRowIndex, c: 0 },
        e: { r: currentRowIndex, c: columns.length - 1 }
      });
      currentRowIndex++;
    });

    // Add one empty white row between report headers and actual table
    if (reportHeaders.length > 0) {
      const emptyRow = new Array(columns.length).fill('');
      worksheetData.push(emptyRow);
      currentRowIndex++;
    }

    // 2. Add Column Headers
    let columnHeaderRowIndexes: number[] = [];

    if (columnHeader?.rows?.length) {
      const headerStartRowIndex = currentRowIndex;

      columnHeader.rows.forEach((row) => {
        worksheetData.push(row);
        columnHeaderRowIndexes.push(currentRowIndex);
        currentRowIndex++;
      });

      (columnHeader.merges || []).forEach((merge) => {
        merges.push({
          s: {
            r: headerStartRowIndex + merge.s.r,
            c: merge.s.c,
          },
          e: {
            r: headerStartRowIndex + merge.e.r,
            c: merge.e.c,
          },
        });
      });
    } else {
      worksheetData.push(columns.map(col => col.header));
      columnHeaderRowIndexes.push(currentRowIndex);
      currentRowIndex++;
    }

    // 3. Add Data Rows
    const dataRowIndexes: number[] = [];
    data.forEach((row) => {
      dataRowIndexes.push(currentRowIndex);
      if (row._rowType === 'header') {
        const groupHeaderRow = new Array(columns.length).fill('');
        groupHeaderRow[0] = row._headerValue || '';
        worksheetData.push(groupHeaderRow);

        merges.push({
          s: { r: currentRowIndex, c: 0 },
          e: { r: currentRowIndex, c: columns.length - 1 }
        });
      } else {
        worksheetData.push(columns.map(col => row[col.field]));
      }
      currentRowIndex++;
    });

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // Apply Merges
    if (merges.length > 0) {
      worksheet['!merges'] = merges;
    }

    // Style report headers (row 0 to reportHeaders.length - 1)
    for (let rowIndex = 0; rowIndex < reportHeaders.length; rowIndex++) {
      const cellRef = XLSX.utils.encode_cell({ r: rowIndex, c: 0 });
      const cell = worksheet[cellRef];
      if (cell) {
        cell.s = {
          font: {
            name: 'Calibri',
            sz: 14,
            bold: true,
            color: { rgb: '000000' } // simple black text
          },
          alignment: {
            horizontal: 'left',
            vertical: 'center'
          }
        };
      }
    }

    // Style column headers
    columnHeaderRowIndexes.forEach((rowIndex) => {
      for (let colIndex = 0; colIndex < columns.length; colIndex++) {
        const cellRef = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });
        const cell = worksheet[cellRef];

        if (!cell) {
          continue;
        }

        cell.s = {
          font: {
            name: 'Calibri',
            sz: 11,
            bold: true,
            color: { rgb: '000000' } // black text
          },
          fill: {
            fgColor: { rgb: 'F2F2F2' } // soft grey header background (monochrome)
          },
          alignment: {
            horizontal: 'center',
            vertical: 'center',
            wrapText: true
          },
          border: {
            top: { style: 'thin', color: { rgb: '000000' } },
            bottom: { style: 'medium', color: { rgb: '000000' } },
            left: { style: 'thin', color: { rgb: 'CCCCCC' } },
            right: { style: 'thin', color: { rgb: 'CCCCCC' } }
          }
        };
      }
    });

    // Style data rows
    dataRowIndexes.forEach((r) => {
      for (let c = 0; c < columns.length; c++) {
        const cellRef = XLSX.utils.encode_cell({ r: r, c: c });
        const cell = worksheet[cellRef];
        if (cell) {
          const isGroupHeader = merges.some(m => m.s.r === r && m.s.c === 0 && m.e.c === columns.length - 1 && m.s.r >= reportHeaders.length + (reportHeaders.length > 0 ? 1 : 0));
          
          if (isGroupHeader) {
            cell.s = {
              font: {
                name: 'Calibri',
                sz: 11,
                bold: true,
                color: { rgb: '000000' }
              },
              fill: {
                fgColor: { rgb: 'F9FAFB' }
              },
              alignment: {
                horizontal: 'left',
                vertical: 'center'
              }
            };
          } else {
            cell.s = {
              font: {
                name: 'Calibri',
                sz: 10
              },
              border: {
                top: { style: 'thin', color: { rgb: 'E2E8F0' } },
                bottom: { style: 'thin', color: { rgb: 'E2E8F0' } },
                left: { style: 'thin', color: { rgb: 'E2E8F0' } },
                right: { style: 'thin', color: { rgb: 'E2E8F0' } }
              },
              alignment: {
                horizontal: columns[c].field === 'sr_no' || columns[c].field === 'srNo' ? 'center' : 'left',
                vertical: 'center'
              }
            };
          }
        }
      }
    });

    // Basic styling/formatting hints for xlsx library (AOA to Sheet doesn't do much style, but we can set widths)
    const colWidths = columns.map((c) => ({
      wch: (c as any).excelWidth || Math.min(Math.max(c.header.length, 12), 22),
    }));
    worksheet['!cols'] = colWidths;

    // Center alignment for report headers (this is tricky with utilities, but we can try)
    // For now, AOAs are best for layout as requested.

    // Create Workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');

    // Generate and download file
    XLSX.writeFile(workbook, `${fileName}_${new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}.xlsx`);
  }

  /**
   * Export an HTML Table element directly to Excel, preserving spans and headers.
   * @param tableElement DOM table element
   * @param fileName File name for download
   */
  exportTableToExcel(tableElement: any, fileName: string) {
    const worksheet = XLSX.utils.table_to_sheet(tableElement, { raw: true });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
    XLSX.writeFile(workbook, `${fileName}_${new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}.xlsx`);
  }

  /**
   * Export data to CSV and trigger download
   * @param data Array of objects to export
   * @param columns Array of column definitions { field: string, header: string }
   * @param fileName Name of the file (without extension)
   */
  exportToCsv(data: any[], columns: { field: string, header: string }[], fileName: string) {
    if (!data || data.length === 0) {
      console.warn('No data to export');
      return;
    }

    const headers = columns.map(col => col.header).join(',');
    const rows = data.map(row => {
      return columns.map(col => {
        let val = row[col.field];
        if (val === null || val === undefined) val = '';
        const cell = String(val).replace(/"/g, '""');
        return cell.includes(',') ? `"${cell}"` : cell;
      }).join(',');
    });

    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${fileName}_${new Date().getTime()}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
}
