const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };


/**
 * Build the fullest possible context string from ALL of the user's data.
 * No artificial limits — fetch everything, serialize everything.
 */
export async function buildAriContext({ maxChars = 80000 } = {}) {
  const [files, notes, dataSources] = await Promise.all([
    db.entities.File.list('-created_date', 200),
    db.entities.Note.list('-updated_date', 200),
    db.entities.DataSource.list('-created_date', 50).catch(() => []),
  ]);

  const parts = [];
  const sources = [];

  // ── FILES ────────────────────────────────────────────────────────────────
  parts.push('# FILES (' + files.length + ' total)');
  for (const f of files) {
    const block = [
      `\n## File: ${f.name}`,
      f.tags?.length ? `Tags: ${f.tags.join(', ')}` : '',
      f.file_type ? `Type: ${f.file_type}` : '',
      f.size ? `Size: ${Math.round(f.size / 1024)} KB` : '',
      f.summary ? `Summary: ${f.summary}` : '',
      f.extracted_text ? `Full content:\n${f.extracted_text}` : '',
      `URL: ${f.file_url}`,
      `Created: ${f.created_date}`,
    ].filter(Boolean).join('\n');
    parts.push(block);
    sources.push(`file:${f.name}`);
  }

  // ── NOTES ─────────────────────────────────────────────────────────────────
  parts.push('\n\n# NOTES (' + notes.length + ' total)');
  for (const n of notes) {
    const block = [
      `\n## Note: ${n.title || 'Untitled'} [id:${n.id}]`,
      n.tags?.length ? `Tags: ${n.tags.join(', ')}` : '',
      n.pinned ? 'Pinned: yes' : '',
      `Updated: ${n.updated_date}`,
      `Created: ${n.created_date}`,
      n.content ? `\n${n.content}` : '(empty)',
    ].filter(Boolean).join('\n');
    parts.push(block);
    sources.push(`note:${n.title || 'Untitled'}`);
  }

  // ── DATA SOURCES ─────────────────────────────────────────────────────────
  if (dataSources.length > 0) {
    parts.push('\n\n# EXTERNAL DATASETS (' + dataSources.length + ' total)');
    for (const ds of dataSources) {
      const block = [
        `\n## Dataset: ${ds.name} [id:${ds.id}]`,
        ds.tags?.length ? `Tags: ${ds.tags.join(', ')}` : '',
        `Type: ${ds.source_type}`,
        ds.rows != null ? `Rows: ${ds.rows}` : '',
        ds.columns?.length ? `Columns: ${ds.columns.join(', ')}` : '',
        ds.summary ? `Summary: ${ds.summary}` : '',
        ds.extracted_text ? `Full data:\n${ds.extracted_text}` : '',
        `Created: ${ds.created_date}`,
      ].filter(Boolean).join('\n');
      parts.push(block);
      sources.push(`dataset:${ds.name}`);
    }
  }

  let context = parts.join('\n');
  if (context.length > maxChars) context = context.slice(0, maxChars) + '\n\n…[context truncated at ' + maxChars + ' chars — more data exists]';

  return {
    context,
    sources,
    fileCount: files.length,
    noteCount: notes.length,
    dataSourceCount: dataSources.length,
    files,
    notes,
    dataSources,
  };
}