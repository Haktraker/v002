'use client';

import { useState } from 'react';
import { Threat } from './CyberThreatMap';
import { X } from 'lucide-react';

interface ThreatPanelProps {
  country: string;
  threats: Threat[];
  onClose: () => void;
}

export default function ThreatPanel({ country, threats, onClose }: ThreatPanelProps) {
  const [activeThreatType, setActiveThreatType] = useState<string | null>(null);

  // Calculate stats for this country
  const totalAttacks = threats.length;
  
  // Count threats by type
  const threatsByType = threats.reduce((acc, threat) => {
    acc[threat.type] = (acc[threat.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Get the top threat types
  const topThreatTypes = Object.entries(threatsByType)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  
  // Get the top source countries
  const sourceCountries = threats.reduce((acc, threat) => {
    acc[threat.sourceCountry] = (acc[threat.sourceCountry] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const topSourceCountries = Object.entries(sourceCountries)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30">
      <div className="bg-card/95 backdrop-blur-md border border-border rounded-lg shadow-2xl w-[500px] max-w-[90vw] max-h-[80vh] overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-border">
          <h2 className="text-xl font-bold">{country}</h2>
          <button 
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground rounded-full p-1 hover:bg-muted"
            aria-label="Close country panel"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onClose()}
          >
            <X size={18} />
          </button>
        </div>
        
        <div className="p-4">
          <div className="mb-6">
            <div className="text-sm text-muted-foreground mb-2">Total Attacks</div>
            <div className="text-3xl font-bold text-primary">{totalAttacks}</div>
          </div>
          
          <div className="mb-6">
            <div className="text-sm text-muted-foreground mb-2">Top Threat Types</div>
            <div className="space-y-2">
              {topThreatTypes.map(([type, count]) => (
                <div key={type} className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-2 bg-${getColorClass(type)}`}></div>
                    <div>{type}</div>
                  </div>
                  <div>{count}</div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="mb-6">
            <div className="text-sm text-muted-foreground mb-2">Top Source Countries</div>
            <div className="space-y-2">
              {topSourceCountries.map(([country, count]) => (
                <div key={country} className="flex justify-between items-center">
                  <div>{country}</div>
                  <div>{count}</div>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <div className="text-sm text-muted-foreground mb-2">Recent Attacks</div>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
              {threats.slice(-10).reverse().map(threat => (
                <div key={threat.id} className="bg-muted/40 p-2 rounded text-xs">
                  <div className="flex justify-between">
                    <span>Type: {threat.type}</span>
                    <span>{formatTime(threat.timestamp)}</span>
                  </div>
                  <div>From: {threat.sourceCountry}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="p-4 border-t border-border flex justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
            aria-label="Close panel"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onClose()}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper function to format time
function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return `${String(date.getUTCHours()).padStart(2, '0')}:${String(date.getUTCMinutes()).padStart(2, '0')}:${String(date.getUTCSeconds()).padStart(2, '0')}`;
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