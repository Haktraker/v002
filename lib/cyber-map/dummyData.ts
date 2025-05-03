import { v4 as uuidv4 } from 'uuid';
import { Threat, ThreatType } from '@/components/cyber-map/CyberThreatMap';

// Country coordinates data (latitude, longitude)
export const countryCoordinates: Record<string, [number, number]> = {
  'United States': [37.0902, -95.7129],
  'Russia': [61.5240, 105.3188],
  'China': [35.8617, 104.1954],
  'Brazil': [-14.2350, -51.9253],
  'India': [20.5937, 78.9629],
  'Germany': [51.1657, 10.4515],
  'United Kingdom': [55.3781, -3.4360],
  'Japan': [36.2048, 138.2529],
  'France': [46.2276, 2.2137],
  'Italy': [41.8719, 12.5674],
  'Canada': [56.1304, -106.3468],
  'Australia': [-25.2744, 133.7751],
  'South Korea': [35.9078, 127.7669],
  'Spain': [40.4637, -3.7492],
  'Mexico': [23.6345, -102.5528],
  'Indonesia': [-0.7893, 113.9213],
  'Netherlands': [52.1326, 5.2913],
  'Saudi Arabia': [23.8859, 45.0792],
  'Turkey': [38.9637, 35.2433],
  'Switzerland': [46.8182, 8.2275],
  'Poland': [51.9194, 19.1451],
  'Sweden': [60.1282, 18.6435],
  'Belgium': [50.5039, 4.4699],
  'Argentina': [-38.4161, -63.6167],
  'Norway': [60.4720, 8.4689],
  'Austria': [47.5162, 14.5501],
  'United Arab Emirates': [23.4241, 53.8478],
  'Thailand': [15.8700, 100.9925],
  'Denmark': [56.2639, 9.5018],
  'Singapore': [1.3521, 103.8198],
  'South Africa': [-30.5595, 22.9375],
  'Malaysia': [4.2105, 101.9758],
  'Philippines': [12.8797, 121.7740],
  'Colombia': [4.5709, -74.2973],
  'Ireland': [53.1424, -7.6921],
  'Pakistan': [30.3753, 69.3451],
  'Chile': [-35.6751, -71.5430],
  'Finland': [61.9241, 25.7482],
  'Bangladesh': [23.6850, 90.3563],
  'Egypt': [26.8206, 30.8025],
  'New Zealand': [-40.9006, 174.8860],
  'Vietnam': [14.0583, 108.2772],
  'Greece': [39.0742, 21.8243],
  'Portugal': [39.3999, -8.2245],
  'Czech Republic': [49.8175, 15.4730],
  'Israel': [31.0461, 34.8516],
  'Romania': [45.9432, 24.9668],
  'Peru': [-9.1900, -75.0152],
  'Hungary': [47.1625, 19.5033],
  'Ukraine': [48.3794, 31.1656]
};

// List of threat types
const threatTypes: ThreatType[] = ['OAS', 'ODS', 'MAV', 'WAV', 'IDS', 'VUL', 'KAS', 'BAD', 'RMW'];

// Function to generate random data
export function generateDummyThreatData(count: number): Threat[] {
  const threats: Threat[] = [];
  const countries = Object.keys(countryCoordinates);
  
  for (let i = 0; i < count; i++) {
    // Select random source and target countries
    const sourceCountryIndex = Math.floor(Math.random() * countries.length);
    let targetCountryIndex = Math.floor(Math.random() * countries.length);
    
    // Make sure source and target are different
    while (targetCountryIndex === sourceCountryIndex) {
      targetCountryIndex = Math.floor(Math.random() * countries.length);
    }
    
    const sourceCountry = countries[sourceCountryIndex];
    const targetCountry = countries[targetCountryIndex];
    
    // Get coordinates
    const sourceCoordinates = countryCoordinates[sourceCountry];
    const targetCoordinates = countryCoordinates[targetCountry];
    
    // Select random threat type
    const threatType = threatTypes[Math.floor(Math.random() * threatTypes.length)];
    
    // Create threat object
    threats.push({
      id: uuidv4(),
      sourceCountry,
      sourceCoordinates,
      targetCountry,
      targetCoordinates,
      type: threatType,
      timestamp: Date.now()
    });
  }
  
  return threats;
}

// Helper function to add some randomness to coordinates
export function jitterCoordinates(coords: [number, number], amount: number = 0.5): [number, number] {
  return [
    coords[0] + (Math.random() - 0.5) * amount,
    coords[1] + (Math.random() - 0.5) * amount
  ];
} 