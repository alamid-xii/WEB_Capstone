import { useState, useEffect, useRef } from "react";
import { Search, X, MapPin, ZoomIn, ZoomOut, Maximize2, Clock, Building2, ChevronRight } from "lucide-react";
import { Pannellum } from "pannellum-react";

const CATEGORY_COLORS = {
  Academic:       "#102A71",
  Administration: "#001840",
  Sports:         "#059669",
  Health:         "#DC2626",
  Services:       "#EA580C",
  Library:        "#D97706",
};

export function CampusMap() {
  const [dbBuildings, setDbBuildings] = useState([]);
  const [pins, setPins] = useState([]);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const mapRef = useRef(null);

  useEffect(() => {
    fetch("http://localhost:3000/api/buildings")
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        if (!Array.isArray(data) || data.length === 0) return;
        setDbBuildings(data);
        const built = data.filter(b => b.coordinates).map(b => {
          let coords = { x: 50, y: 50 };
          try { coords = JSON.parse(b.coordinates); } catch {}
          return {
            id: `db-${b.id}`, dbId: b.id,
            name: b.name || "Building",
            desc: b.description || "",
            category: b.category || "Academic",
            x: coords.x ?? 50, y: coords.y ?? 50,
            color: CATEGORY_COLORS[b.category] || "#001840",
          };
        });
        setPins(built);
      })
      .catch(() => {});
  }, []);

  const filtered = pins.filter(b =>
    !search || b.name.toLowerCase().includes(search.toLowerCase())
  );

  const dbMatch = selected
    ? dbBuildings.find(db => db.id === selected.dbId)
    : null;

  const photo360 = dbMatch?.imageUrl
    ? `http://localhost:3000${dbMatch.imageUrl}`
    : null;

  let offices = [];
  try { offices = JSON.parse(dbMatch?.offices || "[]"); } catch {}

  // Zoom / pan
  const zoomIn    = () => setZoom(z => Math.min(z + 0.25, 3));
  const zoomOut   = () => setZoom(z => Math.max(z - 0.25, 0.5));
  const resetView = () => { setZoom(1); setPan({ x: 0, y: 0 }); };
  const onMouseDown = e => { setDragging(true); setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y }); };
  const onMouseMove = e => { if (dragging) setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y }); };
  const onMouseUp   = () => setDragging(false);
  const onWheel     = e => { e.preventDefault(); setZoom(z => Math.min(Math.max(z + (e.deltaY > 0 ? -0.12 : 0.12), 0.5), 3)); };

  return (
    <div className="flex flex-col bg-[#FFFDF0]" style={{ height: "calc(100vh - 80px)" }}>

      {/* ── Hero strip ── */}
      <div className="bg-[#001840] px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div>
          <h2 className="text-white font-bold text-base leading-tight">Campus Virtual Tour</h2>
          <p className="text-[#FFDC5F]/60 text-xs mt-0.5">Click any pin to explore buildings in 360°</p>
        </div>
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search buildings..."
            className="bg-white/10 text-white placeholder-white/40 border border-white/20 rounded-lg pl-8 pr-4 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#F5C400]/40 w-48"
          />
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* ── Map ── */}
        <div
          ref={mapRef}
          className="flex-1 relative overflow-hidden bg-gray-200"
          style={{ cursor: dragging ? "grabbing" : "grab" }}
          onMouseDown={onMouseDown} onMouseMove={onMouseMove}
          onMouseUp={onMouseUp} onMouseLeave={onMouseUp} onWheel={onWheel}
        >
          {/* Zoomable */}
          <div style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "center center",
            transition: dragging ? "none" : "transform 0.1s ease",
            position: "absolute", inset: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <div className="relative" style={{ width: "100%", maxWidth: "960px" }}>
              <img src="/emc_aerial.jpg" alt="EMC Campus" className="w-full h-auto block select-none" draggable={false} />

              {/* Pins */}
              {filtered.map(b => {
                const isActive = selected?.id === b.id;
                return (
                  <button key={b.id}
                    onClick={e => { e.stopPropagation(); setSelected(isActive ? null : b); }}
                    style={{ left: `${b.x}%`, top: `${b.y}%`, position: "absolute" }}
                    className="-translate-x-1/2 -translate-y-1/2 group z-10"
                    title={b.name}
                  >
                    {/* Pin dot */}
                    <div className={`relative flex items-center justify-center rounded-full border-2 border-white shadow-lg transition-all duration-200 ${
                      isActive ? "w-12 h-12" : "w-9 h-9 hover:scale-110"
                    }`} style={{ backgroundColor: b.color }}>
                      <MapPin size={isActive ? 17 : 14} className="text-white" />
                      {isActive && <span className="absolute inset-0 rounded-full animate-ping opacity-25" style={{ backgroundColor: b.color }} />}
                    </div>
                    {/* Label */}
                    <div className={`absolute left-1/2 -translate-x-1/2 top-full mt-1.5 whitespace-nowrap px-2.5 py-0.5 rounded-full text-xs font-semibold shadow pointer-events-none transition-all ${
                      isActive ? "opacity-100 bg-[#F5C400] text-[#001840]" : "opacity-0 group-hover:opacity-100 bg-[#001840] text-white"
                    }`}>
                      {b.name}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Empty state */}
          {pins.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div className="bg-white/95 border border-gray-200 rounded-2xl px-7 py-6 text-center shadow-lg max-w-xs">
                <div className="w-12 h-12 bg-[#FFFDF0] rounded-full flex items-center justify-center mx-auto mb-3">
                  <Building2 size={22} className="text-[#001840]" />
                </div>
                <p className="font-semibold text-[#001840] text-sm">No buildings yet</p>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">Admin can add buildings and pin their locations from the Admin Panel.</p>
              </div>
            </div>
          )}

          {/* Zoom controls */}
          <div className="absolute top-4 right-4 flex flex-col gap-1.5 z-20">
            {[{ I: ZoomIn, fn: zoomIn }, { I: ZoomOut, fn: zoomOut }, { I: Maximize2, fn: resetView }].map(({ I, fn }) => (
              <button key={fn.name} onClick={fn}
                className="w-9 h-9 bg-white hover:bg-[#FFFDF0] border border-gray-200 rounded-xl shadow-sm flex items-center justify-center transition-colors">
                <I size={15} className="text-[#001840]" />
              </button>
            ))}
          </div>

          {/* Hint pill */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20">
            <div className="bg-[#001840]/80 backdrop-blur-sm text-white/80 text-xs px-4 py-1.5 rounded-full shadow">
              Scroll to zoom · Drag to pan · Click a pin to explore
            </div>
          </div>
        </div>

        {/* ── Side Panel ── */}
        <div className={`absolute top-0 right-0 h-full bg-white flex flex-col transition-all duration-300 ease-in-out z-30 ${
          selected ? "w-[340px] shadow-2xl border-l border-gray-100" : "w-0 overflow-hidden"
        }`}>
          {selected && (
            <div className="flex flex-col h-full w-[340px]">

              {/* 360 viewer */}
              <div className="relative flex-shrink-0 bg-gray-100" style={{ height: "210px" }}>
                {photo360 ? (
                  <Pannellum width="100%" height="210px" image={photo360}
                    pitch={5} yaw={180} hfov={120} autoLoad showZoomCtrl={false} showFullscreenCtrl={false} />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-[#001840] to-[#102A71]">
                    <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center">
                      <MapPin size={24} className="text-white/50" />
                    </div>
                    <p className="text-white/60 text-xs font-medium">No 360° photo available</p>
                  </div>
                )}
                {/* Close */}
                <button onClick={() => setSelected(null)}
                  className="absolute top-3 right-3 w-7 h-7 bg-[#001840]/70 hover:bg-[#001840] rounded-full flex items-center justify-center transition-colors z-10">
                  <X size={13} className="text-white" />
                </button>
              </div>

              {/* Building header */}
              <div className="px-5 pt-4 pb-3 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: selected.color + "18" }}>
                    <Building2 size={16} style={{ color: selected.color }} />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#001840] text-base leading-tight">{selected.name}</h3>
                    <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{ backgroundColor: selected.color + "15", color: selected.color }}>
                      {selected.category}
                    </span>
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

                {(selected.desc || dbMatch?.description) && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">About</p>
                    <p className="text-sm text-gray-600 leading-relaxed">{selected.desc || dbMatch?.description}</p>
                  </div>
                )}

                {dbMatch?.hours && (
                  <div className="flex items-start gap-3 p-3 bg-[#FFFDF0] rounded-xl border border-[#F5C400]/20">
                    <Clock size={15} className="text-[#001840] mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-[#001840] mb-0.5">Operating Hours</p>
                      <p className="text-sm text-gray-600">{dbMatch.hours}</p>
                    </div>
                  </div>
                )}

                {offices.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Offices & Rooms</p>
                    <div className="flex flex-wrap gap-1.5">
                      {offices.map((o, i) => (
                        <span key={i} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium border border-gray-200">{o}</span>
                      ))}
                    </div>
                  </div>
                )}

                {!photo360 && (
                  <div className="p-3 bg-[#FFFDF0] border border-[#F5C400]/30 rounded-xl text-center">
                    <p className="text-xs text-gray-500">360° virtual tour coming soon for this building.</p>
                  </div>
                )}
              </div>

              {/* Other buildings */}
              {pins.filter(b => b.id !== selected.id).length > 0 && (
                <div className="border-t border-gray-100 px-5 py-4 flex-shrink-0">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5">Explore Other Buildings</p>
                  <div className="space-y-1">
                    {pins.filter(b => b.id !== selected.id).map(b => (
                      <button key={b.id} onClick={() => setSelected(b)}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[#FFFDF0] transition-colors text-left group">
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: b.color + "20" }}>
                          <MapPin size={11} style={{ color: b.color }} />
                        </div>
                        <span className="text-sm text-gray-700 group-hover:text-[#001840] font-medium flex-1">{b.name}</span>
                        <ChevronRight size={13} className="text-gray-300 group-hover:text-[#001840] transition-colors" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
