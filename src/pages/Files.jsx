const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import PageHeader from '@/components/layout/PageHeader';
import FileUploader from '@/components/files/FileUploader';
import FileCard from '@/components/files/FileCard';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

export default function Files() {
  const [q, setQ] = useState('');
  const { data: files = [], isLoading } = useQuery({
    queryKey: ['files'],
    queryFn: () => db.entities.File.list('-created_date'),
  });

  const filtered = files.filter((f) => {
    if (!q) return true;
    const hay = `${f.name} ${f.summary || ''} ${(f.tags || []).join(' ')}`.toLowerCase();
    return hay.includes(q.toLowerCase());
  });

  return (
    <div className="max-w-6xl mx-auto px-10 py-12">
      <PageHeader
        eyebrow="Library"
        title="Your files"
        description="Upload and ARI reads everything — so you can ask later."
      />

      <div className="mb-10">
        <FileUploader />
      </div>

      <div className="flex items-center justify-between mb-6">
        <h2 className="font-serif text-2xl">All files <span className="text-muted-foreground text-lg">· {files.length}</span></h2>
        <div className="relative w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Filter files…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9 rounded-full bg-card"
          />
        </div>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center">
          <p className="font-serif text-xl text-muted-foreground">No files yet.</p>
          <p className="text-sm text-muted-foreground mt-1">Upload something above to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((f) => <FileCard key={f.id} file={f} />)}
        </div>
      )}
    </div>
  );
}