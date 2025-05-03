import CyberThreatMap from '@/components/cyber-map/CyberThreatMap';

export const metadata = {
  title: 'Cyber Threat Map',
  description: 'Real-time visualization of cyber threats across the globe',
};

export default function DashboardCyberMapPage() {
  return (
    <div className="w-full h-screen">
      <CyberThreatMap />
    </div>
  );
} 