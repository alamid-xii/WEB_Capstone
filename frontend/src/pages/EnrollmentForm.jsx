import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';
import { CheckCircle2, Upload, X, Loader2, BookOpen, FileText, ArrowLeft, ChevronLeft } from 'lucide-react';
import { createEnrollment, createEnrollmentWithTOR, uploadEnrollmentDocuments, getEnrollmentById } from '../services/enrollmentApi';

const COLLEGE_SAVE_KEY = 'college_enrollment_draft';

// ── Constants ─────────────────────────────────────────────────────────────────
const COURSES = ['BEED', 'BSIS', 'BSBA', 'BSED', 'BSCrim'];
const BSED_MAJORS = ['Filipino', 'English', 'Mathematics', 'Science', 'Social Studies'];
const BSBA_MAJORS = ['Financial Management', 'Marketing Management'];
const CREDENTIALS = [
  { key: 'f138', label: 'F-138' },
  { key: 'f137a', label: 'F-137-A' },
  { key: 'cgmc', label: 'CGMC' },
  { key: 'tor', label: 'TOR' },
  { key: 'birthCert', label: 'Birth Certificate' },
  { key: 'marriageCert', label: 'Marriage Certificate', optional: true },
];
const STEPS = [
  { id: 1, label: 'Enrollment Type' },
  { id: 2, label: 'Personal Info' },
  { id: 3, label: 'Family Background' },
  { id: 4, label: 'Education' },
  { id: 5, label: 'Course Details' },
  { id: 6, label: 'Subjects' },
  { id: 7, label: 'Documents' },
];
const API = 'http://localhost:3000/api';

