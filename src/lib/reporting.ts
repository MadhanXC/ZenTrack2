'use client';

import { saveAs } from 'file-saver';
import type { Fund } from './types';

const handleApiResponse = async (response: Response, fileName: string) => {
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to process the request.' }));
        throw new Error(errorData.message || `Failed to download file. Status: ${response.status}`);
    }
    const blob = await response.blob();
    saveAs(blob, fileName);
};

export const generatePdf = async (funds: Fund[], userName: string) => {
    const response = await fetch('/api/report/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ funds, userName }),
    });
    await handleApiResponse(response, 'portfolio-report.pdf');
};

export const generateXlsx = async (funds: Fund[], userName: string) => {
    const response = await fetch('/api/report/xlsx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ funds, userName }),
    });
    await handleApiResponse(response, 'portfolio-report.xlsx');
};
