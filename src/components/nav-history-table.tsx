'use client';

import * as React from 'react';
import type { NavHistoryEntry } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from './ui/scroll-area';
import { Skeleton } from './ui/skeleton';

interface NavHistoryTableProps {
  history: NavHistoryEntry[];
  isLoading: boolean;
  noFunds: boolean;
  hasFetched: boolean;
}

export function NavHistoryTable({ history, isLoading, noFunds, hasFetched }: NavHistoryTableProps) {
    const containerHeightClass = "h-[400px] md:h-[500px] lg:h-[600px]";
    
    if (noFunds) {
        return (
            <div className={`${containerHeightClass} flex items-center justify-center text-center p-4 text-muted-foreground border rounded-lg`}>
                Add a fund to view its history.
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className={`space-y-2 p-4 border rounded-lg ${containerHeightClass}`}>
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
            </div>
        );
    }

    if (!hasFetched) {
        return (
             <div className={`${containerHeightClass} flex items-center justify-center text-center p-4 text-muted-foreground border rounded-lg`}>
                Click "View History" to fetch the 365-day NAV data for the selected fund.
            </div>
        )
    }

    if (history.length === 0) {
        return (
             <div className={`${containerHeightClass} flex items-center justify-center text-center p-4 text-muted-foreground border rounded-lg`}>
                No history data available for this fund.
            </div>
        )
    }
  
  return (
    <ScrollArea className={`${containerHeightClass} rounded-md border`}>
      <Table>
        <TableHeader className="sticky top-0 z-10">
          <TableRow className="bg-muted hover:bg-muted">
            <TableHead className="w-[200px]">Date</TableHead>
            <TableHead className="text-right">NAV</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {history.map((entry) => (
            <TableRow key={entry.date}>
              <TableCell className="font-medium">{entry.formattedDate}</TableCell>
              <TableCell className="text-right">{parseFloat(entry.nav).toFixed(2)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}
