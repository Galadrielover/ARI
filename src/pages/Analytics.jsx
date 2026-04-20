const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import PageHeader from '@/components/layout/PageHeader';
import WordFrequencyChart from '@/components/analytics/WordFrequencyChart';
import TopicsCloud from '@/components/analytics/TopicsCloud';
import FileTypesChart from '@/components/analytics/FileTypesChart';
import FileTagsChart from '@/components/analytics/FileTagsChart';
import WritingActivity from '@/components/analytics/WritingActivity';

export default function Analytics() {
  const { data: notes = [], isLoading: notesLoading } = useQuery({
    queryKey: ['notes'],
    queryFn: () => db.entities.Note.list('-updated_date'),
  });
  const { data: files = [], isLoading: filesLoading } = useQuery({
    queryKey: ['files'],
    queryFn: () => db.entities.File.list('-created_date'),
  });

  const isLoading = notesLoading || filesLoading;

  return (
    <div className="max-w-6xl mx-auto px-10 py-12">
      <PageHeader
        eyebrow="Insights"
        title="Your knowledge, visualised"
        description="Patterns across everything you've written and stored."
      />

      {isLoading ? (
        <div className="py-32 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-border border-t-accent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-14">
          {/* Notes analytics */}
          <section>
            <div className="flex items-baseline gap-3 mb-8">
              <h2 className="font-serif text-2xl">Writing analysis</h2>
              <span className="text-muted-foreground text-sm">{notes.length} notes</span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <WordFrequencyChart notes={notes} />
              <TopicsCloud notes={notes} />
            </div>
            <div className="mt-6">
              <WritingActivity notes={notes} />
            </div>
          </section>

          {/* File analytics */}
          <section>
            <div className="flex items-baseline gap-3 mb-8">
              <h2 className="font-serif text-2xl">File library analysis</h2>
              <span className="text-muted-foreground text-sm">{files.length} files</span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <FileTypesChart files={files} />
              <FileTagsChart files={files} />
            </div>
          </section>
        </div>
      )}
    </div>
  );
}