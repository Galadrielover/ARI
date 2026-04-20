const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import PageHeader from '@/components/layout/PageHeader';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Sparkles, FileText, NotebookPen, Table2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// Extract a short snippet from text with the query highlighted
function snippet(text = '', query = '', radius = 120) {
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text.slice(0, radius * 2);
  const start = Math.max(0, idx - radius);
  const end = Math.min(text.length, idx + query.length + radius);
  return (start > 0 ? '…' : '') + text.slice(start, end) + (end < text.length ? '…' : '');
}

function Highlight({ text, query }) {
  if (!query) return <span>{text}</span>;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return (
    <span>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-accent/25 text-foreground rounded-sm px-0.5">{part}</mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
}

export default function SearchPage() {
  const [q, setQ] = useState('');
  const [aiAnswer, setAiAnswer] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const { data: files = [] } = useQuery({
    queryKey: ['files'],
    queryFn: () => db.entities.File.list('-created_date'),
  });
  const { data: notes = [] } = useQuery({
    queryKey: ['notes'],
    queryFn: () => db.entities.Note.list('-updated_date'),
  });
  const { data: dataSources = [] } = useQuery({
    queryKey: ['datasources'],
    queryFn: () => db.entities.DataSource.list('-created_date'),
  });

  const results = useMemo(() => {
    if (!q.trim()) return { files: [], notes: [], dataSources: [] };
    const needle = q.toLowerCase();
    const matches = (hay) => (hay || '').toLowerCase().includes(needle);
    return {
      files: files
        .filter((f) => matches(f.name) || matches(f.summary) || matches(f.extracted_text) || (f.tags || []).some(matches))
        .map((f) => ({
          ...f,
          snippet: matches(f.extracted_text)
            ? snippet(f.extracted_text, q)
            : f.summary || '',
        })),
      notes: notes
        .filter((n) => matches(n.title) || matches(n.content) || (n.tags || []).some(matches))
        .map((n) => ({
          ...n,
          snippet: matches(n.content) ? snippet(n.content, q) : '',
        })),
      dataSources: dataSources
        .filter((d) => matches(d.name) || matches(d.summary) || matches(d.extracted_text) || (d.tags || []).some(matches))
        .map((d) => ({
          ...d,
          snippet: matches(d.extracted_text)
            ? snippet(d.extracted_text, q)
            : d.summary || '',
        })),
    };
  }, [q, files, notes, dataSources]);

  const totalHits = results.files.length + results.notes.length + results.dataSources.length;

  const askAri = async () => {
    if (!q.trim()) return;
    setAiLoading(true);
    setAiAnswer('');
    const { buildAriContext } = await import('@/lib/ariContext');
    const { context } = await buildAriContext();
    const prompt = `You are ARI, searching the user's personal knowledge base.\n\nBASE:\n${context}\n\nUSER QUERY: "${q}"\n\nAnswer in 3-5 sentences. Reference specific file, note, or dataset names when relevant. If nothing relevant exists, say so.`;
    const answer = await db.integrations.Core.InvokeLLM({ prompt });
    setAiAnswer(answer);
    setAiLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-10 py-12">
      <PageHeader
        eyebrow="Search"
        title="Find anything"
        description="Search across files, notes, and imported datasets — or ask ARI in natural language."
      />

      <div className="relative mb-3">
        <Search className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && askAri()}
          placeholder="Search files, notes, data — or ask a question…"
          className="pl-14 pr-4 h-14 rounded-2xl bg-card text-base"
        />
      </div>
      <div className="flex items-center justify-between mb-8">
        <p className="text-xs text-muted-foreground">
          {q ? `${totalHits} match${totalHits === 1 ? '' : 'es'} across files, notes & data` : 'Type to search'}
        </p>
        <Button onClick={askAri} disabled={!q.trim() || aiLoading} size="sm" variant="outline" className="rounded-full">
          {aiLoading ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 mr-1.5" />}
          Ask ARI
        </Button>
      </div>

      {aiAnswer && (
        <div className="mb-10 p-6 rounded-2xl bg-accent/5 border border-accent/20">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-accent" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-accent font-medium">ARI's answer</span>
          </div>
          <p className="text-sm leading-relaxed whitespace-pre-wrap font-serif">{aiAnswer}</p>
        </div>
      )}

      {q && (
        <div className="space-y-10">
          {results.notes.length > 0 && (
            <section>
              <h2 className="font-serif text-xl mb-4 flex items-center gap-2">
                <NotebookPen className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} /> Notes
                <span className="text-sm text-muted-foreground font-sans font-normal">· {results.notes.length}</span>
              </h2>
              <div className="space-y-2">
                {results.notes.map((n) => (
                  <Link key={n.id} to={`/notes/${n.id}`} className="block p-4 rounded-xl bg-card border border-border hover:border-accent/40 transition-all">
                    <p className="font-medium text-sm mb-1">{n.title || 'Untitled'}</p>
                    {n.snippet && (
                      <p className="text-xs text-muted-foreground leading-relaxed font-serif">
                        <Highlight text={n.snippet} query={q} />
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {results.files.length > 0 && (
            <section>
              <h2 className="font-serif text-xl mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} /> Files
                <span className="text-sm text-muted-foreground font-sans font-normal">· {results.files.length}</span>
              </h2>
              <div className="space-y-2">
                {results.files.map((f) => (
                  <a key={f.id} href={f.file_url} target="_blank" rel="noopener noreferrer"
                    className="block p-4 rounded-xl bg-card border border-border hover:border-accent/40 transition-all">
                    <p className="font-medium text-sm mb-1">{f.name}</p>
                    {f.snippet && (
                      <p className="text-xs text-muted-foreground leading-relaxed font-serif">
                        <Highlight text={f.snippet} query={q} />
                      </p>
                    )}
                    {f.tags?.length > 0 && (
                      <div className="flex gap-1.5 mt-2">
                        {f.tags.slice(0, 4).map((t) => (
                          <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{t}</span>
                        ))}
                      </div>
                    )}
                  </a>
                ))}
              </div>
            </section>
          )}

          {results.dataSources.length > 0 && (
            <section>
              <h2 className="font-serif text-xl mb-4 flex items-center gap-2">
                <Table2 className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} /> Data sources
                <span className="text-sm text-muted-foreground font-sans font-normal">· {results.dataSources.length}</span>
              </h2>
              <div className="space-y-2">
                {results.dataSources.map((d) => (
                  <Link key={d.id} to="/data-sources"
                    className="block p-4 rounded-xl bg-card border border-border hover:border-accent/40 transition-all">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm">{d.name}</p>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                        {d.rows ?? '?'} rows
                      </span>
                    </div>
                    {d.snippet && (
                      <p className="text-xs text-muted-foreground leading-relaxed font-mono">
                        <Highlight text={d.snippet} query={q} />
                      </p>
                    )}
                    {d.tags?.length > 0 && (
                      <div className="flex gap-1.5 mt-2">
                        {d.tags.slice(0, 4).map((t) => (
                          <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{t}</span>
                        ))}
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {totalHits === 0 && !aiAnswer && (
            <div className="py-16 text-center">
              <p className="font-serif text-lg text-muted-foreground">No keyword matches.</p>
              <p className="text-sm text-muted-foreground mt-1">Try asking ARI instead — it understands meaning.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}