import { useState } from "react";
import {
  Navigation,
  MapPin,
  Camera,
  ChevronRight,
  ArrowUp,
  RotateCcw,
  Compass,
  AlertCircle,
  CheckCircle2,
  Layers,
} from "lucide-react";

const destinations = [
  { id: 1, label: "Registrar's Office", building: "Admin Building, GF", distance: "120m", time: "2 min" },
  { id: 2, label: "Guidance Office", building: "Admin Building, 2F", distance: "145m", time: "2 min" },
  { id: 3, label: "Cashier / Finance", building: "Admin Building, GF", distance: "110m", time: "1 min" },
  { id: 4, label: "Library", building: "Library Building", distance: "200m", time: "3 min" },
  { id: 5, label: "College of Education", building: "Annex Building A", distance: "280m", time: "4 min" },
  { id: 6, label: "College of Business", building: "Annex Building B", distance: "310m", time: "4 min" },
  { id: 7, label: "Canteen / Cafeteria", building: "Main Hall, 1F", distance: "180m", time: "2 min" },
  { id: 8, label: "Medical / Clinic", building: "Health Services Bldg.", distance: "230m", time: "3 min" },
];

const steps = [
  { instruction: "Head straight towards the Admin Building", icon: ArrowUp, dist: "50m" },
  { instruction: "Turn left at the flagpole junction", icon: RotateCcw, dist: "30m" },
  { instruction: "Enter through the main double doors", icon: CheckCircle2, dist: "Arrived" },
];

