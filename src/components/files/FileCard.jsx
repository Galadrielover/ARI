const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from 'react';
import { FileText, FileImage, FileCode, File as FileIcon, Trash2, ExternalLink, Eye } from 'lucide-react';
import { format } from 'date-fns';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import FilePreviewModal from './FilePreviewModal';

function iconFor(type = '', name = '') {
  const t = (type + ' ' + name).toLowerCase();
  if (/image|png|jpg|jpeg|gif|webp|svg/.test(t)) return FileImage;
  if (/js|ts|jsx|tsx|py|code|json|html|css/.test(t)) return FileCode;
  if (/pdf|doc|txt|md/.test(t)) return FileText;
  return FileIcon;
}

function formatSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function FileCard({ file }) {
  const qc = useQueryClient();
  const Icon = iconFor(file.file_type, file.name);
  const [previewing, setPreviewing] = useState(false);

  const del = useMutation({
    mutationFn: () => db.entities.File.delete(file.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['files'] });
      toast.success('File deleted');
    },
  });

  return (
    <div className="group relative p-5 rounded-xl bg-card border border-border hover:border-accent/40 hover:shadow-sm transition-all duration-300">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-foreground" strokeWidth={1.5} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-sm truncate">{file.name}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {format(new Date(file.created_date), 'MMM d, yyyy')}
            {file.size ? ` · ${formatSize(file.size)}` : ''}
          </p>
          {file.summary && (
            <p className="text-xs text-muted-foreground mt-3 line-clamp-2 font-serif italic leading-relaxed">
              {file.summary}
            </p>
          )}
          {file.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {file.tags.slice(0, 4).map((t) => (
                <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 mt-4 pt-3 border-t border-border/60 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setPreviewing(true)}>
          <Eye className="w-3 h-3 mr-1.5" /> Preview
        </Button>
        <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
          <a href={file.file_url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="w-3 h-3 mr-1.5" /> Open
          </a>
        </Button>
        <Button
          onClick={() => del.mutate()}
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-destructive hover:text-destructive ml-auto"
        >
          <Trash2 className="w-3 h-3 mr-1.5" /> Delete
        </Button>
      </div>
      <FilePreviewModal file={previewing ? file : null} onClose={() => setPreviewing(false)} />
    </div>
  );
}
