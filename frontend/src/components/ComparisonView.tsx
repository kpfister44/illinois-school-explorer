// ABOUTME: Side-by-side comparison for schools
// ABOUTME: Mobile: Swipeable cards; Desktop: Table with color-coded metrics

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { SchoolDetail } from '@/lib/api/types';
import { cn } from '@/lib/utils';

interface ComparisonViewProps {
  schools: SchoolDetail[];
}

interface MetricRow {
  label: string;
  getValue: (school: SchoolDetail) => number | null;
  format: (value: number | null) => string;
  higherIsBetter: boolean;
}

const metrics: MetricRow[] = [
  {
    label: 'Enrollment',
    getValue: (s) => s.metrics.enrollment,
    format: (v) => (v == null ? 'N/A' : v.toLocaleString()),
    higherIsBetter: false,
  },
  {
    label: 'ACT ELA Average',
    getValue: (s) => s.metrics.act?.ela_avg ?? null,
    format: (v) => (v == null ? 'N/A' : v.toFixed(1)),
    higherIsBetter: true,
  },
  {
    label: 'ACT Math Average',
    getValue: (s) => s.metrics.act?.math_avg ?? null,
    format: (v) => (v == null ? 'N/A' : v.toFixed(1)),
    higherIsBetter: true,
  },
  {
    label: 'ACT Science Average',
    getValue: (s) => s.metrics.act?.science_avg ?? null,
    format: (v) => (v == null ? 'N/A' : v.toFixed(1)),
    higherIsBetter: true,
  },
  {
    label: 'IAR Overall Proficiency %',
    getValue: (s) => s.metrics.iar_overall_proficiency_pct,
    format: (v) => (v == null ? 'N/A' : `${v.toFixed(1)}%`),
    higherIsBetter: true,
  },
  {
    label: 'IAR ELA Proficiency %',
    getValue: (s) => s.metrics.iar_ela_proficiency_pct,
    format: (v) => (v == null ? 'N/A' : `${v.toFixed(1)}%`),
    higherIsBetter: true,
  },
  {
    label: 'IAR Math Proficiency %',
    getValue: (s) => s.metrics.iar_math_proficiency_pct,
    format: (v) => (v == null ? 'N/A' : `${v.toFixed(1)}%`),
    higherIsBetter: true,
  },
  {
    label: 'English Learner %',
    getValue: (s) => s.metrics.demographics.el_percentage,
    format: (v) => (v == null ? 'N/A' : `${v.toFixed(1)}%`),
    higherIsBetter: false,
  },
  {
    label: 'Low Income %',
    getValue: (s) => s.metrics.demographics.low_income_percentage,
    format: (v) => (v == null ? 'N/A' : `${v.toFixed(1)}%`),
    higherIsBetter: false,
  },
  {
    label: 'White %',
    getValue: (s) => s.metrics.diversity.white,
    format: (v) => (v == null ? 'N/A' : `${v.toFixed(1)}%`),
    higherIsBetter: false,
  },
  {
    label: 'Black %',
    getValue: (s) => s.metrics.diversity.black,
    format: (v) => (v == null ? 'N/A' : `${v.toFixed(1)}%`),
    higherIsBetter: false,
  },
  {
    label: 'Hispanic %',
    getValue: (s) => s.metrics.diversity.hispanic,
    format: (v) => (v == null ? 'N/A' : `${v.toFixed(1)}%`),
    higherIsBetter: false,
  },
  {
    label: 'Asian %',
    getValue: (s) => s.metrics.diversity.asian,
    format: (v) => (v == null ? 'N/A' : `${v.toFixed(1)}%`),
    higherIsBetter: false,
  },
];

function getColorClass(
  value: number | null,
  values: (number | null)[],
  higherIsBetter: boolean
): string {
  if (value === null) return '';

  const validValues = values.filter((v): v is number => v !== null);
  if (validValues.length < 2) return '';

  const max = Math.max(...validValues);
  const min = Math.min(...validValues);

  if (higherIsBetter) {
    return value === max ? 'bg-green-100 dark:bg-green-900' : '';
  }

  return value === min ? 'bg-green-100 dark:bg-green-900' : '';
}