export function ARNavigation() {
  const [selectedDest, setSelectedDest] = useState<number | null>(null);
  const [navigating, setNavigating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const dest = destinations.find((d) => d.id === selectedDest);

  function startNav() {
    if (!selectedDest) return;
    setNavigating(true);
    setCurrentStep(0);
  }

  function nextStep() {
    if (currentStep < steps.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      setNavigating(false);
      setSelectedDest(null);
      setCurrentStep(0);
    }
  }

  return (
    <div className="min-h-screen bg-[#FFFDF0]">
      {/* Page Header */}
      <div className="bg-[#001840] text-white px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-[#F5C400] w-10 h-10 rounded-xl flex items-center justify-center">
              <Navigation className="w-5 h-5 text-[#001840]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">AR Campus Navigation</h1>
              <p className="text-[#FFDC5F] text-sm">Real-time Augmented Reality Wayfinding</p>
            </div>
          </div>
          <p className="text-[#FFFDF0]/70 text-sm mt-2 max-w-xl">
            Point your camera at the campus and follow the AR overlays to reach your destination. Select a destination below to begin.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-5 gap-6">

          {/* Left Panel */}
          <aside className="lg:col-span-2 flex flex-col gap-4">
            {/* Current Location */}
            <div className="bg-[#102A71] text-white rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-1">
                <Compass className="w-4 h-4 text-[#FFDC5F]" />
                <span className="text-[#FFDC5F] text-xs font-semibold uppercase tracking-wider">Current Location</span>
              </div>
              <p className="font-semibold mt-1">Main Gate Entrance</p>
              <p className="text-[#FFFDF0]/60 text-sm">Eastern Mindoro College Campus</p>
              <div className="mt-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-[#F5C400] rounded-full animate-pulse" />
                <span className="text-[#FFDC5F] text-xs">GPS Signal: Strong</span>
              </div>
            </div>

            {/* Destination Selector */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-[#001840] font-semibold mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#F5C400]" />
                Select Destination
              </h3>
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {destinations.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => { setSelectedDest(d.id); setNavigating(false); }}
                    className={`w-full text-left px-4 py-3 rounded-xl border transition-all duration-150 flex items-center justify-between group ${
                      selectedDest === d.id
                        ? "bg-[#102A71] border-[#102A71] text-white"
                        : "border-gray-100 hover:border-[#FFDC5F] hover:bg-[#FFFDF0] text-[#001840]"
                    }`}
                  >
                    <div>
                      <p className="font-medium text-sm">{d.label}</p>
                      <p className={`text-xs mt-0.5 ${selectedDest === d.id ? "text-[#FFDC5F]" : "text-gray-400"}`}>
                        {d.building}
                      </p>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <p className={`text-xs font-semibold ${selectedDest === d.id ? "text-[#F5C400]" : "text-[#102A71]"}`}>
                        {d.distance}
                      </p>
                      <p className={`text-xs ${selectedDest === d.id ? "text-[#FFDC5F]" : "text-gray-400"}`}>
                        ~{d.time} walk
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Start Button */}
            <button
              onClick={startNav}
              disabled={!selectedDest}
              className="bg-[#F5C400] hover:bg-[#FFDC5F] disabled:bg-gray-200 disabled:cursor-not-allowed text-[#001840] py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-colors shadow-lg"
            >
              <Navigation className="w-5 h-5" />
              {navigating ? "Navigating…" : "Start AR Navigation"}
            </button>

            {/* Info Notice */}
            <div className="bg-[#FFDC5F]/30 border border-[#FFDC5F] rounded-xl p-4 flex gap-3">
              <AlertCircle className="w-4 h-4 text-[#001840] shrink-0 mt-0.5" />
              <p className="text-[#001840] text-xs leading-relaxed">
                AR Navigation works best on mobile devices. Point your camera at campus surroundings for live directional overlays.
              </p>
            </div>
          </aside>

          {/* Right Panel — AR Preview */}
          <div className="lg:col-span-3 flex flex-col gap-4">
            {/* AR Viewport */}
            <div className="relative bg-[#001840] rounded-2xl overflow-hidden aspect-video shadow-xl">
              {/* Camera Simulation Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#001840] via-[#0d2258] to-[#102A71]" />

              {/* Grid overlay */}
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
                  backgroundSize: "40px 40px",
                }}
              />

              {/* Simulated Campus Silhouette */}
              <div className="absolute bottom-0 left-0 right-0 h-2/5">
                <svg viewBox="0 0 800 200" className="w-full h-full" preserveAspectRatio="none">
                  <rect x="30" y="80" width="120" height="120" fill="#102A71" rx="4" />
                  <rect x="50" y="60" width="80" height="20" fill="#0d1f5c" rx="2" />
                  <rect x="200" y="40" width="180" height="160" fill="#0d2258" rx="6" />
                  <rect x="220" y="20" width="140" height="25" fill="#102A71" rx="3" />
                  <rect x="430" y="90" width="100" height="110" fill="#102A71" rx="4" />
                  <rect x="580" y="60" width="160" height="140" fill="#0d1f5c" rx="4" />
                  <rect x="600" y="40" width="120" height="25" fill="#0a1a4a" rx="2" />
                </svg>
              </div>

              {/* AR Overlay Elements */}
              {navigating ? (
                <>
                  {/* Direction Arrow */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2">
                    <div className="bg-[#F5C400] w-16 h-16 rounded-full flex items-center justify-center shadow-2xl animate-bounce">
                      <ArrowUp className="w-8 h-8 text-[#001840]" />
                    </div>
                    <div className="bg-[#001840]/80 backdrop-blur px-4 py-2 rounded-full text-[#FFDC5F] text-sm font-semibold">
                      {steps[currentStep].dist}
                    </div>
                  </div>

                  {/* AR Path Line */}
                  <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-1 h-32 bg-gradient-to-t from-[#F5C400] to-transparent rounded-full opacity-70" />

                  {/* Destination Label */}
                  {dest && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-[#102A71]/90 backdrop-blur px-5 py-2 rounded-full border border-[#FFDC5F]/30">
                      <p className="text-white text-sm font-medium">{dest.label}</p>
                    </div>
                  )}

                  {/* Current step instruction */}
                  <div className="absolute bottom-4 left-4 right-4 bg-[#001840]/90 backdrop-blur rounded-xl p-4 flex items-center gap-3">
                    <div className="bg-[#F5C400] w-8 h-8 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-[#001840] text-xs font-bold">{currentStep + 1}</span>
                    </div>
                    <p className="text-white text-sm flex-1">{steps[currentStep].instruction}</p>
                    <button
                      onClick={nextStep}
                      className="bg-[#F5C400] hover:bg-[#FFDC5F] text-[#001840] px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                    >
                      {currentStep < steps.length - 1 ? "Next" : "Arrived"}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Idle State */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                    <div className="border-2 border-[#F5C400]/40 rounded-2xl w-48 h-36 flex items-center justify-center relative">
                      <Camera className="w-10 h-10 text-[#F5C400]/50" />
                      {/* Corner brackets */}
                      <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-[#F5C400] rounded-tl-lg" />
                      <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-[#F5C400] rounded-tr-lg" />
                      <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-[#F5C400] rounded-bl-lg" />
                      <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-[#F5C400] rounded-br-lg" />
                    </div>
                    <p className="text-[#FFDC5F] text-sm">
                      {selectedDest ? "Press 'Start AR Navigation' to begin" : "Select a destination to activate AR"}
                    </p>
                  </div>

                  {/* AR labels on campus silhouette */}
                  <div className="absolute bottom-24 left-16 bg-[#F5C400]/90 text-[#001840] text-xs font-semibold px-2 py-1 rounded-lg">
                    Admin Building
                  </div>
                  <div className="absolute bottom-32 left-[38%] bg-[#F5C400]/90 text-[#001840] text-xs font-semibold px-2 py-1 rounded-lg">
                    Dr. Angel Francisco Hall
                  </div>
                  <div className="absolute bottom-20 right-24 bg-[#F5C400]/90 text-[#001840] text-xs font-semibold px-2 py-1 rounded-lg">
                    Library
                  </div>
                </>
              )}

              {/* HUD: Compass */}
              <div className="absolute top-4 right-4 bg-[#001840]/70 backdrop-blur w-12 h-12 rounded-full flex items-center justify-center border border-[#102A71]">
                <Compass className="w-6 h-6 text-[#F5C400]" />
              </div>

              {/* HUD: Layers */}
              <div className="absolute top-4 left-4 bg-[#001840]/70 backdrop-blur px-3 py-1 rounded-full flex items-center gap-1.5">
                <Layers className="w-3 h-3 text-[#FFDC5F]" />
                <span className="text-[#FFDC5F] text-xs">AR Mode</span>
              </div>
            </div>

            {/* Turn-by-Turn Steps */}
            {dest && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[#001840] font-semibold flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-[#F5C400]" />
                    Route to {dest.label}
                  </h3>
                  <span className="text-xs text-gray-400">
                    {dest.distance} · ~{dest.time} walk
                  </span>
                </div>
                <div className="space-y-3">
                  {steps.map((step, i) => {
                    const Icon = step.icon;
                    const done = navigating && i < currentStep;
                    const active = navigating && i === currentStep;
                    return (
                      <div key={i} className={`flex items-center gap-3 p-3 rounded-xl ${active ? "bg-[#FFDC5F]/30 border border-[#FFDC5F]" : done ? "opacity-50" : "bg-[#FFFDF0]"}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${active ? "bg-[#F5C400]" : done ? "bg-green-100" : "bg-[#102A71]/10"}`}>
                          <Icon className={`w-4 h-4 ${active ? "text-[#001840]" : done ? "text-green-600" : "text-[#102A71]"}`} />
                        </div>
                        <span className="text-sm text-[#001840] flex-1">{step.instruction}</span>
                        <span className={`text-xs font-semibold ${active ? "text-[#001840]" : "text-gray-400"}`}>{step.dist}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
