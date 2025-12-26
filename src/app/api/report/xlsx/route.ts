'use server';
import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import type { Fund } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const { funds, userName } = await request.json();

    if (!funds || !Array.isArray(funds) || funds.length === 0) {
      return new NextResponse(
        JSON.stringify({ message: 'No fund data provided.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const totalValue = funds.reduce((acc: number, fund: Fund) => acc + (fund.currentValue || 0), 0);

    // Main data sheet
    const dataWorksheet = XLSX.utils.json_to_sheet(funds.map((fund: Fund) => ({
        'Fund Name': fund.name || fund.schemeCode,
        'Scheme Code': fund.schemeCode,
        'Category': fund.category,
        'Units': fund.units,
        'NAV (INR)': fund.nav,
        'Current Value (INR)': fund.currentValue
    })));

    // Summary sheet
    const summaryData = [
        { 'Metric': 'Portfolio For', 'Value': userName || 'N/A' },
        { 'Metric': 'Total Portfolio Value (INR)', 'Value': totalValue },
        { 'Metric': 'Number of Funds', 'Value': funds.length },
        { 'Metric': 'Report Generated On', 'Value': new Date().toUTCString() },
    ]
    const summaryWorksheet = XLSX.utils.json_to_sheet(summaryData);
    
    // Auto-fit columns for both sheets
    const fitCols = (ws: XLSX.WorkSheet) => {
        const objectMaxLength: {wch?: number}[] = [];
        const jsonData = XLSX.utils.sheet_to_json(ws, {header: 1}) as any[][];
        jsonData.forEach((row) => {
            row.forEach((cell, colIndex) => {
                objectMaxLength[colIndex] = objectMaxLength[colIndex] || { wch: 0 };
                const cellLength = cell ? String(cell).length : 0;
                if ((objectMaxLength[colIndex].wch || 0) < cellLength) {
                    objectMaxLength[colIndex].wch = cellLength;
                }
            });
        });
        ws['!cols'] = objectMaxLength;
    }

    fitCols(summaryWorksheet);
    fitCols(dataWorksheet);


    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'Summary');
    XLSX.utils.book_append_sheet(workbook, dataWorksheet, 'Fund Details');


    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="portfolio-report.xlsx"`,
      },
    });
  } catch (error: any) {
    console.error('Failed to generate XLSX report:', error);
    return new NextResponse(
      JSON.stringify({ message: error.message || 'Internal Server Error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
