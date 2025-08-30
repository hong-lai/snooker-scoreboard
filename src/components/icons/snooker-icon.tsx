import * as React from 'react';

export const SnookerIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.2" />
    <circle cx="10" cy="8" r="2.5" fill="hsl(var(--primary))" stroke="none" />
    <circle cx="15" cy="10" r="2.5" fill="hsl(var(--destructive))" stroke="none" />
    <circle cx="11" cy="15" r="2.5" fill="hsl(var(--card-foreground))" stroke="none" />
  </svg>
);
