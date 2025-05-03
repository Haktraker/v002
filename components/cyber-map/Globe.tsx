'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { Threat } from './CyberThreatMap';

interface GlobeProps {
  threats: Threat[];
  viewMode: 'globe' | 'plane';
  darkMode: boolean;
  selectedCountry: string | null;
  onCountryClick: (countryName: string) => void;
}

// A set of vibrant colors to randomly select from
const vibrantColors = [
  'rgba(255, 0, 0, 0.8)',      // Red
  'rgba(0, 0, 255, 0.8)',      // Blue
  'rgba(0, 255, 0, 0.8)',      // Green
  'rgba(255, 165, 0, 0.8)',    // Orange
  'rgba(255, 0, 255, 0.8)',    // Magenta
  'rgba(0, 255, 255, 0.8)',    // Cyan
  'rgba(255, 255, 0, 0.8)',    // Yellow
  'rgba(128, 0, 128, 0.8)',    // Purple
  'rgba(255, 105, 180, 0.8)',  // Hot Pink
  'rgba(0, 191, 255, 0.8)',    // Deep Sky Blue
  'rgba(50, 205, 50, 0.8)',    // Lime Green
  'rgba(255, 69, 0, 0.8)',     // Orange Red
  'rgba(0, 128, 128, 0.8)',    // Teal
  'rgba(138, 43, 226, 0.8)',   // Blue Violet
  'rgba(255, 215, 0, 0.8)',    // Gold
];

