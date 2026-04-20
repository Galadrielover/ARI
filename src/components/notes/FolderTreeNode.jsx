import React from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen, Bookmark, BookmarkCheck, BookOpen, FolderPlus } from 'lucide-react';
import { buildFolderTree } from './constants';

// Recursive tree node — supports unlimited nesting
function TreeNode({ name, fullPath, children, depth, notes, activeId, openFolders, activeFolder, onToggleFolder, onSelectNote, onSelectFolder, onAddSubfolder }) {
  const isOpen = openFolders.has(fullPath);
  const isActive = activeFolder === fullPath;
  const folderNotes = notes.filter((n) => n.folder === fullPath || n.folder?.startsWith(fullPath + '/'));
  const childKeys = Object.keys(children || {}).filter((k) => k !== '__children');

  return (
    <div style={{ marginLeft: depth > 0 ? 0 : 0 }}>
      {/* Folder row */}
      <div className="group relative flex items-center">
        <button
          onClick={() => onToggleFolder(fullPath)}
          className={`flex-1 flex items-center gap-1.5 px-2 py-1.5 rounded-md transition-all text-xs min-w-0 ${
            isActive
              ? 'bg-accent/15 text-foreground font-medium'
              : 'text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50'
          }`}
          style={{ paddingLeft: `${8 + depth * 12}px` }}
        >
          <span className="shrink-0 text-muted-foreground/60">
            {childKeys.length > 0
              ? isOpen ? <ChevronDown className="w-2.5 h-2.5" /> : <ChevronRight className="w-2.5 h-2.5" />
              : <span className="w-2.5 h-2.5 inline-block" />}
          </span>
          {isOpen
            ? <FolderOpen className="w-3 h-3 shrink-0 text-accent" />
            : <Folder className="w-3 h-3 shrink-0" />}
          <span className="truncate flex-1">{name}</span>
          <span className="text-[9px] opacity-50 shrink-0">{folderNotes.length}</span>
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onAddSubfolder(fullPath); }}
          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-sidebar-accent text-muted-foreground hover:text-foreground transition-all mr-1"
          title="Add subfolder"
        >
          <FolderPlus className="w-2.5 h-2.5" />
        </button>
      </div>

      {/* Children: subfolders + notes */}
      {isOpen && (
        <div className="relative">
          {/* Indent guide line */}
          <div
            className="absolute top-0 bottom-0 border-l border-border/30"
            style={{ left: `${12 + depth * 12}px` }}
          />

          {/* Sub-folder nodes */}
          {childKeys.map((childName) => (
            <TreeNode
              key={childName}
              name={childName}
              fullPath={`${fullPath}/${childName}`}
              children={children[childName].__children}
              depth={depth + 1}
              notes={notes}
              activeId={activeId}
              openFolders={openFolders}
              activeFolder={activeFolder}
              onToggleFolder={onToggleFolder}
              onSelectNote={onSelectNote}
              onSelectFolder={onSelectFolder}
              onAddSubfolder={onAddSubfolder}
            />
          ))}

          {/* Notes directly in this folder (not subfolders) */}
          {folderNotes
            .filter((n) => n.folder === fullPath)
            .map((n) => (
              <button
                key={n.id}
                onClick={() => { onSelectFolder(fullPath); onSelectNote(n.id); }}
                className={`w-full text-left flex items-center gap-1.5 py-1.5 rounded-md transition-all text-[11px] ${
                  n.id === activeId
                    ? 'bg-accent/10 text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/40'
                }`}
                style={{ paddingLeft: `${20 + depth * 12}px` }}
              >
                {n.bookmarked && <Bookmark className="w-2 h-2 text-accent shrink-0" />}
                <span className="truncate">{n.title || 'Untitled'}</span>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}

export default function FolderTree({ notes, activeId, openFolders, activeFolder, onToggleFolder, onSelectNote, onSelectFolder, onAddSubfolder }) {
  const allFolders = [...new Set(notes.map((n) => n.folder).filter(Boolean))].sort();
  const tree = buildFolderTree(allFolders);
  const topLevel = Object.keys(tree).filter((k) => k !== '__children');

  return (
    <div className="text-xs space-y-0.5">
      {/* All notes */}
      <button
        onClick={() => onSelectFolder(null)}
        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md transition-all ${
          activeFolder === null
            ? 'bg-accent/15 text-foreground font-medium'
            : 'text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50'
        }`}
      >
        <BookOpen className="w-3 h-3 shrink-0" />
        <span className="truncate flex-1">All notes</span>
        <span className="text-[9px] opacity-50">{notes.length}</span>
      </button>

      {/* Bookmarks */}
      <button
        onClick={() => onSelectFolder('__bookmarks__')}
        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md transition-all ${
          activeFolder === '__bookmarks__'
            ? 'bg-accent/15 text-foreground font-medium'
            : 'text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50'
        }`}
      >
        <BookmarkCheck className="w-3 h-3 shrink-0 text-accent" />
        <span className="truncate flex-1">Bookmarks</span>
        <span className="text-[9px] opacity-50">{notes.filter((n) => n.bookmarked).length}</span>
      </button>

      {/* Divider */}
      {topLevel.length > 0 && (
        <div className="border-t border-border/30 pt-1 mt-1" />
      )}

      {/* Recursive folder tree */}
      {topLevel.map((name) => (
        <TreeNode
          key={name}
          name={name}
          fullPath={name}
          children={tree[name].__children}
          depth={0}
          notes={notes}
          activeId={activeId}
          openFolders={openFolders}
          activeFolder={activeFolder}
          onToggleFolder={onToggleFolder}
          onSelectNote={onSelectNote}
          onSelectFolder={onSelectFolder}
          onAddSubfolder={onAddSubfolder}
        />
      ))}

      {/* Uncategorised */}
      {notes.filter((n) => !n.folder).length > 0 && topLevel.length > 0 && (
        <div className="pt-1 mt-1 border-t border-border/30">
          <div className="px-2 py-1 text-[9px] uppercase tracking-[0.18em] text-muted-foreground/60">Uncategorised</div>
        </div>
      )}
    </div>
  );
}