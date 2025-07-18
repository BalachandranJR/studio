import * as React from 'react';

const Logo = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 100 100"
    width={60}
    height={60}
    {...props}
  >
    <defs>
        <radialGradient id="logo-gradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
            <stop offset="0%" style={{stopColor: '#888', stopOpacity: 1}} />
            <stop offset="100%" style={{stopColor: '#444', stopOpacity: 1}} />
        </radialGradient>
    </defs>
    <circle cx="50" cy="50" r="48" fill="url(#logo-gradient)" />
    <text 
        x="50" 
        y="58" 
        fontFamily="Arial, sans-serif"
        fontSize="30" 
        fontWeight="bold"
        fill="#FFFFFF" 
        textAnchor="middle"
        stroke="#222"
        strokeWidth="1"
    >
      BJR
    </text>
     <path d="M25 50 Q 35 40, 40 55 T 30 65 Z" fill="#26C6DA" opacity="0.7" />
     <path d="M60 45 L 75 42 L 70 58 Z" fill="#26C6DA" opacity="0.7" />
  </svg>
);

export default Logo;
