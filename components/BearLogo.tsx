import type { SVGProps } from "react";

type BearLogoProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

export function BearLogo({ size = 40, ...props }: BearLogoProps) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <circle cx="32" cy="32" r="30" fill="black" />
      <ellipse cx="32" cy="37" rx="16" ry="12" fill="white" />
      <path
        d="M23 32.5C23 28.8 26.7 26 32 26C37.3 26 41 28.8 41 32.5C41 35 37.1 37 32 37C26.9 37 23 35 23 32.5Z"
        fill="black"
      />
      <path
        d="M32 37V41.5M32 41.5C29.8 44.1 27.2 44.4 25 42.5M32 41.5C34.2 44.1 36.8 44.4 39 42.5"
        stroke="black"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
