// ABOUTME: A school's Illinois state designation on ISBE's five-step scale
// ABOUTME: Handles dually designated and undesignated schools and links to the Illinois Report Card profile

import { ExternalLink } from 'lucide-react';
import type { Designation } from '@/lib/api/types';
import { CURRENT_YEAR } from '@/lib/trendUtils';
import { cn } from '@/lib/utils';

interface DesignationScaleProps {
  designation: Designation | null;
  rcdts: string;
}

interface Level {
  name: Designation;
  position: string;
  isbeDescription: string;
}

// Lowest first, the order the steps are drawn in
const LEVELS: Level[] = [
  { name: 'Comprehensive', position: 'Lowest', isbeDescription: 'low performance' },
  { name: 'Developing', position: 'Second lowest', isbeDescription: 'below average performance' },
  { name: 'Commendable', position: 'Middle', isbeDescription: 'typical or average performance' },
  { name: 'Approaching Exemplary', position: 'Second highest', isbeDescription: 'strong performance' },
  { name: 'Exemplary', position: 'Highest', isbeDescription: 'the highest levels of performance' },
];

function profileUrl(rcdts: string): string {
  const schoolId = rcdts.replaceAll('-', '');
  return `https://www.illinoisreportcard.com/school.aspx?schoolid=${schoolId}&source=accountability&source2=essadesignation`;
}

export default function DesignationScale({ designation, rcdts }: DesignationScaleProps) {
  const level = LEVELS.find((candidate) => candidate.name === designation);

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">Illinois state designation · {CURRENT_YEAR}</p>

      {level && (
        <>
          <p className="text-xl font-bold">
            <span className="bg-highlighter px-1 text-highlighter-foreground">{level.name}</span>
          </p>
          <div
            role="img"
            aria-label={`${level.position} of five levels`}
            className="grid grid-cols-5 gap-1"
          >
            {LEVELS.map((step) => (
              <span
                key={step.name}
                className={cn(
                  'h-2.5 border',
                  step === level ? 'border-foreground bg-highlighter' : 'border-border bg-muted'
                )}
              />
            ))}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground" aria-hidden="true">
            <span>{LEVELS[0].name}</span>
            <span>{LEVELS[LEVELS.length - 1].name}</span>
          </div>
          <p className="text-sm">
            {`${level.position} of five levels. ISBE describes it as ${level.isbeDescription}.`}
          </p>
        </>
      )}

      {designation === 'Dually Designated' && (
        <>
          <p className="text-xl font-bold">Dually Designated</p>
          <p className="text-sm">
            This school spans two grade bands, so ISBE gave it one designation for each. The public
            data does not say which two.
          </p>
        </>
      )}

      {designation === null && (
        <>
          <p className="text-xl font-bold">Not designated</p>
          <p className="text-sm">ISBE gave this school no designation for {CURRENT_YEAR}.</p>
        </>
      )}

      <p className="text-sm text-muted-foreground">
        Designations are new in {CURRENT_YEAR}, so there is no earlier year to compare.
      </p>
      <a
        href={profileUrl(rcdts)}
        target="_blank"
        rel="noreferrer"
        className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-link underline underline-offset-4"
      >
        Full profile on Illinois Report Card
        <ExternalLink className="h-4 w-4" aria-hidden="true" />
      </a>
    </div>
  );
}
