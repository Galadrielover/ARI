import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function FileTagsChart({ files }) {
  const data = useMemo(() => {
    const freq = {};
    files.forEach((f) => {
      (f.tags || []).forEach((t) => {
        if (t) freq[t] = (freq[t] || 0) + 1;
      });
    });
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([tag, count]) => ({ tag, count }));
  }, [files]);

  if (!data.length) {
    return (
      <div className="bg-card border border-border rounded-2xl p-8 flex items-center justify-center h-64">
        <p className="text-muted-foreground text-sm">Tag your files to see distribution</p>
      </div>
    );
  }

  const max = data[0]?.count || 1;

  return (
    <div className="bg-card border border-border rounded-2xl p-8">
      <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-6">File tags</p>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ left: 0, right: 10, top: 0, bottom: 40 }}>
          <XAxis
            dataKey="tag"
            tick={{ fontSize: 11, fill: 'hsl(var(--foreground))' }}
            axisLine={false}
            tickLine={false}
            angle={-35}
            textAnchor="end"
          />
          <YAxis hide />
          <Tooltip
            cursor={{ fill: 'hsl(var(--secondary))' }}
            contentStyle={{
              background: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '10px',
              fontSize: '12px',
            }}
            formatter={(v) => [v, 'files']}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={28}>
            {data.map((entry) => (
              <Cell
                key={entry.tag}
                fill={`hsl(var(--chart-2) / ${0.35 + 0.65 * (entry.count / max)})`}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}