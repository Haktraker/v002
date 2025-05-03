'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { generateDummyThreatData } from '@/lib/cyber-map/dummyData';
import MapControls from './MapControls';
import StatsPanel from './StatsPanel';
import ThreatPanel from './ThreatPanel';
import CountrySelector from './CountrySelector';
import { countryCoordinates } from '@/lib/cyber-map/dummyData';

// Dynamically import the Globe component to avoid SSR issues
const Globe = dynamic(() => import('./Globe'), { ssr: false });

// Types
export type ThreatType = 'OAS' | 'ODS' | 'MAV' | 'WAV' | 'IDS' | 'VUL' | 'KAS' | 'BAD' | 'RMW';
export type ViewMode = 'MAP' | 'STATISTICS' | 'DATA_SOURCES' | 'BUZZ' | 'WIDGET';

export interface Threat {
  id: string;
  sourceCountry: string;
  sourceCoordinates: [number, number];
  targetCountry: string;
  targetCoordinates: [number, number];
  type: ThreatType;
  timestamp: number;
}

export default function CyberThreatMap() {
  const [threatData, setThreatData] = useState<Threat[]>([]);
  const [viewMode, setViewMode] = useState<'globe' | 'plane'>('globe');
  const [darkMode, setDarkMode] = useState(true);
  const [demoMode, setDemoMode] = useState(true);
  const [showCountryPanel, setShowCountryPanel] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [filteredThreats, setFilteredThreats] = useState<Threat[]>([]);
  const [currentView, setCurrentView] = useState<ViewMode>('MAP');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Generate new threats periodically
  useEffect(() => {
    if (demoMode) {
      // Initialize with some data
      setThreatData(generateDummyThreatData(50));
      
      // Add new threats every second
      intervalRef.current = setInterval(() => {
        setThreatData(prev => {
          const newThreats = generateDummyThreatData(Math.floor(Math.random() * 3) + 1);
          return [...prev.slice(-100), ...newThreats]; // Keep only the last 100 threats
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [demoMode]);

  // Filter threats based on selected country
  useEffect(() => {
    if (selectedCountry) {
      setFilteredThreats(
        threatData.filter(
          threat => 
            threat.sourceCountry === selectedCountry || 
            threat.targetCountry === selectedCountry
        )
      );
    } else {
      setFilteredThreats(threatData);
    }
  }, [threatData, selectedCountry]);

  // Calculate stats
  const countryAttacks = filteredThreats.reduce((acc, threat) => {
    acc[threat.targetCountry] = (acc[threat.targetCountry] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const mostAttackedCountry = Object.entries(countryAttacks)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

  const typeCounts = filteredThreats.reduce((acc, threat) => {
    acc[threat.type] = (acc[threat.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const handleCountryClick = (countryName: string) => {
    setSelectedCountry(countryName);
    setShowCountryPanel(true);
  };

  const handleCountrySelect = (country: string | null) => {
    setSelectedCountry(country);
    if (country) {
      setShowCountryPanel(true);
    } else {
      setShowCountryPanel(false);
    }
  };

  const toggleDemoMode = () => {
    setDemoMode(!demoMode);
  };

  const toggleViewMode = () => {
    setViewMode(prev => prev === 'globe' ? 'plane' : 'globe');
  };

  const toggleColorMode = () => {
    setDarkMode(!darkMode);
  };

  const handleViewChange = (view: ViewMode) => {
    setCurrentView(view);
  };

  // Statistics View Component
  const StatisticsView = () => {
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
    
    const topAttackedCountries = Object.entries(countryAttacks)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    
    const totalAttacks = filteredThreats.length;
    
    return (
      <div className="p-8 pt-20 w-full max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold mb-8 text-primary">Global Threat Statistics</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-card p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4">Top Attacked Countries</h3>
            <div className="space-y-3">
              {topAttackedCountries.map(([country, count], index) => (
                <div key={country} className="flex justify-between items-center">
                  <div className="flex items-center">
                    <span className="text-primary font-bold mr-2">#{index + 1}</span>
                    <span>{country}</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-32 bg-muted h-2 rounded-full mr-2 overflow-hidden">
                      <div 
                        className="bg-primary h-full rounded-full" 
                        style={{ width: `${(count / (topAttackedCountries[0]?.[1] || 1)) * 100}%` }}
                      ></div>
                    </div>
                    <span className="font-mono">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-card p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4">Threat Types Distribution</h3>
            <div className="space-y-3">
              {threatTypes.map(type => {
                const count = typeCounts[type.key] || 0;
                const percentage = totalAttacks ? Math.round((count / totalAttacks) * 100) : 0;
                
                return (
                  <div key={type.key} className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-2 bg-${getColorClass(type.key)}`}></div>
                      <span className="mr-1">{type.key}</span>
                      <span className="text-muted-foreground text-xs">({type.name})</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-24 bg-muted h-2 rounded-full mr-2 overflow-hidden">
                        <div 
                          className={`bg-${getColorClass(type.key)} h-full rounded-full`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm">{count} ({percentage}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="bg-card p-6 rounded-lg shadow-md md:col-span-2">
            <h3 className="text-xl font-semibold mb-4">Attack Timeline</h3>
            <div className="h-64 flex items-end space-x-1">
              {Array.from({ length: 24 }).map((_, i) => {
                const height = Math.floor(Math.random() * 80) + 20;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center">
                    <div 
                      className="w-full bg-primary/80 rounded-t" 
                      style={{ height: `${height}%` }}
                    ></div>
                    <span className="text-xs mt-1">{i}h</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Data Sources View Component
  const DataSourcesView = () => {
    const dataSources = [
      { 
        name: 'Threat Intelligence Feeds', 
        description: 'Real-time feeds from global security networks that track known malicious IPs and domains.',
        count: 14,
        lastUpdated: '2 minutes ago'
      },
      { 
        name: 'Honeypot Networks', 
        description: 'Decoy systems designed to attract and detect attackers, revealing their techniques.',
        count: 48,
        lastUpdated: '5 minutes ago'
      },
      { 
        name: 'Malware Analysis', 
        description: 'Automated and manual analysis of malware samples to identify threat signatures.',
        count: 123,
        lastUpdated: '15 minutes ago'
      },
      { 
        name: 'Dark Web Monitoring', 
        description: 'Surveillance of dark web forums and marketplaces to detect emerging threats.',
        count: 8,
        lastUpdated: '30 minutes ago'
      },
      { 
        name: 'Security Researcher Network', 
        description: 'Community of security researchers sharing discoveries and insights.',
        count: 56,
        lastUpdated: '1 hour ago'
      },
      { 
        name: 'Partner Security Vendors', 
        description: 'Data sharing agreements with leading security vendors for broader threat coverage.',
        count: 17,
        lastUpdated: '2 hours ago'
      }
    ];
    
    return (
      <div className="p-8 pt-20 w-full max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold mb-8 text-primary">Data Sources</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {dataSources.map(source => (
            <div key={source.name} className="bg-card p-6 rounded-lg shadow-md border border-border">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-xl font-semibold">{source.name}</h3>
                <span className="text-xs text-muted-foreground">Updated {source.lastUpdated}</span>
              </div>
              <p className="text-muted-foreground mb-4">{source.description}</p>
              <div className="flex justify-between items-center text-sm">
                <span className="bg-primary/10 text-primary px-3 py-1 rounded-full">
                  {source.count} active feeds
                </span>
                <button className="text-primary hover:underline">
                  View details
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  // Buzz View Component
  const BuzzView = () => {
    const buzzItems = [
      {
        title: 'New Ransomware Variant Targeting Financial Sector',
        description: 'Security researchers have identified a sophisticated ransomware strain specifically targeting banking infrastructure.',
        category: 'Ransomware',
        severity: 'High',
        timestamp: '2 hours ago'
      },
      {
        title: 'Critical Zero-Day Vulnerability in Popular CMS',
        description: 'A severe vulnerability allowing remote code execution has been discovered in a widely-used content management system.',
        category: 'Vulnerability',
        severity: 'Critical',
        timestamp: '5 hours ago'
      },
      {
        title: 'State-Sponsored APT Group Expanding Operations',
        description: 'Intelligence reports indicate increased activity from a nation-state threat actor targeting critical infrastructure.',
        category: 'APT',
        severity: 'High',
        timestamp: '12 hours ago'
      },
      {
        title: 'New Phishing Campaign Impersonating Major Cloud Provider',
        description: 'A sophisticated phishing operation mimicking a major cloud service provider is targeting enterprise users.',
        category: 'Phishing',
        severity: 'Medium',
        timestamp: '1 day ago'
      },
      {
        title: 'IoT Botnet Activity Surges in Southeast Asia',
        description: 'Security firms report a significant increase in IoT device compromise attempts originating from multiple regions.',
        category: 'Botnet',
        severity: 'Medium',
        timestamp: '2 days ago'
      }
    ];
    
    const getSeverityColor = (severity: string) => {
      switch(severity) {
        case 'Critical': return 'text-red-500 bg-red-500/10';
        case 'High': return 'text-orange-500 bg-orange-500/10';
        case 'Medium': return 'text-yellow-500 bg-yellow-500/10';
        case 'Low': return 'text-green-500 bg-green-500/10';
        default: return 'text-blue-500 bg-blue-500/10';
      }
    };
    
    return (
      <div className="p-8 pt-20 w-full max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold mb-8 text-primary">Cybersecurity Buzz</h2>
        
        <div className="space-y-6">
          {buzzItems.map(item => (
            <div key={item.title} className="bg-card p-6 rounded-lg shadow-md border border-border">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-semibold">{item.title}</h3>
                <span className="text-xs text-muted-foreground">{item.timestamp}</span>
              </div>
              <p className="text-muted-foreground mb-4">{item.description}</p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 rounded-full text-sm bg-primary/10 text-primary">
                  {item.category}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm ${getSeverityColor(item.severity)}`}>
                  {item.severity} Severity
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  // Widget View Component
  const WidgetView = () => {
    return (
      <div className="p-8 pt-20 w-full max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold mb-8 text-primary">Widget Embedding</h2>
        
        <div className="bg-card p-6 rounded-lg shadow-md mb-8">
          <h3 className="text-xl font-semibold mb-4">Embed the Cyberthreat Map on Your Website</h3>
          <p className="text-muted-foreground mb-6">
            Add real-time threat visualization to your own website by embedding our interactive cyberthreat map.
            Copy the code below and paste it into your HTML.
          </p>
          
          <div className="bg-muted p-4 rounded-md font-mono text-sm mb-6 overflow-x-auto">
            {'<iframe src="https://yourdomain.com/embed/cyber-map" width="100%" height="500" frameborder="0"></iframe>'}
          </div>
          
          <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md">
            Copy Embed Code
          </button>
        </div>
        
        <div className="bg-card p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4">Customization Options</h3>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Map Size</h4>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input type="radio" name="size" className="mr-2" defaultChecked />
                  <span>Default</span>
                </label>
                <label className="flex items-center">
                  <input type="radio" name="size" className="mr-2" />
                  <span>Large</span>
                </label>
                <label className="flex items-center">
                  <input type="radio" name="size" className="mr-2" />
                  <span>Custom</span>
                </label>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Theme</h4>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input type="radio" name="theme" className="mr-2" />
                  <span>Light</span>
                </label>
                <label className="flex items-center">
                  <input type="radio" name="theme" className="mr-2" defaultChecked />
                  <span>Dark</span>
                </label>
                <label className="flex items-center">
                  <input type="radio" name="theme" className="mr-2" />
                  <span>Auto</span>
                </label>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Show Controls</h4>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" defaultChecked />
                  <span>Enable controls</span>
                </label>
              </div>
            </div>
          </div>
          
          <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md mt-6">
            Generate Custom Code
          </button>
        </div>
      </div>
    );
  };

  const renderView = () => {
    switch(currentView) {
      case 'STATISTICS':
        return <StatisticsView />;
      case 'DATA_SOURCES':
        return <DataSourcesView />;
      case 'BUZZ':
        return <BuzzView />;
      case 'WIDGET':
        return <WidgetView />;
      case 'MAP':
      default:
        return (
          <>
            <Globe 
              threats={filteredThreats}
              viewMode={viewMode}
              darkMode={darkMode}
              onCountryClick={handleCountryClick}
              selectedCountry={selectedCountry}
            />
            {/* Country Selector */}
            <div className="absolute top-16 left-4 z-10 w-64">
              <CountrySelector 
                countries={Object.keys(countryCoordinates)}
                selectedCountry={selectedCountry}
                onSelectCountry={handleCountrySelect}
              />
            </div>
            {/* Controls */}
            <MapControls 
              viewMode={viewMode}
              darkMode={darkMode}
              demoMode={demoMode}
              showCountryPanel={showCountryPanel}
              onToggleViewMode={toggleViewMode}
              onToggleColorMode={toggleColorMode}
              onToggleDemoMode={toggleDemoMode}
              onToggleCountryPanel={() => setShowCountryPanel(!showCountryPanel)}
            />
            {/* Statistics Panel */}
            <StatsPanel 
              mostAttackedCountry={mostAttackedCountry}
              typeCounts={typeCounts}
              totalThreats={filteredThreats.length}
            />
            {/* Country panel */}
            {showCountryPanel && selectedCountry && (
              <ThreatPanel
                country={selectedCountry}
                threats={filteredThreats.filter(t => t.targetCountry === selectedCountry || t.sourceCountry === selectedCountry)}
                onClose={() => {
                  setShowCountryPanel(false);
                  if (selectedCountry) {
                    setSelectedCountry(null);
                  }
                }}
              />
            )}
          </>
        );
    }
  };

  return (
    <div className="w-full h-screen bg-background dark:bg-background relative text-foreground dark:text-white overflow-hidden">
      {/* Header */}
      <div className="absolute top-0 left-0 w-full flex justify-between items-center p-4 z-10 bg-background/70 dark:bg-background/70 backdrop-blur-sm">
        <div className="text-2xl font-bold text-primary">CYBERTHREAT LIVE MAP</div>
        <div className="flex space-x-4">
          <button 
            className={`px-3 py-1 rounded ${currentView === 'MAP' ? 'bg-primary text-primary-foreground' : 'hover:bg-primary/20'}`}
            onClick={() => handleViewChange('MAP')}
          >
            MAP
          </button>
          <button 
            className={`px-3 py-1 rounded ${currentView === 'STATISTICS' ? 'bg-primary text-primary-foreground' : 'hover:bg-primary/20'}`}
            onClick={() => handleViewChange('STATISTICS')}
          >
            STATISTICS
          </button>
          <button 
            className={`px-3 py-1 rounded ${currentView === 'DATA_SOURCES' ? 'bg-primary text-primary-foreground' : 'hover:bg-primary/20'}`}
            onClick={() => handleViewChange('DATA_SOURCES')}
          >
            DATA SOURCES
          </button>
          <button 
            className={`px-3 py-1 rounded ${currentView === 'BUZZ' ? 'bg-primary text-primary-foreground' : 'hover:bg-primary/20'}`}
            onClick={() => handleViewChange('BUZZ')}
          >
            BUZZ
          </button>
          <button 
            className={`px-3 py-1 rounded ${currentView === 'WIDGET' ? 'bg-primary text-primary-foreground' : 'hover:bg-primary/20'}`}
            onClick={() => handleViewChange('WIDGET')}
          >
            WIDGET
          </button>
        </div>
      </div>

      {/* Main Content */}
      {renderView()}
    </div>
  );
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