import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays, startOfDay } from 'date-fns';

export default function WritingActivity({ notes }) {
  const data = useMemo(() => {
    const days = 30;
    const buckets = {};
    for (let i = days; i >= 0; i--) {
      const d = format(subDays(new Date(), i), 'MMM d');
      buckets[d] = { date: d, notes: 0, words: 0 };
    }
    notes.forEach((n) => {
      const d = format(new Date(n.updated_date), 'MMM d');
      if (buckets[d]) {
        buckets[d].notes += 1;
        buckets[d].words += (n.content || '').split(/\s+/).filter(Boolean).length;
      }
    });
    return Object.values(buckets);
  }, [notes]);

  const totalWords = notes.reduce((s, n) => s + (n.content || '').split(/\s+/).filter(Boolean).length, 0);
  const avgWords = notes.length ? Math.round(totalWords / notes.length) : 0;

  return (
    <div className="bg-card border border-border rounded-2xl p-8">
      <div className="flex items-baseline justify-between mb-6">
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Writing activity · last 30 days</p>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="font-serif text-2xl font-light">{totalWords.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground">total words</p>
          </div>
          <div className="text-right">
            <p className="font-serif text-2xl font-light">{avgWords}</p>
            <p className="text-[10px] text-muted-foreground">avg per note</p>
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={140}>
        <AreaChart data={data} margin={{ left: 0, right: 0, top: 4, bottom: 0 }}>
          <defs>
            <linearGradient id="wordGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={false}
            tickLine={false}
            interval={5}
          />
          <YAxis hide />
          <Tooltip
            contentStyle={{
              background: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '10px',
              fontSize: '12px',
            }}
            formatter={(v, name) => [v, name]}
          />
          <Area
            type="monotone"
            dataKey="words"
            stroke="hsl(var(--accent))"
            strokeWidth={2}
            fill="url(#wordGrad)"
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
