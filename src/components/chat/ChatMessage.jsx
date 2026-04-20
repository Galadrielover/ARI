import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Sparkles } from 'lucide-react';

export default function ChatMessage({ message }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-4 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center ${
        isUser ? 'bg-foreground text-background' : 'bg-accent/10 text-accent border border-accent/20'
      }`}>
        {isUser ? (
          <span className="text-[11px] font-medium">You</span>
        ) : (
          <Sparkles className="w-3.5 h-3.5" strokeWidth={2} />
        )}
      </div>
      <div className={`max-w-[80%] ${isUser ? 'text-right' : ''}`}>
        <div className={`inline-block text-left px-5 py-3.5 rounded-2xl ${
          isUser
            ? 'bg-foreground text-background rounded-tr-sm'
            : 'bg-card border border-border rounded-tl-sm'
        }`}>
          {isUser ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          ) : (
            <ReactMarkdown
              className="text-sm leading-relaxed prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_p]:my-2 [&_ul]:my-2 [&_ol]:my-2 [&_li]:my-0.5 [&_h1]:font-serif [&_h2]:font-serif [&_h3]:font-serif [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:bg-secondary [&_code]:text-xs"
            >
              {message.content}
            </ReactMarkdown>
          )}
        </div>
        {message.sources?.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {message.sources.map((s, i) => (
              <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                {s}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
