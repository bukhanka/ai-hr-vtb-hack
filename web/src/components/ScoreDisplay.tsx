interface ScoreDisplayProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  label?: string;
  color?: 'primary' | 'success' | 'warning' | 'danger';
}

export function ScoreDisplay({ 
  score, 
  size = 'md', 
  showLabel = true,
  label = 'Балл',
  color = 'primary'
}: ScoreDisplayProps) {
  const getColorClasses = () => {
    switch (color) {
      case 'success':
        return 'from-green-500 to-green-600 text-green-700';
      case 'warning':
        return 'from-yellow-500 to-orange-500 text-orange-700';
      case 'danger':
        return 'from-red-500 to-red-600 text-red-700';
      default:
        return 'from-vtb-primary to-vtb-secondary text-vtb-primary';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          container: 'h-16 w-16',
          text: 'text-lg font-bold',
          label: 'text-xs',
          progress: 'h-2'
        };
      case 'lg':
        return {
          container: 'h-24 w-24',
          text: 'text-2xl font-bold',
          label: 'text-sm',
          progress: 'h-4'
        };
      default:
        return {
          container: 'h-20 w-20',
          text: 'text-xl font-bold',
          label: 'text-sm',
          progress: 'h-3'
        };
    }
  };

  const sizeClasses = getSizeClasses();
  const colorClasses = getColorClasses();

  return (
    <div className="flex flex-col items-center">
      {/* Circular Score Display */}
      <div className={`${sizeClasses.container} bg-gradient-to-br ${colorClasses} rounded-full flex items-center justify-center shadow-lg relative overflow-hidden`}>
        {/* Background Circle */}
        <div className="absolute inset-0 bg-white/20 rounded-full" />
        
        {/* Score Text */}
        <div className={`${sizeClasses.text} text-white relative z-10`}>
          {Math.round(score)}%
        </div>

        {/* Progress Ring - SVG approach for better precision */}
        <svg 
          className="absolute inset-0 w-full h-full -rotate-90" 
          viewBox="0 0 100 100"
        >
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="6"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="rgba(255,255,255,0.8)"
            strokeWidth="6"
            strokeDasharray={`${2 * Math.PI * 45 * (score / 100)} ${2 * Math.PI * 45}`}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
      </div>
      
      {/* Label */}
      {showLabel && (
        <span className={`${sizeClasses.label} text-vtb-text-secondary mt-2 text-center`}>
          {label}
        </span>
      )}
    </div>
  );
}

// Horizontal Bar Version
interface ScoreBarProps {
  score: number;
  maxScore?: number;
  label?: string;
  color?: 'primary' | 'success' | 'warning' | 'danger';
  height?: 'sm' | 'md' | 'lg';
  showPercentage?: boolean;
}

export function ScoreBar({ 
  score, 
  maxScore = 100,
  label,
  color = 'primary',
  height = 'md',
  showPercentage = true
}: ScoreBarProps) {
  const percentage = Math.min((score / maxScore) * 100, 100);

  const getColorClasses = () => {
    switch (color) {
      case 'success':
        return 'bg-gradient-to-r from-green-500 to-green-600';
      case 'warning':
        return 'bg-gradient-to-r from-yellow-500 to-orange-500';
      case 'danger':
        return 'bg-gradient-to-r from-red-500 to-red-600';
      default:
        return 'bg-gradient-to-r from-vtb-primary to-vtb-secondary';
    }
  };

  const getHeightClass = () => {
    switch (height) {
      case 'sm': return 'h-2';
      case 'lg': return 'h-4';
      default: return 'h-3';
    }
  };

  const heightClass = getHeightClass();
  const colorClasses = getColorClasses();

  return (
    <div className="w-full">
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-2">
          {label && (
            <span className="text-sm font-medium text-vtb-text">
              {label}
            </span>
          )}
          {showPercentage && (
            <span className="text-sm font-semibold text-vtb-text">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      
      <div className={`w-full bg-gray-200 rounded-full ${heightClass} overflow-hidden`}>
        <div
          className={`${heightClass} ${colorClasses} rounded-full transition-all duration-1000 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// Multi-Score Display
interface MultiScoreDisplayProps {
  scores: Array<{
    label: string;
    score: number;
    maxScore?: number;
    color?: 'primary' | 'success' | 'warning' | 'danger';
  }>;
}

export function MultiScoreDisplay({ scores }: MultiScoreDisplayProps) {
  return (
    <div className="space-y-4">
      {scores.map((item, index) => (
        <ScoreBar
          key={index}
          score={item.score}
          maxScore={item.maxScore}
          label={item.label}
          color={item.color}
          height="md"
          showPercentage={true}
        />
      ))}
    </div>
  );
}