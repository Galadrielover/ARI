import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ExternalLink, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

function isImage(file) {
  return /image|png|jpg|jpeg|gif|webp|svg/.test((file.file_type + ' ' + file.name).toLowerCase());
}
function isPdf(file) {
  return /pdf/.test((file.file_type + ' ' + file.name).toLowerCase());
}

export default function FilePreviewModal({ file, onClose }) {
  if (!file) return null;

  return (
    <Dialog open={!!file} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between pb-3 border-b border-border">
          <DialogTitle className="font-serif text-xl font-light truncate pr-4">{file.name}</DialogTitle>
          <div className="flex items-center gap-2 shrink-0">
            <Button asChild variant="outline" size="sm" className="rounded-full h-8">
              <a href={file.file_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> Open
              </a>
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto min-h-0 mt-2">
          {isImage(file) ? (
            <img
              src={file.file_url}
              alt={file.name}
              className="max-w-full max-h-[70vh] object-contain mx-auto rounded-lg"
            />
          ) : isPdf(file) ? (
            <iframe
              src={file.file_url}
              title={file.name}
              className="w-full h-[70vh] rounded-lg border border-border"
            />
          ) : file.extracted_text ? (
            <div className="space-y-4">
              {file.summary && (
                <div className="p-4 rounded-xl bg-accent/5 border border-accent/20">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-accent mb-2">AI Summary</p>
                  <p className="text-sm font-serif italic text-muted-foreground leading-relaxed">{file.summary}</p>
                </div>
              )}
              {file.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {file.tags.map((t) => (
                    <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{t}</span>
                  ))}
                </div>
              )}
              <div className="p-5 rounded-xl bg-secondary/40 border border-border">
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-3">Extracted Text</p>
                <pre className="text-sm text-foreground/80 whitespace-pre-wrap font-sans leading-relaxed max-h-96 overflow-auto">
                  {file.extracted_text}
                </pre>
              </div>
            </div>
          ) : (
            <div className="py-16 text-center">
              <p className="text-muted-foreground font-serif italic">No preview available.</p>
              <Button asChild variant="outline" className="mt-4 rounded-full" size="sm">
                <a href={file.file_url} target="_blank" rel="noopener noreferrer">Open file</a>
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}