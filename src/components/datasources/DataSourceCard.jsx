const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from 'react';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Trash2, Table2, Rows, Columns, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';

export default function DataSourceCard({ source }) {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(false);

  const del = useMutation({
    mutationFn: () => db.entities.DataSource.delete(source.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['datasources'] });
      toast.success('Data source removed');
    },
  });

  const typeLabel = {
    google_sheets: 'Google Sheets',
    csv_paste: 'CSV',
    json_paste: 'JSON',
    manual_table: 'Manual',
  }[source.source_type] || source.source_type;

  return (
    <div className="group p-5 rounded-xl bg-card border border-border hover:border-accent/40 transition-all duration-300">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
          <Table2 className="w-4 h-4 text-foreground" strokeWidth={1.5} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm truncate">{source.name}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {typeLabel} · {format(new Date(source.created_date), 'MMM d, yyyy')}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 mb-3">
        {source.rows != null && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Rows className="w-3 h-3" /> {source.rows} rows
          </div>
        )}
        {source.columns?.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Columns className="w-3 h-3" /> {source.columns.length} cols
          </div>
        )}
      </div>

      {source.summary && (
        <p className="text-xs text-muted-foreground italic font-serif leading-relaxed line-clamp-2 mb-3">
          {source.summary}
        </p>
      )}

      {source.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {source.tags.slice(0, 4).map((t) => (
            <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{t}</span>
          ))}
        </div>
      )}

      {/* Columns list */}
      {source.columns?.length > 0 && (
        <div className="mb-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          >
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {expanded ? 'Hide' : 'Show'} columns
          </button>
          {expanded && (
            <div className="mt-2 flex flex-wrap gap-1">
              {source.columns.map((c) => (
                <span key={c} className="text-[10px] px-2 py-0.5 rounded bg-secondary/80 font-mono text-foreground/70">{c}</span>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex items-center pt-3 border-t border-border/60 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-destructive hover:text-destructive ml-auto"
          onClick={() => del.mutate()}
        >
          <Trash2 className="w-3 h-3 mr-1.5" /> Remove
        </Button>
      </div>
    </div>
  );
}
