// ABOUTME: Page explaining the yardsticks shown beside a school's figures
// ABOUTME: Covers state and district averages, percentiles, the band, similar schools and test years

import type { ReactNode } from 'react';
import BackButton from '@/components/BackButton';
import { SAT_YEARS } from '@/lib/history';
import { CURRENT_YEAR } from '@/lib/trendUtils';

function Topic({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-2xl font-medium">{title}</h2>
      {children}
    </section>
  );
}

export default function HowThisWorks() {
  return (
    <div className="mx-auto max-w-2xl space-y-8 py-8">
      <BackButton />
      <header className="space-y-2">
        <h1 className="text-3xl font-medium leading-tight lg:text-4xl">How this works</h1>
        <p className="text-muted-foreground">
          Every figure comes from the {CURRENT_YEAR} Illinois Report Card, published by the
          Illinois State Board of Education (ISBE). The comparisons beside a school's test scores
          are worked out here from that data, as follows.
        </p>
      </header>

      <Topic title="Illinois average">
        <p>
          The average across Illinois schools of the same level (elementary, middle or high) that
          reported the figure. Every school counts once, whatever its size.
        </p>
        <p>
          ISBE's published state figures count every student once instead, so large schools weigh
          more in them. The two will not match. The average here answers what a typical school
          looks like.
        </p>
      </Topic>

      <Topic title="District average">
        <p>
          The same average across the schools of that level in the school's district. It is shown
          only when the district has three or more such schools, since an average of one or two
          schools says little.
        </p>
      </Topic>

      <Topic title="Higher than a share of schools">
        <p>
          "Higher than 64% of Illinois high schools" means 64 in every 100 Illinois high schools
          had a lower score this year. Schools with the same score are not counted as lower.
        </p>
      </Topic>

      <Topic title="Where most schools fall">
        <p>
          The shaded band on a comparison runs from the score that one school in ten falls below
          to the score that one school in ten rises above. Eight in ten schools of that level sit
          inside it, so it shows how much a gap between two schools matters.
        </p>
      </Topic>

      <Topic title="Similar schools">
        <p>
          Test scores follow family income closely, so each school is also compared with the 25
          schools most like it. Likeness is measured on three things: the share of students from
          low-income families, the share learning English, and enrollment.
        </p>
        <p>
          Each of the three is scaled by how much it varies between schools, so none dominates.
          Enrollment is compared in proportion: a school half the size is as far away as one twice
          the size. ISBE withholds the English learner share when fewer than 10 students are
          counted, and a withheld share counts as zero for matching only.
        </p>
        <p>
          The 25 schools are listed on each school's page so anyone can check them. A school with
          no published low-income share or enrollment cannot be matched.
        </p>
      </Topic>

      <Topic title="Which schools a test is compared with">
        <p>
          The ACT is taken in grade 11, so ACT averages are compared with Illinois high schools.
          The Illinois Assessment of Readiness (IAR) is taken in grades 3 to 8, so IAR results are
          compared with elementary schools or middle schools, whichever the school is.
        </p>
        <p>
          Some schools span both, such as a school for grades 6 to 12. Its ACT average is compared
          with high schools and its IAR results with middle schools.
        </p>
      </Topic>

      <Topic title="Test scores over time">
        <p>
          From {SAT_YEARS.first} to {SAT_YEARS.last} Illinois gave the SAT in place of the ACT.
          Those years are converted to the ACT scale and shaded on the chart. No statewide scores
          were published for 2018 or 2020. IAR scoring changed in {CURRENT_YEAR - 1}, so IAR
          results are compared with that year only.
        </p>
      </Topic>

      <Topic title="Students are described, not ranked">
        <p>
          Only test results are read as higher or lower. Enrollment, family income, English
          learners, and race and ethnicity are shown beside state figures for context, with no
          better or worse.
        </p>
      </Topic>
    </div>
  );
}
