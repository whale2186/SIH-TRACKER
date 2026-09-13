export interface CompetitionThresholds {
  low: number;
  medium: number;
  high: number;
  veryHigh: number;
}

export const DEFAULT_THRESHOLDS: CompetitionThresholds = {
  low: 0,
  medium: 100,
  high: 250,
  veryHigh: 500,
};

export function getCompetitionLevel(count: number, thresholds: CompetitionThresholds = DEFAULT_THRESHOLDS): string {
  if (count >= thresholds.veryHigh) return 'Very High';
  if (count >= thresholds.high) return 'High';
  if (count >= thresholds.medium) return 'Medium';
  return 'Low';
}

export function getCompetitionColor(level: string): string {
  switch (level) {
    case 'Very High': return 'text-red-700 bg-red-50 border-red-200';
    case 'High': return 'text-orange-700 bg-orange-50 border-orange-200';
    case 'Medium': return 'text-yellow-700 bg-yellow-50 border-yellow-200';
    case 'Low': return 'text-green-700 bg-green-50 border-green-200';
    default: return 'text-gray-700 bg-gray-50 border-gray-200';
  }
}

export function getCompetitionBadgeColor(level: string): string {
  switch (level) {
    case 'Very High': return 'bg-red-100 text-red-800';
    case 'High': return 'bg-orange-100 text-orange-800';
    case 'Medium': return 'bg-yellow-100 text-yellow-800';
    case 'Low': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}
