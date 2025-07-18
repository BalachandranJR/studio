import * as React from 'react';

const Logo = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 160 40"
    width={160}
    height={40}
    {...props}
  >
    <defs>
      <linearGradient id="logoGradient" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#5DADE2" />
        <stop offset="100%" stopColor="#2E86C1" />
      </linearGradient>
    </defs>
    
    <path 
      d="M10 5 L10 35 L22 35 C35 35 35 25 22 25 L18 25 M18 15 L20 15 C35 15 35 5 20 5 L10 5" 
      stroke="url(#logoGradient)" 
      strokeWidth="3"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M 2 2 L 8 8 M 2 38 L 8 32 M 30 2 L 24 8 M 30 38 L 24 32"
      stroke="#F4D03F"
      strokeWidth="2.5"
      fill="none"
      strokeLinecap="round"
    />
    
    <text 
      x="45" 
      y="28" 
      fontFamily="'PT Sans', sans-serif" 
      fontSize="18" 
      fontWeight="bold" 
      fill="hsl(var(--primary))"
    >
      TripAssist
    </text>
  </svg>
);

export default Logo;