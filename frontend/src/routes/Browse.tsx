// ABOUTME: Browse page component
// ABOUTME: Lists every district or every city and town, narrowed by name, each linking to its schools

import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import ChipLink from '@/components/ChipLink';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useCities, useDistricts } from '@/lib/api/queries';
import { formatMetric } from '@/lib/format';
import { LIST_PATH, listPath } from '@/lib/schoolList';

interface Place {
  key: string;
  name: string;
  detail: string;
  to: string;
}

type PlaceKind = 'district' | 'city';

const KINDS: Record<PlaceKind, { chip: string; one: string; many: string }> = {
  district: { chip: 'Districts', one: 'district', many: 'districts' },
  city: { chip: 'Cities and towns', one: 'city or town', many: 'cities and towns' },
};

function countSchools(count: number): string {
  return `${formatMetric(count, 'count')} ${count === 1 ? 'school' : 'schools'}`;
}

function usePlaces(kind: PlaceKind) {
  const districts = useDistricts();
  const cities = useCities();

  if (kind === 'city') {
    return {
      ...cities,
      places: cities.data?.map(
        (city): Place => ({
          key: city.name,
          name: city.name,
          detail: countSchools(city.school_count),
          to: listPath({ city: city.name }),
        })
      ),
    };
  }

  return {
    ...districts,
    places: districts.data?.map(
      (district): Place => ({
        key: district.id,
        name: district.name ?? district.id,
        detail: [district.county && `${district.county} County`, countSchools(district.school_count)]
          .filter(Boolean)
          .join(' · '),
        to: `/district/${district.id}`,
      })
    ),
  };
}

export default function Browse() {
  const [searchParams] = useSearchParams();
  const kind: PlaceKind = searchParams.get('by') === 'city' ? 'city' : 'district';
  const [typed, setTyped] = useState('');
  const { places, isLoading, isError } = usePlaces(kind);
  const words = KINDS[kind];

  const wanted = typed.trim().toLowerCase();
  const shown = places?.filter((place) => place.name.toLowerCase().includes(wanted));

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-4">
      <header className="space-y-1">
        <h1 className="text-3xl font-medium leading-tight">Browse</h1>
        <p className="text-muted-foreground">Pick a district or a town to see its schools.</p>
      </header>

      <nav aria-label="Browse by">
        <ul role="list" className="flex flex-wrap gap-2">
          {(Object.keys(KINDS) as PlaceKind[]).map((choice) => (
            <li key={choice}>
              <ChipLink to={`/browse?by=${choice}`} current={choice === kind}>
                {KINDS[choice].chip}
              </ChipLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="space-y-3">
        <div>
          <label htmlFor="browse-name" className="mb-1 block text-sm font-medium">
            Narrow by name
          </label>
          <Input
            id="browse-name"
            type="search"
            value={typed}
            onChange={(event) => setTyped(event.target.value)}
          />
        </div>

        {isLoading && (
          <div className="space-y-3">
            {[...Array(6)].map((_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </div>
        )}

        {isError && (
          <p className="text-sm text-muted-foreground">The {words.many} could not be loaded.</p>
        )}

        {shown && (
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {shown.length === 0
              ? `No ${words.many.replace(' and ', ' or ')} match “${typed.trim()}”.`
              : `${formatMetric(shown.length, 'count')} ${shown.length === 1 ? words.one : words.many}`}
          </p>
        )}

        {shown && shown.length > 0 && (
          <ul role="list" aria-label="Places" className="border-t-2 border-foreground">
            {shown.map((place) => (
              <li key={place.key} className="border-b border-border">
                <Link
                  to={place.to}
                  className="flex min-h-11 flex-col justify-center py-2 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="font-semibold">{place.name}</span>
                  <span className="text-sm text-muted-foreground">{place.detail}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Link
        to={LIST_PATH}
        className="inline-flex min-h-11 items-center text-sm font-medium text-link underline underline-offset-4"
      >
        See every school
      </Link>
    </div>
  );
}
