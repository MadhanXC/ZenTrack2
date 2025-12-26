'use client';

import * as React from 'react';
import { Header } from '@/components/header';
import { FundCard } from '@/components/fund-card';
import { PerformanceChart } from '@/components/performance-chart';
import { NavHistoryCard } from '@/components/nav-history-card';
import { ProjectionChart } from '@/components/projection-chart';
import type { Fund, NavHistoryEntry } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Loader } from 'lucide-react';
import {
  useFirebase,
  useMemoFirebase,
  useUser,
  updateDocumentNonBlocking,
  useCollection,
  deleteDocumentNonBlocking,
  setDocumentNonBlocking,
} from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

function useAuthRedirect() {
    const { user, isUserLoading } = useUser();
    const router = useRouter();

    React.useEffect(() => {
        if (!isUserLoading && !user) {
            router.replace('/login');
        }
    }, [user, isUserLoading, router]);
}


function Dashboard() {
  useAuthRedirect();
  const { user, isUserLoading } = useUser();
  const { firestore } = useFirebase();

  const fundsCollectionRef = useMemoFirebase(
    () => (user ? collection(firestore, 'users', user.uid, 'funds') : null),
    [firestore, user]
  );

  const { data: fundsFromFirebase, isLoading: isFundsLoading } =
    useCollection<Fund>(fundsCollectionRef);

  const [fundsData, setFundsData] = React.useState<Fund[]>([]);
  const [navHistoryForChart, setNavHistoryForChart] = React.useState<NavHistoryEntry[]>([]);
  const [navHistoryForTable, setNavHistoryForTable] = React.useState<NavHistoryEntry[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isRefreshingNav, setIsRefreshingNav] = React.useState(false);

  React.useEffect(() => {
    if (isUserLoading) {
      setLoading(true);
      return;
    }
    // Auth redirect is handled by the hook
  }, [isUserLoading, user]);

    React.useEffect(() => {
    if (isFundsLoading) {
      setLoading(true);
      return;
    }

    if (fundsFromFirebase) {
        const fundsWithDefaults = fundsFromFirebase.map((f) => ({
          ...f,
          name: f.name || '',
          nav: f.nav || 0,
          currentValue: f.currentValue || 0,
        }));
        setFundsData(fundsWithDefaults);
    } else if (user) { // Only clear funds if a user is logged in but has no funds
        setFundsData([]);
    }
    setLoading(isUserLoading || isFundsLoading);

  }, [fundsFromFirebase, isFundsLoading, isUserLoading, user]);

  const handleHistoryFetched = (tableHistory: NavHistoryEntry[], chartHistory: NavHistoryEntry[]) => {
    setNavHistoryForTable(tableHistory);
    setNavHistoryForChart(chartHistory);
  };

  const handleUnitsChange = (fundId: string, newUnits: number) => {
    if (!user || !firestore) return;

    const fundDocRef = doc(firestore, 'users', user.uid, 'funds', fundId);
    
    const fund = fundsData.find(f => f.id === fundId);
    if(fund) {
      const currentValue = (fund.nav || 0) * newUnits;
      setFundsData(prev => prev.map(f => f.id === fundId ? { ...f, units: newUnits, currentValue } : f));
      updateDocumentNonBlocking(fundDocRef, { units: newUnits, currentValue });
    }
  };

  const handleAddFund = (schemeCode: string) => {
    if (!user || !firestore) return;
    if (fundsData.some(fund => fund.schemeCode === schemeCode)) {
      setError('This fund is already in your portfolio.');
      setTimeout(() => setError(null), 3000);
      return;
    }

    const newFund: Fund = {
      id: schemeCode,
      schemeCode: schemeCode,
      units: 0,
      name: `Fund ${schemeCode}`, 
      category: 'Uncategorized',
      nav: 0,
      currentValue: 0,
    };
    const fundDocRef = doc(firestore, 'users', user.uid, 'funds', schemeCode);
    setDocumentNonBlocking(fundDocRef, { ...newFund, userId: user.uid }, { merge: false });
  };


  const handleDeleteFund = (fundId: string) => {
    if (!user || !firestore) return;
    
    const fundDocRef = doc(firestore, 'users', user.uid, 'funds', fundId);
    deleteDocumentNonBlocking(fundDocRef);
  };
  
  const handleRefreshNav = async () => {
    if (!user || !firestore || fundsData.length === 0) return;

    setIsRefreshingNav(true);
    setError(null);

    try {
        const schemeCodes = fundsData.map(f => f.schemeCode).join(',');
        const navApiResponse = await fetch(`/api/nav?schemes=${schemeCodes}`);
        if (!navApiResponse.ok) {
            throw new Error('Failed to fetch latest NAV data.');
        }
        const navData: Record<string, { nav: number; name: string, date: string }> = await navApiResponse.json();

        const updates: Partial<Fund>[] = [];
        
        fundsData.forEach((fund) => {
            const latestNavData = navData[fund.schemeCode];
            if (latestNavData) {
                const newNav = latestNavData.nav;
                const newCurrentValue = newNav * fund.units;
                const newName = latestNavData.name || fund.name;
                const newNavDate = latestNavData.date;

                const updatePayload: Partial<Fund> = {
                    id: fund.id,
                    nav: newNav,
                    currentValue: newCurrentValue,
                    name: newName,
                    navDate: newNavDate,
                };
                
                updates.push(updatePayload);
                
                const fundDocRef = doc(firestore, 'users', user.uid, 'funds', fund.id);
                updateDocumentNonBlocking(fundDocRef, { nav: newNav, currentValue: newCurrentValue, name: newName, navDate: newNavDate });
            }
        });

        if(updates.length > 0) {
            setFundsData(prevFunds => {
                const updatesMap = new Map(updates.map(u => [u.id, u]));
                return prevFunds.map(fund => {
                    const fundUpdate = updatesMap.get(fund.id);
                    return fundUpdate ? { ...fund, ...fundUpdate } : fund;
                });
            });
        }

    } catch (err: any) {
        setError(err.message || 'An unexpected error occurred while refreshing.');
        console.error(err);
    } finally {
        setIsRefreshingNav(false);
    }
};


  const totalValue = React.useMemo(() => {
    return fundsData.reduce((acc, fund) => acc + (fund.currentValue || 0), 0);
  }, [fundsData]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);


  const isAppLoading = isUserLoading || !user || loading;

  if (isAppLoading) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background">
          <Loader className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Loading your portfolio...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <Header 
        onAddFund={handleAddFund} 
        onRefreshNav={handleRefreshNav} 
        isRefreshing={isRefreshingNav}
        funds={fundsData}
        userName={user.displayName || ''}
      />
      <main className="flex flex-1 flex-col gap-8 p-4 md:p-8">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <section className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
            <h2 className="text-2xl font-semibold mb-2">Welcome, <span className="text-primary">{user.displayName}</span>!</h2>
            <div className="text-sm text-muted-foreground">Total Portfolio Value</div>
            <div className="text-4xl font-bold tracking-tight">{formatCurrency(totalValue)}</div>
        </section>
        <section>
          {fundsData.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                  {fundsData.map((fund) => (
                      <FundCard key={fund.id} fund={fund} onUnitsChange={handleUnitsChange} onDelete={handleDeleteFund} />
                  ))}
              </div>
          ) : (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <h2 className="text-2xl font-semibold">No Fund details added.</h2>
                <p className="mt-2 text-muted-foreground">Click "Add Fund" to start tracking your investments.</p>
            </div>
          )}
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className='lg:col-span-2'>
                <NavHistoryCard funds={fundsData} onHistoryFetched={handleHistoryFetched} history={navHistoryForTable} />
            </div>
            <div className='lg:col-span-3'>
                <PerformanceChart navHistory={navHistoryForChart} />
            </div>
        </section>

        <section>
          <ProjectionChart funds={fundsData} />
        </section>
      </main>
    </div>
  );
}

export default function DashboardPage() {
    return (
        <Dashboard />
    )
}
