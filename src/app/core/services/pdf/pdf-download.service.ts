import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PdfDownloadService {

  /**
   * Downloads a PDF blob using the browser's native download dialog.
   * @param blob The PDF data as a Blob.
   * @param filename The desired filename (e.g. 'Application.pdf').
   */
  download(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Cleanup the object URL after a short delay to ensure the browser has started the download
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
    }, 100);
  }

  /**
   * Opens the PDF blob in a new browser tab, allowing the user to use 
   * the browser's built-in PDF tools (print, save, zoom).
   * @param blob The PDF data as a Blob.
   */
  preview(blob: Blob): void {
    const url = window.URL.createObjectURL(blob);
    window.open(url, '_blank');
    // Note: We don't revoke URL immediately as the new tab needs it.
    // Browsers usually handle cleanup when the tab is closed if it's an object URL.
  }

  /**
   * Triggers the browser's print dialog for a specific HTML element.
   * Preserves styling by copying document stylesheets.
   * @param elementId The ID of the element to print.
   */
  printElement(elementId: string): void {
    const element = document.getElementById(elementId);
    const printContents = element?.outerHTML;
    if (!printContents) {
      console.warn(`Element with ID ${elementId} not found for printing.`);
      return;
    }

    const printWindow = window.open('', '_blank', 'width=1000,height=800');
    if (!printWindow) {
      alert('Please allow popups to print.');
      return;
    }

    // Start building the print document
    printWindow.document.write('<html><head><title>Print Form</title>');

    // 1. Copy all style/link tags from parent window to retain original styling
    const styles = document.querySelectorAll('link[rel="stylesheet"], style');
    styles.forEach(style => {
      printWindow.document.write(style.outerHTML);
    });

    printWindow.document.write('</head><body style="background: white !important;">');
    printWindow.document.write(printContents);
    printWindow.document.write('</body></html>');
    
    // Add print-specific tweaks
    const styleSheet = printWindow.document.createElement("style");
    styleSheet.innerText = `
      @media print {
        @page { 
          size: auto; 
          margin: 10mm; 
        }
        .no-print { display: none !important; }
        body { 
          margin: 0; 
          padding: 0; 
          background: white !important;
          overflow: visible !important;
          height: auto !important;
        }
        .loanapp, .scrutiny, .report-page, .form-container, .page, .sheet, .doc-page, .final-page { 
          width: 100% !important; 
          margin: 0 !important; 
          padding: 0 !important; 
          border: none !important; 
          box-shadow: none !important; 
          overflow: visible !important;
          height: auto !important;
          display: block !important;
          position: relative !important;
          page-break-after: always;
        }
        table { page-break-inside: auto; width: 100% !important; }
        tr { page-break-inside: avoid; page-break-after: auto; }
        thead { display: table-header-group; }
        tfoot { display: table-footer-group; }
      }
      /* Ensure absolute elements like photos stay in place */
      .photo-box, .photo-area {
        position: absolute !important;
      }
    `;
    printWindow.document.head.appendChild(styleSheet);

    printWindow.document.close();

    // Longer delay to ensure all Angular data-bindings and images are fully rendered
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 800);
  }
}
