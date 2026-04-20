import React, { useState, useRef, useEffect } from 'react';
import { PenLine, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PENS, INK_COLORS, PAPER_STYLES, penFor } from './constants';

export default function PenPicker({ pen, color, paperStyle, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = penFor(pen);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(!open)}
        className={`h-7 text-xs gap-1.5 rounded-full transition-all ${open ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
      >
        <PenLine className="w-3 h-3" />
        <span className={`${current.font} text-xs`}>{current.label}</span>
        {color && (
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
        )}
      </Button>

      {open && (
        <div className="absolute top-9 left-0 z-50 bg-card border border-border rounded-2xl shadow-2xl p-4 w-64 space-y-4">

          {/* Writing tool */}
          <div>
            <div className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-2">Writing tool</div>
            <div className="space-y-0.5">
              {PENS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => onChange({ pen: p.id, color, paperStyle })}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-secondary transition-colors ${p.id === pen ? 'bg-secondary' : ''}`}
                >
                  <div className="flex items-center gap-2">
                    {p.id === pen && <Check className="w-2.5 h-2.5 text-accent" />}
                    {p.id !== pen && <span className="w-2.5 h-2.5" />}
                    <span className={`${p.font} text-sm text-foreground`}>{p.label}</span>
                  </div>
                  <span className={`${p.font} text-base text-muted-foreground`}>Aa</span>
                </button>
              ))}
            </div>
          </div>

          {/* Ink color */}
          <div>
            <div className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-2">Ink color</div>
            <div className="flex flex-wrap gap-2">
              {INK_COLORS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => onChange({ pen, color: c.value, paperStyle })}
                  title={c.label}
                  className={`w-6 h-6 rounded-full border-2 transition-all hover:scale-110 ${
                    color === c.value ? 'border-foreground scale-110 ring-2 ring-accent/40' : 'border-border'
                  }`}
                  style={{ background: c.value || 'hsl(var(--foreground))' }}
                />
              ))}
            </div>
          </div>

          {/* Paper style */}
          <div>
            <div className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-2">Paper</div>
            <div className="grid grid-cols-4 gap-1.5">
              {PAPER_STYLES.map((ps) => (
                <button
                  key={ps.id}
                  onClick={() => onChange({ pen, color, paperStyle: ps.id })}
                  title={ps.label}
                  className={`h-8 rounded-lg border-2 transition-all overflow-hidden ${
                    paperStyle === ps.id ? 'border-accent' : 'border-border hover:border-accent/50'
                  }`}
                  style={{ background: ps.bg || 'hsl(var(--card))', backgroundSize: '16px 16px' }}
                >
                  <span className="text-[9px] text-muted-foreground block mt-1">{ps.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}