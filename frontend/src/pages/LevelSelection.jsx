import { useNavigate } from 'react-router';
import { GraduationCap, BookOpen, School } from 'lucide-react';

const levels = [
  {
    id: 'JHS',
    label: 'Junior High School',
    subtitle: 'Grade 7 – Grade 10',
    icon: School,
    color: 'border-[#102A71] bg-white text-[#001840] hover:bg-[#FFFDF0] hover:border-[#F5C400] hover:shadow-xl cursor-pointer',
    iconColor: 'text-[#102A71]',
    disabled: false,
    badge: null,
  },
  {
    id: 'SHS',
    label: 'Senior High School',
    subtitle: 'Grade 11 – Grade 12 · STEM · ABM · HUMSS',
    icon: BookOpen,
    color: 'border-[#102A71] bg-white text-[#001840] hover:bg-[#FFFDF0] hover:border-[#F5C400] hover:shadow-xl cursor-pointer',
    iconColor: 'text-[#102A71]',
    disabled: false,
    badge: null,
  },
  {
    id: 'College',
    label: 'College',
    subtitle: 'BEED · BSIS · BSBA · BSED · BSCrim',
    icon: GraduationCap,
    color: 'border-[#102A71] bg-white text-[#001840] hover:bg-[#FFFDF0] hover:border-[#F5C400] hover:shadow-xl cursor-pointer',
    iconColor: 'text-[#102A71]',
    disabled: false,
    badge: null,
  },
];

export function LevelSelection() {
  const navigate = useNavigate();

  const handleSelect = (level) => {
    if (level.disabled) return;
    if (level.id === 'College') {
      navigate('/enrollment-form', { state: { educationLevel: 'College' } });
    } else {
      navigate('/hs-enrollment-form', { state: { educationLevel: level.id } });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFFDF0] via-[#FFF9E6] to-[#FFFDF0] flex items-center justify-center py-16 px-4">
      <div className="w-full max-w-3xl">
        {/* Header */}
        <div className="text-center mb-12">
          <img src="/emc_logo_nobg.png" alt="EMC Logo" className="w-20 h-20 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-[#001840] mb-2">Student Enrollment</h1>
          <p className="text-gray-600 text-lg">Select your education level to get started</p>
        </div>

        {/* Level Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {levels.map((level) => {
            const Icon = level.icon;
            return (
              <div
                key={level.id}
                onClick={() => handleSelect(level)}
                className={`relative rounded-2xl border-2 p-8 transition-all duration-200 select-none ${level.color}`}
              >
                {/* Coming Soon Badge */}
                {level.badge && (
                  <span className="absolute top-3 right-3 text-xs font-semibold bg-gray-200 text-gray-500 px-2 py-1 rounded-full">
                    {level.badge}
                  </span>
                )}

                <div className="flex flex-col items-center text-center gap-4">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center ${level.disabled ? 'bg-gray-100' : 'bg-[#EEF2FF]'}`}>
                    <Icon className={`w-8 h-8 ${level.iconColor}`} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold mb-1">{level.label}</h2>
                    <p className={`text-sm ${level.disabled ? 'text-gray-400' : 'text-gray-500'}`}>{level.subtitle}</p>
                  </div>
                  {!level.disabled && (
                    <span className="mt-2 px-4 py-1.5 bg-[#102A71] text-white text-sm font-semibold rounded-lg">
                      Enroll Now
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-center text-sm text-gray-400 mt-8">
          Select your education level to begin the enrollment process.
        </p>
      </div>
    </div>
  );
}
