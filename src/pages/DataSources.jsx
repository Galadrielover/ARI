const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import PageHeader from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Plus, Loader2, Trash2, Table2, Link2, FileSpreadsheet, Braces } from 'lucide-react';
import DataSourceCard from '@/components/datasources/DataSourceCard';
import ImportModal from '@/components/datasources/ImportModal';

export default function DataSources() {
  const [showImport, setShowImport] = useState(false);
  const qc = useQueryClient();

  const { data: sources = [], isLoading } = useQuery({
    queryKey: ['datasources'],
    queryFn: () => db.entities.DataSource.list('-created_date'),
  });

  return (
    <div className="max-w-6xl mx-auto px-10 py-12">
      <PageHeader
        eyebrow="Data Sources"
        title="External data"
        description="Import spreadsheets, CSVs, or JSON. ARI indexes everything so you can ask questions across all your data."
        actions={
          <Button
            onClick={() => setShowImport(true)}
            className="rounded-full bg-foreground hover:bg-foreground/90"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Import data
          </Button>
        }
      />

      {isLoading ? (
        <div className="py-32 flex justify-center">
          <div className="w-6 h-6 border-2 border-border border-t-accent rounded-full animate-spin" />
        </div>
      ) : sources.length === 0 ? (
        <div className="py-24 border-2 border-dashed border-border rounded-2xl text-center">
          <Table2 className="w-8 h-8 text-muted-foreground mx-auto mb-4" strokeWidth={1.5} />
          <p className="font-serif text-xl text-muted-foreground mb-2">No data sources yet.</p>
          <p className="text-sm text-muted-foreground mb-6">
            Import a Google Sheets URL, paste CSV, or drop in JSON — ARI will understand it all.
          </p>
          <Button variant="outline" className="rounded-full" onClick={() => setShowImport(true)}>
            Import your first dataset
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sources.map((s) => (
            <DataSourceCard key={s.id} source={s} />
          ))}
        </div>
      )}

      {showImport && <ImportModal onClose={() => setShowImport(false)} />}
    </div>
  );
}