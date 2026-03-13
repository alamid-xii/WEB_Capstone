import { useState } from "react";
import {
  Search,
  MapPin,
  X,
  Navigation,
  Building2,
  BookOpen,
  Heart,
  Coffee,
  GraduationCap,
  Dumbbell,
  ChevronRight,
  Info,
} from "lucide-react";


const buildings = [
  {
    id: 1,
    name: "Administration Building (Dr. Angel Francisco Hall)",
    shortName: "Admin Hall",
    category: "Administration",
    description: "Main administrative hub of Eastern Mindoro College. Houses the Registrar, Cashier, Guidance, and executive offices.",
    offices: ["Registrar's Office", "Cashier / Finance", "Guidance & Counseling", "Office of the President", "Student Affairs"],
    hours: "Mon–Fri: 8:00 AM – 5:00 PM",
    icon: Building2,
    x: 50,
    y: 38,
    color: "#102A71",
  },
  {
    id: 2,
    name: "Library & Learning Resource Center",
    shortName: "Library",
    category: "Academic",
    description: "Multi-floor library with physical and digital collections, study rooms, computer stations, and research databases.",
    offices: ["Main Reading Hall", "Computer Lab", "Research & Reference", "Periodicals Section"],
    hours: "Mon–Fri: 7:30 AM – 6:00 PM · Sat: 8:00 AM – 12:00 PM",
    icon: BookOpen,
    x: 72,
    y: 55,
    color: "#001840",
  },
  {
    id: 3,
    name: "College of Education Annex",
    shortName: "CEduc",
    category: "Academic",
    description: "Home to the Bachelor of Secondary Education (BSEd) and Bachelor of Elementary Education (BEEd) programs.",
    offices: ["Dean's Office", "Faculty Rooms", "Demo Teaching Room", "Student Council"],
    hours: "Mon–Fri: 7:30 AM – 5:00 PM",
    icon: GraduationCap,
    x: 22,
    y: 60,
    color: "#102A71",
  },
  {
    id: 4,
    name: "College of Business Annex",
    shortName: "CBusiness",
    category: "Academic",
    description: "Houses BSA, BSBA programs, accounting labs, and business simulation rooms.",
    offices: ["Dean's Office", "Accounting Lab", "Finance Room", "Business Simulation Lab"],
    hours: "Mon–Fri: 7:30 AM – 5:00 PM",
    icon: Building2,
    x: 35,
    y: 72,
    color: "#001840",
  },
  {
    id: 5,
    name: "Health Services / Medical Clinic",
    shortName: "Clinic",
    category: "Services",
    description: "Campus medical clinic providing basic health services, first aid, and medical certificates for enrollment.",
    offices: ["Medical Clinic", "Dental Clinic", "Nurse Station"],
    hours: "Mon–Fri: 8:00 AM – 5:00 PM",
    icon: Heart,
    x: 75,
    y: 30,
    color: "#102A71",
  },
  {
    id: 6,
    name: "Canteen & Cafeteria",
    shortName: "Canteen",
    category: "Services",
    description: "Campus dining area with affordable meals, snacks, and beverages for students and faculty.",
    offices: ["Main Cafeteria", "Snack Stalls", "Faculty Dining"],
    hours: "Mon–Sat: 6:30 AM – 6:00 PM",
    icon: Coffee,
    x: 58,
    y: 70,
    color: "#001840",
  },
  {
    id: 7,
    name: "Gymnasium & Sports Complex",
    shortName: "Gym",
    category: "Facilities",
    description: "Multi-purpose gymnasium hosting PE classes, university events, and student sports activities.",
    offices: ["Main Gym Floor", "PE Department Office", "Equipment Room"],
    hours: "Mon–Fri: 7:00 AM – 8:00 PM",
    icon: Dumbbell,
    x: 20,
    y: 32,
    color: "#102A71",
  },
];

const categories = ["All", "Administration", "Academic", "Services", "Facilities"];

