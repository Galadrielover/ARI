const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useRef, useState } from 'react';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const TEXT_EXTRACTABLE = ['pdf', 'txt', 'md', 'csv', 'json', 'html', 'docx'];

export default function FileUploader() {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const qc = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (file) => {
      const { file_url } = await db.integrations.Core.UploadFile({ file });
      const ext = (file.name.split('.').pop() || '').toLowerCase();

      let extracted_text = '';
      let summary = '';
      let tags = [];

      if (TEXT_EXTRACTABLE.includes(ext)) {
        try {
          const res = await db.integrations.Core.ExtractDataFromUploadedFile({
            file_url,
            json_schema: {
              type: 'object',
              properties: {
                text: { type: 'string', description: 'All readable text content from the file' },
                summary: { type: 'string', description: 'A 2-3 sentence summary' },
                tags: { type: 'array', items: { type: 'string' }, description: '3-6 short topical tags' },
              },
            },
          });
          if (res.status === 'success' && res.output) {
            const out = Array.isArray(res.output) ? res.output[0] : res.output;
            extracted_text = out.text || '';
            summary = out.summary || '';
            tags = out.tags || [];
          }
        } catch (e) {
          // silent: file still saved
        }
      }

      return db.entities.File.create({
        name: file.name,
        file_url,
        file_type: file.type || ext,
        size: file.size,
        extracted_text,
        summary,
        tags,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['files'] });
      toast.success('File uploaded and indexed');
    },
    onError: () => toast.error('Upload failed'),
  });

  const handleFiles = (files) => {
    Array.from(files).forEach((f) => uploadMutation.mutate(f));
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
      }}
      className={`relative rounded-2xl border-2 border-dashed transition-all duration-300 px-8 py-14 text-center ${
        dragOver ? 'border-accent bg-accent/5' : 'border-border hover:border-accent/40'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />
      <div className="flex flex-col items-center">
        {uploadMutation.isPending ? (
          <Loader2 className="w-6 h-6 text-accent animate-spin mb-4" strokeWidth={1.5} />
        ) : (
          <Upload className="w-6 h-6 text-muted-foreground mb-4" strokeWidth={1.5} />
        )}
        <p className="font-serif text-xl mb-1">
          {uploadMutation.isPending ? 'Indexing your file…' : 'Drop files here'}
        </p>
        <p className="text-sm text-muted-foreground mb-5">
          PDFs, docs, images, and code. ARI will read and index them automatically.
        </p>
        <Button
          onClick={() => inputRef.current?.click()}
          variant="outline"
          className="rounded-full"
          disabled={uploadMutation.isPending}
        >
          Choose files
        </Button>
      </div>
    </div>
  );
}