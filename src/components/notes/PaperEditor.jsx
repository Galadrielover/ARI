const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect, useRef } from 'react';

import { Folder, BookOpen } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { penFor, PAPER_STYLES } from './constants';
import EditorToolbar from './EditorToolbar';

export default function PaperEditor({ note, onSave, onDelete }) {
  const [title, setTitle]           = useState('');
  const [content, setContent]       = useState('');
  const [tags, setTags]             = useState('');
  const [folder, setFolder]         = useState('');
  const [pinned, setPinned]         = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [pen, setPen]               = useState('ballpoint');
  const [color, setColor]           = useState('');
  const [paperStyle, setPaperStyle] = useState('ruled');
  const [dirty, setDirty]           = useState(false);
  const [lastSaved, setLastSaved]   = useState(null);
  const [aiLoading, setAiLoading]   = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (!note) return;
    setTitle(note.title || '');
    setContent(note.content || '');
    setTags((note.tags || []).join(', '));
    setFolder(note.folder || '');
    setPinned(!!note.pinned);
    setBookmarked(!!note.bookmarked);
    setPen(note.pen || 'ballpoint');
    setColor(note.color || '');
    setPaperStyle(note.paperStyle || 'ruled');
    setLastSaved(note.updated_date);
    setDirty(false);
  }, [note?.id]);

  const doSave = async () => {
    if (!note) return;
    await db.entities.Note.update(note.id, {
      title: title || 'Untitled',
      content,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      folder: folder.trim() || null,
      pinned,
      bookmarked,
      pen,
      color,
      paperStyle,
    });
    setDirty(false);
    setLastSaved(new Date().toISOString());
    onSave();
  };

  useEffect(() => {
    if (!dirty || !note) return;
    const t = setTimeout(() => doSave().catch(() => {}), 1200);
    return () => clearTimeout(t);
  }, [title, content, tags, folder, pinned, bookmarked, pen, color, paperStyle, dirty]);

  const mark = (setter) => (v) => { setter(v); setDirty(true); };

  const handlePenChange = ({ pen: p, color: c, paperStyle: ps }) => {
    mark(setPen)(p);
    mark(setColor)(c);
    mark(setPaperStyle)(ps);
  };

  const aiEnhance = async (action) => {
    if (!content.trim() && action !== 'outline') { toast.error('Write something first'); return; }
    setAiLoading(true);
    const prompts = {
      summarize: `Summarize this note in 3-5 concise bullet points:\n\n${content}`,
      expand: `Expand and develop this note thoughtfully, keeping the author's voice:\n\n${content}`,
      outline: `Create a well-structured markdown outline for "${title || 'Untitled'}"${content ? `:\n\n${content}` : ''}.`,
    };
    const result = await db.integrations.Core.InvokeLLM({ prompt: prompts[action] });
    mark(setContent)(`${content}${content ? '\n\n---\n\n' : ''}${result}`);
    setAiLoading(false);
  };

  const currentPen = penFor(pen);
  const paper = PAPER_STYLES.find((p) => p.id === paperStyle) || PAPER_STYLES[0];

  // Word count
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;

  if (!note) {
    return (
      <div className="flex-1 flex items-center justify-center flex-col gap-4 text-muted-foreground bg-background">
        <BookOpen className="w-12 h-12 opacity-10" strokeWidth={1} />
        <div className="text-center">
          <p className="font-serif text-2xl opacity-30 mb-1">Open a note</p>
          <p className="text-sm opacity-20">or create a new one from the sidebar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      <EditorToolbar
        pen={pen}
        color={color}
        paperStyle={paperStyle}
        onPenChange={handlePenChange}
        pinned={pinned}
        onPin={() => mark(setPinned)(!pinned)}
        bookmarked={bookmarked}
        onBookmark={() => mark(setBookmarked)(!bookmarked)}
        dirty={dirty}
        lastSaved={lastSaved}
        aiLoading={aiLoading}
        onAiAction={aiEnhance}
        onSave={doSave}
        onDelete={onDelete}
        textareaRef={textareaRef}
        content={content}
        onContentChange={mark(setContent)}
      />

      {/* Paper */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div
          className="max-w-2xl mx-auto px-14 py-12 min-h-full relative"
          style={{
            backgroundImage: paper.bg,
            backgroundSize: paper.id === 'grid' ? '32px 32px' : paper.id === 'dotted' ? '32px 32px' : undefined,
            backgroundPositionY: paper.id === 'ruled' ? '68px' : 0,
          }}
        >
          {/* Margin line */}
          {paper.id === 'ruled' && (
            <div
              className="absolute top-0 bottom-0 border-l border-red-300/25 pointer-events-none"
              style={{ left: '56px' }}
            />
          )}

          {/* Title */}
          <Input
            value={title}
            onChange={(e) => mark(setTitle)(e.target.value)}
            placeholder="Untitled"
            className="font-serif font-light h-auto border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 mb-2 tracking-tight w-full"
            style={{ fontSize: '2.1rem', lineHeight: '1.25', color: color || undefined }}
          />

          {/* Meta row */}
          <div className="flex items-center gap-3 mb-8 flex-wrap">
            <Input
              value={tags}
              onChange={(e) => mark(setTags)(e.target.value)}
              placeholder="tags, comma-separated…"
              className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 text-xs text-muted-foreground h-5 flex-1 min-w-24"
            />
            <div className="flex items-center gap-1 shrink-0">
              <Folder className="w-3 h-3 text-muted-foreground/40" />
              <Input
                value={folder}
                onChange={(e) => mark(setFolder)(e.target.value)}
                placeholder="folder/sub/deep…"
                className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 text-xs text-muted-foreground h-5 w-40"
              />
            </div>
          </div>

          {/* Content */}
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => mark(setContent)(e.target.value)}
            placeholder="Begin writing…"
            className={`border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 resize-none w-full ${currentPen.font} ${currentPen.size} ${currentPen.weight} ${currentPen.style}`}
            style={{
              minHeight: '65vh',
              lineHeight: currentPen.lineH,
              color: color || undefined,
              caretColor: color || undefined,
            }}
          />

          {/* Word count footer */}
          <div className="mt-8 pt-4 border-t border-border/20 flex items-center gap-4 text-[10px] text-muted-foreground/40">
            <span>{wordCount} words</span>
            <span>{charCount} chars</span>
          </div>
        </div>
      </div>
    </div>
  );
}