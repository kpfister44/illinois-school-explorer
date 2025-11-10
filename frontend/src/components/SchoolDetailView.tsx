// ABOUTME: SchoolDetailView component for detailed school display
// ABOUTME: Organizes overview, academics, and demographics in tabs

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import type { SchoolDetail } from '@/lib/api/types';

interface SchoolDetailViewProps {
  school: SchoolDetail;
}

const numberFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });

function formatNumber(value: number | null): string {
  if (value === null) {
    return 'N/A';
  }
  if (Number.isInteger(value)) {
    return numberFormatter.format(value);
  }
  return value.toFixed(1);
}

function formatPercent(value: number | null): string {
  if (value === null) {
    return 'N/A';
  }
  return `${value.toFixed(1)}%`;
}

export default function SchoolDetailView({ school }: SchoolDetailViewProps) {
  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{school.school_name}</h1>
            <p className="text-muted-foreground">
              {school.city}
              {school.county && ` • ${school.county} County`}
              {school.district && ` • ${school.district}`}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {school.school_type && <Badge variant="secondary">{school.school_type}</Badge>}
            {school.grades_served && <Badge variant="outline">Grades {school.grades_served}</Badge>}
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="academics">Academics</TabsTrigger>
          <TabsTrigger value="demographics">Demographics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Enrollment</CardTitle>
              <CardDescription>Total student population</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">
                {formatNumber(school.metrics.enrollment)}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="academics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>ACT Scores</CardTitle>
              <CardDescription>Average Grade 11 performance (out of 36)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {school.metrics.act.ela_avg !== null && (
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">ELA</span>
                    <span className="text-sm font-bold">
                      {school.metrics.act.ela_avg.toFixed(1)}
                    </span>
                  </div>
                  <Progress value={(school.metrics.act.ela_avg / 36) * 100} />
                </div>
              )}
              {school.metrics.act.math_avg !== null && (
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Math</span>
                    <span className="text-sm font-bold">
                      {school.metrics.act.math_avg.toFixed(1)}
                    </span>
                  </div>
                  <Progress value={(school.metrics.act.math_avg / 36) * 100} />
                </div>
              )}
              {school.metrics.act.science_avg !== null && (
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Science</span>
                    <span className="text-sm font-bold">
                      {school.metrics.act.science_avg.toFixed(1)}
                    </span>
                  </div>
                  <Progress value={(school.metrics.act.science_avg / 36) * 100} />
                </div>
              )}
              {school.metrics.act.overall_avg !== null && (
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Overall</span>
                    <span className="text-sm font-bold">
                      {school.metrics.act.overall_avg.toFixed(1)}
                    </span>
                  </div>
                  <Progress value={(school.metrics.act.overall_avg / 36) * 100} />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="demographics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Demographics</CardTitle>
              <CardDescription>Student support indicators</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">English Learners</span>
                <span className="text-lg font-semibold">
                  {formatPercent(school.metrics.demographics.el_percentage)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Low Income</span>
                <span className="text-lg font-semibold">
                  {formatPercent(school.metrics.demographics.low_income_percentage)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Racial Diversity</CardTitle>
              <CardDescription>Student population breakdown</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {school.metrics.diversity.white !== null && (
                <div>
                  <div className="flex justify-between mb-2 text-sm">
                    <span>White</span>
                    <span className="font-medium">
                      {formatPercent(school.metrics.diversity.white)}
                    </span>
                  </div>
                  <Progress value={school.metrics.diversity.white} />
                </div>
              )}
              {school.metrics.diversity.hispanic !== null && (
                <div>
                  <div className="flex justify-between mb-2 text-sm">
                    <span>Hispanic</span>
                    <span className="font-medium">
                      {formatPercent(school.metrics.diversity.hispanic)}
                    </span>
                  </div>
                  <Progress value={school.metrics.diversity.hispanic} />
                </div>
              )}
              {school.metrics.diversity.asian !== null && (
                <div>
                  <div className="flex justify-between mb-2 text-sm">
                    <span>Asian</span>
                    <span className="font-medium">
                      {formatPercent(school.metrics.diversity.asian)}
                    </span>
                  </div>
                  <Progress value={school.metrics.diversity.asian} />
                </div>
              )}
              {school.metrics.diversity.black !== null && (
                <div>
                  <div className="flex justify-between mb-2 text-sm">
                    <span>Black</span>
                    <span className="font-medium">
                      {formatPercent(school.metrics.diversity.black)}
                    </span>
                  </div>
                  <Progress value={school.metrics.diversity.black} />
                </div>
              )}
              {school.metrics.diversity.two_or_more !== null && (
                <div>
                  <div className="flex justify-between mb-2 text-sm">
                    <span>Two or More Races</span>
                    <span className="font-medium">
                      {formatPercent(school.metrics.diversity.two_or_more)}
                    </span>
                  </div>
                  <Progress value={school.metrics.diversity.two_or_more} />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
