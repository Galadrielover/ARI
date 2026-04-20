import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Pin, Bookmark, Folder, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { penFor } from './constants';

function NoteRow({ note, isActive, onClick }) {
  const preview = (note.content || '').replace(/[#*_`>\[\]\-]/g, '').trim().slice(0, 90);
  const pen = penFor(note.pen);
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 border-b border-border/25 transition-all group ${
        isActive ? 'bg-accent/8 border-l-2 border-l-accent' : 'hover:bg-secondary/50'
      }`}
    >
      <div className="flex items-start justify-between gap-1.5 mb-0.5">
        <span className={`font-serif text-sm leading-snug truncate ${isActive ? 'text-foreground font-medium' : 'text-foreground/85'}`}>
          {note.title || 'Untitled'}
        </span>
        <div className="flex items-center gap-1 shrink-0 mt-0.5">
          {note.bookmarked && <Bookmark className="w-2.5 h-2.5 text-accent" />}
          {note.pinned && <Pin className="w-2.5 h-2.5 text-muted-foreground/60" />}
        </div>
      </div>
      {preview && (
        <p className="text-[10px] text-muted-foreground/60 line-clamp-1 leading-relaxed">{preview}</p>
      )}
      <div className="flex items-center gap-2 mt-1">
        {note.folder && (
          <span className="flex items-center gap-0.5 text-[9px] text-muted-foreground/40">
            <Folder className="w-2 h-2" />
            {note.folder.split('/').pop()}
          </span>
        )}
        {note.pen && note.pen !== 'ballpoint' && (
          <span className={`text-[9px] text-muted-foreground/40 ${pen.font}`}>{pen.label}</span>
        )}
        <span className="text-[9px] text-muted-foreground/40 ml-auto">
          {formatDistanceToNow(new Date(note.updated_date), { addSuffix: true })}
        </span>
      </div>
    </button>
  );
}

export default function NoteListPanel({ notes, activeId, onSelectNote, onCreate, isLoading, q, onSearchChange }) {
  const pinned = notes.filter((n) => n.pinned);
  const rest = notes.filter((n) => !n.pinned);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Search */}
      <div className="px-3 py-2.5 border-b border-border/40 shrink-0">
        <div className="relative">
          <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
          <Input
            placeholder="Search notes…"
            value={q}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-7 h-7 text-xs rounded-lg bg-secondary/60 border-0 shadow-none focus-visible:ring-1"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {isLoading ? (
          <div className="p-4 text-xs text-muted-foreground/60">Loading…</div>
        ) : notes.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-xs text-muted-foreground/60 mb-3">No notes here.</p>
            <Button size="sm" variant="outline" onClick={onCreate} className="rounded-full h-7 text-xs">
              New note
            </Button>
          </div>
        ) : (
          <>
            {pinned.length > 0 && (
              <>
                <div className="px-4 pt-3 pb-1 text-[9px] uppercase tracking-[0.2em] text-muted-foreground/50">Pinned</div>
                {pinned.map((n) => (
                  <NoteRow key={n.id} note={n} isActive={n.id === activeId} onClick={() => onSelectNote(n.id)} />
                ))}
                <div className="px-4 pt-3 pb-1 text-[9px] uppercase tracking-[0.2em] text-muted-foreground/50">Notes</div>
              </>
            )}
            {rest.map((n) => (
              <NoteRow key={n.id} note={n} isActive={n.id === activeId} onClick={() => onSelectNote(n.id)} />
            ))}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-border/40 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={onCreate}
          className="w-full h-7 text-xs rounded-lg justify-start text-muted-foreground/70 gap-1.5 hover:text-foreground"
        >
          <Plus className="w-3 h-3" /> New note
        </Button>
      </div>
    </div>
  );
}