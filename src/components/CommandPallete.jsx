import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Command, CommandInput, CommandList, CommandItem, CommandGroup, CommandEmpty } from '@/components/ui/command';
import { FileText, NotebookPen, Sparkles, Search, LayoutGrid, Plus, Network } from 'lucide-react';

const COMMANDS = [
  { label: 'Go to Workspace', icon: LayoutGrid, action: '/', type: 'nav' },
  { label: 'Go to Files', icon: FileText, action: '/files', type: 'nav' },
  { label: 'Go to Notes', icon: NotebookPen, action: '/notes', type: 'nav' },
  { label: 'Ask ARI', icon: Sparkles, action: '/chat', type: 'nav' },
  { label: 'Search', icon: Search, action: '/search', type: 'nav' },
  { label: 'New Note', icon: Plus, action: '/notes/new', type: 'nav' },
  { label: 'Knowledge Graph', icon: Network, action: '/graph', type: 'nav' },
];

export default function CommandPallette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const run = (cmd) => {
    setOpen(false);
    navigate(cmd.action);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="p-0 overflow-hidden max-w-lg">
        <Command>
          <CommandInput placeholder="Type a command or search…" className="h-12" />
          <CommandList className="max-h-72">
            <CommandEmpty>No commands found.</CommandEmpty>
            <CommandGroup heading="Navigation">
              {COMMANDS.map((cmd) => (
                <CommandItem key={cmd.label} onSelect={() => run(cmd)} className="flex items-center gap-3 cursor-pointer">
                  <cmd.icon className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                  <span>{cmd.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
