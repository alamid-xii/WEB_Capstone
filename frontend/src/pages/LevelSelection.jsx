import { useState } from 'react';
import { useNavigate } from 'react-router';
import { GraduationCap, BookOpen, School, ArrowLeft, FlaskConical, ClipboardList, X, Upload, FileText, Loader2, CheckCircle2 } from 'lucide-react';

const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB
const ACCEPTED = ".pdf,.jpg,.jpeg,.png";
const FILE_HINT = "Formats: PDF, JPG, JPEG, PNG · Max file size: 3.0MB";

const levels = [
  { id: 'JHS', label: 'Junior High School', subtitle: 'Grade 7 – Grade 10', icon: School },
  { id: 'SHS', label: 'Senior High School', subtitle: 'Grade 11 – Grade 12 · STEM · ABM · HUMSS', icon: BookOpen },
  { id: 'College', label: 'College', subtitle: 'BEED · BSIS · BSBA · BSED · BSCrim', icon: GraduationCap },
];

function UploadBox({ label, file, onFile, error }) {
  const handleChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (f.size > MAX_FILE_SIZE) { alert("File exceeds 3MB limit. Please choose a smaller file."); return; }
    onFile(f);
  };
  return (
    <div className={`rounded-xl border-2 p-4 transition-all ${file ? "border-green-400 bg-green-50" : error ? "border-red-300 bg-red-50" : "border-gray-200 bg-gray-50"}`}>
      <p className="text-sm font-semibold text-[#001840] mb-2">{label}</p>
      {file ? (
        <div className="flex items-center gap-2">
          <FileText size={14} className="text-green-600 shrink-0" />
          <span className="text-xs text-green-700 truncate flex-1">{file.name}</span>
          <button type="button" onClick={() => onFile(null)} className="text-red-400 hover:text-red-600"><X size={14} /></button>
        </div>
      ) : (
        <label className="flex items-center gap-2 cursor-pointer">
          <Upload size={14} className="text-gray-400" />
          <span className="text-xs text-gray-500">Drag and Drop or Upload File</span>
          <input type="file" accept={ACCEPTED} className="hidden" onChange={handleChange} />
        </label>
      )}
      <p className="text-[10px] text-gray-400 mt-2 italic">{FILE_HINT}</p>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

export function LevelSelection() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);       // 'JHS' | 'SHS' | 'College'
  const [showSSCModal, setShowSSCModal] = useState(false);
  const [sscFile, setSscFile] = useState(null);
  const [sscFileError, setSscFileError] = useState('');
  const [submittingSSC, setSubmittingSSC] = useState(false);
  const [sscDone, setSscDone] = useState(false);

  const handleSelect = (level) => {
    if (level.id === 'JHS') {
      setSelected('JHS');
      // Check if student already has an SSC application
      const token = localStorage.getItem('token');
      fetch('http://localhost:3000/api/enrollments/ssc-application/status', {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.json()).then(data => {
        if (data.applied) { setSscDone(true); }
      }).catch(() => {});
      setShowSSCModal(true);
    } else if (level.id === 'College') {
      navigate('/enrollment-form', { state: { educationLevel: 'College' } });
    } else {
      navigate('/hs-enrollment-form', { state: { educationLevel: level.id } });
    }
  };

  const handleSkipSSC = () => {
    setShowSSCModal(false);
    navigate('/hs-enrollment-form', { state: { educationLevel: 'JHS' } });
  };

  const handleSubmitSSC = async () => {
    if (!sscFile) { setSscFileError("Please upload your Grade 6 Report Card."); return; }
    setSscFileError('');
    setSubmittingSSC(true);
    try {
      const token = localStorage.getItem('token');
      const fd = new FormData();
      fd.append('sscCard', sscFile);
      const res = await fetch('http://localhost:3000/api/enrollments/ssc-application', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) {
        // If already applied, treat it as success — let them continue
        if (res.status === 400 && data.message?.toLowerCase().includes('already')) {
          setSscDone(true);
          return;
        }
        throw new Error(data.message || 'Failed to submit SSC application');
      }
      setSscDone(true);
    } catch (err) {
      setSscFileError(err.message);
    } finally {
      setSubmittingSSC(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFFDF0] via-[#FFF9E6] to-[#FFFDF0] flex items-start justify-center pt-10 pb-6 px-4">
      {/* Back button */}
      <button
        onClick={() => navigate('/my-enrollments')}
        className="fixed top-20 left-6 flex items-center gap-2 text-[#102A71] hover:text-[#001840] font-medium text-sm transition-colors z-10"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      {/* SSC Modal */}
      {showSSCModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full">
            {sscDone ? (
              <div className="text-center py-4">
                <button onClick={() => setShowSSCModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors">
                  <X size={20} />
                </button>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-[#001840] mb-2">SSC Application Submitted!</h3>
                <p className="text-sm text-gray-600">
                  The registrar will review your Grade 6 Report Card, schedule your entrance exam, and notify you of the result. You can proceed to fill out your enrollment form in the meantime.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
                      <FlaskConical className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[#001840]">Special Science Class (SSC)</h3>
                      <p className="text-xs text-gray-500">Grade 7 applicants only</p>
                    </div>
                  </div>
                  <button onClick={() => setShowSSCModal(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-4">
                  <p className="text-xs text-yellow-800 leading-relaxed">
                    Students with a Grade 6 General Average of <strong>85 or higher</strong> may apply for the Special Science Class. The registrar will verify your report card, schedule an entrance exam, and inform you of the result. You can then choose to enroll in SSC or Regular class.
                  </p>
                </div>

                <p className="text-sm font-semibold text-[#001840] mb-3">Would you like to apply for SSC?</p>

                <UploadBox
                  label="Grade 6 Report Card *"
                  file={sscFile}
                  onFile={setSscFile}
                  error={sscFileError}
                />

                <div className="flex gap-3 mt-5">
                  <button
                    onClick={handleSkipSSC}
                    className="flex-1 py-2.5 border-2 border-gray-300 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-all"
                  >
                    Skip — Enroll Regular
                  </button>
                  <button
                    onClick={handleSubmitSSC}
                    disabled={submittingSSC}
                    className="flex-1 py-2.5 bg-[#102A71] text-white rounded-xl text-sm font-semibold hover:bg-[#001840] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {submittingSSC ? <><Loader2 size={14} className="animate-spin" /> Submitting...</> : 'Apply for SSC'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div className="relative w-full max-w-3xl">
        {/* Header */}
        <div className="text-center mb-8">
          <img src="/emc_logo_nobg.png" alt="EMC Logo" className="w-16 h-16 mx-auto mb-3" />
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
                className="relative rounded-2xl border-2 p-8 transition-all duration-200 select-none border-[#102A71] bg-white text-[#001840] hover:bg-[#FFFDF0] hover:border-[#F5C400] hover:shadow-xl cursor-pointer"
              >
                <div className="flex flex-col items-center text-center gap-4">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center bg-[#EEF2FF]">
                    <Icon className="w-8 h-8 text-[#102A71]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold mb-1">{level.label}</h2>
                    <p className="text-sm text-gray-500">{level.subtitle}</p>
                  </div>
                  <span className="mt-2 px-4 py-1.5 bg-[#102A71] text-white text-sm font-semibold rounded-lg">
                    Enroll Now
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* SSC info note */}
        <div className="mt-6 flex items-start gap-3 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <FlaskConical className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-yellow-800">Applying for Grade 7 Special Science Class?</p>
            <p className="text-xs text-yellow-700 mt-0.5">Select Junior High School — you'll be asked to upload your Grade 6 Report Card before proceeding to the enrollment form. The registrar will schedule your SSC entrance exam.</p>
          </div>
        </div>

        <p className="text-center text-sm text-gray-400 mt-6">
          Select your education level to begin the enrollment process.
        </p>
      </div>
    </div>
  );
}
