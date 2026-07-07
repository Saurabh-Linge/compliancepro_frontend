import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';

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

    // 3. Add Data Rows (with special handling for group headers)
    data.forEach((row) => {
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

    columnHeaderRowIndexes.forEach((rowIndex) => {
      for (let colIndex = 0; colIndex < columns.length; colIndex++) {
        const cellRef = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });
        const cell = worksheet[cellRef];

        if (!cell) {
          continue;
        }

        cell.s = {
          ...(cell.s || {}),
          font: {
            ...(cell.s?.font || {}),
            bold: true,
          },
          alignment: {
            ...(cell.s?.alignment || {}),
            horizontal: 'center',
            vertical: 'center',
            wrapText: true,
          },
        };
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
