const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { BookOpen, Plus, FolderPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import FolderTree from '@/components/notes/FolderTreeNode';
import NoteListPanel from '@/components/notes/NoteListPanel';
import PaperEditor from '@/components/notes/PaperEditor';

// Animated notebook icon that visually grows with note count
function NotebookIcon({ count }) {
  const fill = Math.min(count / 50, 1); // saturates at 50 notes
  const size = 18 + Math.floor(fill * 6); // 18px → 24px
  return (
    <div className="relative flex items-center justify-center" style={{ width: size + 8, height: size + 8 }}>
      <BookOpen
        strokeWidth={1.5}
        className="text-accent transition-all duration-700"
        style={{ width: size, height: size }}
      />
      {count > 0 && (
        <span
          className="absolute -top-1.5 -right-1.5 bg-accent text-accent-foreground rounded-full font-bold leading-none flex items-center justify-center transition-all duration-500"
          style={{
            fontSize: '9px',
            minWidth: Math.max(14, 14 + Math.floor(fill * 4)),
            height: Math.max(14, 14 + Math.floor(fill * 4)),
            paddingInline: 3,
          }}
        >
          {count}
        </span>
      )}
    </div>
  );
}

// Inline new-folder input that appears in the tree
function InlineFolderInput({ parentPath, onConfirm, onCancel }) {
  const [name, setName] = React.useState('');
  const placeholder = parentPath ? `${parentPath}/…` : 'Folder name…';
  return (
    <div className="px-2 py-1.5">
      <Input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={placeholder}
        className="h-6 text-xs rounded-md border-accent/40 bg-secondary/60 mb-1.5"
        onKeyDown={(e) => {
          if (e.key === 'Enter') onConfirm(parentPath ? `${parentPath}/${name}` : name);
          if (e.key === 'Escape') onCancel();
        }}
      />
      <div className="flex gap-1">
        <Button size="sm" className="h-5 text-[10px] rounded-full flex-1 bg-accent hover:bg-accent/90"
          onClick={() => onConfirm(parentPath ? `${parentPath}/${name}` : name)}>
          Create
        </Button>
        <Button size="sm" variant="ghost" className="h-5 text-[10px] rounded-full px-2" onClick={onCancel}>
          ✕
        </Button>
      </div>
    </div>
  );
}

export default function Notes() {
  const [q, setQ]                       = useState('');
  const [activeId, setActiveId]         = useState(null);
  const [activeFolder, setActiveFolder] = useState(null);
  const [openFolders, setOpenFolders]   = useState(new Set());
  const [newFolderParent, setNewFolderParent] = useState(undefined); // undefined = hidden, string = parent path
  const qc = useQueryClient();

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['notes'],
    queryFn: () => db.entities.Note.list('-updated_date', 500),
  });

  const activeNote = notes.find((n) => n.id === activeId) || null;

  // Notes visible in the middle panel
  const visibleNotes = useMemo(() => {
    let list = notes;
    if (activeFolder === '__bookmarks__') list = notes.filter((n) => n.bookmarked);
    else if (activeFolder) list = notes.filter((n) => n.folder === activeFolder || n.folder?.startsWith(activeFolder + '/'));
    if (q) {
      const needle = q.toLowerCase();
      list = list.filter((n) =>
        `${n.title} ${n.content || ''} ${(n.tags || []).join(' ')}`.toLowerCase().includes(needle)
      );
    }
    return list;
  }, [notes, activeFolder, q]);

  const createNote = async () => {
    const n = await db.entities.Note.create({
      title: 'Untitled',
      content: '',
      tags: [],
      pinned: false,
      bookmarked: false,
      folder: (activeFolder && activeFolder !== '__bookmarks__') ? activeFolder : null,
      pen: 'ballpoint',
      paperStyle: 'ruled',
    });
    qc.invalidateQueries({ queryKey: ['notes'] });
    setActiveId(n.id);
  };

  const deleteActive = async () => {
    if (!activeId) return;
    await db.entities.Note.delete(activeId);
    qc.invalidateQueries({ queryKey: ['notes'] });
    setActiveId(null);
    toast.success('Note deleted');
  };

  const toggleFolder = (path) => {
    setOpenFolders((prev) => {
      const next = new Set(prev);
      next.has(path) ? next.delete(path) : next.add(path);
      return next;
    });
    setActiveFolder(path);
  };

  const handleNewFolder = async (fullPath) => {
    if (!fullPath?.trim()) { setNewFolderParent(undefined); return; }
    const n = await db.entities.Note.create({
      title: 'Untitled',
      content: '',
      tags: [],
      folder: fullPath.trim(),
      pen: 'ballpoint',
      paperStyle: 'ruled',
    });
    qc.invalidateQueries({ queryKey: ['notes'] });
    // Open all ancestor folders
    const parts = fullPath.trim().split('/');
    setOpenFolders((prev) => {
      const next = new Set(prev);
      parts.reduce((acc, part) => {
        const path = acc ? `${acc}/${part}` : part;
        next.add(path);
        return path;
      }, '');
      return next;
    });
    setActiveFolder(fullPath.trim());
    setActiveId(n.id);
    setNewFolderParent(undefined);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">

      {/* ── LEFT: Folder tree ── */}
      <div className="w-52 shrink-0 border-r border-border/60 flex flex-col bg-sidebar overflow-hidden">
        {/* Header */}
        <div className="px-3 pt-4 pb-3 border-b border-border/40 shrink-0">
          <div className="flex items-center justify-between">
            <NotebookIcon count={notes.length} />
            <div className="flex items-center gap-0.5">
              <Button
                variant="ghost" size="icon"
                onClick={() => setNewFolderParent('')}
                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                title="New folder"
              >
                <FolderPlus className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="ghost" size="icon"
                onClick={createNote}
                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                title="New note"
              >
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground/60 font-serif italic mt-1.5">
            {notes.length} {notes.length === 1 ? 'note' : 'notes'}
          </p>
        </div>

        {/* Inline folder creator (root level) */}
        {newFolderParent === '' && (
          <InlineFolderInput
            parentPath={null}
            onConfirm={handleNewFolder}
            onCancel={() => setNewFolderParent(undefined)}
          />
        )}

        {/* Tree */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-2">
          <FolderTree
            notes={notes}
            activeId={activeId}
            openFolders={openFolders}
            activeFolder={activeFolder}
            onToggleFolder={toggleFolder}
            onSelectNote={(id) => { setActiveId(id); }}
            onSelectFolder={setActiveFolder}
            onAddSubfolder={(parentPath) => setNewFolderParent(parentPath)}
          />
          {/* Inline subfolder creator */}
          {newFolderParent && newFolderParent !== '' && (
            <InlineFolderInput
              parentPath={newFolderParent}
              onConfirm={handleNewFolder}
              onCancel={() => setNewFolderParent(undefined)}
            />
          )}
        </div>
      </div>

      {/* ── MIDDLE: Note list ── */}
      <div className="w-60 shrink-0 border-r border-border/60 flex flex-col bg-sidebar-background/80 overflow-hidden">
        {/* Panel title */}
        <div className="px-4 py-2.5 border-b border-border/40 shrink-0">
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 font-medium">
            {activeFolder === '__bookmarks__' ? 'Bookmarks'
              : activeFolder ? activeFolder.split('/').pop()
              : 'All notes'}
          </p>
          <p className="text-[10px] text-muted-foreground/40 mt-0.5">{visibleNotes.length} notes</p>
        </div>
        <NoteListPanel
          notes={visibleNotes}
          activeId={activeId}
          onSelectNote={setActiveId}
          onCreate={createNote}
          isLoading={isLoading}
          q={q}
          onSearchChange={setQ}
        />
      </div>

      {/* ── RIGHT: Editor ── */}
      <PaperEditor
        note={activeNote}
        onSave={() => qc.invalidateQueries({ queryKey: ['notes'] })}
        onDelete={deleteActive}
      />
    </div>
  );
}