export default function ComparisonView({ schools }: ComparisonViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  if (schools.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No schools to compare</p>
      </div>
    );
  }

  const currentSchool = schools[currentIndex];
  const allValues = metrics.map((metric) => schools.map((s) => metric.getValue(s)));

  const navigate = (newDirection: number) => {
    setDirection(newDirection);
    setCurrentIndex((prev) => {
      const next = prev + newDirection;
      if (next < 0) return schools.length - 1;
      if (next >= schools.length) return 0;
      return next;
    });
  };

  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
  };

  return (
    <>
      {/* Mobile: Swipeable Card Carousel */}
      <div className="md:hidden">
        <div className="relative">
          {/* Navigation Header */}
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(-1)}
              disabled={schools.length === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                School {currentIndex + 1} of {schools.length}
              </p>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(1)}
              disabled={schools.length === 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Swipeable Card */}
          <div className="relative overflow-hidden" style={{ minHeight: '500px' }}>
            <AnimatePresence initial={false} custom={direction} mode="wait">
              <motion.div
                key={currentIndex}
                custom={direction}
                variants={{
                  enter: (dir: number) => ({
                    x: dir > 0 ? 300 : -300,
                    opacity: 0,
                  }),
                  center: {
                    zIndex: 1,
                    x: 0,
                    opacity: 1,
                  },
                  exit: (dir: number) => ({
                    zIndex: 0,
                    x: dir < 0 ? 300 : -300,
                    opacity: 0,
                  }),
                }}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: 'spring', stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 },
                }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={1}
                onDragEnd={(e, { offset, velocity }) => {
                  const swipe = swipePower(offset.x, velocity.x);
                  if (swipe < -swipeConfidenceThreshold) {
                    navigate(1);
                  } else if (swipe > swipeConfidenceThreshold) {
                    navigate(-1);
                  }
                }}
                className="absolute w-full"
              >
                <Card>
                  <CardHeader>
                    <CardTitle>{currentSchool.school_name}</CardTitle>
                    <CardDescription>
                      {currentSchool.city}
                      {currentSchool.district && ` • ${currentSchool.district}`}
                    </CardDescription>
                    {currentSchool.school_type && (
                      <Badge variant="secondary" className="mt-2 w-fit">
                        {currentSchool.school_type}
                      </Badge>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {metrics.map((metric, idx) => {
                        const value = metric.getValue(currentSchool);
                        const values = allValues[idx];
                        const colorClass = getColorClass(value, values, metric.higherIsBetter);
                        const isHighlight = colorClass !== '';

                        return (
                          <div
                            key={metric.label}
                            className={cn(
                              'flex items-center justify-between py-3 px-4 rounded-lg border',
                              colorClass
                            )}
                          >
                            <span className="text-sm font-medium">{metric.label}</span>
                            <span className={cn('text-lg font-bold', isHighlight && 'text-foreground')}>
                              {metric.format(value)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Swipe Hint */}
          <p className="text-xs text-center text-muted-foreground mt-4">
            Swipe or use arrows to compare schools
          </p>
        </div>
      </div>

      {/* Desktop: Existing Table View */}
      <div className="hidden md:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-48 font-bold">Metric</TableHead>
              {schools.map((school) => (
                <TableHead key={school.rcdts} className="min-w-[200px]">
                  <div>
                    <div className="font-bold">{school.school_name}</div>
                    <div className="text-xs text-muted-foreground font-normal">
                      {school.city}
                    </div>
                    {school.school_type && (
                      <Badge variant="secondary" className="mt-1 text-xs">
                        {school.school_type}
                      </Badge>
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {metrics.map((metric) => {
              const values = schools.map((s) => metric.getValue(s));

              return (
                <TableRow key={metric.label}>
                  <TableCell className="font-medium">{metric.label}</TableCell>
                  {schools.map((school) => {
                    const value = metric.getValue(school);
                    const colorClass = getColorClass(value, values, metric.higherIsBetter);

                    return (
                      <TableCell
                        key={school.rcdts}
                        className={cn('text-center', colorClass)}
                      >
                        {metric.format(value)}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