// ── Helpers ───────────────────────────────────────────────────────────────────
const onlyDigits = (e) => { if (!/[0-9]/.test(e.key) && !['Backspace','Tab','ArrowLeft','ArrowRight','Delete'].includes(e.key)) e.preventDefault(); };
const onlyLetters = (e) => { if (!/[a-zA-ZÀ-ÿ\s\-']/.test(e.key) && !['Backspace','Tab','ArrowLeft','ArrowRight','Delete'].includes(e.key)) e.preventDefault(); };

function Field({ label, required, error, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-semibold text-[#001840]">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
    </div>
  );
}

function Input({ error, ...props }) {
  return (
    <input
      {...props}
      className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all ${
        error ? 'border-red-400 focus:ring-red-200' : 'border-gray-200 focus:ring-[#102A71]/20 focus:border-[#102A71]'
      } bg-white text-[#001840]`}
    />
  );
}

function Select({ error, children, ...props }) {
  return (
    <select
      {...props}
      className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all bg-white text-[#001840] ${
        error ? 'border-red-400 focus:ring-red-200' : 'border-gray-200 focus:ring-[#102A71]/20 focus:border-[#102A71]'
      }`}
    >
      {children}
    </select>
  );
}

// ── Progress Bar ──────────────────────────────────────────────────────────────
function ProgressBar({ currentStep, totalSteps, onStepClick, stepFills }) {
  const pct = Math.round(((currentStep - 1) / (totalSteps - 1)) * 100);
  return (
    <div className="bg-white border-b border-gray-100 shadow-sm sticky top-16 lg:top-20 z-40">
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-3 relative">
          <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 z-0" />
          <div className="absolute top-4 left-0 h-0.5 bg-[#102A71] z-0 transition-all duration-500" style={{ width: `${pct}%` }} />
          {STEPS.map((step) => {
            const sid = step.id;
            const active = sid === currentStep;
            const fill = stepFills ? (stepFills[sid] ?? 0) : (sid < currentStep ? 100 : 0);
            const complete = fill === 100 && !active;
            const circleStyle = complete
              ? { background: '#102A71', border: '2px solid #102A71', color: '#fff' }
              : active
                ? { background: '#F5C400', border: '2px solid #F5C400', color: '#001840' }
                : fill > 0
                  ? { background: `conic-gradient(#102A71 ${fill * 3.6}deg, #e5e7eb ${fill * 3.6}deg)`, border: '2px solid #102A71', color: '#102A71' }
                  : { background: '#fff', border: '2px solid #d1d5db', color: '#9ca3af' };
            return (
              <div key={sid} onClick={() => onStepClick && onStepClick(sid)} className="flex flex-col items-center z-10 gap-1 cursor-pointer group">
                <div style={circleStyle} className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 group-hover:scale-110 group-hover:shadow-md">
                  {fill > 0 && !complete && !active
                    ? <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center text-[10px] font-bold text-[#102A71]">{sid}</div>
                    : complete ? <CheckCircle2 size={14} /> : sid}
                </div>
                <span className={`text-[9px] font-medium hidden sm:block text-center leading-tight max-w-[60px] transition-colors ${active ? 'text-[#001840]' : complete ? 'text-[#102A71]' : fill > 0 ? 'text-[#102A71]' : 'text-gray-400 group-hover:text-[#102A71]'}`}>{step.label}</span>
              </div>
            );
          })}
        </div>
        <div className="w-full bg-gray-100 rounded-full h-1.5">
          <div className="bg-gradient-to-r from-[#102A71] to-[#F5C400] h-1.5 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-xs text-gray-400 mt-1 text-right">Step {currentStep} of {totalSteps}</p>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export function EnrollmentForm({ enrollmentId: propId, readOnly = false }) {
  const { id: paramId } = useParams();
  const id = propId || paramId;
  const navigate = useNavigate();

  const [step, setStep] = useState(() => {
    try { const s = localStorage.getItem(COLLEGE_SAVE_KEY + '_step'); return s ? parseInt(s) : 1; } catch(_) { return 1; }
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [savedId, setSavedId] = useState(id || null);
  const [subjects, setSubjects] = useState([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [showBackDialog, setShowBackDialog] = useState(false);
  const [previewModal, setPreviewModal] = useState(null);

  const defaultForm = {
    enrollmentType: '', studentStatus: '', torFile: null,
    familyName: '', firstName: '', middleName: '',
    sex: '', dateOfBirth: '', placeOfBirth: '',
    email: '', mobileNumber: '',
    fatherName: '', fatherOccupation: '', fatherAddress: '',
    motherName: '', motherOccupation: '', motherAddress: '',
    guardianName: '', guardianOccupation: '', guardianAddress: '',
    primarySchool: '', primaryAyStart: '', primaryAyEnd: '',
    intermediateSchool: '', intermediateAyStart: '', intermediateAyEnd: '',
    juniorHighSchool: '', juniorHighAyStart: '', juniorHighAyEnd: '',
    seniorHighSchool: '', seniorHighAyStart: '', seniorHighAyEnd: '',
    seniorHighAddress: '',
    lastCollegeName: '', lastCollegeCourse: '', lastCollegeAddress: '',
    lastCollegeAyStart: '', lastCollegeAyEnd: '',
    course: '', major: '', curriculumYear: '',
    semester: '', yearStart: '', yearEnd: '',
    dateEnrolled: '',
    studentNumber: ['', '', '', '', '', ''],
    studentType: 'New',
    credentials: {}, docFiles: {},
  };

  const [form, setForm] = useState(() => {
    try {
      const saved = localStorage.getItem(COLLEGE_SAVE_KEY);
      if (saved) { const parsed = JSON.parse(saved); return { ...defaultForm, ...parsed, docFiles: {}, torFile: null }; }
    } catch(_) {}
    return defaultForm;
  });

  // Auto-save on change
  useEffect(() => {
    try {
      const { docFiles, torFile, ...saveable } = form;
      localStorage.setItem(COLLEGE_SAVE_KEY, JSON.stringify(saveable));
    } catch(_) {}
  }, [form]);
  useEffect(() => { localStorage.setItem(COLLEGE_SAVE_KEY + '_step', step); }, [step]);

  function clearDraft() { localStorage.removeItem(COLLEGE_SAVE_KEY); localStorage.removeItem(COLLEGE_SAVE_KEY + '_step'); }

  // Step fill percentages
  function stepFill(s) {
    if (s === 1) { return form.enrollmentType ? 100 : 0; }
    if (s === 2) { const f = [form.familyName, form.firstName, form.sex, form.dateOfBirth, form.email, form.mobileNumber]; return Math.round(f.filter(Boolean).length / f.length * 100); }
    if (s === 3) { const f = [form.fatherName, form.motherName]; return Math.round(f.filter(Boolean).length / f.length * 100); }
    if (s === 4) { return form.primarySchool ? 50 : 0; }
    if (s === 5) { const f = [form.course, form.semester, form.yearStart]; return Math.round(f.filter(Boolean).length / f.length * 100); }
    if (s === 6) { return subjects.length > 0 ? 100 : 0; }
    if (s === 7) { const uploaded = CREDENTIALS.filter(c => form.docFiles[c.key]).length; return Math.round(uploaded / CREDENTIALS.length * 100); }
    return 0;
  }
  const stepFills = Object.fromEntries(STEPS.map(s => [s.id, stepFill(s.id)]));

  function goToStep(target) {
    if (target === step) return;
    setErrors({});
    setStep(target);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));
  const setErr = (key, msg) => setErrors(prev => ({ ...prev, [key]: msg }));
  const clearErr = (key) => setErrors(prev => { const n = { ...prev }; delete n[key]; return n; });

  // Load existing enrollment if editing
  useEffect(() => {
    if (id) {
      getEnrollmentById(id).then(data => {
        const e = data.enrollment || data;
        setForm(prev => ({
          ...prev,
          enrollmentType: e.enrollmentType || '',
          studentStatus: e.studentStatus || '',
          familyName: e.familyName || '',
          firstName: e.firstName || '',
          middleName: e.middleName || '',
          sex: e.sex || '',
          dateOfBirth: e.dateOfBirth || '',
          placeOfBirth: e.placeOfBirth || '',
          email: e.email || '',
          mobileNumber: e.mobileNumber || '',
          fatherName: e.fatherName || '',
          fatherOccupation: e.fatherOccupation || '',
          fatherAddress: e.fatherAddress || '',
          motherName: e.motherName || '',
          motherOccupation: e.motherOccupation || '',
          motherAddress: e.motherAddress || '',
          guardianName: e.guardianName || '',
          guardianOccupation: e.guardianOccupation || '',
          guardianAddress: e.guardianAddress || '',
          course: e.course || '',
          major: e.major || '',
          curriculumYear: e.curriculumYear || '',
          semester: e.semester || '',
          dateEnrolled: e.dateEnrolled || '',
          studentNumber: e.studentNumber ? e.studentNumber.split('').slice(0, 6) : ['','','','','',''],
          studentType: e.studentType || 'New',
          credentials: Array.isArray(e.admissionCredentials)
            ? Object.fromEntries(e.admissionCredentials.map(k => [k, true]))
            : {},
        }));
        setSavedId(e.id);
      }).catch(() => {});
    }
  }, [id]);

  // Load subjects when course changes
  useEffect(() => {
    if (!form.course) return;
    setSubjectsLoading(true);
    const isIrregular = form.enrollmentType === 'continuing' && form.studentStatus === 'irregular';
    fetch(`${API}/academic/subjects?programCode=${form.course}&yearLevel=1&semester=1st`)
      .then(r => r.json())
      .then(data => {
        if (isIrregular) {
          setAvailableSubjects(Array.isArray(data) ? data : []);
          setSubjects([]);
        } else {
          setSubjects(Array.isArray(data) ? data : []);
          setAvailableSubjects([]);
        }
      })
      .catch(() => {})
      .finally(() => setSubjectsLoading(false));
  }, [form.course, form.enrollmentType, form.studentStatus]);

  // ── Validation per step ─────────────────────────────────────────────────────
  function validateStep(s) {
    const errs = {};
    if (s === 1) {
      if (!form.enrollmentType) errs.enrollmentType = 'Please select an enrollment type';
      if (form.enrollmentType === 'continuing' && !form.studentStatus) errs.studentStatus = 'Please select Regular or Irregular';
      if (form.enrollmentType === 'transferee' && !form.torFile) errs.torFile = 'TOR is required for transferees';
    }
    if (s === 2) {
      if (!form.familyName.trim()) errs.familyName = 'Family name is required';
      else if (/\d/.test(form.familyName)) errs.familyName = 'Name cannot contain numbers';
      if (!form.firstName.trim()) errs.firstName = 'First name is required';
      else if (/\d/.test(form.firstName)) errs.firstName = 'Name cannot contain numbers';
      if (form.middleName && /\d/.test(form.middleName)) errs.middleName = 'Name cannot contain numbers';
      if (!form.sex) errs.sex = 'Sex is required';
      if (!form.dateOfBirth) errs.dateOfBirth = 'Date of birth is required';
      if (!form.placeOfBirth.trim()) errs.placeOfBirth = 'Place of birth is required';
      if (!form.email.trim()) errs.email = 'Email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email format';
      if (!form.mobileNumber.trim()) errs.mobileNumber = 'Mobile number is required';
      else if (!/^09\d{9}$/.test(form.mobileNumber)) errs.mobileNumber = 'Must be 11 digits starting with 09';
    }
    if (s === 5) {
      if (!form.course) errs.course = 'Course is required';
      if (!form.semester.trim()) errs.semester = 'Semester is required';
      if (!form.yearStart || !form.yearEnd) errs.academicYear = 'Academic year is required';
      else if (!/^\d{4}$/.test(form.yearStart) || !/^\d{4}$/.test(form.yearEnd)) errs.academicYear = 'Enter 4-digit year (e.g. 2025)';
    }
    if (s === 7) {
      const uploaded = CREDENTIALS.filter(c => !c.optional && form.docFiles[c.key]);
      if (CREDENTIALS.filter(c => form.docFiles[c.key]).length === 0) {
        errs.credentials = 'Please upload at least one document before submitting.';
      }
    }
    return errs;
  }

  function handleNext() {
    const errs = validateStep(step);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setStep(s => s + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleBack() {
    setErrors({});
    setStep(s => s - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ── Submit ──────────────────────────────────────────────────────────────────
  async function handleSubmit() {
    const errs = validateStep(7);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setSubmitting(true);
    try {
      const admissionCredentials = CREDENTIALS.filter(c => form.docFiles[c.key]).map(c => c.key);
      const enrollmentData = {
        educationLevel: 'College',
        enrollmentType: form.enrollmentType,
        studentStatus: form.studentStatus || null,
        studentType: form.studentType,
        studentNumber: form.studentNumber.join(''),
        semester: form.semester,
        academicYear: form.yearStart && form.yearEnd ? `${form.yearStart}-${form.yearEnd}` : '',
        dateEnrolled: form.dateEnrolled || null,
        course: form.course,
        major: form.major || '',
        curriculumYear: form.curriculumYear || '',
        admissionCredentials,
        familyName: form.familyName,
        firstName: form.firstName,
        middleName: form.middleName,
        sex: form.sex,
        dateOfBirth: form.dateOfBirth,
        placeOfBirth: form.placeOfBirth,
        email: form.email,
        mobileNumber: form.mobileNumber,
        fatherName: form.fatherName,
        fatherOccupation: form.fatherOccupation,
        fatherAddress: form.fatherAddress,
        motherName: form.motherName,
        motherOccupation: form.motherOccupation,
        motherAddress: form.motherAddress,
        guardianName: form.guardianName,
        guardianOccupation: form.guardianOccupation,
        guardianAddress: form.guardianAddress,
        educationalBackground: {
          primary: { school: form.primarySchool, ayStart: form.primaryAyStart, ayEnd: form.primaryAyEnd },
          intermediate: { school: form.intermediateSchool, ayStart: form.intermediateAyStart, ayEnd: form.intermediateAyEnd },
          juniorHigh: { school: form.juniorHighSchool, ayStart: form.juniorHighAyStart, ayEnd: form.juniorHighAyEnd },
          seniorHigh: { school: form.seniorHighSchool, ayStart: form.seniorHighAyStart, ayEnd: form.seniorHighAyEnd },
          seniorHighAddress: form.seniorHighAddress,
          lastCollege: { name: form.lastCollegeName, course: form.lastCollegeCourse, address: form.lastCollegeAddress, ayStart: form.lastCollegeAyStart, ayEnd: form.lastCollegeAyEnd },
        },
        subjects: subjects.map(s => ({ code: s.code, description: s.description, units: String(s.units) })),
      };

      let result;
      if (form.enrollmentType === 'transferee' && form.torFile) {
        const fd = new FormData();
        fd.append('enrollmentData', JSON.stringify(enrollmentData));
        fd.append('tor', form.torFile);
        result = await createEnrollmentWithTOR(fd);
      } else {
        result = await createEnrollment(enrollmentData);
      }

      const eid = result.enrollment?.id;
      if (eid) {
        // Upload documents — if this fails, rollback the enrollment
        const filesToUpload = {};
        Object.entries(form.docFiles).forEach(([k, f]) => { if (f) filesToUpload[k] = f; });
        if (Object.keys(filesToUpload).length > 0) {
          try {
            await uploadEnrollmentDocuments(eid, filesToUpload);
          } catch (uploadErr) {
            console.error('Document upload error:', uploadErr);
            // Delete the enrollment so student can retry cleanly
            try {
              const token = localStorage.getItem('token');
              await fetch(`http://localhost:3000/api/enrollments/${eid}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
              });
            } catch (_) {}
            throw new Error('Document upload failed: ' + uploadErr.message + '. Please try again.');
          }
        }
        toast.success('Enrollment submitted successfully!', {
          description: `Enrollment ID: ${eid}`,
        });
        clearDraft();
        navigate('/my-enrollments');
      } else {
        throw new Error('No enrollment ID returned from server');
      }
    } catch (err) {
      console.error('Submit error:', err);
      toast.error(err.message || 'Failed to submit enrollment');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Read-only view ──────────────────────────────────────────────────────────
  if (readOnly || (id && !submitting)) {
    return <EnrollmentReadOnly id={id} />;
  }

  // ── Step renderers ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFFDF0] via-[#FFF9E6] to-[#FFFDF0]">

      {/* File preview modal */}
      {previewModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex flex-col">
          <div className="flex items-center justify-between bg-[#001840] px-4 py-3 shrink-0">
            <span className="text-white text-sm font-medium truncate max-w-xs">{previewModal.name}</span>
            <button onClick={() => setPreviewModal(null)} className="flex items-center gap-1.5 text-white bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all">
              <X size={14}/> Close
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            {previewModal.isPdf
              ? <iframe src={previewModal.url} className="w-full h-full border-0" title={previewModal.name}/>
              : <div className="w-full h-full flex items-center justify-center p-4"><img src={previewModal.url} alt={previewModal.name} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"/></div>
            }
          </div>
        </div>
      )}

      {/* Save progress dialog */}
      {showBackDialog && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-[#001840] mb-2">Save your progress?</h3>
            <p className="text-sm text-gray-600 mb-5">Your form data is automatically saved. When you come back, you can continue where you left off.</p>
            <div className="flex gap-3">
              <button onClick={() => { clearDraft(); navigate('/enroll'); }} className="flex-1 py-2.5 border-2 border-red-300 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-50 transition-all">Discard & Leave</button>
              <button onClick={() => { setShowBackDialog(false); navigate('/enroll'); }} className="flex-1 py-2.5 bg-[#102A71] text-white rounded-xl text-sm font-semibold hover:bg-[#001840] transition-all">Save & Leave</button>
            </div>
            <button onClick={() => setShowBackDialog(false)} className="w-full mt-2 py-2 text-sm text-gray-400 hover:text-gray-600">Stay on form</button>
          </div>
        </div>
      )}

      <div className="bg-white border-b border-gray-100 shadow-sm sticky top-16 lg:top-20 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button onClick={() => setShowBackDialog(true)} className="flex items-center gap-1.5 text-sm text-[#102A71] hover:text-[#001840] font-medium mb-3 transition-colors">
            <ArrowLeft size={15}/> Back to Level Selection
          </button>
          <div className="flex items-center justify-between mb-3 relative">
            <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 z-0" />
            <div className="absolute top-4 left-0 h-0.5 bg-[#102A71] z-0 transition-all duration-500" style={{ width: `${Math.round(((step - 1) / (STEPS.length - 1)) * 100)}%` }} />
            {STEPS.map((s) => {
              const sid = s.id;
              const active = sid === step;
              const fill = stepFills[sid] ?? 0;
              const complete = fill === 100 && !active;
              const circleStyle = complete
                ? { background: '#102A71', border: '2px solid #102A71', color: '#fff' }
                : active
                  ? { background: '#F5C400', border: '2px solid #F5C400', color: '#001840' }
                  : fill > 0
                    ? { background: `conic-gradient(#102A71 ${fill * 3.6}deg, #e5e7eb ${fill * 3.6}deg)`, border: '2px solid #102A71', color: '#102A71' }
                    : { background: '#fff', border: '2px solid #d1d5db', color: '#9ca3af' };
              return (
                <div key={sid} onClick={() => goToStep(sid)} className="flex flex-col items-center z-10 gap-1 cursor-pointer group">
                  <div style={circleStyle} className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 group-hover:scale-110 group-hover:shadow-md">
                    {fill > 0 && !complete && !active
                      ? <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center text-[10px] font-bold text-[#102A71]">{sid}</div>
                      : complete ? <CheckCircle2 size={14} /> : sid}
                  </div>
                  <span className={`text-[9px] font-medium hidden sm:block text-center leading-tight max-w-[60px] transition-colors ${active ? 'text-[#001840]' : complete ? 'text-[#102A71]' : fill > 0 ? 'text-[#102A71]' : 'text-gray-400 group-hover:text-[#102A71]'}`}>{s.label}</span>
                </div>
              );
            })}
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div className="bg-gradient-to-r from-[#102A71] to-[#F5C400] h-1.5 rounded-full transition-all duration-500" style={{ width: `${Math.round(((step - 1) / (STEPS.length - 1)) * 100)}%` }} />
          </div>
          <p className="text-xs text-gray-400 mt-1 text-right">Step {step} of {STEPS.length}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-4 pb-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-[#001840]">{STEPS[step - 1].label}</h2>
          <p className="text-sm text-gray-500 mt-1">Step {step} of {STEPS.length}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-8">
          {step === 1 && <Step1 form={form} set={set} errors={errors} setErrors={setErrors} />}
          {step === 2 && <Step2 form={form} set={set} errors={errors} />}
          {step === 3 && <Step3 form={form} set={set} errors={errors} />}
          {step === 4 && <Step4 form={form} set={set} errors={errors} />}
          {step === 5 && <Step5 form={form} set={set} errors={errors} />}
          {step === 6 && <Step6 form={form} subjects={subjects} availableSubjects={availableSubjects} selectedSubjectIds={selectedSubjectIds} setSelectedSubjectIds={setSelectedSubjectIds} subjectsLoading={subjectsLoading} />}
          {step === 7 && <Step7 form={form} set={set} errors={errors} previewModal={previewModal} setPreviewModal={setPreviewModal} />}
        </div>

        {step === STEPS.length && (
          <div className="flex justify-end mt-6">
            <button onClick={handleSubmit} disabled={submitting}
              className="flex items-center gap-2 px-8 py-3 bg-[#F5C400] text-[#001840] rounded-xl font-bold hover:bg-[#FFDC5F] transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed">
              {submitting ? <><Loader2 size={18} className="animate-spin" /> Submitting...</> : <><CheckCircle2 size={18} /> Submit Enrollment</>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Step 1: Enrollment Type ───────────────────────────────────────────────────
function Step1({ form, set, errors, setErrors }) {
  const types = [
    { value: 'first-time', label: 'First-time', desc: 'New college student enrolling for the first time' },
    { value: 'continuing', label: 'Continuing', desc: 'Currently enrolled, proceeding to next semester' },
    { value: 'returnee', label: 'Returnee', desc: 'Previously enrolled, returning after a break' },
    { value: 'transferee', label: 'Transferee', desc: 'Coming from another school or institution' },
  ];
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-gray-600 mb-4">Select the type that best describes your enrollment situation.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {types.map(t => (
            <button
              key={t.value}
              type="button"
              onClick={() => { set('enrollmentType', t.value); set('studentStatus', ''); }}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                form.enrollmentType === t.value
                  ? 'border-[#102A71] bg-[#EEF2FF]'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className={`w-2 h-2 rounded-full mb-2 ${form.enrollmentType === t.value ? 'bg-[#102A71]' : 'bg-gray-300'}`} />
              <div className="font-semibold text-[#001840]">{t.label}</div>
              <div className="text-xs text-gray-500 mt-0.5">{t.desc}</div>
            </button>
          ))}
        </div>
        {errors.enrollmentType && <p className="text-xs text-red-500 mt-2">{errors.enrollmentType}</p>}
      </div>

      {form.enrollmentType === 'continuing' && (
        <div>
          <p className="text-sm font-semibold text-[#001840] mb-2">Student Status <span className="text-red-500">*</span></p>
          <div className="flex gap-3">
            {['regular', 'irregular'].map(s => (
              <button
                key={s}
                type="button"
                onClick={() => set('studentStatus', s)}
                className={`px-5 py-2.5 rounded-xl border-2 text-sm font-medium capitalize transition-all ${
                  form.studentStatus === s ? 'border-[#102A71] bg-[#EEF2FF] text-[#001840]' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          {errors.studentStatus && <p className="text-xs text-red-500 mt-1">{errors.studentStatus}</p>}
          {form.studentStatus === 'irregular' && (
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2">
              Irregular students will manually select their subjects in Step 6.
            </p>
          )}
        </div>
      )}

      {form.enrollmentType === 'transferee' && (
        <div>
          <p className="text-sm font-semibold text-[#001840] mb-2">Upload Transcript of Records (TOR) <span className="text-red-500">*</span></p>
          <label className={`flex items-center gap-3 p-4 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
            form.torFile ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-[#102A71] hover:bg-[#EEF2FF]'
          }`}>
            <Upload size={20} className={form.torFile ? 'text-green-600' : 'text-gray-400'} />
            <div>
              <p className="text-sm font-medium text-[#001840]">{form.torFile ? form.torFile.name : 'Click to upload TOR'}</p>
              <p className="text-xs text-gray-400">PDF, JPG, PNG — max 10MB</p>
            </div>
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={e => set('torFile', e.target.files[0])} />
          </label>
          {errors.torFile && <p className="text-xs text-red-500 mt-1">{errors.torFile}</p>}
        </div>
      )}

      {form.enrollmentType === 'returnee' && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          As a returnee, the admin will verify your previous records and reactivate your account before final approval.
        </div>
      )}
    </div>
  );
}

// ── Step 2: Personal Information ──────────────────────────────────────────────
function Step2({ form, set, errors }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Field label="Family Name" required error={errors.familyName}>
          <Input value={form.familyName} error={errors.familyName} placeholder="e.g. Dela Cruz"
            onKeyDown={onlyLetters}
            onChange={e => set('familyName', e.target.value)} />
        </Field>
        <Field label="First Name" required error={errors.firstName}>
          <Input value={form.firstName} error={errors.firstName} placeholder="e.g. Juan"
            onKeyDown={onlyLetters}
            onChange={e => set('firstName', e.target.value)} />
        </Field>
        <Field label="Middle Name" error={errors.middleName}>
          <Input value={form.middleName} error={errors.middleName} placeholder="e.g. Santos"
            onKeyDown={onlyLetters}
            onChange={e => set('middleName', e.target.value)} />
        </Field>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Sex" required error={errors.sex}>
          <Select value={form.sex} error={errors.sex} onChange={e => set('sex', e.target.value)}>
            <option value="">Select sex</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </Select>
        </Field>
        <Field label="Date of Birth" required error={errors.dateOfBirth}>
          <Input type="date" value={form.dateOfBirth} error={errors.dateOfBirth}
            onChange={e => set('dateOfBirth', e.target.value)} />
        </Field>
      </div>
      <Field label="Place of Birth" required error={errors.placeOfBirth}>
        <Input value={form.placeOfBirth} error={errors.placeOfBirth} placeholder="e.g. Calapan City, Oriental Mindoro"
          onChange={e => set('placeOfBirth', e.target.value)} />
      </Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Email Address" required error={errors.email}>
          <Input type="email" value={form.email} error={errors.email} placeholder="your@email.com"
            onChange={e => set('email', e.target.value)} />
        </Field>
        <Field label="Mobile Number" required error={errors.mobileNumber}>
          <Input value={form.mobileNumber} error={errors.mobileNumber} placeholder="09XXXXXXXXX" maxLength={11}
            onKeyDown={onlyDigits}
            onChange={e => set('mobileNumber', e.target.value)} />
        </Field>
      </div>
    </div>
  );
}

// ── Step 3: Family Background ─────────────────────────────────────────────────
function Step3({ form, set, errors }) {
  const sections = [
    { prefix: 'father', title: "Father's Information" },
    { prefix: 'mother', title: "Mother's Information" },
    { prefix: 'guardian', title: "Guardian's Information" },
  ];
  return (
    <div className="space-y-6">
      {sections.map(({ prefix, title }) => (
        <div key={prefix}>
          <h3 className="text-sm font-bold text-[#001840] mb-3 pb-2 border-b border-gray-100">{title}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Full Name">
              <Input value={form[`${prefix}Name`]} placeholder="Full name"
                onKeyDown={onlyLetters}
                onChange={e => set(`${prefix}Name`, e.target.value)} />
            </Field>
            <Field label="Occupation">
              <Input value={form[`${prefix}Occupation`]} placeholder="Occupation"
                onChange={e => set(`${prefix}Occupation`, e.target.value)} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Address">
                <Input value={form[`${prefix}Address`]} placeholder="Complete address"
                  onChange={e => set(`${prefix}Address`, e.target.value)} />
              </Field>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Step 4: Educational Background ───────────────────────────────────────────
function Step4({ form, set, errors }) {
  const schools = [
    { label: 'Primary School', prefix: 'primary' },
    { label: 'Intermediate School', prefix: 'intermediate' },
    { label: 'Junior High School', prefix: 'juniorHigh' },
    { label: 'Senior High School', prefix: 'seniorHigh' },
  ];
  return (
    <div className="space-y-6">
      {schools.map(({ label, prefix }) => (
        <div key={prefix}>
          <h3 className="text-sm font-bold text-[#001840] mb-3 pb-2 border-b border-gray-100">{label}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1">
              <Field label="School Name">
                <Input value={form[`${prefix}School`]} placeholder="School name"
                  onChange={e => set(`${prefix}School`, e.target.value)} />
              </Field>
            </div>
            <Field label="AY Start (e.g. 2020)">
              <Input value={form[`${prefix}AyStart`]} placeholder="2020" maxLength={4}
                onKeyDown={onlyDigits}
                onChange={e => set(`${prefix}AyStart`, e.target.value)} />
            </Field>
            <Field label="AY End (e.g. 2021)">
              <Input value={form[`${prefix}AyEnd`]} placeholder="2021" maxLength={4}
                onKeyDown={onlyDigits}
                onChange={e => set(`${prefix}AyEnd`, e.target.value)} />
            </Field>
          </div>
          {prefix === 'seniorHigh' && (
            <div className="mt-3">
              <Field label="Complete Address of Senior High School">
                <Input value={form.seniorHighAddress} placeholder="Complete address"
                  onChange={e => set('seniorHighAddress', e.target.value)} />
              </Field>
            </div>
          )}
        </div>
      ))}
      <div>
        <h3 className="text-sm font-bold text-[#001840] mb-3 pb-2 border-b border-gray-100">Last College Attended</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="College Name">
            <Input value={form.lastCollegeName} placeholder="College name"
              onChange={e => set('lastCollegeName', e.target.value)} />
          </Field>
          <Field label="Course Taken">
            <Input value={form.lastCollegeCourse} placeholder="Course"
              onChange={e => set('lastCollegeCourse', e.target.value)} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Address">
              <Input value={form.lastCollegeAddress} placeholder="Complete address"
                onChange={e => set('lastCollegeAddress', e.target.value)} />
            </Field>
          </div>
          <Field label="AY Start">
            <Input value={form.lastCollegeAyStart} placeholder="2022" maxLength={4}
              onKeyDown={onlyDigits}
              onChange={e => set('lastCollegeAyStart', e.target.value)} />
          </Field>
          <Field label="AY End">
            <Input value={form.lastCollegeAyEnd} placeholder="2023" maxLength={4}
              onKeyDown={onlyDigits}
              onChange={e => set('lastCollegeAyEnd', e.target.value)} />
          </Field>
        </div>
      </div>
    </div>
  );
}

// ── Step 5: Course & Enrollment Details ───────────────────────────────────────
function Step5({ form, set, errors }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Course" required error={errors.course}>
          <Select value={form.course} error={errors.course} onChange={e => { set('course', e.target.value); set('major', ''); }}>
            <option value="">Select course</option>
            {COURSES.map(c => <option key={c} value={c}>{c}</option>)}
          </Select>
        </Field>
        {form.course === 'BSED' && (
          <Field label="Major">
            <Select value={form.major} onChange={e => set('major', e.target.value)}>
              <option value="">Select major</option>
              {BSED_MAJORS.map(m => <option key={m} value={m}>{m}</option>)}
            </Select>
          </Field>
        )}
        {form.course === 'BSBA' && (
          <Field label="Major">
            <Select value={form.major} onChange={e => set('major', e.target.value)}>
              <option value="">Select major</option>
              {BSBA_MAJORS.map(m => <option key={m} value={m}>{m}</option>)}
            </Select>
          </Field>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Field label="Semester" required error={errors.semester}>
          <Select value={form.semester} error={errors.semester} onChange={e => set('semester', e.target.value)}>
            <option value="">Select</option>
            <option value="1">1st Semester</option>
            <option value="2">2nd Semester</option>
            <option value="Summer">Summer</option>
          </Select>
        </Field>
        <Field label="AY Start (e.g. 2025)" required error={errors.academicYear}>
          <Input value={form.yearStart} error={errors.academicYear} placeholder="2025" maxLength={4}
            onKeyDown={onlyDigits}
            onChange={e => set('yearStart', e.target.value)} />
        </Field>
        <Field label="AY End (e.g. 2026)">
          <Input value={form.yearEnd} placeholder="2026" maxLength={4}
            onKeyDown={onlyDigits}
            onChange={e => set('yearEnd', e.target.value)} />
        </Field>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Curriculum Year">
          <Input value={form.curriculumYear} placeholder="e.g. 2024" maxLength={4}
            onKeyDown={onlyDigits}
            onChange={e => set('curriculumYear', e.target.value)} />
        </Field>
        <Field label="Date Enrolled">
          <Input type="date" value={form.dateEnrolled} onChange={e => set('dateEnrolled', e.target.value)} />
        </Field>
      </div>
      <div>
        <p className="text-sm font-semibold text-[#001840] mb-2">Student Number</p>
        <div className="flex gap-2 items-center">
          {form.studentNumber.map((digit, i) => (
            <input
              key={i}
              type="text"
              maxLength={1}
              value={digit}
              onKeyDown={onlyDigits}
              onChange={e => {
                const arr = [...form.studentNumber];
                arr[i] = e.target.value;
                set('studentNumber', arr);
              }}
              className="w-10 h-10 text-center border-2 border-gray-200 rounded-lg text-sm font-mono font-bold focus:outline-none focus:border-[#102A71] focus:ring-2 focus:ring-[#102A71]/20"
            />
          ))}
        </div>
      </div>
      <div>
        <p className="text-sm font-semibold text-[#001840] mb-2">Student Type</p>
        <div className="flex gap-3">
          {['New', 'Old'].map(t => (
            <button key={t} type="button" onClick={() => set('studentType', t)}
              className={`px-5 py-2 rounded-xl border-2 text-sm font-medium transition-all ${
                form.studentType === t ? 'border-[#102A71] bg-[#EEF2FF] text-[#001840]' : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}>{t} Student</button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Step 6: Subjects ──────────────────────────────────────────────────────────
function Step6({ form, subjects, availableSubjects, selectedSubjectIds, setSelectedSubjectIds, subjectsLoading }) {
  const isIrregular = form.enrollmentType === 'continuing' && form.studentStatus === 'irregular';
  if (!form.course) {
    return (
      <div className="text-center py-10 text-gray-400">
        <BookOpen size={40} className="mx-auto mb-3 opacity-40" />
        <p>Please select a course in Step 5 first.</p>
      </div>
    );
  }
  if (subjectsLoading) {
    return (
      <div className="text-center py-10 text-gray-400">
        <Loader2 size={32} className="mx-auto mb-3 animate-spin" />
        <p>Loading subjects for {form.course}...</p>
      </div>
    );
  }
  if (isIrregular) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-600">Select the subjects you want to enroll in:</p>
        {availableSubjects.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No subjects found for {form.course}.</p>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {availableSubjects.map(s => (
              <label key={s.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 cursor-pointer hover:bg-[#EEF2FF] transition-colors">
                <input type="checkbox"
                  checked={selectedSubjectIds.includes(s.id)}
                  onChange={() => setSelectedSubjectIds(prev =>
                    prev.includes(s.id) ? prev.filter(i => i !== s.id) : [...prev, s.id]
                  )}
                  className="w-4 h-4 accent-[#102A71]" />
                <span className="font-mono text-xs text-[#102A71] w-20 shrink-0">{s.code}</span>
                <span className="text-sm flex-1">{s.description}</span>
                <span className="text-xs text-gray-400">{s.units} units</span>
              </label>
            ))}
          </div>
        )}
        <p className="text-xs text-gray-400">{selectedSubjectIds.length} subject(s) selected</p>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
        <CheckCircle2 size={16} />
        Subjects auto-loaded from the {form.course} curriculum (Year 1, 1st Semester)
      </div>
      {subjects.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">No subjects found for {form.course}. You can proceed — subjects will be assigned by the admin.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="w-full text-sm">
            <thead className="bg-[#001840] text-white">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-semibold">Code</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold">Description</th>
                <th className="px-4 py-2.5 text-center text-xs font-semibold">Units</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {subjects.map((s, i) => (
                <tr key={i} className="hover:bg-[#FFFDF0]">
                  <td className="px-4 py-2.5 font-mono text-xs text-[#102A71] font-semibold">{s.code}</td>
                  <td className="px-4 py-2.5 text-gray-700">{s.description}</td>
                  <td className="px-4 py-2.5 text-center text-gray-500">{s.units}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Step 7: Documents ─────────────────────────────────────────────────────────
function Step7({ form, set, errors, previewModal, setPreviewModal }) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-[#001840] mb-1">Upload Required Documents <span className="text-red-500">*</span></p>
        <p className="text-xs text-gray-500 mb-4">Upload a clear scan or photo of each document. At least one is required.</p>
      </div>
      {CREDENTIALS.map(cred => {
        const file = form.docFiles[cred.key];
        const previewUrl = file ? URL.createObjectURL(file) : null;
        return (
          <div key={cred.key} className={`p-4 rounded-xl border-2 transition-all ${file ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-[#001840]">{cred.label}</span>
                {cred.optional && <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Optional</span>}
              </div>
              {file && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Uploaded</span>}
            </div>
            {file ? (
              <div className="flex items-center gap-3 bg-white rounded-lg px-3 py-2 border border-green-200">
                <FileText size={14} className="text-green-600 shrink-0"/>
                <span className="text-xs text-green-700 truncate flex-1">{file.name}</span>
                <button type="button"
                  onClick={() => setPreviewModal({ url: previewUrl, name: file.name, isPdf: file.type === 'application/pdf' })}
                  className="text-xs text-[#102A71] hover:text-[#001840] font-semibold shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg border border-[#102A71]/30 hover:bg-[#EEF2FF] transition-all">
                  View
                </button>
                <button type="button" onClick={() => set('docFiles', { ...form.docFiles, [cred.key]: null })} className="text-red-400 hover:text-red-600 shrink-0"><X size={14}/></button>
              </div>
            ) : (
              <label className="flex items-center justify-between gap-2 cursor-pointer border border-gray-200 rounded-lg px-3 py-2.5 bg-white hover:bg-gray-50 transition-all">
                <span className="text-sm text-gray-500">Drag and Drop or Upload File</span>
                <Upload size={16} className="text-gray-400 shrink-0"/>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={e => {
                  const f = e.target.files[0];
                  if (!f) return;
                  if (f.size > 3 * 1024 * 1024) { alert('File exceeds 3MB limit.'); return; }
                  set('docFiles', { ...form.docFiles, [cred.key]: f });
                }}/>
              </label>
            )}
            <p className="text-[10px] text-gray-400 mt-2 italic">Formats: PDF, JPG, JPEG, PNG · Max file size: 3.0MB</p>
          </div>
        );
      })}
      {errors.credentials && <p className="text-xs text-red-500">{errors.credentials}</p>}
      {errors.docFiles && <p className="text-xs text-red-500">{errors.docFiles}</p>}
    </div>
  );
}

// ── Read-only view ────────────────────────────────────────────────────────────
function EnrollmentReadOnly({ id }) {
  const [enrollment, setEnrollment] = useState(null);
  const navigate = useNavigate();
  useEffect(() => {
    if (id) getEnrollmentById(id).then(d => setEnrollment(d.enrollment || d)).catch(() => {});
  }, [id]);
  if (!enrollment) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 size={32} className="animate-spin text-[#102A71]" />
    </div>
  );
  return (
    <div className="min-h-screen bg-[#FFFDF0] py-8">
      <div className="max-w-3xl mx-auto px-4">
        <button onClick={() => navigate('/my-enrollments')} className="flex items-center gap-2 text-[#102A71] mb-6 font-medium hover:text-[#001840]">
          <ChevronLeft size={18} /> Back to My Enrollments
        </button>
        <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
            <img src="/emc_logo_nobg.png" alt="EMC" className="w-10 h-10" />
            <div>
              <h1 className="font-bold text-[#001840] text-xl">Enrollment Details</h1>
              <p className="text-xs text-gray-500">ID: #{enrollment.id} · {enrollment.educationLevel} · {enrollment.status}</p>
            </div>
          </div>
          {[
            ['Name', `${enrollment.firstName} ${enrollment.middleName || ''} ${enrollment.familyName}`],
            ['Course', enrollment.course],
            ['Enrollment Type', enrollment.enrollmentType],
            ['Semester', enrollment.semester],
            ['Academic Year', enrollment.academicYear],
            ['Email', enrollment.email],
            ['Mobile', enrollment.mobileNumber],
          ].filter(([, v]) => v).map(([label, value]) => (
            <div key={label} className="flex justify-between text-sm border-b border-gray-50 pb-2">
              <span className="text-gray-500">{label}</span>
              <span className="font-medium text-[#001840]">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
