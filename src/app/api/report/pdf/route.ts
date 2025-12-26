'use server';
import { NextResponse } from 'next/server';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import type { Fund } from '@/lib/types';

// Extend the jsPDF type to include autoTable
interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDF;
}

export async function POST(request: Request) {
  try {
    const { funds, userName } = await request.json();

    if (!funds || !Array.isArray(funds) || funds.length === 0) {
      return new NextResponse(
        JSON.stringify({ message: 'No fund data provided.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const doc = new jsPDF() as jsPDFWithAutoTable;

    doc.setFontSize(18);
    doc.text('Portfolio Report', 14, 22);

    if (userName) {
      doc.setFontSize(12);
      doc.text(`For: ${userName}`, 14, 29);
    }

    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 36);


    const totalValue = funds.reduce((acc: number, fund: Fund) => acc + (fund.currentValue || 0), 0);
    const formattedTotalValue = `INR ${totalValue.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;

    doc.setFontSize(12);
    doc.text(`Total Portfolio Value: ${formattedTotalValue}`, 14, 45);

    const tableColumn = ['Fund Name', 'Units', 'NAV (INR)', 'Current Value (INR)'];
    const tableRows: any[][] = [];

    funds.forEach((fund: Fund) => {
      const fundData = [
        fund.name || fund.schemeCode,
        fund.units.toString(),
        fund.nav.toFixed(2),
        (fund.currentValue || 0).toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
      ];
      tableRows.push(fundData);
    });

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 55,
      headStyles: { fillColor: [41, 128, 185] },
      theme: 'grid',
    });

    const pdfOutput = doc.output('arraybuffer');

    return new NextResponse(pdfOutput, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="portfolio-report.pdf"`,
      },
    });
  } catch (error: any) {
    console.error('Failed to generate PDF report:', error);
    return new NextResponse(
      JSON.stringify({ message: error.message || 'Internal Server Error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
