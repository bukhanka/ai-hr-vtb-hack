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

export const EyeIcon = ({ className = "w-6 h-6", size }: IconProps) => (
  <svg 
    className={className} 
    width={size} 
    height={size} 
    fill="none" 
    strokeWidth={2} 
    stroke="currentColor" 
    viewBox="0 0 24 24"
  >
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
)

export const VideoIcon = ({ className = "w-6 h-6", size }: IconProps) => (
  <svg 
    className={className} 
    width={size} 
    height={size} 
    fill="none" 
    strokeWidth={2} 
    stroke="currentColor" 
    viewBox="0 0 24 24"
  >
    <path d="M16 10l-6-4v8l6-4z"/>
    <rect x="2" y="6" width="20" height="12" rx="2"/>
  </svg>
)

export const XMarkIcon = ({ className = "w-6 h-6", size }: IconProps) => (
  <svg 
    className={className} 
    width={size} 
    height={size} 
    fill="none" 
    strokeWidth={2} 
    stroke="currentColor" 
    viewBox="0 0 24 24"
  >
    <path d="M18 6L6 18"/>
    <path d="M6 6l12 12"/>
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

export const PlusIcon = ({ className = "w-6 h-6", size }: IconProps) => (
  <svg 
    className={className} 
    width={size} 
    height={size} 
    fill="none" 
    strokeWidth={2} 
    stroke="currentColor" 
    viewBox="0 0 24 24"
  >
    <path d="M5 12h14"/>
    <path d="M12 5v14"/>
  </svg>
)

export const EditIcon = ({ className = "w-6 h-6", size }: IconProps) => (
  <svg 
    className={className} 
    width={size} 
    height={size} 
    fill="none" 
    strokeWidth={2} 
    stroke="currentColor" 
    viewBox="0 0 24 24"
  >
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="m18.5 2.5 a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
)

export const TrashIcon = ({ className = "w-6 h-6", size }: IconProps) => (
  <svg 
    className={className} 
    width={size} 
    height={size} 
    fill="none" 
    strokeWidth={2} 
    stroke="currentColor" 
    viewBox="0 0 24 24"
  >
    <path d="m3 6 3 16 12 0 3-16"/>
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    <path d="m14 11 v6"/>
    <path d="m10 11 v6"/>
  </svg>
)

export const UploadIcon = ({ className = "w-6 h-6", size }: IconProps) => (
  <svg 
    className={className} 
    width={size} 
    height={size} 
    fill="none" 
    strokeWidth={2} 
    stroke="currentColor" 
    viewBox="0 0 24 24"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7,10 12,5 17,10"/>
    <line x1="12" x2="12" y1="15" y2="5"/>
  </svg>
)

export const DocumentIcon = ({ className = "w-6 h-6", size }: IconProps) => (
  <svg 
    className={className} 
    width={size} 
    height={size} 
    fill="none" 
    strokeWidth={2} 
    stroke="currentColor" 
    viewBox="0 0 24 24"
  >
    <path d="M14,2 L20,8 L20,20 A2,2 0 0,1 18,22 L6,22 A2,2 0 0,1 4,20 L4,4 A2,2 0 0,1 6,2 L14,2 Z"/>
    <polyline points="14,2 14,8 20,8"/>
    <line x1="16" x2="8" y1="13" y2="13"/>
    <line x1="16" x2="8" y1="17" y2="17"/>
    <polyline points="10,9 9,9 8,9"/>
  </svg>
)

export const MicrophoneIcon = ({ className = "w-6 h-6", size }: IconProps) => (
  <svg 
    className={className} 
    width={size} 
    height={size} 
    fill="none" 
    strokeWidth={2} 
    stroke="currentColor" 
    viewBox="0 0 24 24"
  >
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
    <line x1="12" x2="12" y1="19" y2="22"/>
  </svg>
)

export const PlayIcon = ({ className = "w-6 h-6", size }: IconProps) => (
  <svg 
    className={className} 
    width={size} 
    height={size} 
    fill="none" 
    strokeWidth={2} 
    stroke="currentColor" 
    viewBox="0 0 24 24"
  >
    <polygon points="5 3 19 12 5 21 5 3"/>
  </svg>
)

export const CheckCircleIcon = ({ className = "w-6 h-6", size }: IconProps) => (
  <svg 
    className={className} 
    width={size} 
    height={size} 
    fill="none" 
    strokeWidth={2} 
    stroke="currentColor" 
    viewBox="0 0 24 24"
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22,4 12,14.01 9,11.01"/>
  </svg>
)

export const CalendarIcon = ({ className = "w-6 h-6", size }: IconProps) => (
  <svg 
    className={className} 
    width={size} 
    height={size} 
    fill="none" 
    strokeWidth={2} 
    stroke="currentColor" 
    viewBox="0 0 24 24"
  >
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" x2="16" y1="2" y2="6"/>
    <line x1="8" x2="8" y1="2" y2="6"/>
    <line x1="3" x2="21" y1="10" y2="10"/>
  </svg>
)

export const ClockIcon = ({ className = "w-6 h-6", size }: IconProps) => (
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
    <polyline points="12,6 12,12 16,14"/>
  </svg>
)

export const ChartBarIcon = ({ className = "w-6 h-6", size }: IconProps) => (
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

export const LogInIcon = ({ className = "w-6 h-6", size }: IconProps) => (
  <svg 
    className={className} 
    width={size} 
    height={size} 
    fill="none" 
    strokeWidth={2} 
    stroke="currentColor" 
    viewBox="0 0 24 24"
  >
    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
    <polyline points="10,17 15,12 10,7"/>
    <line x1="15" x2="3" y1="12" y2="12"/>
  </svg>
)

export const LogoutIcon = ({ className = "w-6 h-6", size }: IconProps) => (
  <svg 
    className={className} 
    width={size} 
    height={size} 
    fill="none" 
    strokeWidth={2} 
    stroke="currentColor" 
    viewBox="0 0 24 24"
  >
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16,17 21,12 16,7"/>
    <line x1="21" x2="9" y1="12" y2="12"/>
  </svg>
)

export const ChevronLeftIcon = ({ className = "w-6 h-6", size }: IconProps) => (
  <svg 
    className={className} 
    width={size} 
    height={size} 
    fill="none" 
    strokeWidth={2} 
    stroke="currentColor" 
    viewBox="0 0 24 24"
  >
    <polyline points="15,18 9,12 15,6"/>
  </svg>
)

export const BriefcaseIcon = ({ className = "w-6 h-6", size }: IconProps) => (
  <svg 
    className={className} 
    width={size} 
    height={size} 
    fill="none" 
    strokeWidth={2} 
    stroke="currentColor" 
    viewBox="0 0 24 24"
  >
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
  </svg>
)

export const AcademicCapIcon = ({ className = "w-6 h-6", size }: IconProps) => (
  <svg 
    className={className} 
    width={size} 
    height={size} 
    fill="none" 
    strokeWidth={2} 
    stroke="currentColor" 
    viewBox="0 0 24 24"
  >
    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
    <path d="M6 12v5c3 3 9 3 12 0v-5"/>
  </svg>
)

export const CodeIcon = ({ className = "w-6 h-6", size }: IconProps) => (
  <svg 
    className={className} 
    width={size} 
    height={size} 
    fill="none" 
    strokeWidth={2} 
    stroke="currentColor" 
    viewBox="0 0 24 24"
  >
    <polyline points="16,18 22,12 16,6"/>
    <polyline points="8,6 2,12 8,18"/>
  </svg>
)

export const TrophyIcon = ({ className = "w-6 h-6", size }: IconProps) => (
  <svg 
    className={className} 
    width={size} 
    height={size} 
    fill="none" 
    strokeWidth={2} 
    stroke="currentColor" 
    viewBox="0 0 24 24"
  >
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
    <path d="M4 22h16"/>
    <path d="M10 14.66V17c0 .55.47.98.97 1.21C12.04 18.75 13 19.24 14 19.24c1 0 1.96-.49 2.03-1.03.03-.23.97-.66.97-1.21v-2.34c0-2.06-1.57-3.74-3.5-3.97L12 10l-1.5.69C8.57 10.92 7 12.6 7 14.66z"/>
  </svg>
)

export const GlobeIcon = ({ className = "w-6 h-6", size }: IconProps) => (
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
    <path d="m2 12 c 0 0 2 -8 10 -8 s 10 8 10 8"/>
    <path d="m2 12 c 0 0 2 8 10 8 s 10 -8 10 -8"/>
    <path d="M12 2v20"/>
  </svg>
)

export const CheckIcon = ({ className = "w-6 h-6", size }: IconProps) => (
  <svg 
    className={className} 
    width={size} 
    height={size} 
    fill="none" 
    strokeWidth={2} 
    stroke="currentColor" 
    viewBox="0 0 24 24"
  >
    <polyline points="20,6 9,17 4,12"/>
  </svg>
)