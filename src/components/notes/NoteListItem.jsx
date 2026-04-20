import React from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Pin } from 'lucide-react';

export default function NoteListItem({ note }) {
  const preview = (note.content || '').replace(/[#*_`>\-]/g, '').slice(0, 160);
  return (
    <Link
      to={`/notes/${note.id}`}
      className="group block p-6 rounded-xl bg-card border border-border hover:border-accent/40 transition-all duration-300"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="font-serif text-xl leading-tight group-hover:text-accent transition-colors">
          {note.title || 'Untitled'}
        </h3>
        {note.pinned && <Pin className="w-3.5 h-3.5 text-accent shrink-0 mt-1" />}
      </div>
      {preview && (
        <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">{preview}</p>
      )}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/60">
        <div className="flex flex-wrap gap-1.5">
          {(note.tags || []).slice(0, 3).map((t) => (
            <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
              {t}
            </span>
          ))}
        </div>
        <span className="text-[11px] text-muted-foreground">
          {formatDistanceToNow(new Date(note.updated_date), { addSuffix: true })}
        </span>
      </div>
    </Link>
  );
}