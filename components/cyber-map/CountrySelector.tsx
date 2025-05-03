'use client';

import { useState, useEffect, useRef } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';

interface CountrySelectorProps {
  countries: string[];
  selectedCountry: string | null;
  onSelectCountry: (country: string | null) => void;
}

export default function CountrySelector({ 
  countries, 
  selectedCountry, 
  onSelectCountry 
}: CountrySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Filter countries based on search term
  const filteredCountries = countries.filter(country => 
    country.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort();
  
  const handleToggle = () => {
    setIsOpen(!isOpen);
  };
  
  const handleSelect = (country: string) => {
    onSelectCountry(country);
    setIsOpen(false);
    setSearchTerm('');
  };
  
  const handleClear = () => {
    onSelectCountry(null);
    setSearchTerm('');
  };
  
  return (
    <div ref={dropdownRef} className="relative">
      <div className="bg-card dark:bg-card border border-border rounded-md shadow-md">
        <div 
          className="flex items-center justify-between p-2 cursor-pointer"
          onClick={handleToggle}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleToggle()}
        >
          <div className="flex-1">
            {selectedCountry ? (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{selectedCountry}</span>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClear();
                  }}
                  className="ml-2 text-muted-foreground hover:text-foreground"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">Select a country</span>
            )}
          </div>
          <ChevronDown 
            size={16} 
            className={`ml-2 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
        
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-card dark:bg-card border border-border rounded-md shadow-lg z-50">
            <div className="p-2">
              <input
                type="text"
                placeholder="Search countries..."
                className="w-full px-3 py-2 text-sm bg-background dark:bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
            </div>
            <ul 
              className="max-h-60 overflow-auto py-1"
              role="listbox"
            >
              {filteredCountries.length > 0 ? (
                filteredCountries.map(country => (
                  <li
                    key={country}
                    className={`px-3 py-2 text-sm cursor-pointer hover:bg-muted flex items-center justify-between ${
                      selectedCountry === country ? 'bg-primary/10 text-primary' : ''
                    }`}
                    onClick={() => handleSelect(country)}
                    role="option"
                    aria-selected={selectedCountry === country}
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && handleSelect(country)}
                  >
                    {country}
                    {selectedCountry === country && <Check size={16} className="text-primary" />}
                  </li>
                ))
              ) : (
                <li className="px-3 py-2 text-sm text-muted-foreground">No countries found</li>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
} 