'use client';

import { useState } from 'react';

interface MapControlsProps {
  viewMode: 'globe' | 'plane';
  darkMode: boolean;
  demoMode: boolean;
  showCountryPanel: boolean;
  onToggleViewMode: () => void;
  onToggleColorMode: () => void;
  onToggleDemoMode: () => void;
  onToggleCountryPanel: () => void;
}

export default function MapControls({
  viewMode,
  darkMode,
  demoMode,
  showCountryPanel,
  onToggleViewMode,
  onToggleColorMode,
  onToggleDemoMode,
  onToggleCountryPanel
}: MapControlsProps) {
  const [isOpen, setIsOpen] = useState(true);

  const handleTogglePanel = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="absolute right-6 top-1/2 transform -translate-y-1/2 z-20">
      <div className="bg-black/70 rounded-lg border border-gray-700 shadow-lg">
        {isOpen ? (
          <div className="p-2 flex flex-col gap-3">
            <button 
              className="text-white hover:text-blue-400 flex items-center justify-between"
              onClick={onToggleCountryPanel}
              aria-label="Toggle country panel"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onToggleCountryPanel()}
            >
              <span className="text-sm font-medium">
                {showCountryPanel ? 'Hide country panel' : 'Show country panel'}
              </span>
            </button>

            <button 
              className="text-white hover:text-blue-400 flex items-center justify-between"
              onClick={onToggleViewMode}
              aria-label="Toggle view mode"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onToggleViewMode()}
            >
              <span className="text-sm font-medium">
                {viewMode === 'globe' ? 'Switch to Plane view' : 'Switch to Globe view'}
              </span>
            </button>

            <button 
              className="text-white hover:text-blue-400 flex items-center justify-between"
              onClick={onToggleColorMode}
              aria-label="Toggle color mode"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onToggleColorMode()}
            >
              <span className="text-sm font-medium">
                Toggle map Color
              </span>
            </button>

            <button
              className="text-white hover:text-blue-400 flex items-center justify-between"
              onClick={onToggleDemoMode}
              aria-label="Toggle demo mode"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onToggleDemoMode()}
            >
              <span className="text-sm font-medium">
                {demoMode ? 'Disable demo mode' : 'Enable demo mode'}
              </span>
            </button>

            <div className="flex justify-between gap-2">
              <button
                className="text-white hover:text-blue-400"
                aria-label="Zoom in"
                tabIndex={0}
              >
                <span className="text-sm font-medium">Zoom in</span>
              </button>

              <button
                className="text-white hover:text-blue-400"
                aria-label="Zoom out"
                tabIndex={0}
              >
                <span className="text-sm font-medium">Zoom out</span>
              </button>
            </div>

            <button
              className="text-white p-2 hover:text-blue-400 absolute -right-1 top-0 transform translate-x-full"
              onClick={handleTogglePanel}
              aria-label="Close controls panel"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleTogglePanel()}
            >
              <span>×</span>
            </button>
          </div>
        ) : (
          <button
            className="text-white p-2 hover:text-blue-400"
            onClick={handleTogglePanel}
            aria-label="Open controls panel"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleTogglePanel()}
          >
            <span>⚙️</span>
          </button>
        )}
      </div>
    </div>
  );
} 