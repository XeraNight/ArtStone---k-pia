import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Quote, Invoice } from '@/types/database';

export const generateQuotePDF = (quote: Quote) => {
    // Create new PDF document
    const doc = new jsPDF();

    // Color constants
    const PRIMARY_COLOR = [0, 0, 0]; // Black for standard invoice look
    const TEXT_COLOR = [40, 40, 40];

    // Helper to format currency
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('sk-SK', {
            style: 'currency',
            currency: 'EUR',
        }).format(value);
    };

    // --- Header ---
    doc.setFontSize(24);
    doc.setTextColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
    doc.text('ArtStone', 20, 20);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Profesionálne kamenárske práce', 20, 25);

    // --- Quote Title & Number ---
    doc.setFontSize(20);
    doc.setTextColor(TEXT_COLOR[0], TEXT_COLOR[1], TEXT_COLOR[2]);
    doc.text('CENOVÁ PONUKA', 140, 20);

    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(quote.quote_number, 140, 27);

    // --- Client & Info Section ---
    const startY = 40;

    // Left Layout: Client Info
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text('KLIENT', 20, startY);

    doc.setFontSize(11);
    doc.setTextColor(TEXT_COLOR[0], TEXT_COLOR[1], TEXT_COLOR[2]);
    let clientY = startY + 6;

    if (quote.client?.company_name) {
        doc.text(quote.client.company_name, 20, clientY);
        clientY += 5;
    }
    doc.text(quote.client?.contact_name || '', 20, clientY);
    clientY += 5;

    if (quote.client?.address) {
        doc.text(quote.client.address, 20, clientY);
        clientY += 5;
    }
    if (quote.client?.postal_code) {
        doc.text(quote.client.postal_code, 20, clientY);
        clientY += 5;
    }
    if (quote.client?.email) {
        doc.text(quote.client.email, 20, clientY);
        clientY += 5;
    }

    // Right Layout: Dates & Status
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text('INFORMÁCIE', 140, startY);

    doc.setFontSize(10);
    doc.setTextColor(TEXT_COLOR[0], TEXT_COLOR[1], TEXT_COLOR[2]);

    doc.text('Dátum vystavenia:', 140, startY + 6);
    doc.text(new Date(quote.created_at).toLocaleDateString('sk-SK'), 180, startY + 6);

    if (quote.valid_until) {
        doc.text('Platnosť do:', 140, startY + 12);
        doc.text(new Date(quote.valid_until).toLocaleDateString('sk-SK'), 180, startY + 12);
    }

    doc.text('Vystavil:', 140, startY + 18);
    doc.text(quote.created_by_user?.full_name || 'ArtStone', 180, startY + 18);

    // --- Items Table ---
    const tableStartY = Math.max(clientY, startY + 24) + 10;

    const tableData = quote.items?.map(item => [
        item.description,
        `${item.quantity} ks`,
        formatCurrency(item.unit_price),
        formatCurrency(item.total)
    ]) || [];

    autoTable(doc, {
        startY: tableStartY,
        head: [['Položka', 'Množstvo', 'Cena/ks', 'Spolu']],
        body: tableData,
        theme: 'grid',
        headStyles: {
            fillColor: [30, 30, 30],
            textColor: 255,
            fontStyle: 'bold'
        },
        styles: {
            fontSize: 10,
            cellPadding: 3
        },
        columnStyles: {
            0: { cellWidth: 'auto' }, // Description
            1: { cellWidth: 30, halign: 'right' }, // Qty
            2: { cellWidth: 35, halign: 'right' }, // Unit Price
            3: { cellWidth: 35, halign: 'right' }  // Total
        }
    });

    // --- Totals ---
    // @ts-ignore
    let finalY = doc.lastAutoTable.finalY + 10;

    // Prevent page break split (simple check)
    if (finalY > 250) {
        doc.addPage();
        finalY = 20;
    }

    const rightMargin = 190;
    const labelX = 110;

    doc.setFontSize(10);

    doc.text('Základ (bez DPH):', labelX, finalY);
    doc.text(formatCurrency(quote.subtotal), rightMargin, finalY, { align: 'right' });

    if (quote.discount && quote.discount > 0) {
        finalY += 6;
        doc.text('Zľava:', labelX, finalY);
        doc.text(`- ${formatCurrency(quote.discount)}`, rightMargin, finalY, { align: 'right' });
    }

    if (quote.shipping && quote.shipping > 0) {
        finalY += 6;
        doc.text('Doprava:', labelX, finalY);
        doc.text(formatCurrency(quote.shipping), rightMargin, finalY, { align: 'right' });
    }

    finalY += 6;
    doc.text(`DPH (${quote.tax_rate}%):`, labelX, finalY);
    doc.text(formatCurrency(quote.tax_amount), rightMargin, finalY, { align: 'right' });

    finalY += 8;
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('SPOLU K ÚHRADE:', labelX, finalY);
    doc.setTextColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
    doc.text(formatCurrency(quote.total), rightMargin, finalY, { align: 'right' });

    // --- Notes ---
    if (quote.notes) {
        finalY += 15;
        doc.setFont(undefined, 'normal');
        doc.setTextColor(150, 150, 150);
        doc.setFontSize(10);
        doc.text('POZNÁMKA', 20, finalY);

        finalY += 5;
        doc.setTextColor(TEXT_COLOR[0], TEXT_COLOR[1], TEXT_COLOR[2]);
        doc.setFontSize(9);

        // Split text to fit width
        const splitNotes = doc.splitTextToSize(quote.notes, 170);
        doc.text(splitNotes, 20, finalY);
    }

    // --- Footer ---
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Vygenerované systémom ArtStone CRM', 105, pageHeight - 10, { align: 'center' });

    // Save the PDF
    doc.save(`Cenova_ponuka_${quote.quote_number}.pdf`);
};

