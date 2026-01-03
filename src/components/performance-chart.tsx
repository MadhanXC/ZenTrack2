'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { NavHistoryEntry } from '@/lib/types';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { ChartContainer, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { useIsMobile } from '@/hooks/use-mobile';

interface PerformanceChartProps {
  navHistory: NavHistoryEntry[];
}

const chartConfig = {
  nav: {
    label: "NAV",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

export function PerformanceChart({ navHistory }: PerformanceChartProps) {
  const hasHistory = navHistory.length > 0;
  const isMobile = useIsMobile();

  return (
    <Card className='h-full'>
      <CardHeader>
        <CardTitle>Performance Chart</CardTitle>
        <CardDescription>
          {hasHistory
            ? '365-day NAV performance for the selected fund.'
            : 'Select a fund and click "View History" to see its performance chart.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] md:h-[500px] lg:h-[600px] w-full">
        {hasHistory ? (
            <ChartContainer config={chartConfig} className='h-full w-full'>
              <AreaChart
                accessibilityLayer
                data={navHistory}
                margin={{ top: 10, right: isMobile ? 10 : 30, left: isMobile ? -20 : 0, bottom: 20 }}
              >
                <defs>
                  <linearGradient id="colorNav" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-nav)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="var(--color-nav)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="formattedDate"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  interval={isMobile ? Math.floor(navHistory.length / 5) : Math.floor(navHistory.length / 10)}
                  tickFormatter={(value) => {
                      if (!value) return '';
                      // Example: If value is "Jan 1, 2023", show "Jan '23" on mobile
                      if (isMobile) {
                          const date = new Date(value);
                          if(!isNaN(date.getTime())) {
                            const month = date.toLocaleString('default', { month: 'short' });
                            const year = date.getFullYear().toString().slice(-2);
                            return `${month} '${year}`;
                          }
                      }
                      return value;
                  }}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `₹${value.toFixed(0)}`}
                  domain={['dataMin - 10', 'dataMax + 10']}
                />
                <CartesianGrid strokeDasharray="3 3" className='stroke-border/50' />
                <Tooltip
                  content={<ChartTooltipContent
                    formatter={(value) => `₹${Number(value).toFixed(2)}`}
                    labelFormatter={(label, payload) => {
                        const entry = payload?.[0]?.payload;
                        if(entry?.date) {
                            // The date from API is dd-mm-yyyy, we parse and format it
                             const dateObj = new Date(entry.date.split('-').reverse().join('-'));
                             return dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
                        }
                        return label;
                    }}
                   />}
                />
                <Area type="monotone" dataKey="navValue" name="NAV" stroke="var(--color-nav)" fillOpacity={1} fill="url(#colorNav)" />
              </AreaChart>
            </ChartContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
            <p>No performance data to display.</p>
          </div>
        )}
        </div>
      </CardContent>
    </Card>
  );
}
