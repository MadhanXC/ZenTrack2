'use client';

import * as React from 'react';
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from './ui/button';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import type { Fund } from '@/lib/types';
import { generatePdf, generateXlsx } from '@/lib/reporting';

type ReportFormat = 'pdf' | 'xlsx';

interface ReportDialogProps {
  funds: Fund[];
  userName: string;
  onClose: () => void;
}

export function ReportDialog({ funds, userName, onClose }: ReportDialogProps) {
  const [format, setFormat] = React.useState<ReportFormat>('pdf');
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleDownload = async () => {
    if (funds.length === 0) {
      setError('There is no fund data to generate a report.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    try {
      if (format === 'pdf') {
        await generatePdf(funds, userName);
      } else {
        await generateXlsx(funds, userName);
      }
      onClose(); // Close the dialog on success
    } catch (err: any) {
      console.error('Report generation failed:', err);
      setError(err.message || 'An unexpected error occurred while generating the report.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Download Portfolio Report</DialogTitle>
          <DialogDescription>
            Select a format to download your portfolio summary.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="py-4">
          <Label className="mb-4 block">Report Format</Label>
          <RadioGroup
            defaultValue="pdf"
            value={format}
            onValueChange={(value: string) => setFormat(value as ReportFormat)}
            className="flex items-center gap-8"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="pdf" id="pdf" />
              <Label htmlFor="pdf">PDF</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="xlsx" id="xlsx" />
              <Label htmlFor="xlsx">Excel (XLSX)</Label>
            </div>
          </RadioGroup>
        </div>

        <DialogFooter>
          <Button
            onClick={handleDownload}
            disabled={isGenerating}
            className="w-full sm:w-auto"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              'Download Report'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
  );
}