export function CampusMap() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [hoveredBuilding, setHoveredBuilding] = useState(null);

  const filtered = buildings.filter((b) => {
    const matchSearch = b.name.toLowerCase().includes(search.toLowerCase()) || b.shortName.toLowerCase().includes(search.toLowerCase());
    const matchCat = selectedCategory === "All" || b.category === selectedCategory;
    return matchSearch && matchCat;
  });

  return (
    <div className="min-h-screen bg-[#FFFDF0]">
      {/* Page Header */}
      <div className="bg-[#001840] text-white px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-[#F5C400] w-10 h-10 rounded-xl flex items-center justify-center">
              <MapPin className="w-5 h-5 text-[#001840]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Interactive Campus Map</h1>
              <p className="text-[#FFDC5F] text-sm">Eastern Mindoro College — Calapan City, Oriental Mindoro</p>
            </div>
          </div>
          <p className="text-[#FFFDF0]/70 text-sm mt-2 max-w-xl">
            Click any building marker to view details, office locations, and operating hours.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-6 flex-col lg:flex-row">

          {/* Left Panel */}
          <aside className="lg:w-72 shrink-0 flex flex-col gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search buildings…"
                className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm text-[#001840] focus:outline-none focus:border-[#102A71] focus:ring-2 focus:ring-[#102A71]/10"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${selectedCategory === cat
                      ? "bg-[#102A71] text-white"
                      : "bg-white border border-gray-200 text-gray-600 hover:border-[#FFDC5F]"
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Building List */}
            <div className="bg-[#102A71] rounded-2xl overflow-hidden flex flex-col max-h-[480px]">
              <div className="px-4 py-3 border-b border-[#001840]/30">
                <h3 className="text-[#FFDC5F] font-semibold text-sm">Buildings & Facilities</h3>
                <p className="text-[#FFFDF0]/50 text-xs mt-0.5">{filtered.length} found</p>
              </div>
              <div className="overflow-y-auto flex-1">
                {filtered.map((building) => {
                  const Icon = building.icon;
                  const isSelected = selectedBuilding?.id === building.id;
                  return (
                    <button
                      key={building.id}
                      onClick={() => setSelectedBuilding(isSelected ? null : building)}
                      className={`w-full text-left px-4 py-3.5 border-b border-[#001840]/20 flex items-center gap-3 transition-colors ${isSelected ? "bg-[#F5C400]/20" : "hover:bg-[#001840]/20"
                        }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isSelected ? "bg-[#F5C400]" : "bg-[#001840]/40"}`}>
                        <Icon className={`w-4 h-4 ${isSelected ? "text-[#001840]" : "text-[#FFDC5F]"}`} />
                      </div>
                      <div className="min-w-0">
                        <p className={`text-sm font-medium truncate ${isSelected ? "text-[#F5C400]" : "text-[#FFFDF0]"}`}>
                          {building.shortName}
                        </p>
                        <p className="text-xs text-[#FFFDF0]/50 truncate">{building.category}</p>
                      </div>
                      <ChevronRight className={`w-4 h-4 shrink-0 ml-auto transition-transform ${isSelected ? "text-[#F5C400] rotate-90" : "text-[#FFFDF0]/30"}`} />
                    </button>
                  );
                })}
                {filtered.length === 0 && (
                  <div className="px-4 py-8 text-center text-[#FFFDF0]/50 text-sm">
                    No buildings found
                  </div>
                )}
              </div>
            </div>
          </aside>

          {/* Map + Details */}
          <div className="flex-1 flex flex-col gap-4">
            {/* Campus Map */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Map header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-[#F5C400] rounded-full" />
                  <span className="text-sm text-[#001840] font-medium">Campus Overview Map</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <Info className="w-3 h-3" />
                  Click markers for details
                </div>
              </div>

              {/* SVG Map */}
              <div className="relative bg-[#e8f0ea] overflow-hidden" style={{ paddingBottom: "56.25%" }}>
                <svg
                  viewBox="0 0 800 450"
                  className="absolute inset-0 w-full h-full"
                  style={{ fontFamily: "inherit" }}
                >
                  {/* Ground / Grass */}
                  <rect width="800" height="450" fill="#d4e6d4" />

                  {/* Roads */}
                  <rect x="0" y="200" width="800" height="24" fill="#c8bfa0" opacity="0.6" />
                  <rect x="380" y="0" width="22" height="450" fill="#c8bfa0" opacity="0.6" />
                  <rect x="0" y="320" width="500" height="16" fill="#c8bfa0" opacity="0.45" />

                  {/* Pathways */}
                  <path d="M402 200 Q 450 180 480 140" stroke="#b8ad8c" strokeWidth="6" fill="none" opacity="0.5" />
                  <path d="M380 224 Q 300 260 200 280" stroke="#b8ad8c" strokeWidth="6" fill="none" opacity="0.5" />

                  {/* Trees decoration */}
                  {[
                    [60, 90], [100, 120], [700, 80], [740, 120], [680, 390], [120, 390], [60, 350],
                  ].map(([cx, cy], i) => (
                    <g key={i}>
                      <circle cx={cx} cy={cy} r="14" fill="#5d9e5d" opacity="0.7" />
                      <circle cx={cx} cy={cy} r="9" fill="#4a8a4a" opacity="0.8" />
                    </g>
                  ))}

                  {/* Parking area */}
                  <rect x="600" y="360" width="160" height="70" rx="6" fill="#c0b896" opacity="0.5" />
                  <text x="680" y="399" textAnchor="middle" fontSize="10" fill="#6b5e3a" opacity="0.8">Parking</text>

                  {/* Gate */}
                  <rect x="370" y="430" width="60" height="20" rx="4" fill="#8b6914" opacity="0.7" />
                  <text x="400" y="444" textAnchor="middle" fontSize="9" fill="#FFFDF0">Main Gate</text>

                  {/* Campus boundary */}
                  <rect x="10" y="10" width="780" height="430" rx="12" fill="none" stroke="#8b6914" strokeWidth="3" opacity="0.5" strokeDasharray="8,4" />

                  {/* Buildings */}
                  {buildings.map((b) => {
                    const cx = (b.x / 100) * 800;
                    const cy = (b.y / 100) * 450;
                    const isSelected = selectedBuilding?.id === b.id;
                    const isHovered = hoveredBuilding === b.id;
                    const isFiltered = filtered.find((f) => f.id === b.id);

                    return (
                      <g key={b.id}>
                        {/* Building shadow */}
                        <rect
                          x={cx - 24}
                          y={cy - 18}
                          width={48}
                          height={36}
                          rx="6"
                          fill="#000"
                          opacity="0.08"
                          transform="translate(3,4)"
                        />
                        {/* Building rect */}
                        <rect
                          x={cx - 24}
                          y={cy - 18}
                          width={48}
                          height={36}
                          rx="6"
                          fill={isSelected ? "#F5C400" : isFiltered ? b.color : "#aab"}
                          opacity={isFiltered ? 1 : 0.35}
                          className="cursor-pointer transition-all"
                          onClick={() => setSelectedBuilding(isSelected ? null : b)}
                          onMouseEnter={() => setHoveredBuilding(b.id)}
                          onMouseLeave={() => setHoveredBuilding(null)}
                        />
                        {/* Marker dot */}
                        <circle
                          cx={cx}
                          cy={cy - 24}
                          r={isSelected ? 10 : isHovered ? 9 : 7}
                          fill={isSelected ? "#F5C400" : "#F5C400"}
                          opacity={isFiltered ? 1 : 0.3}
                          className="cursor-pointer transition-all"
                          onClick={() => setSelectedBuilding(isSelected ? null : b)}
                          onMouseEnter={() => setHoveredBuilding(b.id)}
                          onMouseLeave={() => setHoveredBuilding(null)}
                        />
                        <circle cx={cx} cy={cy - 24} r="3" fill="#001840" opacity={isFiltered ? 0.9 : 0.2} />

                        {/* Label */}
                        {isFiltered && (
                          <text
                            x={cx}
                            y={cy + 26}
                            textAnchor="middle"
                            fontSize="9"
                            fill={isSelected ? "#001840" : "#001840"}
                            fontWeight={isSelected ? "700" : "500"}
                            className="select-none pointer-events-none"
                          >
                            {b.shortName}
                          </text>
                        )}

                        {/* Hover tooltip */}
                        {isHovered && !isSelected && (
                          <g>
                            <rect x={cx - 55} y={cy - 58} width="110" height="22" rx="6" fill="#001840" opacity="0.85" />
                            <text x={cx} y={cy - 43} textAnchor="middle" fontSize="9" fill="#FFDC5F" className="select-none pointer-events-none">
                              {b.shortName}
                            </text>
                          </g>
                        )}
                      </g>
                    );
                  })}

                  {/* Legend */}
                  <g>
                    <rect x="20" y="16" width="130" height="52" rx="8" fill="#001840" opacity="0.75" />
                    <circle cx="35" cy="32" r="5" fill="#F5C400" />
                    <text x="46" y="36" fontSize="9" fill="#FFFDF0">Building Marker</text>
                    <rect x="28" y="44" width="14" height="10" rx="2" fill="#102A71" />
                    <text x="46" y="52" fontSize="9" fill="#FFFDF0">Building</text>
                  </g>
                </svg>
              </div>
            </div>

            {/* Building Details Card */}
            {selectedBuilding ? (
              <div className="bg-[#102A71] text-white rounded-2xl p-6 shadow-lg">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-start gap-4">
                    <div className="bg-[#F5C400] w-12 h-12 rounded-xl flex items-center justify-center shrink-0">
                      <selectedBuilding.icon className="w-6 h-6 text-[#001840]" />
                    </div>
                    <div>
                      <span className="bg-[#FFDC5F] text-[#001840] text-xs font-semibold px-2 py-0.5 rounded-full">
                        {selectedBuilding.category}
                      </span>
                      <h3 className="font-bold text-lg mt-1 leading-snug">{selectedBuilding.name}</h3>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedBuilding(null)}
                    className="shrink-0 bg-[#001840]/40 hover:bg-[#001840]/60 p-1.5 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4 text-[#FFFDF0]" />
                  </button>
                </div>

                <p className="text-[#FFFDF0]/80 text-sm leading-relaxed mb-4">{selectedBuilding.description}</p>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-[#FFDC5F] text-xs font-semibold uppercase tracking-wide mb-2">Offices / Areas</h4>
                    <ul className="space-y-1.5">
                      {selectedBuilding.offices.map((office, i) => (
                        <li key={i} className="flex items-center gap-2 text-[#FFFDF0] text-sm">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#F5C400] shrink-0" />
                          {office}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-[#FFDC5F] text-xs font-semibold uppercase tracking-wide mb-2">Operating Hours</h4>
                    <p className="text-[#FFFDF0] text-sm">{selectedBuilding.hours}</p>

                    <button className="mt-4 flex items-center gap-2 bg-[#F5C400] hover:bg-[#FFDC5F] text-[#001840] px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors">
                      <Navigation className="w-4 h-4" />
                      Get AR Directions
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
                <MapPin className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">Click a building marker or list item to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}