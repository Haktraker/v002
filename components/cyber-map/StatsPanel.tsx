'use client';

import { useState, useEffect } from 'react';

interface StatsPanelProps {
  mostAttackedCountry: string;
  typeCounts: Record<string, number>;
  totalThreats: number;
}

export default function StatsPanel({ mostAttackedCountry, typeCounts, totalThreats }: StatsPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [startTime] = useState(Date.now());
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const threatTypes = [
    { key: 'OAS', name: 'Online Attack Sites' },
    { key: 'ODS', name: 'Online Dangerous Sites' },
    { key: 'MAV', name: 'Malicious Activity' },
    { key: 'WAV', name: 'Web Attacks' },
    { key: 'IDS', name: 'Intrusion Detection' },
    { key: 'VUL', name: 'Vulnerabilities' },
    { key: 'KAS', name: 'Known Attack Sources' },
    { key: 'BAD', name: 'Botnet Activity' },
    { key: 'RMW', name: 'Ransomware' }
  ];

  return (
    <div className={`absolute z-10 ${isCollapsed ? 'bottom-4 left-4' : 'bottom-0 left-0'} transition-all duration-300`}>
      <div className="bg-card/80 backdrop-blur-md text-foreground dark:text-white border-t border-r border-border">
        {isCollapsed ? (
          <button 
            onClick={toggleCollapse}
            className="p-3 text-sm hover:bg-primary/10 transition-colors w-full text-left"
            aria-label="Expand statistics panel"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && toggleCollapse()}
          >
            Show Statistics
          </button>
        ) : (
          <div className="w-80 max-w-full">
            <button 
              onClick={toggleCollapse}
              className="p-2 text-sm hover:bg-primary/10 transition-colors w-full text-right"
              aria-label="Collapse statistics panel"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && toggleCollapse()}
            >
              Hide
            </button>
            
            <div className="p-4 border-t border-border/50">
              <div className="flex justify-between items-center mb-4">
                <div className="text-lg font-bold"># MOST-ATTACKED COUNTRY</div>
              </div>
              <div className="text-3xl font-bold text-primary mb-6">{mostAttackedCountry}</div>
              
              <div className="space-y-3">
                {threatTypes.map(type => (
                  <div key={type.key} className="flex justify-between">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-2 bg-${getColorClass(type.key)}`}></div>
                      <div className="font-bold">{type.key}</div>
                    </div>
                    <div>{typeCounts[type.key] || 0}</div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 text-center">
                <div className="text-sm text-muted-foreground">Detections discovered since {formatTime(startTime)}</div>
                <div className="text-2xl font-bold mt-2">{totalThreats}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function to format time as HH:MM GMT
function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return `${String(date.getUTCHours()).padStart(2, '0')}:${String(date.getUTCMinutes()).padStart(2, '0')} GMT`;
}

// Helper function to get a color class based on threat type
function getColorClass(type: string): string {
  const colors: Record<string, string> = {
    OAS: 'red-500',
    ODS: 'blue-500',
    MAV: 'yellow-500',
    WAV: 'green-500',
    IDS: 'purple-500',
    VUL: 'yellow-300',
    KAS: 'cyan-500',
    BAD: 'pink-500',
    RMW: 'indigo-500'
  };
  
  return colors[type] || 'gray-500';
} 