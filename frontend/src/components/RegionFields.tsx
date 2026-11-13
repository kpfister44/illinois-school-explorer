// ABOUTME: County and district fields that together choose a region of Illinois
// ABOUTME: The county narrows the districts offered; choosing a county drops a district outside it

import { useId } from 'react';
import { useDistricts } from '@/lib/api/queries';

export interface Region {
  county: string;
  district: string;
}

interface RegionFieldsProps extends Region {
  onChange: (region: Region) => void;
}

export const SELECT_CLASS =
  'h-11 w-full rounded-md border border-input bg-background px-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:text-sm';
export const LABEL_CLASS = 'mb-1 block text-sm font-medium';

export default function RegionFields({ county, district, onChange }: RegionFieldsProps) {
  const { data: districts = [] } = useDistricts();
  const fieldId = useId();

  const counties = [...new Set(districts.map((item) => item.county).filter(Boolean))].sort();
  const districtsOffered = county ? districts.filter((item) => item.county === county) : districts;

  const handleCountyChange = (chosen: string) => {
    const districtIsInCounty = districts.some(
      (item) => item.id === district && item.county === chosen
    );
    onChange({ county: chosen, district: chosen && !districtIsInCounty ? '' : district });
  };

  return (
    <>
      <div>
        <label htmlFor={`${fieldId}-county`} className={LABEL_CLASS}>
          County
        </label>
        <select
          id={`${fieldId}-county`}
          value={county}
          onChange={(event) => handleCountyChange(event.target.value)}
          className={SELECT_CLASS}
        >
          <option value="">Any county</option>
          {counties.map((name) => (
            <option key={name} value={name!}>
              {name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor={`${fieldId}-district`} className={LABEL_CLASS}>
          District
        </label>
        <select
          id={`${fieldId}-district`}
          value={district}
          onChange={(event) => onChange({ county, district: event.target.value })}
          className={SELECT_CLASS}
        >
          <option value="">Any district</option>
          {districtsOffered.map((item) => (
            <option key={item.id} value={item.id}>
              {county || !item.county ? item.name : `${item.name} (${item.county})`}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}
