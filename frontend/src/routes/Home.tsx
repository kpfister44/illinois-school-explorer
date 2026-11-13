// ABOUTME: Home page component
// ABOUTME: Landing page with the search field, level chips and links for browsing by district, town or top scores

import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import ChipLink from '@/components/ChipLink';
import SearchBar from '@/components/SearchBar';
import SchoolCount from '@/components/SchoolCount';
import { useStats } from '@/lib/api/queries';
import { formatMetric } from '@/lib/format';
import { listPath } from '@/lib/schoolList';

const LEVELS = [
  { label: 'High schools', level: 'high' },
  { label: 'Middle schools', level: 'middle' },
  { label: 'Elementary schools', level: 'elementary' },
] as const;

export default function Home() {
  const { data: stats } = useStats();

  const browseLinks = [
    {
      to: '/browse?by=district',
      label: 'By district',
      detail: stats && `${formatMetric(stats.districts, 'count')} districts`,
    },
    {
      to: '/browse?by=city',
      label: 'By city or town',
      detail: stats && `${formatMetric(stats.cities, 'count')} places`,
    },
    { to: '/top-scores', label: 'Top scores', detail: 'ACT and IAR rankings' },
  ];

  return (
    <div className="mx-auto max-w-xl space-y-6 py-6">
      <h1 className="text-4xl font-medium leading-tight tracking-tight">
        Look up any Illinois public school
      </h1>
      <SearchBar />

      <nav aria-label="School level">
        <ul role="list" className="flex flex-wrap gap-2">
          {LEVELS.map(({ label, level }) => (
            <li key={level}>
              <ChipLink to={listPath({ level })}>{label}</ChipLink>
            </li>
          ))}
        </ul>
      </nav>

      <section aria-labelledby="browse-heading">
        <h2
          id="browse-heading"
          className="border-t-2 border-foreground pt-2 font-sans text-xs font-bold uppercase tracking-widest text-muted-foreground"
        >
          Browse
        </h2>
        <ul role="list">
          {browseLinks.map((link) => (
            <li key={link.to} className="border-b border-border">
              <Link
                to={link.to}
                className="flex min-h-14 items-center justify-between gap-3 py-2 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span>
                  <span className="block font-semibold">{link.label}</span>{' '}
                  {link.detail && (
                    <span className="block text-sm text-muted-foreground">{link.detail}</span>
                  )}
                </span>
                <ChevronRight className="h-5 w-5 flex-none text-muted-foreground" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <SchoolCount />
    </div>
  );
}
