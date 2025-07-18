import * as React from 'react';

const Logo = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 200 60"
    width={150}
    height={45}
    {...props}
  >
    <defs>
      <linearGradient id="grad-blue" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#00AEEF" />
        <stop offset="100%" stopColor="#0072BB" />
      </linearGradient>
      <linearGradient id="grad-silver" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#E0E0E0" />
        <stop offset="100%" stopColor="#BDBDBD" />
      </linearGradient>
    </defs>
    
    {/* B letter parts */}
    <path d="M 5,20 L 5,40 L 20,40 C 35,40 35,20 20,20 L 5,20 Z M 5,42 L 5,50 L 22,50 C 40,50 40,35 22,35 L 5,35" fill="url(#grad-silver)" />
    
    {/* Shards around B */}
    <polygon points="0,15 4,18 2,5" fill="url(#grad-blue)" />
    <polygon points="1,42 4,40 0,55" fill="url(#grad-silver)" />
    <polygon points="30,5 25,15 35,18" fill="url(#grad-blue)" />
    <polygon points="30,55 35,45 25,48" fill="url(#grad-silver)" />
    
    {/* J letter */}
    <path d="M 50,20 L 70,20 L 70,45 C 70,55 55,55 55,45 L 55,40" fill="url(#grad-silver)" stroke="none" />
    <path d="M 45,5 L 75,5 L 70,20" fill="url(#grad-silver)" />
    
    {/* R letter parts */}
    <path d="M 80,20 L 80,50 L 95,50 C 110,50 110,35 95,35 L 80,35" fill="url(#grad-silver)" />
    <path d="M 98,38 L 115,50" fill="none" stroke="url(#grad-silver)" strokeWidth="5" />
    
    {/* Shards around R */}
    <path d="M 115,5 L 125,18 L 105,20" fill="url(#grad-blue)" />
    <path d="M 118,22 L 130,25 L 125,35" fill="url(#grad-blue)" />
    <path d="M 132, 28 L 135,35 L 128,38" fill="url(#grad-blue)" />
    
    {/* Text */}
    <text x="45" y="58" fontFamily="Arial, sans-serif" fontSize="6" fill="#FFFFFF" fontWeight="bold">
      BALACHANDRAN JANAKI RAMAN
    </text>
  </svg>
);

export default Logo;
