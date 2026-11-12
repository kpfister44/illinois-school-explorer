// ABOUTME: Sticky row of controls that jump to sections of a long page
// ABOUTME: Scrolls in place so the address and the Back button's history are left alone

interface Section {
  id: string;
  label: string;
}

interface SectionLinksProps {
  sections: Section[];
}

export default function SectionLinks({ sections }: SectionLinksProps) {
  return (
    <nav aria-label="Sections" className="sticky top-0 z-30 border-b bg-background">
      <ul className="flex justify-between overflow-x-auto sm:justify-start sm:gap-2">
        {sections.map((section) => (
          <li key={section.id}>
            <button
              type="button"
              onClick={() => document.getElementById(section.id)?.scrollIntoView()}
              className="min-h-11 whitespace-nowrap rounded-md px-2 text-sm font-medium text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:px-3"
            >
              {section.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
