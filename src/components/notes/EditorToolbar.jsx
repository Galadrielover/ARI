import React from 'react';
import { Pin, Trash2, Sparkles, Loader2, Save, Bookmark, BookmarkCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import PenPicker from './PenPicker';
import { HEADINGS } from './constants';

function HeadingBar({ textareaRef, content, onChange }) {
  const insert = (prefix) => {
    const el = textareaRef.current;
    if (!el) { onChange(content + prefix); return; }
    const start = el.selectionStart;
    const lineStart = content.lastIndexOf('\n', start - 1) + 1;
    const newContent = content.slice(0, lineStart) + prefix + content.slice(lineStart);
    onChange(newContent);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(lineStart + prefix.length, lineStart + prefix.length);
    }, 0);
  };

  return (
    <div className="flex items-center gap-0.5">
      {HEADINGS.map((h) => (
        <button
          key={h.label}
          onClick={() => insert(h.prefix)}
          title={h.title}
          className="px-1.5 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-colors"
        >
          {h.label}
        </button>
      ))}
    </div>
  );
}

export default function EditorToolbar({
  pen, color, paperStyle, onPenChange,
  pinned, onPin,
  bookmarked, onBookmark,
  dirty, lastSaved,
  aiLoading, onAiAction,
  onSave, onDelete,
  textareaRef, content, onContentChange,
}) {
  return (
    <div className="flex items-center justify-between px-5 py-2 border-b border-border/40 shrink-0 gap-3 bg-card/50 backdrop-blur-sm">
      {/* Left: tools */}
      <div className="flex items-center gap-1 flex-wrap min-w-0">
        <PenPicker pen={pen} color={color} paperStyle={paperStyle} onChange={onPenChange} />

        <div className="w-px h-4 bg-border/60 mx-1 shrink-0" />

        <HeadingBar textareaRef={textareaRef} content={content} onChange={onContentChange} />

        <div className="w-px h-4 bg-border/60 mx-1 shrink-0" />

        {/* AI buttons */}
        <span className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground/60 shrink-0">ARI</span>
        {[
          { id: 'summarize', label: 'Summarize' },
          { id: 'expand',    label: 'Expand' },
          { id: 'outline',   label: 'Outline' },
        ].map((a) => (
          <Button
            key={a.id}
            variant="ghost"
            size="sm"
            onClick={() => onAiAction(a.id)}
            disabled={aiLoading}
            className="h-6 text-[10px] text-muted-foreground hover:text-foreground rounded-full px-2 gap-1"
          >
            {aiLoading
              ? <Loader2 className="w-2.5 h-2.5 animate-spin" />
              : <Sparkles className="w-2.5 h-2.5" />}
            {a.label}
          </Button>
        ))}
      </div>

      {/* Right: state + actions */}
      <div className="flex items-center gap-0.5 shrink-0">
        <span className="text-[10px] text-muted-foreground/60 mr-1 whitespace-nowrap">
          {dirty ? 'Saving…' : lastSaved ? `Saved ${formatDistanceToNow(new Date(lastSaved), { addSuffix: true })}` : ''}
        </span>
        <Button variant="ghost" size="icon" onClick={onBookmark} className="h-7 w-7" title="Bookmark">
          {bookmarked
            ? <BookmarkCheck className="w-3.5 h-3.5 text-accent" />
            : <Bookmark className="w-3.5 h-3.5 text-muted-foreground" />}
        </Button>
        <Button variant="ghost" size="icon" onClick={onPin} className="h-7 w-7" title="Pin">
          <Pin className={`w-3.5 h-3.5 ${pinned ? 'text-accent fill-accent' : 'text-muted-foreground'}`} />
        </Button>
        <Button variant="ghost" size="icon" onClick={onSave} className="h-7 w-7" title="Save">
          <Save className="w-3.5 h-3.5 text-muted-foreground" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onDelete} className="h-7 w-7" title="Delete">
          <Trash2 className="w-3.5 h-3.5 text-destructive/60 hover:text-destructive" />
        </Button>
      </div>
    </div>
  );
}