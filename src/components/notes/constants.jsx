export const PENS = [
  { id: 'ballpoint', label: 'Ballpoint', font: 'font-ballpoint', size: 'text-base',  weight: 'font-normal',   style: '',          lineH: '32px' },
  { id: 'fountain',  label: 'Fountain',  font: 'font-fountain',  size: 'text-lg',    weight: 'font-normal',   style: '',          lineH: '34px' },
  { id: 'marker',    label: 'Marker',    font: 'font-marker',    size: 'text-xl',    weight: 'font-bold',     style: '',          lineH: '36px' },
  { id: 'pencil',    label: 'Pencil',    font: 'font-pencil',    size: 'text-base',  weight: 'font-normal',   style: 'opacity-75',lineH: '32px' },
  { id: 'brush',     label: 'Brush',     font: 'font-brush',     size: 'text-xl',    weight: 'font-semibold', style: '',          lineH: '36px' },
];

export const INK_COLORS = [
  { label: 'Default', value: '' },
  { label: 'Navy',    value: '#1e3a8a' },
  { label: 'Crimson', value: '#991b1b' },
  { label: 'Forest',  value: '#14532d' },
  { label: 'Violet',  value: '#581c87' },
  { label: 'Sepia',   value: '#78350f' },
  { label: 'Teal',    value: '#134e4a' },
  { label: 'Slate',   value: '#334155' },
];

export const PAPER_STYLES = [
  { id: 'ruled',  label: 'Ruled',  bg: 'repeating-linear-gradient(transparent, transparent 31px, hsl(var(--border) / 0.35) 31px, hsl(var(--border) / 0.35) 32px)' },
  { id: 'grid',   label: 'Grid',   bg: 'repeating-linear-gradient(hsl(var(--border) / 0.2) 0 1px, transparent 1px 32px), repeating-linear-gradient(90deg, hsl(var(--border) / 0.2) 0 1px, transparent 1px 32px)' },
  { id: 'dotted', label: 'Dotted', bg: 'radial-gradient(circle, hsl(var(--border) / 0.6) 1px, transparent 1px) 0 0 / 32px 32px' },
  { id: 'blank',  label: 'Blank',  bg: 'none' },
];

export const HEADINGS = [
  { label: 'H1', prefix: '# ',    title: 'Heading 1' },
  { label: 'H2', prefix: '## ',   title: 'Heading 2' },
  { label: 'H3', prefix: '### ',  title: 'Heading 3' },
  { label: '•',  prefix: '- ',    title: 'Bullet' },
  { label: '1.', prefix: '1. ',   title: 'Numbered' },
  { label: '[ ]',prefix: '- [ ] ',title: 'Checkbox' },
  { label: '❝',  prefix: '> ',    title: 'Quote' },
  { label: '—',  prefix: '\n---\n',title: 'Divider' },
];

export function penFor(id) {
  return PENS.find((p) => p.id === id) || PENS[0];
}

// Build a tree from flat folder strings like "A", "A/B", "A/B/C"
export function buildFolderTree(folderPaths) {
  const root = {};
  for (const path of folderPaths) {
    const parts = path.split('/');
    let node = root;
    for (const part of parts) {
      if (!node[part]) node[part] = { __children: {} };
      node = node[part].__children;
    }
  }
  return root;
}