export default function Globe({ 
  threats, 
  viewMode, 
  darkMode, 
  selectedCountry,
  onCountryClick 
}: GlobeProps) {
  // Using any type for the ref since the globe.gl typing is incomplete
  const globeEl = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [countries, setCountries] = useState<any[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [arcColors, setArcColors] = useState<Record<string, string>>({});

  // Generate random colors for each threat when the threats array changes
  useEffect(() => {
    const newArcColors = { ...arcColors };
    
    threats.forEach(threat => {
      if (!newArcColors[threat.id]) {
        // Assign a random color from the vibrant colors array
        const randomColorIndex = Math.floor(Math.random() * vibrantColors.length);
        newArcColors[threat.id] = vibrantColors[randomColorIndex];
      }
    });
    
    setArcColors(newArcColors);
  }, [threats]);

  // Dynamically import globe.gl (which is client-side only)
  useEffect(() => {
    let isMounted = true;
    
    const initGlobe = async () => {
      try {
        // Dynamically import globe.gl
        const globeGl = await import('globe.gl');
        // @ts-ignore - TypeScript doesn't understand the globe.gl module structure
        const GlobeInstance = globeGl.default;
        
        if (!isMounted || !containerRef.current) return;
        
        // Create a new Globe instance
        // @ts-ignore - The globe.gl API doesn't match TypeScript expectations
        const globe = GlobeInstance()
          .backgroundColor(darkMode ? 'rgba(0,0,0,0)' : 'rgba(255,255,255,0)')
          .showGlobe(true)
          .showAtmosphere(true)
          .atmosphereColor(darkMode ? 'rgba(50, 50, 200, 0.7)' : 'rgba(65, 148, 217, 0.7)')
          .globeImageUrl('/earth-blue-marble.jpg')
          .arcColor((arc: any) => arc.color)  // Use arc's assigned color
          .arcStroke(0.5)
          .arcDashLength(0.4)
          .arcDashGap(0.2)
          .arcDashAnimateTime(1500)
          .arcsTransitionDuration(200)
          .arcAltitude(0.3)
          .pointColor((point: any) => point.color)  // Use point's assigned color
          .pointAltitude(0.02)
          .pointRadius(0.25)
          .hexPolygonsData([])
          .hexPolygonResolution(3)
          .hexPolygonMargin(0.7)
          .hexPolygonColor((polygon: any) => {
            if (selectedCountry && polygon.properties && polygon.properties.ADMIN === selectedCountry) {
              return darkMode ? 'rgba(70, 150, 240, 0.9)' : 'rgba(255, 100, 50, 0.9)';
            }
            return darkMode ? 'rgba(0, 70, 150, 0.6)' : 'rgba(200, 70, 30, 0.6)';
          })
          .onHexPolygonClick((polygon: any) => {
            if (polygon.properties && polygon.properties.ADMIN) {
              onCountryClick(polygon.properties.ADMIN);
            }
          });

        // Append to container
        if (containerRef.current) {
          // Clear previous instances
          while (containerRef.current.firstChild) {
            containerRef.current.removeChild(containerRef.current.firstChild);
          }
          
          // Mount the globe to the DOM
          // @ts-ignore - The types for globe.gl are not complete
          globe(containerRef.current);
          globeEl.current = globe;
        }
        
        // Load country data
        const fetchCountries = async () => {
          try {
            const response = await fetch('/countries.geojson');
            let countriesData: any[] = [];
            
            if (!response.ok) {
              // If file doesn't exist, use a CDN source
              try {
                const cdnResponse = await fetch('https://unpkg.com/world-atlas@2.0.2/countries-110m.json');
                if (cdnResponse.ok) {
                  const data = await cdnResponse.json();
                  countriesData = data.features || [];
                }
              } catch (err) {
                console.error('Error fetching from CDN:', err);
                countriesData = [];
              }
            } else {
              const data = await response.json();
              countriesData = data.features || [];
            }
            
            if (isMounted) {
              setCountries(countriesData);
              if (globe && countriesData.length > 0) {
                globe.hexPolygonsData(countriesData);
              }
            }
          } catch (error) {
            console.error('Error fetching country data:', error);
            // Fallback to empty data
            if (isMounted) {
              setCountries([]);
              globe.hexPolygonsData([]);
            }
          }
        };
        
        await fetchCountries();
        if (isMounted) {
          setInitialized(true);
        }
      } catch (error) {
        console.error('Error initializing globe:', error);
      }
    };

    if (!initialized) {
      initGlobe();
    }
    
    return () => {
      isMounted = false;
    };
  }, [darkMode, initialized, onCountryClick, selectedCountry]);

  // Update globe with new threat data and view mode
  useEffect(() => {
    if (!globeEl.current || !initialized) return;

    // Create arc data from threats
    const arcsData = threats.map(threat => ({
      startLat: threat.sourceCoordinates[0],
      startLng: threat.sourceCoordinates[1],
      endLat: threat.targetCoordinates[0],
      endLng: threat.targetCoordinates[1],
      color: arcColors[threat.id] || getRandomColor(), // Use stored color or generate a new one
      id: threat.id
    }));
    
    // Update arcs
    globeEl.current.arcsData(arcsData);
    
    // Add points at the target locations
    const pointsData = threats.map(threat => ({
      lat: threat.targetCoordinates[0],
      lng: threat.targetCoordinates[1],
      color: arcColors[threat.id] || getRandomColor(), // Use the same color as the arc
      id: threat.id
    }));
    
    globeEl.current.pointsData(pointsData);
    
    // Toggle between globe and plane view
    if (globeEl.current.toggleGlobeProjection) {
      globeEl.current.globeImageUrl('/earth-blue-marble.jpg');
      globeEl.current.toggleGlobeProjection(viewMode === 'globe');
    }
    
  }, [threats, viewMode, darkMode, initialized, arcColors]);

  // Update the polygon colors when selected country changes
  useEffect(() => {
    if (!globeEl.current || !initialized || !countries || countries.length === 0) return;
    
    try {
      // Re-set the hex polygons to trigger re-coloring
      globeEl.current.hexPolygonsData([...countries]);
      
      // If a country is selected, focus the camera on that country
      if (selectedCountry && globeEl.current.pointOfView) {
        const selectedCountryData = countries.find(
          (c: any) => c && c.properties && c.properties.ADMIN === selectedCountry
        );
        
        if (selectedCountryData && selectedCountryData.geometry) {
          // Calculate centroid of country polygon
          const coords = selectedCountryData.geometry.coordinates;
          let lat = 0, lng = 0, count = 0;
          
          try {
            // Handle different geometry types
            if (selectedCountryData.geometry.type === 'Polygon' && coords && coords[0]) {
              coords[0].forEach((coord: number[]) => {
                if (coord && coord.length >= 2) {
                  lng += coord[0];
                  lat += coord[1];
                  count++;
                }
              });
            } else if (selectedCountryData.geometry.type === 'MultiPolygon' && coords) {
              coords.forEach((poly: number[][][]) => {
                if (poly && poly[0]) {
                  poly[0].forEach((coord: number[]) => {
                    if (coord && coord.length >= 2) {
                      lng += coord[0];
                      lat += coord[1];
                      count++;
                    }
                  });
                }
              });
            }
            
            if (count > 0) {
              // Focus camera on country
              globeEl.current.pointOfView({
                lat: lat / count,
                lng: lng / count,
                altitude: 1.5
              }, 1000); // duration in ms
            }
          } catch (err) {
            console.error('Error calculating country centroid:', err);
          }
        }
      }
    } catch (err) {
      console.error('Error updating polygons:', err);
    }
  }, [selectedCountry, countries, initialized]);

  // Update globe style based on dark mode
  useEffect(() => {
    if (!globeEl.current || !initialized) return;
    
    globeEl.current.backgroundColor(darkMode ? 'rgba(0,0,0,0)' : 'rgba(255,255,255,0)');
    globeEl.current.atmosphereColor(darkMode ? 'rgba(50, 50, 200, 0.7)' : 'rgba(65, 148, 217, 0.7)');
  }, [darkMode, initialized]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (globeEl.current) {
        globeEl.current.width(window.innerWidth);
        globeEl.current.height(window.innerHeight);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return <div ref={containerRef} className="w-full h-full" />;
}

// Helper function to generate a random color
function getRandomColor(): string {
  const randomIndex = Math.floor(Math.random() * vibrantColors.length);
  return vibrantColors[randomIndex];
}

// Original threat type color function kept for reference
function getColorForThreatType(type: string, darkMode: boolean): string {
  const colors = {
    OAS: darkMode ? 'rgba(255, 69, 0, 0.8)' : 'rgba(255, 0, 0, 0.8)',
    ODS: darkMode ? 'rgba(0, 170, 255, 0.8)' : 'rgba(0, 0, 255, 0.8)',
    MAV: darkMode ? 'rgba(255, 170, 0, 0.8)' : 'rgba(255, 153, 0, 0.8)',
    WAV: darkMode ? 'rgba(0, 255, 0, 0.8)' : 'rgba(0, 204, 0, 0.8)',
    IDS: darkMode ? 'rgba(255, 0, 255, 0.8)' : 'rgba(204, 0, 204, 0.8)',
    VUL: darkMode ? 'rgba(255, 255, 0, 0.8)' : 'rgba(204, 204, 0, 0.8)',
    KAS: darkMode ? 'rgba(0, 255, 255, 0.8)' : 'rgba(0, 204, 204, 0.8)',
    BAD: darkMode ? 'rgba(255, 0, 119, 0.8)' : 'rgba(204, 0, 102, 0.8)',
    RMW: darkMode ? 'rgba(119, 0, 255, 0.8)' : 'rgba(102, 0, 204, 0.8)'
  };
  
  return colors[type as keyof typeof colors] || (darkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)');
} 