export const generateInvoicePDF = (invoice: Invoice) => {
    // Create new PDF document
    const doc = new jsPDF();

    // Color constants
    const PRIMARY_COLOR = [0, 0, 0];
    const TEXT_COLOR = [40, 40, 40];

    // Helper to format currency
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('sk-SK', {
            style: 'currency',
            currency: 'EUR',
        }).format(value);
    };

    // --- Header ---
    doc.setFontSize(24);
    doc.setTextColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
    doc.text('ArtStone', 20, 20);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Profesionálne kamenárske práce', 20, 25);

    // --- Invoice Title & Number ---
    doc.setFontSize(20);
    doc.setTextColor(TEXT_COLOR[0], TEXT_COLOR[1], TEXT_COLOR[2]);
    doc.text('FAKTÚRA', 140, 20);

    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(invoice.invoice_number, 140, 27);

    // --- Client & Info Section ---
    const startY = 40;

    // Left Layout: Client Info
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text('ODBERATEĽ', 20, startY);

    doc.setFontSize(11);
    doc.setTextColor(TEXT_COLOR[0], TEXT_COLOR[1], TEXT_COLOR[2]);
    let clientY = startY + 6;

    if (invoice.client?.company_name) {
        doc.text(invoice.client.company_name, 20, clientY);
        clientY += 5;
    }
    doc.text(invoice.client?.contact_name || '', 20, clientY);
    clientY += 5;

    if (invoice.client?.address) {
        doc.text(invoice.client.address, 20, clientY);
        clientY += 5;
    }
    if (invoice.client?.postal_code) {
        doc.text(invoice.client.postal_code, 20, clientY);
        clientY += 5;
    }
    if (invoice.client?.email) {
        doc.text(invoice.client.email, 20, clientY);
        clientY += 5;
    }

    // Right Layout: Dates & Status
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text('INFORMÁCIE', 140, startY);

    doc.setFontSize(10);
    doc.setTextColor(TEXT_COLOR[0], TEXT_COLOR[1], TEXT_COLOR[2]);

    doc.text('Dátum vystavenia:', 140, startY + 6);
    doc.text(new Date(invoice.issue_date || invoice.created_at).toLocaleDateString('sk-SK'), 180, startY + 6);

    if (invoice.due_date) {
        doc.text('Dátum splatnosti:', 140, startY + 12);
        doc.text(new Date(invoice.due_date).toLocaleDateString('sk-SK'), 180, startY + 12);

        // Highlight overdue
        if (new Date() > new Date(invoice.due_date) && invoice.status !== 'paid') {
            doc.setTextColor(200, 0, 0); // Red
            doc.text('(Po splatnosti)', 140, startY + 18);
            doc.setTextColor(TEXT_COLOR[0], TEXT_COLOR[1], TEXT_COLOR[2]); // Reset
        }
    }

    // --- Items Table ---
    const tableStartY = Math.max(clientY, startY + 24) + 10;

    const tableData = invoice.items?.map(item => [
        item.description,
        `${item.quantity} ks`,
        formatCurrency(item.unit_price),
        formatCurrency(item.total)
    ]) || [];

    autoTable(doc, {
        startY: tableStartY,
        head: [['Položka', 'Množstvo', 'Cena/ks', 'Spolu']],
        body: tableData,
        theme: 'grid',
        headStyles: {
            fillColor: [30, 30, 30],
            textColor: 255,
            fontStyle: 'bold'
        },
        styles: {
            fontSize: 10,
            cellPadding: 3
        },
        columnStyles: {
            0: { cellWidth: 'auto' }, // Description
            1: { cellWidth: 30, halign: 'right' }, // Qty
            2: { cellWidth: 35, halign: 'right' }, // Unit Price
            3: { cellWidth: 35, halign: 'right' }  // Total
        }
    });

    // --- Totals ---
    // @ts-ignore
    let finalY = doc.lastAutoTable.finalY + 10;

    if (finalY > 250) {
        doc.addPage();
        finalY = 20;
    }

    const rightMargin = 190;
    const labelX = 110;

    doc.setFontSize(10);

    doc.text('Základ (bez DPH):', labelX, finalY);
    doc.text(formatCurrency(invoice.subtotal), rightMargin, finalY, { align: 'right' });

    finalY += 6;
    doc.text(`DPH (${invoice.tax_rate}%):`, labelX, finalY);
    doc.text(formatCurrency(invoice.tax_amount), rightMargin, finalY, { align: 'right' });

    finalY += 8;
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('SPOLU K ÚHRADE:', labelX, finalY);
    doc.setTextColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
    doc.text(formatCurrency(invoice.total), rightMargin, finalY, { align: 'right' });

    // --- Notes ---
    if (invoice.notes) {
        finalY += 15;
        doc.setFont(undefined, 'normal');
        doc.setTextColor(150, 150, 150);
        doc.setFontSize(10);
        doc.text('POZNÁMKA', 20, finalY);

        finalY += 5;
        doc.setTextColor(TEXT_COLOR[0], TEXT_COLOR[1], TEXT_COLOR[2]);
        doc.setFontSize(9);

        const splitNotes = doc.splitTextToSize(invoice.notes, 170);
        doc.text(splitNotes, 20, finalY);
    }

    // --- Footer ---
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Vygenerované systémom ArtStone CRM', 105, pageHeight - 10, { align: 'center' });

    // Save the PDF
    doc.save(`Faktura_${invoice.invoice_number}.pdf`);
};
