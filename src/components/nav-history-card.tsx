'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from "@/components/ui/button"
import type { Fund, NavHistoryEntry } from '@/lib/types';
import { NavHistoryTable } from './nav-history-table';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import { parse, format } from 'date-fns';

interface NavHistoryCardProps {
  funds: Fund[];
  history: NavHistoryEntry[];
  onHistoryFetched: (tableHistory: NavHistoryEntry[], chartHistory: NavHistoryEntry[]) => void;
}

export function NavHistoryCard({ funds, history, onHistoryFetched }: NavHistoryCardProps) {
  const [selectedFundId, setSelectedFundId] = React.useState<string | undefined>(funds.length > 0 ? funds[0].id : undefined);
  const [isLoadingHistory, setIsLoadingHistory] = React.useState(false);
  const [historyError, setHistoryError] = React.useState<string | null>(null);

  const selectedFund = React.useMemo(() => {
    return funds.find((fund) => fund.id === selectedFundId);
  }, [funds, selectedFundId]);

  React.useEffect(() => {
    if (funds.length > 0 && !selectedFundId) {
        setSelectedFundId(funds[0].id);
    } else if (funds.length === 0) {
        setSelectedFundId(undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [funds, selectedFundId]);

   React.useEffect(() => {
        onHistoryFetched([], []);
        setHistoryError(null);
   // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [selectedFundId]);


  const handleViewHistory = async () => {
    if (!selectedFund) return;

    setIsLoadingHistory(true);
    setHistoryError(null);

    try {
        const response = await fetch(`/api/nav-history?schemeCode=${selectedFund.schemeCode}`);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch NAV history.');
        }
        const data: NavHistoryEntry[] = await response.json();
        
        // Data for table (descending)
        const tableData = data.map(item => ({
            ...item,
            navValue: parseFloat(item.nav),
            formattedDate: format(parse(item.date, 'dd-MM-yyyy', new Date()), 'MMM d, yyyy')
        }));

        // Data for chart (ascending)
        const chartData = [...tableData].reverse();
        
        onHistoryFetched(tableData, chartData);

    } catch (err: any) {
        setHistoryError(err.message || 'An unexpected error occurred.');
        onHistoryFetched([], []);
    } finally {
        setIsLoadingHistory(false);
    }
  }

  const noFunds = funds.length === 0;

  return (
    <Card className='h-full'>
      <CardHeader>
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className='mb-4 lg:mb-0'>
              <CardTitle>365-Day NAV History</CardTitle>
            </div>
            <div className="flex w-full lg:w-auto items-center gap-2">
                <Select value={selectedFundId} onValueChange={setSelectedFundId} disabled={noFunds}>
                <SelectTrigger className="w-full lg:w-[280px]">
                    <SelectValue placeholder="Select a fund" />
                </SelectTrigger>
                <SelectContent>
                    {funds.map((fund) => (
                    <SelectItem key={fund.id} value={fund.id}>
                        {fund.name}
                    </SelectItem>
                    ))}
                </SelectContent>
                </Select>
                <Button onClick={handleViewHistory} disabled={!selectedFund || isLoadingHistory} className='w-[180px]'>
                    {isLoadingHistory ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'View History'}
                </Button>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        {historyError && (
            <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{historyError}</AlertDescription>
            </Alert>
        )}
        <NavHistoryTable history={history} isLoading={isLoadingHistory} noFunds={noFunds} hasFetched={history.length > 0 || historyError !== null} />
      </CardContent>
    </Card>
  );
}
