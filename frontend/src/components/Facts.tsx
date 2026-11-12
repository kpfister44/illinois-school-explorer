// ABOUTME: A row of short facts, each a figure over its label
// ABOUTME: Used for the school's key facts and its ACT subject scores

interface Fact {
  label: string;
  value: string;
}

interface FactsProps {
  label: string;
  facts: Fact[];
}

export default function Facts({ label, facts }: FactsProps) {
  return (
    <ul role="list" aria-label={label} className="grid grid-cols-3 gap-3 border-y py-3">
      {facts.map((fact) => (
        <li key={fact.label} className="flex min-w-0 flex-col">
          <span className="text-lg font-semibold">{fact.value}</span>
          <span className="text-xs text-muted-foreground">{fact.label}</span>
        </li>
      ))}
    </ul>
  );
}
