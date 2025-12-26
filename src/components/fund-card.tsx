'use client';

import * as React from 'react';
import type { Fund } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Edit, Trash2, Banknote } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from './ui/badge';
import { format, parse } from 'date-fns';


interface FundCardProps {
  fund: Fund;
  onUnitsChange: (fundId: string, newUnits: number) => void;
  onDelete: (fundId: string) => void;
}

export function FundCard({ fund, onUnitsChange, onDelete }: FundCardProps) {
  const [editingUnits, setEditingUnits] = React.useState(fund.units);
  const [isDialogOpen, setDialogOpen] = React.useState(false);
  
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(value);

  const handleSave = () => {
    onUnitsChange(fund.id, Number(editingUnits));
    setDialogOpen(false);
  };
  
  const handleDelete = () => {
    onDelete(fund.id);
  }

  const formattedNavDate = React.useMemo(() => {
    if (!fund.navDate) return null;
    try {
      const date = parse(fund.navDate, 'dd-MM-yyyy', new Date());
      return format(date, 'dd-MMM-yyyy');
    } catch (error) {
      console.error("Error formatting date:", error);
      return fund.navDate; // fallback to original string
    }
  }, [fund.navDate]);

  return (
    <Card className="flex flex-col overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
            <div className='flex-1 min-w-0 mr-2'>
                <CardTitle className="text-base font-medium leading-tight" title={fund.name || fund.schemeCode}>
                  {fund.name || fund.schemeCode}
                </CardTitle>
                 <div className="mt-2 bg-muted/50 p-2 rounded-md">
                    <p className="text-sm font-bold text-primary">NAV: {fund.nav.toFixed(2)}</p>
                    {formattedNavDate && <p className='text-primary text-xs italic'>{formattedNavDate}</p>}
                 </div>
            </div>
            <div className='flex items-center flex-shrink-0'>
              <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-foreground hover:bg-muted hover:text-foreground">
                        <Edit className="h-4 w-4" />
                      </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                          <DialogTitle>Edit Units for {fund.name}</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="units" className="text-right">
                                  Units
                              </Label>
                              <Input
                                  id="units"
                                  type="number"
                                  value={editingUnits}
                                  onChange={(e) => setEditingUnits(Number(e.target.value))}
                                  className="col-span-3"
                              />
                          </div>
                      </div>
                      <Button onClick={handleSave}>Save changes</Button>
                  </DialogContent>
              </Dialog>
               <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive/70 hover:text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action will permanently delete {fund.name || 'this fund'} from your portfolio.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className='bg-destructive hover:bg-destructive/90'>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-end pt-0">
        <div className="flex items-center text-sm text-muted-foreground">
          <Banknote className="mr-2 h-4 w-4 text-chart-4" />
          Current Value
        </div>
        <div className="text-2xl font-bold mt-1">
          {formatCurrency(fund.currentValue)}
        </div>
      </CardContent>
       <CardFooter className="pt-4 pb-4 bg-primary text-primary-foreground">
          <span className="text-sm font-medium">{(fund.units ?? 0).toLocaleString()} units</span>
      </CardFooter>
    </Card>
  );
}
