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
      <linearGradient id="silverGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#E0E0E0', stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: '#BDBDBD', stopOpacity: 1 }} />
      </linearGradient>
      <linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#26C6DA', stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: '#00ACC1', stopOpacity: 1 }} />
      </linearGradient>
    </defs>

    {/* Background Circle */}
    <circle cx="50" cy="50" r="48" fill="#212121" stroke="#424242" strokeWidth="2"/>

    {/* BJR Logo */}
    <g transform="translate(15, 20) scale(0.9)">
      {/* Silver Parts */}
      <path d="M21.1,38.9 L1.5,52.8 L1.5,43.2 L21.1,28.9 L21.1,38.9 Z" fill="url(#silverGradient)" />
      <path d="M18.8,1.4 L1.5,13.2 L1.5,4.1 L18.8,1.4 Z" fill="url(#silverGradient)" />
      <path d="M22,23.5C14.2,23.5,14,17,21,17h13.8L34,23.5H22z" fill="url(#silverGradient)" />
      <path d="M22.2,34.4h11.1l0.8-6.1H21.5C14.5,28.3,13.8,34.4,22.2,34.4z" fill="url(#silverGradient)" />
      <path d="M35.4,1.4 L35.4,34.5 L43.5,34.5 L43.5,13 L56,13 L68.5,1.4 L35.4,1.4 Z M43.5,7.4 L51.5,7.4 L43.5,1.4 L43.5,7.4 Z" fill="url(#silverGradient)" />
      
      {/* Blue Parts */}
      <path d="M20.2,27.5 L1.5,21.8 L1.5,30.2 L20.2,27.5 Z" fill="url(#blueGradient)" />
      <path d="M1.5,14.6 L20,18.8 L20,20.8 L1.5,14.6 Z" fill="url(#blueGradient)" />
      <path d="M69.8,14.1 L57.2,14.1 L44,32.2 L50.2,38.9 L69.8,14.1 Z" fill="url(#blueGradient)" />
      <path d="M51.8,7.4 L62.8,7.4 L57,13 L51.8,7.4 Z" fill="url(#blueGradient)" />
    </g>

     {/* Text */}
     <text 
        x="50" 
        y="82" 
        fontFamily="'PT Sans', sans-serif"
        fontSize="6" 
        fill="#FFFFFF" 
        textAnchor="middle"
        letterSpacing="0.5"
    >
      BALACHANDRAN JANAKI RAMAN
    </text>
  </svg>
);

export default Logo;
