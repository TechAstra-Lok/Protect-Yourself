"use client";

import { useEffect, useState, useRef } from "react";
// Dynamic import required because react-globe.gl requires the window object (Canvas)
import dynamic from "next/dynamic";

const Globe = dynamic(() => import("react-globe.gl"), { ssr: false });

interface AttackData {
  id: string;
  source: { lat: number; lng: number; country: string; city: string };
  target: { lat: number; lng: number; country: string; city: string };
  type: string;
  color: string;
  timestamp: string;
}

export default function ThreatMap() {
  const globeEl = useRef<any>(null);
  const [attacks, setAttacks] = useState<AttackData[]>([]);
  // Start with common desktop, will resize immediately on mount
  const [dimensions, setDimensions] = useState({ width: 1200, height: 800 });

  // Auto-resize globe based on entire window
  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    
    // Initial size
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Poll for live attacks every 2 seconds
  useEffect(() => {
    const fetchLiveAttacks = async () => {
      try {
        const res = await fetch("http://localhost:8000/v1/dashboard/live-attacks");
        const newAttacks: AttackData[] = await res.json();
        
        setAttacks((prev) => {
          // Keep only the most recent 30 attacks to prevent visual clutter and lag
          const combined = [...prev, ...newAttacks];
          return combined.slice(-30);
        });
      } catch (err) {
        console.error("Failed to fetch live attacks:", err);
      }
    };

    fetchLiveAttacks(); // Initial fetch
    const interval = setInterval(fetchLiveAttacks, 2000);
    
    return () => clearInterval(interval);
  }, []);

  // Setup globe physics/spin on mount
  useEffect(() => {
    if (globeEl.current) {
      globeEl.current.controls().autoRotate = true;
      globeEl.current.controls().autoRotateSpeed = 0.5;
      globeEl.current.controls().enableZoom = false; // Disable default zoom
      globeEl.current.pointOfView({ altitude: 2.5 });
    }
  }, []); // Re-run if ref attaches late

  // Custom Zoom Logic (Ctrl + Scroll)
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (globeEl.current) {
        if (e.ctrlKey) {
          e.preventDefault(); // Prevent browser zoom
          globeEl.current.controls().enableZoom = true;
        } else {
          globeEl.current.controls().enableZoom = false;
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Control' && globeEl.current) {
        globeEl.current.controls().enableZoom = false;
      }
    };

    // Use capture: true so we intercept the wheel before OrbitControls gets it
    window.addEventListener("wheel", handleWheel, { passive: false, capture: true });
    window.addEventListener("keyup", handleKeyUp);
    
    return () => {
      window.removeEventListener("wheel", handleWheel, { capture: true } as any);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  return (
    <div className="fixed top-0 left-0 w-screen h-screen -z-10 bg-slate-950 overflow-hidden">
      
      {/* Global Information Overlays */}
      <div className="absolute top-6 left-6 z-10 pointer-events-none flex flex-col gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2 drop-shadow-lg">
            <span className="text-2xl">🌐</span> Live Global Threat Map
          </h2>
          <p className="text-slate-300 text-sm mt-1 drop-shadow-md">
            Real-time cyber attacks monitored across our worldwide intelligence grid <span className="text-white bg-slate-800 px-1 py-0.5 rounded text-[10px] ml-2 opacity-80 border border-slate-600">(Hold CTRL to zoom)</span>
          </p>
          <div className="mt-3 flex items-center gap-2 text-xs font-mono text-cyan-400 bg-slate-900/60 p-2 rounded border border-slate-700 backdrop-blur-sm inline-block">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse inline-block"></span> 
            {attacks.length} Active Vectors Tracking
          </div>
        </div>

        {/* Legend - Moved to top left under Active Vectors */}
        <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-700 backdrop-blur-sm w-fit hidden md:block">
          <h3 className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Attack Signatures</h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs w-max">
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]"></span> DDoS / Malware</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-teal-500 shadow-[0_0_8px_#14b8a6]"></span> Phishing</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-purple-500 shadow-[0_0_8px_#a855f7]"></span> Ransomware</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-pink-500 shadow-[0_0_8px_#ec4899]"></span> Zero-Day</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_8px_#f59e0b]"></span> SQLi</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-violet-500 shadow-[0_0_8px_#8b5cf6]"></span> Botnet</div>
          </div>
        </div>
      </div>

      {/* Globe Implementation */}
      <div 
        className="w-full h-full opacity-80 mix-blend-screen"
        onMouseEnter={() => {
          if (globeEl.current) globeEl.current.controls().autoRotate = false;
        }}
        onMouseLeave={() => {
          if (globeEl.current) {
            globeEl.current.controls().autoRotate = true;
            globeEl.current.controls().autoRotateSpeed = 0.5; // slow speed
          }
        }}
      >
        {typeof window !== "undefined" && (
          <Globe
            ref={globeEl}
            width={dimensions.width}
            height={dimensions.height}
            globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg"
            backgroundColor="rgba(0,0,0,0)" // Transparent to show background
            
            // Arcs (The attacks)
            arcsData={attacks}
            arcStartLat={(d: any) => d.source.lat}
            arcStartLng={(d: any) => d.source.lng}
            arcEndLat={(d: any) => d.target.lat}
            arcEndLng={(d: any) => d.target.lng}
            arcColor={(d: any) => d.color}
            arcDashLength={0.4}
            arcDashGap={0.2}
            arcDashAnimateTime={1500}
            arcStroke={1.5}
            
            arcLabel={(d: any) => `
              <div style="background: rgba(15, 23, 42, 0.9); padding: 10px; border-radius: 8px; border: 1px solid ${d.color}; backdrop-filter: blur(4px); box-shadow: 0 4px 12px rgba(0,0,0,0.5); pointer-events: none;">
                <div style="color: ${d.color}; font-weight: bold; margin-bottom: 4px; display: flex; align-items: center; gap: 4px;">
                  ⚠️ ${d.type}
                </div>
                <div style="font-size: 12px; color: #cbd5e1; margin-bottom: 2px;">
                  <span style="color: #64748b;">ORIGIN:</span> ${d.source.city}, ${d.source.country}
                </div>
                <div style="font-size: 12px; color: #cbd5e1;">
                  <span style="color: #64748b;">TARGET:</span> ${d.target.city}, ${d.target.country}
                </div>
              </div>
            `}

            // Origin / Destination Rings
            ringsData={attacks.flatMap(d => [
              { lat: d.source.lat, lng: d.source.lng, color: d.color },
              { lat: d.target.lat, lng: d.target.lng, color: d.color }
            ])}
            ringColor={(d: any) => d.color}
            ringMaxRadius={5}
            ringPropagationSpeed={3}
            ringRepeatPeriod={1000}
          />
        )}
      </div>
    </div>
  );
}
