const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import { FileText, NotebookPen, Sparkles, ArrowUpRight, Plus } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

function StatCard({ label, value, hint, to }) {
  return (
    <Link
      to={to}
      className="group relative block p-8 rounded-2xl bg-card border border-border hover:border-accent/40 transition-all duration-300"
    >
      <ArrowUpRight className="w-4 h-4 absolute top-6 right-6 text-muted-foreground group-hover:text-accent group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all" />
      <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-4">{label}</p>
      <p className="font-serif text-5xl font-light">{value}</p>
      <p className="text-xs text-muted-foreground mt-3">{hint}</p>
    </Link>
  );
}

export default function Workspace() {
  const { data: files = [] } = useQuery({
    queryKey: ['files'],
    queryFn: () => db.entities.File.list('-created_date', 5),
  });
  const { data: notes = [] } = useQuery({
    queryKey: ['notes'],
    queryFn: () => db.entities.Note.list('-updated_date', 5),
  });

  return (
    <div className="max-w-6xl mx-auto px-10 py-12">
      <PageHeader
        eyebrow="Workspace"
        title="Welcome to ARI"
        description="Your adaptive cloud workspace. Store files, write notes, and ask ARI to think with you."
        actions={
          <>
            <Button asChild variant="outline" className="rounded-full">
              <Link to="/notes/new"><Plus className="w-4 h-4 mr-1.5" />New note</Link>
            </Button>
            <Button asChild className="rounded-full bg-foreground hover:bg-foreground/90">
              <Link to="/chat"><Sparkles className="w-4 h-4 mr-1.5" />Ask ARI</Link>
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-16">
        <StatCard label="Files stored" value={files.length} hint="documents, images, code" to="/files" />
        <StatCard label="Notes written" value={notes.length} hint="ideas and thinking" to="/notes" />
        <StatCard label="ARI" value="Ready" hint="ask anything about your data" to="/chat" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <section>
          <div className="flex items-baseline justify-between mb-5">
            <h2 className="font-serif text-2xl">Recent files</h2>
            <Link to="/files" className="text-xs text-muted-foreground hover:text-accent">View all →</Link>
          </div>
          {files.length === 0 ? (
            <EmptyState icon={FileText} text="Upload your first file to start building your library." to="/files" label="Upload" />
          ) : (
            <ul className="space-y-1">
              {files.map((f) => (
                <li key={f.id}>
                  <Link to="/files" className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-secondary/60 group border-b border-border/60">
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText className="w-4 h-4 text-muted-foreground shrink-0" strokeWidth={1.5} />
                      <span className="truncate text-sm">{f.name}</span>
                    </div>
                    <span className="text-[11px] text-muted-foreground shrink-0 ml-4">
                      {format(new Date(f.created_date), 'MMM d')}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <div className="flex items-baseline justify-between mb-5">
            <h2 className="font-serif text-2xl">Recent notes</h2>
            <Link to="/notes" className="text-xs text-muted-foreground hover:text-accent">View all →</Link>
          </div>
          {notes.length === 0 ? (
            <EmptyState icon={NotebookPen} text="Capture your first thought. ARI will help you connect it." to="/notes/new" label="Write" />
          ) : (
            <ul className="space-y-1">
              {notes.map((n) => (
                <li key={n.id}>
                  <Link to={`/notes/${n.id}`} className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-secondary/60 group border-b border-border/60">
                    <div className="flex items-center gap-3 min-w-0">
                      <NotebookPen className="w-4 h-4 text-muted-foreground shrink-0" strokeWidth={1.5} />
                      <span className="truncate text-sm font-medium">{n.title || 'Untitled'}</span>
                    </div>
                    <span className="text-[11px] text-muted-foreground shrink-0 ml-4">
                      {format(new Date(n.updated_date), 'MMM d')}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, text, to, label }) {
  return (
    <div className="py-12 px-6 border border-dashed border-border rounded-xl text-center">
      <Icon className="w-6 h-6 text-muted-foreground mx-auto mb-3" strokeWidth={1.5} />
      <p className="text-sm text-muted-foreground mb-4 max-w-xs mx-auto">{text}</p>
      <Button asChild size="sm" variant="outline" className="rounded-full">
        <Link to={to}>{label}</Link>
      </Button>
    </div>
  );
}