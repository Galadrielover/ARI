const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { Sparkles, Send, Loader2, Trash2, Zap, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import ChatMessage from '@/components/chat/ChatMessage';
import PageHeader from '@/components/layout/PageHeader';
import { buildAriContext } from '@/lib/ariContext';
import { toast } from 'sonner';

const SYSTEM_PROMPT = `You are ARI — an Adaptive Resource Intelligence with full read and write access to the user's personal knowledge base.

You can:
- READ every file, note, and dataset the user has stored (their full content is in the context below)
- WRITE new notes and EDIT existing notes by outputting a special action block
- ANALYSE data: run calculations, aggregations, summaries, statistical analysis on any dataset
- GENERATE code: Python, JavaScript, SQL, shell scripts — anything the user needs, referencing their actual data
- SYNTHESIZE across sources: connect ideas from multiple files, notes, and datasets
- TRANSFORM data: reformat, convert, clean, filter, sort any dataset they have
- REASON deeply over documents: extract insights, find patterns, build ontologies, generate timelines
- PLAN and strategise based on everything the user has stored
- SEARCH semantically across all their content and surface what's relevant
- DRAFT: write documents, reports, proposals, emails using their stored context

You behave like a combination of:
- A senior software engineer (write production-quality code)
- A data analyst (work with real numbers and datasets)
- A research assistant (synthesise knowledge across all sources)
- A writing partner (draft, edit, improve text)
- A personal chief of staff (plan, prioritise, connect dots)

Rules:
1. Always reference specific file names, note titles, and dataset names from the context. Never be vague.
2. When writing code, make it immediately runnable and specific to the user's actual data (use real column names, real values).
3. When you create or update a note, output an action block EXACTLY like this at the END of your response:
   :::ACTION:CREATE_NOTE title="<title>" content="<full markdown content>":::
   :::ACTION:UPDATE_NOTE id="<note_id>" title="<title>" content="<full markdown content>":::
4. Be direct and dense. No filler. Get to the answer fast.
5. If the user asks you to do something their data doesn't support, say what's missing clearly.
6. Format responses with markdown: headers, code blocks, tables, bullet lists — whatever makes the answer clearest.
7. For data analysis, show actual computed results (sums, averages, counts, etc.) derived from the data in context.`;

const SUGGESTIONS = [
  'Summarize all my notes and find the key themes',
  'Analyse my data and show me insights',
  'Write a report based on everything I have',
  'What connections exist between my files and notes?',
  'Generate code to process my datasets',
  'What should I focus on based on my notes?',
];

// Parse action blocks from AI response and execute them
async function executeActions(reply, qc) {
  const createMatches = [...reply.matchAll(/:::ACTION:CREATE_NOTE title="([^"]*)" content="([\s\S]*?)":::/g)];
  const updateMatches = [...reply.matchAll(/:::ACTION:UPDATE_NOTE id="([^"]*)" title="([^"]*)" content="([\s\S]*?)":::/g)];

  const actions = [];

  for (const m of createMatches) {
    const [, title, content] = m;
    await db.entities.Note.create({ title, content, tags: [] });
    actions.push(`Created note: "${title}"`);
  }
  for (const m of updateMatches) {
    const [, id, title, content] = m;
    await db.entities.Note.update(id, { title, content });
    actions.push(`Updated note: "${title}"`);
  }

  if (actions.length > 0) {
    qc.invalidateQueries({ queryKey: ['notes'] });
    toast.success(actions.join(' · '));
  }
}

// Strip action blocks from displayed message
function stripActions(text) {
  return text.replace(/:::ACTION:[A-Z_]+ [^:]*:::/g, '').trim();
}

export default function Chat() {
  const qc = useQueryClient();
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [contextStats, setContextStats] = useState(null);
  const scrollRef = useRef(null);

  const { data: messages = [] } = useQuery({
    queryKey: ['chat-messages'],
    queryFn: () => db.entities.ChatMessage.list('created_date'),
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  const send = async (text) => {
    const prompt = (text ?? input).trim();
    if (!prompt || sending) return;
    setInput('');
    setSending(true);

    await db.entities.ChatMessage.create({ role: 'user', content: prompt });
    qc.invalidateQueries({ queryKey: ['chat-messages'] });

    try {
      const { context, fileCount, noteCount, dataSourceCount } = await buildAriContext();
      setContextStats({ fileCount, noteCount, dataSourceCount });

      // Full conversation history
      const history = messages
        .map((m) => `${m.role === 'user' ? 'USER' : 'ARI'}: ${m.content}`)
        .join('\n\n');

      const fullPrompt = `${SYSTEM_PROMPT}

---

# USER'S COMPLETE KNOWLEDGE BASE
(${fileCount} files · ${noteCount} notes · ${dataSourceCount} datasets — full content below)

${context}

---

# CONVERSATION HISTORY
${history || '(no prior messages)'}

---

# USER'S CURRENT REQUEST
${prompt}

Respond now. Be thorough, specific, and reference real data from the knowledge base above.`;

      const reply = await db.integrations.Core.InvokeLLM({
        prompt: fullPrompt,
        model: 'claude_sonnet_4_6',
      });

      // Execute any embedded actions
      await executeActions(reply, qc);

      // Extract sources mentioned
      const sources = [];
      const namePattern = /(?:File|Note|Dataset): ([^\n\[\]]+)/g;
      const allNames = (context.match(namePattern) || []).map((s) =>
        s.replace(/(?:File|Note|Dataset): /, '').trim()
      );
      for (const name of allNames) {
        if (reply.includes(name) && !sources.includes(name)) sources.push(name);
      }

      await db.entities.ChatMessage.create({
        role: 'assistant',
        content: stripActions(reply),
        sources: sources.slice(0, 8),
      });
      qc.invalidateQueries({ queryKey: ['chat-messages'] });
    } catch (e) {
      toast.error('ARI could not respond: ' + (e.message || 'unknown error'));
    } finally {
      setSending(false);
    }
  };

  const clearChat = async () => {
    if (!confirm('Clear conversation history?')) return;
    await Promise.all(messages.map((m) => db.entities.ChatMessage.delete(m.id)));
    qc.invalidateQueries({ queryKey: ['chat-messages'] });
  };

  return (
    <div className="max-w-4xl mx-auto px-10 py-10 h-screen flex flex-col">
      <PageHeader
        eyebrow="Assistant"
        title="Ask ARI"
        description="Full access to your files, notes, and data. ARI reads, writes, analyses, and generates."
        actions={
          <div className="flex items-center gap-2">
            {contextStats && (
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground px-3 py-1.5 rounded-full bg-secondary border border-border">
                <Database className="w-3 h-3" />
                {contextStats.fileCount}f · {contextStats.noteCount}n · {contextStats.dataSourceCount}d
              </div>
            )}
            {messages.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearChat} className="text-muted-foreground">
                <Trash2 className="w-4 h-4 mr-1.5" /> Clear
              </Button>
            )}
          </div>
        }
      />

      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin pb-4 -mx-2 px-2">
        {messages.length === 0 && !sending ? (
          <div className="py-12">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent/10 text-accent mb-5 border border-accent/20">
              <Zap className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <h2 className="font-serif text-3xl font-light mb-2">Full access. Ask anything.</h2>
            <p className="text-muted-foreground mb-1 max-w-md text-sm">
              ARI has read your entire knowledge base — every file, every note, every dataset.
            </p>
            <p className="text-muted-foreground mb-8 max-w-md text-sm">
              Ask it to analyse, write, code, connect, transform, or explain anything.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-xl">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-left px-4 py-3 rounded-xl bg-card border border-border hover:border-accent/40 transition-all text-sm text-muted-foreground hover:text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6 py-6">
            {messages.map((m) => <ChatMessage key={m.id} message={m} />)}
            {sending && (
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center">
                  <Loader2 className="w-3.5 h-3.5 text-accent animate-spin" />
                </div>
                <div className="px-5 py-3.5 bg-card border border-border rounded-2xl rounded-tl-sm">
                  <p className="text-sm text-muted-foreground font-serif italic">ARI is working through your data…</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-border mt-2">
        <div className="relative">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
            }}
            placeholder="Ask anything — analyse data, write notes, generate code, find connections…"
            className="resize-none pr-14 min-h-[56px] rounded-2xl bg-card"
            rows={2}
          />
          <Button
            onClick={() => send()}
            disabled={!input.trim() || sending}
            size="icon"
            className="absolute right-2 bottom-2 rounded-xl bg-foreground hover:bg-foreground/90"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground mt-2 text-center">
          Enter to send · Shift+Enter for new line · ARI can create & edit notes automatically
        </p>
      </div>
    </div>
  );
}
