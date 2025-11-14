// ABOUTME: SchoolDetailView component for detailed school display
// ABOUTME: Organizes overview, academics, and demographics in tabs

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Plus, Minus, ArrowLeft } from 'lucide-react';
import { useComparison } from '@/contexts/ComparisonContext';
import { useNavigate } from 'react-router-dom';
import TrendDisplay from '@/components/TrendDisplay';
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
  const { addToComparison, removeFromComparison, isInComparison, canAddMore } = useComparison();
  const navigate = useNavigate();
  const inComparison = isInComparison(school.rcdts);

  const handleComparisonToggle = () => {
    if (inComparison) {
      removeFromComparison(school.rcdts);
    } else {
      addToComparison(school.rcdts);
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        onClick={handleBack}
        className="gap-2 px-0 hover:bg-transparent"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>
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
        <div className="mt-4">
          <Button
            onClick={handleComparisonToggle}
            variant={inComparison ? 'outline' : 'default'}
            disabled={!inComparison && !canAddMore}
          >
            {inComparison ? (
              <>
                <Minus className="mr-2 h-4 w-4" />
                Remove from Compare
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Add to Compare
              </>
            )}
          </Button>
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
              {school.metrics.enrollment !== null && (
                <TrendDisplay
                  label="Enrollment"
                  currentValue={school.metrics.enrollment}
                  trendData={school.metrics.trends?.enrollment}
                  historicalData={school.metrics.historical?.enrollment}
                  metricType="count"
                  unit="students"
                />
              )}
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
              {school.metrics.act.overall_avg !== null && (
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Overall</span>
                    <span className="text-sm font-bold">
                      {school.metrics.act.overall_avg.toFixed(1)}
                    </span>
                  </div>
                  <Progress value={(school.metrics.act.overall_avg / 36) * 100} />
                  <TrendDisplay
                    label="ACT Overall"
                    currentValue={school.metrics.act.overall_avg}
                    trendData={school.metrics.trends?.act}
                    historicalData={school.metrics.historical?.act}
                    metricType="score"
                    unit="points"
                  />
                </div>
              )}
              {school.metrics.act.ela_avg !== null && (
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">ELA</span>
                    <span className="text-sm font-bold">
                      {school.metrics.act.ela_avg.toFixed(1)}
                    </span>
                  </div>
                  <Progress value={(school.metrics.act.ela_avg / 36) * 100} />
                  <TrendDisplay
                    label="ACT ELA"
                    currentValue={school.metrics.act.ela_avg}
                    trendData={school.metrics.trends?.act}
                    historicalData={school.metrics.historical?.act_ela}
                    metricType="score"
                    unit="points"
                  />
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
                  <TrendDisplay
                    label="ACT Math"
                    currentValue={school.metrics.act.math_avg}
                    trendData={school.metrics.trends?.act}
                    historicalData={school.metrics.historical?.act_math}
                    metricType="score"
                    unit="points"
                  />
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
                  <TrendDisplay
                    label="ACT Science"
                    currentValue={school.metrics.act.science_avg}
                    trendData={school.metrics.trends?.act}
                    historicalData={school.metrics.historical?.act_science}
                    metricType="score"
                    unit="points"
                  />
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
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">English Learners</span>
                  <span className="text-lg font-semibold">
                    {formatPercent(school.metrics.demographics.el_percentage)}
                  </span>
                </div>
                {school.metrics.demographics.el_percentage !== null && (
                  <TrendDisplay
                    label="English Learners"
                    currentValue={school.metrics.demographics.el_percentage}
                    trendData={school.metrics.trends?.el}
                    historicalData={school.metrics.historical?.el}
                    metricType="percentage"
                    unit="percentage points"
                  />
                )}
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Low Income</span>
                  <span className="text-lg font-semibold">
                    {formatPercent(school.metrics.demographics.low_income_percentage)}
                  </span>
                </div>
                {school.metrics.demographics.low_income_percentage !== null && (
                  <TrendDisplay
                    label="Low Income"
                    currentValue={school.metrics.demographics.low_income_percentage}
                    trendData={school.metrics.trends?.low_income}
                    historicalData={school.metrics.historical?.low_income}
                    metricType="percentage"
                    unit="percentage points"
                  />
                )}
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
                  <TrendDisplay
                    label="White"
                    currentValue={school.metrics.diversity.white}
                    trendData={school.metrics.trends?.white}
                    historicalData={school.metrics.historical?.white}
                    metricType="percentage"
                    unit="percentage points"
                  />
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
                  <TrendDisplay
                    label="Hispanic"
                    currentValue={school.metrics.diversity.hispanic}
                    trendData={school.metrics.trends?.hispanic}
                    historicalData={school.metrics.historical?.hispanic}
                    metricType="percentage"
                    unit="percentage points"
                  />
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
                  <TrendDisplay
                    label="Asian"
                    currentValue={school.metrics.diversity.asian}
                    trendData={school.metrics.trends?.asian}
                    historicalData={school.metrics.historical?.asian}
                    metricType="percentage"
                    unit="percentage points"
                  />
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
                  <TrendDisplay
                    label="Black"
                    currentValue={school.metrics.diversity.black}
                    trendData={school.metrics.trends?.black}
                    historicalData={school.metrics.historical?.black}
                    metricType="percentage"
                    unit="percentage points"
                  />
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
                  <TrendDisplay
                    label="Two or More Races"
                    currentValue={school.metrics.diversity.two_or_more}
                    trendData={school.metrics.trends?.two_or_more}
                    historicalData={school.metrics.historical?.two_or_more}
                    metricType="percentage"
                    unit="percentage points"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
