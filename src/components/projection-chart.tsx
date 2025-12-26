'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import type { Fund } from '@/lib/types';
import { Button } from './ui/button';

interface ProjectionChartProps {
  funds: Fund[];
}

type ProjectionData = {
  year: number;
  value: number;
};

type Frequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

const chartConfig = {
  value: {
    label: "Projected Value",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

const frequencyMultipliers = {
  daily: 365,
  weekly: 52,
  monthly: 12,
  yearly: 1,
};


export function ProjectionChart({ funds }: ProjectionChartProps) {
  const [selectedFundId, setSelectedFundId] = React.useState<string | undefined>(funds.length > 0 ? funds[0].id : undefined);
  const [growthRate, setGrowthRate] = React.useState(10); // Default 10%
  const [period, setPeriod] = React.useState(10); // Default 10 years
  const [investmentUnits, setInvestmentUnits] = React.useState(0);
  const [frequency, setFrequency] = React.useState<Frequency>('monthly');
  const [projectionData, setProjectionData] = React.useState<ProjectionData[]>([]);

  const selectedFund = React.useMemo(() => {
    return funds.find((fund) => fund.id === selectedFundId);
  }, [funds, selectedFundId]);

  React.useEffect(() => {
    if (funds.length > 0 && !selectedFundId) {
      setSelectedFundId(funds[0].id);
    }
  }, [funds, selectedFundId]);

  const calculateProjection = React.useCallback(() => {
    if (!selectedFund || !selectedFund.nav || period <= 0 || growthRate < 0) {
      setProjectionData([]);
      return;
    }

    const data: ProjectionData[] = [];
    const annualRate = growthRate / 100;
    const periodsPerYear = frequencyMultipliers[frequency];
    
    let futureValue = selectedFund.currentValue;
    const periodicInvestmentValue = investmentUnits * selectedFund.nav;
    
    data.push({ year: 0, value: Math.round(futureValue) });

    for (let year = 1; year <= period; year++) {
      // Calculate future value of the initial principal at the end of the current year
      const fvOfPrincipal = selectedFund.currentValue * Math.pow(1 + annualRate, year);
      
      // Calculate future value of the annuity (periodic investments)
      let fvOfAnnuity = 0;
      if (periodicInvestmentValue > 0 && annualRate > 0) {
        // Standard FV of Annuity Formula for end-of-period payments
        // We calculate it for each year based on total periods up to that year
        const totalPeriods = year * periodsPerYear;
        const ratePerPeriod = annualRate / periodsPerYear;
        fvOfAnnuity = periodicInvestmentValue * ((Math.pow(1 + ratePerPeriod, totalPeriods) - 1) / ratePerPeriod);

        // This gives the value at the end of the last period. We need to adjust for annual compounding view if needed, but for simplicity we can sum them up.
        // A simpler mental model for the chart is to compound the previous year's total and add new investments.
      } else if (periodicInvestmentValue > 0) {
        // if rate is 0
        fvOfAnnuity = periodicInvestmentValue * periodsPerYear * year;
      }
      
      // Let's use a simpler iterative approach for yearly chart points
      let yearlyTotal = selectedFund.currentValue;
      data.splice(1); // Clear previous calculations except year 0

      for (let i = 1; i <= period; i++) {
        const investmentThisYear = periodicInvestmentValue * periodsPerYear;
        yearlyTotal = (yearlyTotal + investmentThisYear) * (1 + annualRate);
        data.push({ year: i, value: Math.round(yearlyTotal) });
      }
      break; // exit loop after recalculating with iterative method.
    }


    setProjectionData(data);
  }, [selectedFund, growthRate, period, investmentUnits, frequency]);
  
  React.useEffect(() => {
    calculateProjection();
  }, [calculateProjection]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Investment Projection</CardTitle>
        <CardDescription>Project the future value of your holdings with periodic unit additions.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
            <div className="space-y-2">
                <Label htmlFor="fund-select">Fund</Label>
                <Select value={selectedFundId} onValueChange={setSelectedFundId} disabled={funds.length === 0}>
                    <SelectTrigger id="fund-select">
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
            </div>
             <div className="space-y-2">
                <Label htmlFor="investment-units">Investment units</Label>
                <Input
                    id="investment-units"
                    type="number"
                    value={investmentUnits}
                    onChange={(e) => setInvestmentUnits(Number(e.target.value))}
                    placeholder="e.g. 100"
                />
            </div>
             <div className="space-y-2">
                <Label htmlFor="frequency-select">Frequency</Label>
                 <Select value={frequency} onValueChange={(value) => setFrequency(value as Frequency)}>
                    <SelectTrigger id="frequency-select">
                        <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label htmlFor="growth-rate">Expected Annual Growth (%)</Label>
                <Input
                    id="growth-rate"
                    type="number"
                    value={growthRate}
                    onChange={(e) => setGrowthRate(Number(e.target.value))}
                    placeholder="e.g. 12"
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="period">Period (Years)</Label>
                <Input
                    id="period"
                    type="number"
                    value={period}
                    onChange={(e) => setPeriod(Number(e.target.value))}
                    placeholder="e.g. 10"
                />
            </div>
        </div>

        <div className="aspect-[16/9] w-full">
        {projectionData.length > 1 ? (
            <ChartContainer config={chartConfig} className='h-full w-full'>
              <AreaChart
                accessibilityLayer
                data={projectionData}
                margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
              >
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-value)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="var(--color-value)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="year"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  label={{ value: 'Years', position: 'insideBottom', offset: -10 }}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => formatCurrency(value)}
                  domain={['dataMin', 'dataMax']}
                />
                <CartesianGrid strokeDasharray="3 3" className='stroke-border/50' />
                <Tooltip
                  content={<ChartTooltipContent
                    formatter={(value) => formatCurrency(Number(value))}
                    labelFormatter={(label) => `Year ${label}`}
                  />}
                />
                <Area type="monotone" dataKey="value" stroke="var(--color-value)" fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ChartContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
            <p>Select a fund and set parameters to calculate projection.</p>
          </div>
        )}
        </div>
      </CardContent>
    </Card>
  );
}
