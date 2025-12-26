'use client';

import * as React from 'react';
import { LineChart, PlusCircle, RefreshCw, LogOut } from 'lucide-react';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useFirebase } from '@/firebase';
import { useIsMobile } from '@/hooks/use-mobile';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import type { Fund } from '@/lib/types';
import { ReportDialog } from './report-dialog';

interface HeaderProps {
  onAddFund: (schemeCode: string) => void;
  onRefreshNav: () => void;
  isRefreshing: boolean;
  funds: Fund[];
  userName: string;
}

export function Header({ onAddFund, onRefreshNav, isRefreshing, funds, userName }: HeaderProps) {
  const [isAddFundOpen, setAddFundOpen] = React.useState(false);
  const [isReportOpen, setReportOpen] = React.useState(false);
  const [schemeCode, setSchemeCode] = React.useState('');
  const { auth, user } = useFirebase();
  const isMobile = useIsMobile();

  const handleAdd = () => {
    if (schemeCode) {
      onAddFund(schemeCode);
      setSchemeCode('');
      setAddFundOpen(false);
    }
  };
  
  const handleSignOut = () => {
    if (auth) {
      auth.signOut();
    }
  }

  const RefreshButton = () => (
     <Button
        size={isMobile ? 'icon' : 'default'}
        onClick={onRefreshNav}
        disabled={isRefreshing}
      >
        <RefreshCw className={`h-4 w-4 ${isMobile ? '' : 'mr-2'} ${isRefreshing ? 'animate-spin' : ''}`} />
        {!isMobile && (isRefreshing ? 'Refreshing...' : 'Refresh NAV')}
      </Button>
  );

  const AddFundButton = () => (
     <Button size={isMobile ? 'icon' : 'default'} onClick={() => setAddFundOpen(true)}>
        <PlusCircle className={`h-4 w-4 ${isMobile ? '' : 'mr-2'}`} />
        {!isMobile && 'Add Fund'}
    </Button>
  );
  
  const ReportButton = () => (
    <Button size={isMobile ? 'icon' : 'default'} onClick={() => setReportOpen(true)}>
      <PlusCircle className={`h-4 w-4 ${isMobile ? '' : 'mr-2'}`} />
      {!isMobile && 'Report'}
    </Button>
  );


  const SignOutButton = () => (
     <Button 
        variant="outline" 
        size={isMobile ? 'icon' : 'default'} 
        onClick={handleSignOut}
        className="hover:bg-destructive hover:text-destructive-foreground"
      >
        <LogOut className={`h-4 w-4 ${isMobile ? '' : 'mr-2'}`} />
        {!isMobile && 'Sign Out'}
    </Button>
  );


  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:px-6">
      <div className="flex items-center gap-2">
        <LineChart className="h-6 w-6 text-primary" />
        <span className="text-lg md:text-xl font-bold tracking-tight">ZenTrack</span>
      </div>
      <div className="ml-auto flex items-center gap-2 md:gap-4">
        <TooltipProvider>
            
            <Tooltip>
                <TooltipTrigger asChild>
                    <div><RefreshButton /></div>
                </TooltipTrigger>
                {isMobile && <TooltipContent><p>Refresh NAV</p></TooltipContent>}
            </Tooltip>
            
            <Dialog open={isAddFundOpen} onOpenChange={setAddFundOpen}>
               <Tooltip>
                    <TooltipTrigger asChild>
                       <div>
                         <Button size={isMobile ? 'icon' : 'default'} onClick={() => setAddFundOpen(true)}>
                            <PlusCircle className={`h-4 w-4 ${isMobile ? '' : 'mr-2'}`} />
                            {!isMobile && 'Add Fund'}
                        </Button>
                       </div>
                    </TooltipTrigger>
                    {isMobile && <TooltipContent><p>Add Fund</p></TooltipContent>}
                </Tooltip>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New Fund</DialogTitle>
                  <DialogDescription>
                    Enter the scheme code of the fund you want to add to your portfolio.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="scheme-code" className="text-right">
                      Scheme Code
                    </Label>
                    <Input
                      id="scheme-code"
                      value={schemeCode}
                      onChange={(e) => setSchemeCode(e.target.value)}
                      className="col-span-3"
                      placeholder="e.g. 120503"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleAdd}>Add Fund</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            <Dialog open={isReportOpen} onOpenChange={setReportOpen}>
              <Tooltip>
                  <TooltipTrigger asChild>
                      <div><ReportButton /></div>
                  </TooltipTrigger>
                  {isMobile && <TooltipContent><p>Download Report</p></TooltipContent>}
              </Tooltip>
              <ReportDialog funds={funds} userName={userName} onClose={() => setReportOpen(false)} />
            </Dialog>

            {user && (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div><SignOutButton /></div>
                    </TooltipTrigger>
                    {isMobile && <TooltipContent><p>Sign Out</p></TooltipContent>}
                </Tooltip>
            )}
        </TooltipProvider>
      </div>
    </header>
  );
}
