import React, { useMemo } from 'react';

export default function TopicsCloud({ notes }) {
  const tagData = useMemo(() => {
    const freq = {};
    notes.forEach((n) => {
      (n.tags || []).forEach((t) => {
        if (t) freq[t] = (freq[t] || 0) + 1;
      });
    });
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30);
  }, [notes]);

  if (!tagData.length) {
    return (
      <div className="bg-card border border-border rounded-2xl p-8 flex items-center justify-center h-64">
        <p className="text-muted-foreground text-sm">Add tags to your notes to see topic clusters</p>
      </div>
    );
  }

  const max = tagData[0]?.[1] || 1;

  return (
    <div className="bg-card border border-border rounded-2xl p-8">
      <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-6">Topic clusters</p>
      <div className="flex flex-wrap gap-2.5 items-center">
        {tagData.map(([tag, count]) => {
          const ratio = count / max;
          const size = 11 + Math.round(ratio * 14);
          const opacity = 0.4 + ratio * 0.6;
          return (
            <span
              key={tag}
              className="rounded-full px-3 py-1 bg-accent/10 text-accent font-medium transition-all hover:bg-accent/20 cursor-default"
              style={{ fontSize: `${size}px`, opacity }}
              title={`${count} note${count > 1 ? 's' : ''}`}
            >
              {tag}
            </span>
          );
        })}
      </div>
      <div className="mt-6 flex items-center gap-2">
        {tagData.slice(0, 3).map(([tag, count]) => (
          <div key={tag} className="text-[10px] text-muted-foreground">
            <span className="font-medium text-foreground">{tag}</span> ×{count}
            {tagData.indexOf(tagData.find(d => d[0] === tag)) < tagData.length - 1 && <span className="mx-1.5">·</span>}
          </div>
        ))}
      </div>
    </div>
  );
}