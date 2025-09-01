interface IconProps {
  className?: string;
  size?: number;
}

export const TargetIcon = ({ className = "w-6 h-6", size }: IconProps) => (
  <svg 
    className={className} 
    width={size} 
    height={size} 
    fill="none" 
    strokeWidth={2} 
    stroke="currentColor" 
    viewBox="0 0 24 24"
  >
    <circle cx="12" cy="12" r="10"/>
    <circle cx="12" cy="12" r="6"/>
    <circle cx="12" cy="12" r="2"/>
  </svg>
)

export const BrainIcon = ({ className = "w-6 h-6", size }: IconProps) => (
  <svg 
    className={className} 
    width={size} 
    height={size} 
    fill="none" 
    strokeWidth={2} 
    stroke="currentColor" 
    viewBox="0 0 24 24"
  >
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/>
    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/>
  </svg>
)

export const BarChartIcon = ({ className = "w-6 h-6", size }: IconProps) => (
  <svg 
    className={className} 
    width={size} 
    height={size} 
    fill="none" 
    strokeWidth={2} 
    stroke="currentColor" 
    viewBox="0 0 24 24"
  >
    <line x1="12" y1="20" x2="12" y2="10"/>
    <line x1="18" y1="20" x2="18" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="16"/>
  </svg>
)

export const UserIcon = ({ className = "w-6 h-6", size }: IconProps) => (
  <svg 
    className={className} 
    width={size} 
    height={size} 
    fill="none" 
    strokeWidth={2} 
    stroke="currentColor" 
    viewBox="0 0 24 24"
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
)

export const SparklesIcon = ({ className = "w-6 h-6", size }: IconProps) => (
  <svg 
    className={className} 
    width={size} 
    height={size} 
    fill="none" 
    strokeWidth={2} 
    stroke="currentColor" 
    viewBox="0 0 24 24"
  >
    <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .962 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.582a.5.5 0 0 1 0 .962L15.5 14.064a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.962 0z"/>
    <path d="M20 3v4"/>
    <path d="M22 5h-4"/>
    <path d="M4 17v2"/>
    <path d="M5 18H3"/>
  </svg>
)

export const BuildingIcon = ({ className = "w-6 h-6", size }: IconProps) => (
  <svg 
    className={className} 
    width={size} 
    height={size} 
    fill="none" 
    strokeWidth={2} 
    stroke="currentColor" 
    viewBox="0 0 24 24"
  >
    <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/>
    <path d="M6 12H4a2 2 0 0 0-2 2v8h4"/>
    <path d="M18 9h2a2 2 0 0 1 2 2v11h-4"/>
    <path d="M10 6h4"/>
    <path d="M10 10h4"/>
    <path d="M10 14h4"/>
    <path d="M10 18h4"/>
  </svg>
)

export const ConstructionIcon = ({ className = "w-6 h-6", size }: IconProps) => (
  <svg 
    className={className} 
    width={size} 
    height={size} 
    fill="none" 
    strokeWidth={2} 
    stroke="currentColor" 
    viewBox="0 0 24 24"
  >
    <rect x="2" y="6" width="20" height="8" rx="1"/>
    <path d="M17 14v7"/>
    <path d="M7 14v7"/>
    <path d="M17 3v3"/>
    <path d="M7 3v3"/>
    <path d="M10 14 2.3 6.3"/>
    <path d="m14 6 7.7 7.7"/>
    <path d="M8 6h8"/>
  </svg>
)