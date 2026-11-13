// ABOUTME: Filter form for a list of schools: county, district, state designation, enrollment and low-income share
// ABOUTME: Holds its choices until they are applied, then reports the full set of filters

import { useId, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import RegionFields, { LABEL_CLASS, SELECT_CLASS } from '@/components/RegionFields';
import type { Designation } from '@/lib/api/types';
import { FORM_FILTERS, type SchoolListFilters } from '@/lib/schoolList';

interface SchoolFilterFormProps {
  filters: SchoolListFilters;
  onApply: (filters: SchoolListFilters) => void;
}

const DESIGNATIONS: Designation[] = [
  'Exemplary',
  'Approaching Exemplary',
  'Commendable',
  'Developing',
  'Comprehensive',
  'Dually Designated',
];

const RANGES = [
  {
    legend: 'Students',
    low: { name: 'enrollment_min', label: 'Fewest students' },
    high: { name: 'enrollment_max', label: 'Most students' },
    step: 1,
    max: undefined,
  },
  {
    legend: 'Low-income share, %',
    low: { name: 'low_income_min', label: 'Lowest low-income share' },
    high: { name: 'low_income_max', label: 'Highest low-income share' },
    step: 'any',
    max: 100,
  },
] as const;

type RangeName = (typeof RANGES)[number]['low' | 'high']['name'];

function withoutFormFilters(filters: SchoolListFilters): SchoolListFilters {
  const kept = { ...filters };
  for (const name of FORM_FILTERS) {
    delete kept[name];
  }
  return kept;
}

export default function SchoolFilterForm({ filters, onApply }: SchoolFilterFormProps) {
  const fieldId = useId();
  const [county, setCounty] = useState(filters.county ?? '');
  const [district, setDistrict] = useState(filters.district ?? '');
  const [designation, setDesignation] = useState(filters.designation ?? '');
  const [ranges, setRanges] = useState<Record<RangeName, string>>({
    enrollment_min: filters.enrollment_min?.toString() ?? '',
    enrollment_max: filters.enrollment_max?.toString() ?? '',
    low_income_min: filters.low_income_min?.toString() ?? '',
    low_income_max: filters.low_income_max?.toString() ?? '',
  });


  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const applied: SchoolListFilters = withoutFormFilters(filters);

    if (county) applied.county = county;
    if (district) applied.district = district;
    if (designation) applied.designation = designation;
    for (const name of Object.keys(ranges) as RangeName[]) {
      if (ranges[name].trim() !== '' && Number.isFinite(Number(ranges[name]))) {
        applied[name] = Number(ranges[name]);
      }
    }
    onApply(applied);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <RegionFields
        county={county}
        district={district}
        onChange={(region) => {
          setCounty(region.county);
          setDistrict(region.district);
        }}
      />

      <div>
        <label htmlFor={`${fieldId}-designation`} className={LABEL_CLASS}>
          State designation
        </label>
        <select
          id={`${fieldId}-designation`}
          value={designation}
          onChange={(event) => setDesignation(event.target.value)}
          className={SELECT_CLASS}
        >
          <option value="">Any designation</option>
          {DESIGNATIONS.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>

      {RANGES.map((range) => (
        <fieldset key={range.legend}>
          <legend className={LABEL_CLASS}>{range.legend}</legend>
          <div className="grid grid-cols-2 gap-2">
            {[range.low, range.high].map((end) => (
              <Input
                key={end.name}
                type="number"
                inputMode="decimal"
                min={0}
                max={range.max}
                step={range.step}
                aria-label={end.label}
                placeholder={end === range.low ? 'At least' : 'At most'}
                value={ranges[end.name]}
                onChange={(event) => setRanges({ ...ranges, [end.name]: event.target.value })}
              />
            ))}
          </div>
        </fieldset>
      ))}

      <div className="flex flex-wrap gap-2 pt-2">
        <Button type="submit">Show schools</Button>
        <Button type="button" variant="outline" onClick={() => onApply(withoutFormFilters(filters))}>
          Clear filters
        </Button>
      </div>
    </form>
  );
}
