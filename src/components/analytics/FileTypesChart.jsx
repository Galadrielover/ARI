import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = [
  'hsl(var(--accent))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

function getExt(name = '') {
  const parts = name.split('.');
  return parts.length > 1 ? parts.pop().toLowerCase() : 'unknown';
}

export default function FileTypesChart({ files }) {
  const data = useMemo(() => {
    const freq = {};
    files.forEach((f) => {
      const ext = getExt(f.name);
      freq[ext] = (freq[ext] || 0) + 1;
    });
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, value]) => ({ name, value }));
  }, [files]);

  if (!data.length) {
    return (
      <div className="bg-card border border-border rounded-2xl p-8 flex items-center justify-center h-64">
        <p className="text-muted-foreground text-sm">Upload files to see type breakdown</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-8">
      <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-6">File types</p>
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={95}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((entry, i) => (
              <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '10px',
              fontSize: '12px',
            }}
            formatter={(v, name) => [v + ' file' + (v > 1 ? 's' : ''), '.' + name]}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(value) => `.${value}`}
            wrapperStyle={{ fontSize: '11px', fontFamily: 'var(--font-sans)' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}