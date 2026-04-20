const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from 'react';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { X, Loader2, Link2, FileSpreadsheet, Braces, Upload } from 'lucide-react';

const TABS = [
  { id: 'csv', label: 'CSV paste', icon: FileSpreadsheet },
  { id: 'json', label: 'JSON paste', icon: Braces },
  { id: 'url', label: 'Google Sheets URL', icon: Link2 },
  { id: 'file', label: 'Upload CSV', icon: Upload },
];

function parseCSV(text) {
  const lines = text.trim().split('\n').filter(Boolean);
  if (lines.length < 2) return { columns: [], rows: 0, text: text };
  const cols = lines[0].split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
  return { columns: cols, rows: lines.length - 1, text };
}

function parseJSON(text) {
  const data = JSON.parse(text);
  const arr = Array.isArray(data) ? data : [data];
  const cols = arr.length ? Object.keys(arr[0]) : [];
  return { columns: cols, rows: arr.length, text };
}

export default function ImportModal({ onClose }) {
  const [tab, setTab] = useState('csv');
  const [name, setName] = useState('');
  const [input, setInput] = useState('');
  const qc = useQueryClient();

  const importMutation = useMutation({
    mutationFn: async () => {
      if (!name.trim()) { toast.error('Give this dataset a name'); return; }
      if (!input.trim()) { toast.error('Paste some data first'); return; }

      let parsed = { columns: [], rows: 0, text: input };
      if (tab === 'csv' || tab === 'file') parsed = parseCSV(input);
      if (tab === 'json') parsed = parseJSON(input);

      // AI summarize
      const prompt = `Analyze this dataset and return a JSON object with:
- summary: 2-3 sentence description of what this dataset contains and what it could be used for
- tags: array of 3-5 topical tags

Dataset name: "${name}"
Columns: ${parsed.columns.join(', ')}
Sample (first 500 chars):
${input.slice(0, 500)}`;

      const aiResult = await db.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            summary: { type: 'string' },
            tags: { type: 'array', items: { type: 'string' } },
          },
        },
      });

      return db.entities.DataSource.create({
        name: name.trim(),
        source_type: tab === 'url' ? 'google_sheets' : tab === 'json' ? 'json_paste' : 'csv_paste',
        raw_input: input,
        columns: parsed.columns,
        rows: parsed.rows,
        summary: aiResult.summary || '',
        extracted_text: `Dataset: ${name}\nColumns: ${parsed.columns.join(', ')}\n${input.slice(0, 8000)}`,
        tags: aiResult.tags || [],
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['datasources'] });
      toast.success('Dataset imported and indexed');
      onClose();
    },
    onError: (e) => toast.error('Import failed: ' + e.message),
  });

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!name) setName(f.name.replace(/\.[^.]+$/, ''));
    const reader = new FileReader();
    reader.onload = (ev) => setInput(ev.target.result);
    reader.readAsText(f);
    setTab('file');
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <h2 className="font-serif text-xl">Import dataset</h2>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-6 space-y-5">
          {/* Name */}
          <div>
            <label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground block mb-1.5">Dataset name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Q1 Sales, Customer List…" />
          </div>

          {/* Tabs */}
          <div>
            <label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground block mb-2">Source type</label>
            <div className="flex gap-1.5 flex-wrap">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all border ${
                    tab === id
                      ? 'bg-foreground text-background border-foreground'
                      : 'border-border text-muted-foreground hover:border-accent/50 hover:text-foreground'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Input area */}
          {tab === 'file' ? (
            <div className="border-2 border-dashed border-border rounded-xl p-6 text-center">
              <input type="file" accept=".csv" className="hidden" id="csv-file-input" onChange={handleFile} />
              <label htmlFor="csv-file-input" className="cursor-pointer">
                <Upload className="w-5 h-5 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Click to upload a CSV file</p>
              </label>
              {input && <p className="text-xs text-accent mt-2">✓ File loaded ({input.split('\n').length} lines)</p>}
            </div>
          ) : tab === 'url' ? (
            <div>
              <label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground block mb-1.5">
                Google Sheets public CSV export URL
              </label>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/.../export?format=csv"
              />
              <p className="text-[11px] text-muted-foreground mt-1.5">
                In Google Sheets: File → Share → Publish to web → CSV format, then paste the URL.
              </p>
            </div>
          ) : (
            <div>
              <label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground block mb-1.5">
                Paste {tab === 'json' ? 'JSON' : 'CSV'} data
              </label>
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={tab === 'json' ? '[{"name":"Alice","score":92},…]' : 'name,score,date\nAlice,92,2024-01-01\n…'}
                className="font-mono text-xs min-h-[140px] resize-none"
              />
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border">
          <Button variant="outline" onClick={onClose} className="rounded-full">Cancel</Button>
          <Button
            onClick={() => importMutation.mutate()}
            disabled={importMutation.isPending || !input.trim() || !name.trim()}
            className="rounded-full bg-foreground hover:bg-foreground/90"
          >
            {importMutation.isPending ? (
              <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Indexing…</>
            ) : 'Import & index'}
          </Button>
        </div>
      </div>
    </div>
  );
}