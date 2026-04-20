import React from 'react';

export default function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <div className="flex items-end justify-between gap-6 pb-8 border-b border-border mb-10">
      <div>
        {eyebrow && (
          <p className="text-[10px] uppercase tracking-[0.22em] text-accent mb-3 font-medium">
            {eyebrow}
          </p>
        )}
        <h1 className="font-serif text-4xl md:text-5xl font-light text-foreground text-balance leading-[1.05]">
          {title}
        </h1>
        {description && (
          <p className="mt-3 text-muted-foreground max-w-xl text-balance">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="shrink-0 flex items-center gap-2">{actions}</div>}
    </div>
  );
}