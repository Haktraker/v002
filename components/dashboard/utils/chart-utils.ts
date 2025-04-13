// --- Types ---
export interface SeverityCount {
  severity: string;
  count: number;
}

export interface BusinessUnit {
  buName: string;
  severities?: SeverityCount[];
}

export interface UserRiskDistributionInput {
  bu?: BusinessUnit[] | null;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  color?: string;
}

// --- Constants ---
export const SEVERITY_ORDER = ['Critical', 'High', 'Medium', 'Low'] as const;
export type SeverityType = typeof SEVERITY_ORDER[number];

// --- Chart Colors ---
export const CHART_COLORS = {
  primary: 'hsl(var(--primary))',
  secondary: 'hsl(var(--secondary))',
  accent: 'hsl(var(--accent))',
  fallback: {
    emerald: '#10B981',
    blue: '#3B82F6',
    amber: '#F59E0B',
    violet: '#8B5CF6',
    pink: '#EC4899'
  }
};

// --- Helper Functions ---
/**
 * Safely gets the count for a specific severity, handling missing or invalid data.
 */
export const getSeverityCount = (severities: SeverityCount[] | undefined | null, targetSeverity: string): number => {
  if (!Array.isArray(severities)) return 0;
  
  const severityEntry = severities.find(
    (s) => s?.severity?.toLowerCase() === targetSeverity.toLowerCase()
  );
  
  const count = severityEntry?.count;
  return (typeof count === 'number' && Number.isFinite(count)) ? count : 0;
};

/**
 * Transforms raw user risk distribution data into ApexCharts series format.
 */
export const transformUserRiskData = (data: UserRiskDistributionInput[] | undefined) => {
  if (!Array.isArray(data) || data.length === 0) return [];

  const countsByBu: Record<string, Record<string, number>> = {};
  let unknownBuIndex = 1;

  data.forEach(entry => {
    if (entry?.bu?.[0]) {
      const businessUnit = entry.bu[0];
      const buName = (typeof businessUnit.buName === 'string' && businessUnit.buName.trim())
        ? businessUnit.buName.trim()
        : `Unknown BU ${unknownBuIndex++}`;

      if (!countsByBu[buName]) countsByBu[buName] = {};

      SEVERITY_ORDER.forEach(severity => {
        countsByBu[buName][severity] = getSeverityCount(businessUnit.severities, severity);
      });
    }
  });

  return Object.entries(countsByBu).map(([buName, severityCounts]) => ({
    name: buName,
    data: SEVERITY_ORDER.map(severity => severityCounts[severity] ?? 0),
  }));
};

/**
 * Generates theme-aware chart options for ApexCharts.
 */
export const getChartThemeOptions = (isDark: boolean) => ({
  colors: Object.values(CHART_COLORS.fallback),
  theme: {
    mode: isDark ? 'dark' : 'light',
  },
  grid: {
    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
  },
  labels: {
    style: {
      colors: isDark ? '#A1A1AA' : '#52525B',
    },
  },
});