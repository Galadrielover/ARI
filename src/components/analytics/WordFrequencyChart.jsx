import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const STOP_WORDS = new Set([
  'the','a','an','and','or','but','in','on','at','to','for','of','with','by','from',
  'is','it','its','was','are','were','be','been','being','have','has','had','do','does',
  'did','will','would','could','should','may','might','shall','can','this','that','these',
  'those','i','you','he','she','we','they','me','him','her','us','them','my','your',
  'his','our','their','what','which','who','not','no','as','so','if','then','than',
  'about','up','out','into','over','also','just','like','more','when','there','all',
  'some','very','one','two','three','new','now','get','got','make','made',
]);

export default function WordFrequencyChart({ notes }) {
  const data = useMemo(() => {
    const freq = {};
    notes.forEach((n) => {
      const text = `${n.title || ''} ${n.content || ''}`;
      text.toLowerCase()
        .replace(/[^a-z\s]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 3 && !STOP_WORDS.has(w))
        .forEach((w) => { freq[w] = (freq[w] || 0) + 1; });
    });
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 14)
      .map(([word, count]) => ({ word, count }));
  }, [notes]);

  if (!data.length) {
    return (
      <div className="bg-card border border-border rounded-2xl p-8 flex items-center justify-center h-64">
        <p className="text-muted-foreground text-sm">Write some notes to see word frequency</p>
      </div>
    );
  }

  const max = data[0]?.count || 1;

  return (
    <div className="bg-card border border-border rounded-2xl p-8">
      <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-6">Most frequent words</p>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} layout="vertical" margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="word"
            width={90}
            tick={{ fontSize: 12, fontFamily: 'var(--font-sans)', fill: 'hsl(var(--foreground))' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: 'hsl(var(--secondary))' }}
            contentStyle={{
              background: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '10px',
              fontSize: '12px',
              fontFamily: 'var(--font-sans)',
            }}
            formatter={(v) => [v, 'occurrences']}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={18}>
            {data.map((entry, i) => (
              <Cell
                key={entry.word}
                fill={`hsl(var(--accent) / ${0.35 + 0.65 * (entry.count / max)})`}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}