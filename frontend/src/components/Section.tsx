// ABOUTME: A titled section of a page, with a ruled label as its heading
// ABOUTME: Used for the parts of the school page and a district's school levels

import type { ReactNode } from 'react';

interface SectionProps {
  id: string;
  title: string;
  children: ReactNode;
}

export default function Section({ id, title, children }: SectionProps) {
  return (
    <section id={id} aria-labelledby={`${id}-heading`} className="scroll-mt-16 space-y-4">
      <h2
        id={`${id}-heading`}
        className="border-t-2 border-foreground pt-2 font-sans text-xs font-bold uppercase tracking-widest text-muted-foreground"
      >
        {title}
      </h2>
      {children}
    </section>
  );
}
