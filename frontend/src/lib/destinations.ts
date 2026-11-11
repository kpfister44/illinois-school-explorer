// ABOUTME: The site's main destinations, shared by the header navigation and the phone tab bar
// ABOUTME: Each destination knows which pages it is current for

import { Scale, Search, Star, type LucideIcon } from 'lucide-react';

export interface Destination {
  to: string;
  label: string;
  icon: LucideIcon;
  isCurrent: (pathname: string) => boolean;
}

export const SEARCH: Destination = {
  to: '/',
  label: 'Search',
  icon: Search,
  isCurrent: (pathname) => pathname === '/' || pathname === '/search',
};

export const COMPARE: Destination = {
  to: '/compare',
  label: 'Compare',
  icon: Scale,
  isCurrent: (pathname) => pathname === '/compare',
};

export const TOP_SCORES: Destination = {
  to: '/top-scores',
  label: 'Top scores',
  icon: Star,
  isCurrent: (pathname) => pathname === '/top-scores',
};
