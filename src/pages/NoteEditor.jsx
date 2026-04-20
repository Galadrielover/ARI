const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Pin, Trash2, Sparkles, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

export default function NoteEditor() {
  const { id } = useParams();
  const isNew = !id || id === 'new';
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [pinned, setPinned] = useState(false);
  const [noteId, setNoteId] = useState(isNew ? null : id);
  const [dirty, setDirty] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  const { data: note } = useQuery({
    queryKey: ['note', noteId],
    queryFn: () => db.entities.Note.list().then((all) => all.find((n) => n.id === noteId)),
    enabled: !!noteId,
  });

  useEffect(() => {
    if (note) {
      setTitle(note.title || '');
      setContent(note.content || '');
      setTags((note.tags || []).join(', '));
      setPinned(!!note.pinned);
      setLastSaved(note.updated_date);
    }
  }, [note]);

  const save = async () => {
    const payload = {
      title: title || 'Untitled',
      content,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      pinned,
    };
    if (noteId) {
      await db.entities.Note.update(noteId, payload);
    } else {
      const created = await db.entities.Note.create(payload);
      setNoteId(created.id);
      navigate(`/notes/${created.id}`, { replace: true });
    }
    qc.invalidateQueries({ queryKey: ['notes'] });
    setDirty(false);
    setLastSaved(new Date().toISOString());
  };

  // Autosave with debounce
  useEffect(() => {
    if (!dirty) return;
    const t = setTimeout(() => { save().catch(() => {}); }, 1200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, content, tags, pinned, dirty]);

  const markDirty = (setter) => (v) => { setter(v); setDirty(true); };

  const del = useMutation({
    mutationFn: () => db.entities.Note.delete(noteId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notes'] });
      toast.success('Note deleted');
      navigate('/notes');
    },
  });

  const aiEnhance = async (action) => {
    if (!content.trim() && action !== 'outline') {
      toast.error('Write something first');
      return;
    }
    setAiLoading(true);
    try {
      const prompts = {
        summarize: `Summarize the following note in 3-5 concise bullet points. Return only the summary.\n\nNote:\n${content}`,
        expand: `Expand and develop the following note into a more thoughtful, well-structured piece. Keep the author's voice. Return only the expanded note.\n\nNote:\n${content}`,
        outline: `Create a clear outline for a note titled "${title || 'Untitled'}"${content ? ` based on these starting thoughts:\n${content}` : ''}. Return only the outline as markdown.`,
      };
      const result = await db.integrations.Core.InvokeLLM({ prompt: prompts[action] });
      setContent((prev) => `${prev}${prev ? '\n\n---\n\n' : ''}${result}`);
      setDirty(true);
    } catch {
      toast.error('AI request failed');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-10 py-10">
      <div className="flex items-center justify-between mb-8">
        <Button asChild variant="ghost" size="sm" className="text-muted-foreground -ml-3">
          <Link to="/notes"><ArrowLeft className="w-4 h-4 mr-1.5" />Notes</Link>
        </Button>
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground mr-3">
            {dirty ? 'Saving…' : lastSaved ? `Saved ${formatDistanceToNow(new Date(lastSaved), { addSuffix: true })}` : 'New note'}
          </span>
          <Button variant="ghost" size="icon" onClick={() => { setPinned(!pinned); setDirty(true); }} className="h-8 w-8">
            <Pin className={`w-4 h-4 ${pinned ? 'text-accent fill-accent' : 'text-muted-foreground'}`} />
          </Button>
          <Button variant="ghost" size="icon" onClick={save} className="h-8 w-8">
            <Save className="w-4 h-4 text-muted-foreground" />
          </Button>
          {noteId && (
            <Button variant="ghost" size="icon" onClick={() => del.mutate()} className="h-8 w-8">
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          )}
        </div>
      </div>

      <Input
        value={title}
        onChange={(e) => markDirty(setTitle)(e.target.value)}
        placeholder="Untitled"
        className="font-serif text-4xl md:text-5xl font-light h-auto border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 mb-3 tracking-tight"
      />
      <Input
        value={tags}
        onChange={(e) => markDirty(setTags)(e.target.value)}
        placeholder="Add tags, comma separated…"
        className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 text-sm text-muted-foreground mb-8"
      />

      <div className="flex items-center gap-2 mb-5 pb-5 border-b border-border">
        <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mr-2">ARI</span>
        {[
          { id: 'summarize', label: 'Summarize' },
          { id: 'expand', label: 'Expand' },
          { id: 'outline', label: 'Outline' },
        ].map((a) => (
          <Button
            key={a.id}
            variant="outline"
            size="sm"
            onClick={() => aiEnhance(a.id)}
            disabled={aiLoading}
            className="rounded-full h-7 text-xs"
          >
            {aiLoading ? <Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1.5" />}
            {a.label}
          </Button>
        ))}
      </div>

      <Textarea
        value={content}
        onChange={(e) => markDirty(setContent)(e.target.value)}
        placeholder="Start writing…"
        className="min-h-[60vh] border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 resize-none text-base leading-relaxed font-serif"
      />
    </div>
  );
}