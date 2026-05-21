import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import {
  LayoutDashboard, ClipboardList, BookOpen, LogOut, Menu, X,
  Search, ChevronDown, ChevronUp, FileText, CheckCircle2,
  RotateCcw, Calendar, ClipboardCheck, GraduationCap, Download,
  Clock, RefreshCw, Filter
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const API = 'http://localhost:3000/api';
const tok = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' });

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CFG = {
  draft:             { label: 'Draft',             color: 'bg-gray-100 text-gray-700' },
  submitted:         { label: 'Submitted',          color: 'bg-blue-100 text-blue-700' },
  pending_exam:      { label: 'Pending Exam',       color: 'bg-yellow-100 text-yellow-700' },
  verified:          { label: 'Verified',           color: 'bg-purple-100 text-purple-700' },
  returned:          { label: 'Returned',           color: 'bg-orange-100 text-orange-700' },
  approved:          { label: 'Approved',           color: 'bg-green-100 text-green-700' },
  subjects_enrolled: { label: 'Subjects Enrolled',  color: 'bg-teal-100 text-teal-700' },
  enrolled:          { label: 'Enrolled',           color: 'bg-emerald-100 text-emerald-700' },
  active:            { label: 'Active',             color: 'bg-cyan-100 text-cyan-700' },
  completed:         { label: 'Completed',          color: 'bg-slate-100 text-slate-700' },
  rejected:          { label: 'Rejected',           color: 'bg-red-100 text-red-700' },
};

function StatusBadge({ status }) {
  const c = STATUS_CFG[status] || { label: status, color: 'bg-gray-100 text-gray-600' };
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${c.color}`}>{c.label}</span>;
}

// ── Modal wrapper ─────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-[#001840]">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={18} className="text-gray-500" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

// ── Approve Modal (replaces Verify — registrar now verifies AND approves) ──────
function ApproveModal({ enrollment, onClose, onSuccess }) {
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);
  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API}/registrar/enrollments/${enrollment.id}/approve`, {
        method: 'POST', headers: tok(), body: JSON.stringify({ remarks }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || 'Failed');
      toast.success('Enrollment verified and approved');
      onSuccess();
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  }
  return (
    <Modal title="Verify & Approve Enrollment" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <p className="text-sm text-gray-600">Documents reviewed and complete for <span className="font-medium text-[#001840]">{enrollment.firstName} {enrollment.familyName}</span>. This will approve the enrollment directly.</p>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Remarks (optional)</label>
          <textarea value={remarks} onChange={e => setRemarks(e.target.value)} rows={3}
            placeholder="Add notes..."
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-400 resize-none" />
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
          <button type="submit" disabled={loading} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-60">
            {loading ? 'Approving...' : 'Verify & Approve'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ── Return Modal ──────────────────────────────────────────────────────────────
function ReturnModal({ enrollment, onClose, onSuccess }) {
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);
  async function submit(e) {
    e.preventDefault();
    if (!remarks.trim()) { toast.error('Remarks are required'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/registrar/enrollments/${enrollment.id}/return`, {
        method: 'POST', headers: tok(), body: JSON.stringify({ remarks }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || 'Failed');
      toast.success('Enrollment returned to student');
      onSuccess();
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  }
  return (
    <Modal title="Return Enrollment" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <p className="text-sm text-gray-600">Return to <span className="font-medium text-[#001840]">{enrollment.firstName} {enrollment.familyName}</span> with correction notes.</p>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Remarks <span className="text-red-500">*</span></label>
          <textarea value={remarks} onChange={e => setRemarks(e.target.value)} rows={4} required
            placeholder="Explain what needs to be corrected or resubmitted..."
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 resize-none" />
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
          <button type="submit" disabled={loading} className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors disabled:opacity-60">
            {loading ? 'Returning...' : 'Return to Student'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ── SSC Schedule Modal ────────────────────────────────────────────────────────
function SSCScheduleModal({ enrollment, onClose, onSuccess }) {
  const [examDate, setExamDate] = useState('');
  const [passingScore, setPassingScore] = useState('75');
  const [loading, setLoading] = useState(false);
  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API}/registrar/enrollments/${enrollment.id}/ssc-schedule`, {
        method: 'PUT', headers: tok(), body: JSON.stringify({ examDate, passingScore: Number(passingScore) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || 'Failed');
      toast.success('SSC exam scheduled');
      onSuccess();
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  }
  return (
    <Modal title="Schedule SSC Entrance Exam" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <p className="text-sm text-gray-600">Schedule entrance exam for <span className="font-medium text-[#001840]">{enrollment.firstName || enrollment.user_name || 'this student'} {enrollment.familyName || ''}</span>.</p>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Exam Date <span className="text-red-500">*</span></label>
          <input type="date" value={examDate} onChange={e => setExamDate(e.target.value)} required
            min={new Date().toISOString().split('T')[0]}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#001840]/20 focus:border-[#001840]" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Passing Score</label>
          <input type="number" value={passingScore} onChange={e => setPassingScore(e.target.value)} min="0" max="100"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#001840]/20 focus:border-[#001840]" />
          <p className="text-xs text-gray-400 mt-1">Students scoring at or above this pass into SSC class</p>
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
          <button type="submit" disabled={loading} className="flex-1 px-4 py-2 bg-yellow-500 text-white rounded-lg text-sm font-medium hover:bg-yellow-600 transition-colors disabled:opacity-60">
            {loading ? 'Scheduling...' : 'Schedule Exam'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ── SSC Result Modal ──────────────────────────────────────────────────────────
function SSCResultModal({ enrollment, onClose, onSuccess }) {
  const [examScore, setExamScore] = useState('');
  const [loading, setLoading] = useState(false);
  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API}/registrar/enrollments/${enrollment.id}/ssc-result`, {
        method: 'PUT', headers: tok(), body: JSON.stringify({ examScore: Number(examScore) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || 'Failed');
      toast.success(data.message || 'SSC result recorded');
      onSuccess();
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  }
  return (
    <Modal title="Record SSC Exam Result" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <p className="text-sm text-gray-600">Record exam score for <span className="font-medium text-[#001840]">{enrollment.firstName || enrollment.user_name || 'this student'} {enrollment.familyName || ''}</span>.</p>
        {enrollment.sscPassingScore && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 text-sm text-yellow-800">
            Passing score: <span className="font-semibold">{enrollment.sscPassingScore}</span>
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Exam Score (0–100) <span className="text-red-500">*</span></label>
          <input type="number" value={examScore} onChange={e => setExamScore(e.target.value)} min="0" max="100" required
            placeholder="e.g. 82"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#001840]/20 focus:border-[#001840]" />
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
          <button type="submit" disabled={loading} className="flex-1 px-4 py-2 bg-[#F5C400] text-[#001840] rounded-lg text-sm font-semibold hover:bg-yellow-400 transition-colors disabled:opacity-60">
            {loading ? 'Saving...' : 'Record Result'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ── TOR Modal ─────────────────────────────────────────────────────────────────
function TORModal({ enrollment, onClose, onSuccess }) {
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);
  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API}/registrar/enrollments/${enrollment.id}/evaluate-tor`, {
        method: 'POST', headers: tok(), body: JSON.stringify({ remarks }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || 'Failed');
      toast.success('TOR evaluation submitted');
      onSuccess();
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  }
  return (
    <Modal title="Evaluate Transcript of Records" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <p className="text-sm text-gray-600">Evaluate TOR for transferee <span className="font-medium text-[#001840]">{enrollment.firstName} {enrollment.familyName}</span>.</p>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Evaluation Remarks <span className="text-red-500">*</span></label>
          <textarea value={remarks} onChange={e => setRemarks(e.target.value)} rows={4} required
            placeholder="Enter credited units, equivalent subjects, notes..."
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#001840]/20 focus:border-[#001840] resize-none" />
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
          <button type="submit" disabled={loading} className="flex-1 px-4 py-2 bg-[#001840] text-white rounded-lg text-sm font-medium hover:bg-[#002a6e] transition-colors disabled:opacity-60">
            {loading ? 'Submitting...' : 'Submit Evaluation'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ── Enrollment Detail Panel ───────────────────────────────────────────────────
const BACKEND = 'http://localhost:3000';

function EnrollmentDetail({ enrollmentId, enrollment: rowData, onClose, onActionSuccess }) {
  const [detail, setDetail] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [uploadedDocs, setUploadedDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState(null);

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    try {
      const [detailRes, subjectsRes, docsRes] = await Promise.all([
        fetch(`${API}/enrollments/${enrollmentId}`, { headers: tok() }),
        fetch(`${API}/enrollments/${enrollmentId}/subjects`, { headers: tok() }).catch(() => null),
        fetch(`${API}/enrollments/${enrollmentId}/documents`, { headers: tok() }).catch(() => null),
      ]);
      if (detailRes.ok) {
        const d = await detailRes.json();
        setDetail(d.enrollment || d);
      }
      if (subjectsRes && subjectsRes.ok) {
        const s = await subjectsRes.json();
        setSubjects(Array.isArray(s) ? s : s.subjects || []);
      }
      if (docsRes && docsRes.ok) {
        const docs = await docsRes.json();
        setUploadedDocs(Array.isArray(docs) ? docs : []);
      }
    } catch (err) {
      toast.error('Failed to load details');
    } finally {
      setLoading(false);
    }
  }, [enrollmentId]);

  useEffect(() => { fetchDetail(); }, [fetchDetail]);

  function handleModalSuccess() {
    setActiveModal(null);
    fetchDetail();
    onActionSuccess();
  }

  async function handleDownloadPDF() {
    try {
      const res = await fetch(`${API}/enrollments/${enrollmentId}/pdf`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) throw new Error('Failed to download PDF');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `enrollment-${enrollmentId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) { toast.error(err.message); }
  }

  const e = detail || rowData;
  if (loading && !e) {
    return (
      <div className="border-t border-gray-100 bg-gray-50 px-6 py-8 flex items-center justify-center gap-2 text-gray-400 text-sm">
        <RefreshCw size={15} className="animate-spin" /> Loading details...
      </div>
    );
  }
  if (!e) return null;

  const status = e.status;
  const level = (e.educationLevel || '').toUpperCase();
  const isJHS = level === 'JHS';
  const isCollege = level === 'COLLEGE';
  const isTransferee = e.enrollmentType === 'transferee';

  const canApprove = ['submitted', 'returned'].includes(status);
  const canReturn = ['submitted', 'verified'].includes(status);
  // For SSC-only applications: allow scheduling if sscApplied and pending_exam, regardless of sscQualified
  const canScheduleSSC = isJHS && e.sscApplied && status === 'pending_exam' && !e.sscExamDate;
  const canRecordSSC = isJHS && status === 'pending_exam' && !!e.sscExamDate && !e.sscExamScore;
  const canEvaluateTOR = isCollege && isTransferee;

  // Display name: use enrollment name fields if filled, otherwise fall back to user account name
  const displayName = (e.firstName || e.familyName)
    ? `${e.firstName || ''} ${e.familyName || ''}`.trim()
    : (e.user_name || e.userEmail || `Student #${e.userId || e.id}`);

  return (
    <div className="border-t border-gray-100 bg-slate-50/70">
      <div className="px-6 py-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="font-semibold text-[#001840]">{displayName}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {e.educationLevel} &bull; {e.course || e.gradeLevel || '—'} &bull; {e.academicYear || e.semester || '—'}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors">
            <X size={15} className="text-gray-400" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Student Info */}
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Student Info</p>
            <dl className="space-y-2 text-sm">
              {[
                ['Name', displayName !== `Student #${e.userId || e.id}` ? displayName : null],
                ['Email', e.email || e.user_email || e.userEmail],
                ['Mobile', e.mobileNumber],
                ['Enrollment Type', e.enrollmentType],
                ['Student Status', e.studentStatus],
                ['Date of Birth', e.dateOfBirth],
                ['SSC Applied', e.sscApplied ? 'Yes' : null],
              ].filter(([, v]) => v).map(([label, value]) => (
                <div key={label} className="flex justify-between gap-2">
                  <dt className="text-gray-400 flex-shrink-0">{label}</dt>
                  <dd className="font-medium text-gray-700 text-right truncate">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Documents */}
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Submitted Documents</p>

            {/* Checked credential list */}
            {Array.isArray(e.admissionCredentials) && e.admissionCredentials.length > 0 ? (
              <ul className="space-y-2">
                {e.admissionCredentials.map((doc, i) => {
                  const docKey = typeof doc === 'string' ? doc : (doc.key || doc.type || '');
                  const docLabel = typeof doc === 'string' ? doc : (doc.name || doc.label || doc.type || doc);
                  const uploaded = uploadedDocs.find(d => d.documentType === docKey);
                  return (
                    <li key={i} className="flex items-center justify-between gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={13} className={uploaded ? 'text-green-500' : 'text-gray-300'} />
                        <span className="text-gray-700">{docLabel}</span>
                      </div>
                      {uploaded ? (
                        <a href={`${BACKEND}${uploaded.filePath}`} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-medium transition-colors">
                          <FileText size={11} /> View
                        </a>
                      ) : (
                        <span className="text-xs text-gray-400 italic">No file</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : uploadedDocs.length > 0 ? (
              // SSC applications: no admissionCredentials but have uploaded docs
              <ul className="space-y-2">
                {uploadedDocs.map(doc => (
                  <li key={doc.id} className="flex items-center justify-between gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={13} className="text-green-500" />
                      <span className="text-gray-700">{doc.documentLabel || doc.documentType}</span>
                    </div>
                    <a href={`${BACKEND}${doc.filePath}`} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-medium transition-colors">
                      <FileText size={11} /> View
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-400 italic">No documents on record</p>
            )}

            {/* Standalone uploaded docs not tied to a credential checkbox — only show when admissionCredentials has items */}
            {Array.isArray(e.admissionCredentials) && e.admissionCredentials.length > 0 && uploadedDocs.filter(d => {
              const creds = Array.isArray(e.admissionCredentials) ? e.admissionCredentials : [];
              return !creds.some(c => (typeof c === 'string' ? c : c.key || c.type) === d.documentType);
            }).map(doc => (
              <div key={doc.id} className="flex items-center justify-between gap-2 text-sm mt-2">
                <div className="flex items-center gap-2">
                  <FileText size={13} className="text-blue-500" />
                  <span className="text-gray-700">{doc.documentLabel || doc.documentType}</span>
                </div>
                <a
                  href={`${BACKEND}${doc.filePath}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-medium transition-colors"
                >
                  <FileText size={11} /> View
                </a>
              </div>
            ))}

            {e.torFilePath && (
              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between gap-2 text-sm">
                <div className="flex items-center gap-2 text-blue-600">
                  <FileText size={13} />
                  <span>TOR (Transferee)</span>
                  {e.tor_evaluated && <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">Evaluated</span>}
                </div>
                <a
                  href={`${BACKEND}/${e.torFilePath.replace(/\\/g, '/')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-medium transition-colors"
                >
                  <FileText size={11} /> View TOR
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Registrar Remarks */}
        {e.registrar_remarks && (
          <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
            <p className="text-xs font-semibold text-orange-600 uppercase tracking-wider mb-1">Registrar Remarks</p>
            <p className="text-sm text-orange-800">{e.registrar_remarks}</p>
          </div>
        )}

        {/* SSC Not Qualified Notice */}
        {e.sscApplied == 1 && e.sscQualified == 0 && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-4">
            <p className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-1">SSC — Not Qualified</p>
            <p className="text-sm text-red-700">
              Student applied for Special Science Class but does not meet the requirement.
              Grade 6 average is <span className="font-semibold">{e.grade6Average}</span> (minimum 85 required).
              Student will be enrolled in the <span className="font-semibold">Regular class</span>.
            </p>
          </div>
        )}

        {/* SSC Info */}
        {e.sscExamDate && (
          <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4">
            <p className="text-xs font-semibold text-yellow-700 uppercase tracking-wider mb-2">SSC Exam</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-gray-400">Date: </span><span className="font-medium">{new Date(e.sscExamDate).toLocaleDateString()}</span></div>
              <div><span className="text-gray-400">Passing: </span><span className="font-medium">{e.sscPassingScore || 75}</span></div>
              {e.sscExamScore && <div><span className="text-gray-400">Score: </span><span className="font-semibold text-[#001840]">{e.sscExamScore}</span></div>}
              {e.sscResult && <div><span className="text-gray-400">Result: </span><span className={`font-semibold ${e.sscResult === 'passed' ? 'text-green-600' : 'text-red-500'}`}>{e.sscResult}</span></div>}
              {e.sscClass && <div><span className="text-gray-400">Class: </span><span className="font-medium">{e.sscClass}</span></div>}
            </div>
          </div>
        )}

        {/* Enrolled Subjects */}
        {subjects.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Enrolled Subjects ({subjects.length})</p>
            <div className="space-y-1 max-h-36 overflow-y-auto">
              {subjects.map((s, i) => (
                <div key={i} className="flex justify-between text-sm py-1 border-b border-gray-50 last:border-0">
                  <span className="text-gray-700">{s.subjectName || s.name || s.code}</span>
                  <span className="text-gray-400 text-xs">{s.units} units</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 pt-1">
          {canApprove && (
            <button onClick={() => setActiveModal('approve')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition-colors">
              <CheckCircle2 size={13} /> Verify & Approve
            </button>
          )}
          {canReturn && (
            <button onClick={() => setActiveModal('return')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 text-white rounded-lg text-xs font-medium hover:bg-orange-600 transition-colors">
              <RotateCcw size={13} /> Return
            </button>
          )}
          {canScheduleSSC && (
            <button onClick={() => setActiveModal('ssc-schedule')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500 text-white rounded-lg text-xs font-medium hover:bg-yellow-600 transition-colors">
              <Calendar size={13} /> Schedule SSC Exam
            </button>
          )}
          {canRecordSSC && (
            <button onClick={() => setActiveModal('ssc-result')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F5C400] text-[#001840] rounded-lg text-xs font-semibold hover:bg-yellow-400 transition-colors">
              <ClipboardCheck size={13} /> Record SSC Result
            </button>
          )}
          {canEvaluateTOR && (
            <button onClick={() => setActiveModal('tor')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#001840] text-white rounded-lg text-xs font-medium hover:bg-[#002a6e] transition-colors">
              <GraduationCap size={13} /> Evaluate TOR
            </button>
          )}
          <button onClick={handleDownloadPDF}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors ml-auto">
            <Download size={13} /> PDF
          </button>
        </div>
      </div>

      {activeModal === 'approve' && <ApproveModal enrollment={e} onClose={() => setActiveModal(null)} onSuccess={handleModalSuccess} />}
      {activeModal === 'return' && <ReturnModal enrollment={e} onClose={() => setActiveModal(null)} onSuccess={handleModalSuccess} />}
      {activeModal === 'ssc-schedule' && <SSCScheduleModal enrollment={e} onClose={() => setActiveModal(null)} onSuccess={handleModalSuccess} />}
      {activeModal === 'ssc-result' && <SSCResultModal enrollment={e} onClose={() => setActiveModal(null)} onSuccess={handleModalSuccess} />}
      {activeModal === 'tor' && <TORModal enrollment={e} onClose={() => setActiveModal(null)} onSuccess={handleModalSuccess} />}
    </div>
  );
}

// ── Overview Tab ──────────────────────────────────────────────────────────────
function OverviewTab({ stats, recentEnrollments, onRefresh }) {
  const s = stats || {};
  const cards = [
    { label: 'Pending Verification', value: s.submitted ?? 0, icon: Clock, bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' },
    { label: 'Pending SSC Exam',     value: s.pending_exam ?? 0, icon: Calendar, bg: 'bg-yellow-50', text: 'text-yellow-600', border: 'border-yellow-100' },
    { label: 'Approved / Enrolled',  value: (s.approved ?? 0) + (s.enrolled ?? 0), icon: CheckCircle2, bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-100' },
    { label: 'Returned to Student',  value: s.returned ?? 0, icon: RotateCcw, bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-100' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map(card => (
          <div key={card.label} className={`bg-white rounded-2xl border ${card.border} p-5 flex items-center gap-4`}>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${card.bg} ${card.text}`}>
              <card.icon size={22} />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#001840]">{card.value}</p>
              <p className="text-xs text-gray-400 mt-0.5 leading-tight">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
          <h3 className="font-semibold text-[#001840] text-sm">Recent Enrollments</h3>
          <button onClick={onRefresh} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <RefreshCw size={14} className="text-gray-400" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-50">
                {['Student', 'Level', 'Program / Grade', 'Status', 'Submitted'].map(h => (
                  <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentEnrollments.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-400 text-sm">No recent enrollments</td></tr>
              ) : recentEnrollments.slice(0, 10).map(e => (
                <tr key={e.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-3 font-medium text-gray-800">
                    {(e.firstName || e.familyName)
                      ? `${e.firstName || ''} ${e.familyName || ''}`.trim()
                      : (e.user_name || `Student #${e.userId || e.id}`)}
                  </td>
                  <td className="px-6 py-3 text-gray-500">{e.educationLevel}</td>
                  <td className="px-6 py-3 text-gray-500 max-w-[160px] truncate">{e.course || e.gradeLevel || '—'}</td>
                  <td className="px-6 py-3"><StatusBadge status={e.status} /></td>
                  <td className="px-6 py-3 text-gray-400 text-xs">{e.createdAt ? new Date(e.createdAt).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Enrollments Tab ───────────────────────────────────────────────────────────
const PAGE_SIZE = 8;

function EnrollmentsTab({ onActionSuccess }) {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [page, setPage] = useState(1);

  const fetchEnrollments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (levelFilter) params.set('educationLevel', levelFilter);
      if (search) params.set('search', search);
      const res = await fetch(`${API}/registrar/enrollments?${params}`, { headers: tok() });
      if (!res.ok) throw new Error('Failed to fetch enrollments');
      const data = await res.json();
      setEnrollments(Array.isArray(data) ? data : data.enrollments || []);
      setPage(1); // reset to first page on new fetch
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, levelFilter, search]);

  useEffect(() => {
    const t = setTimeout(fetchEnrollments, 300);
    return () => clearTimeout(t);
  }, [fetchEnrollments]);

  function handleActionSuccess() {
    fetchEnrollments();
    onActionSuccess();
  }

  const totalPages = Math.ceil(enrollments.length / PAGE_SIZE);
  const paginated = enrollments.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#001840]/20 focus:border-[#001840]" />
          </div>
          <div className="flex gap-2 flex-wrap">
            <div className="relative">
              <Filter size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                className="pl-7 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#001840]/20 focus:border-[#001840] appearance-none bg-white">
                <option value="">All Statuses</option>
                {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <select value={levelFilter} onChange={e => setLevelFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#001840]/20 focus:border-[#001840] appearance-none bg-white">
              <option value="">All Levels</option>
              <option value="JHS">JHS</option>
              <option value="SHS">SHS</option>
              <option value="College">College</option>
            </select>
            <button onClick={fetchEnrollments} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <RefreshCw size={14} className="text-gray-500" />
            </button>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-gray-400 text-sm">
            <RefreshCw size={15} className="animate-spin" /> Loading...
          </div>
        ) : enrollments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <ClipboardList size={36} className="mb-3 opacity-40" />
            <p className="text-sm">No enrollments found</p>
          </div>
        ) : (
          <>
          <div className="divide-y divide-gray-50">
            {paginated.map(enrollment => (
              <div key={enrollment.id}>
                <button
                  onClick={() => setExpandedId(prev => prev === enrollment.id ? null : enrollment.id)}
                  className="w-full flex items-center gap-4 px-6 py-4 hover:bg-gray-50/60 transition-colors text-left"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-medium text-gray-800 text-sm">
                        {(enrollment.firstName || enrollment.familyName)
                          ? `${enrollment.firstName || ''} ${enrollment.familyName || ''}`.trim()
                          : (enrollment.user_name || `Student #${enrollment.userId || enrollment.id}`)}
                      </span>
                      <StatusBadge status={enrollment.status} />
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-400 flex-wrap">
                      <span>{enrollment.educationLevel}</span>
                      {(enrollment.course || enrollment.gradeLevel) && (
                        <><span>&bull;</span><span className="truncate max-w-[180px]">{enrollment.course || enrollment.gradeLevel}</span></>
                      )}
                      {enrollment.createdAt && (
                        <><span>&bull;</span><span>{new Date(enrollment.createdAt).toLocaleDateString()}</span></>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-gray-400">
                    {expandedId === enrollment.id ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </div>
                </button>
                {expandedId === enrollment.id && (
                  <EnrollmentDetail
                    enrollmentId={enrollment.id}
                    enrollment={enrollment}
                    onClose={() => setExpandedId(null)}
                    onActionSuccess={handleActionSuccess}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-3 border-t border-gray-50 bg-gray-50/50">
              <p className="text-xs text-gray-400">
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, enrollments.length)} of {enrollments.length}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 text-xs rounded-lg transition-colors ${
                      p === page
                        ? 'bg-[#001840] text-white font-semibold'
                        : 'border border-gray-200 hover:bg-white text-gray-600'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Sections Tab ──────────────────────────────────────────────────────────────
function SectionsTab() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/admin/sections`, { headers: tok() })
      .then(r => r.ok ? r.json() : Promise.reject('Failed'))
      .then(d => setSections(Array.isArray(d) ? d : d.sections || []))
      .catch(err => toast.error(typeof err === 'string' ? err : 'Failed to load sections'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
        <h3 className="font-semibold text-[#001840] text-sm">Sections</h3>
        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">View only</span>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-16 gap-2 text-gray-400 text-sm">
          <RefreshCw size={15} className="animate-spin" /> Loading...
        </div>
      ) : sections.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <BookOpen size={36} className="mb-3 opacity-40" />
          <p className="text-sm">No sections available</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-50">
                {['Section Code', 'Course', 'Year/Grade', 'Semester', 'Instructor', 'Schedule', 'Room', 'Enrolled / Capacity'].map(h => (
                  <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sections.map(s => {
                const full = (s.currentEnrollment || 0) >= (s.capacity || 0);
                const pct = s.capacity ? Math.round((s.currentEnrollment / s.capacity) * 100) : 0;
                return (
                  <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-3 font-semibold text-[#001840]">{s.code}</td>
                    <td className="px-6 py-3 text-gray-600">{s.course}</td>
                    <td className="px-6 py-3 text-gray-600">Year {s.yearLevel}</td>
                    <td className="px-6 py-3 text-gray-500 whitespace-nowrap">{s.semester}</td>
                    <td className="px-6 py-3 text-gray-600">{s.instructor || '—'}</td>
                    <td className="px-6 py-3 text-gray-500 whitespace-nowrap">{s.schedule || '—'}</td>
                    <td className="px-6 py-3 text-gray-500">{s.room || '—'}</td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium text-sm ${full ? 'text-red-500' : 'text-gray-700'}`}>
                          {s.currentEnrollment ?? 0} / {s.capacity ?? '—'}
                        </span>
                        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${pct >= 100 ? 'bg-red-400' : pct >= 75 ? 'bg-yellow-400' : 'bg-green-400'}`}
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export function RegistrarDashboard() {
  const { user, isLoggedIn, loading: authLoading, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [recentEnrollments, setRecentEnrollments] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Auth guard
  useEffect(() => {
    if (authLoading) return;
    if (!isLoggedIn) { navigate('/login'); return; }
    if (user?.role !== 'registrar') { navigate('/'); return; }
  }, [authLoading, isLoggedIn, user, navigate]);

  // Fetch overview data
  useEffect(() => {
    if (authLoading || !isLoggedIn || user?.role !== 'registrar') return;
    setDataLoading(true);
    Promise.all([
      fetch(`${API}/registrar/stats`, { headers: tok() }),
      fetch(`${API}/registrar/enrollments`, { headers: tok() }),
    ]).then(async ([statsRes, listRes]) => {
      if (statsRes.status === 401 || statsRes.status === 403) { navigate('/login'); return; }
      if (statsRes.ok) {
        const d = await statsRes.json();
        setStats(d.summary || d.stats || d);
      }
      if (listRes.ok) {
        const d = await listRes.json();
        setRecentEnrollments(Array.isArray(d) ? d : d.enrollments || []);
      }
    }).catch(console.error).finally(() => setDataLoading(false));
  }, [authLoading, isLoggedIn, user, navigate, refreshKey]);

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  const navItems = [
    { id: 'overview',    label: 'Overview',    icon: LayoutDashboard },
    { id: 'enrollments', label: 'Enrollments', icon: ClipboardList },
    { id: 'sections',    label: 'Sections',    icon: BookOpen },
  ];

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-400">
          <RefreshCw size={20} className="animate-spin" />
          <span className="text-sm">Loading...</span>
        </div>
      </div>
    );
  }

  if (!isLoggedIn || user?.role !== 'registrar') return null;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-30 bg-[#001840] flex flex-col transition-all duration-300 ease-in-out ${sidebarOpen ? 'w-60' : 'w-16'}`}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
          <div className="w-8 h-8 bg-[#F5C400] rounded-lg flex items-center justify-center flex-shrink-0">
            <GraduationCap size={17} className="text-[#001840]" />
          </div>
          {sidebarOpen && (
            <div className="overflow-hidden">
              <p className="text-white font-bold text-sm leading-tight">Registrar</p>
              <p className="text-white/40 text-xs">Management Portal</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navItems.map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 text-left ${
                activeTab === item.id
                  ? 'bg-[#F5C400] text-[#001840] font-semibold'
                  : 'text-white/60 hover:bg-white/10 hover:text-white'
              }`}>
              <item.icon size={17} className="flex-shrink-0" />
              {sidebarOpen && <span className="text-sm truncate">{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* User + Logout */}
        <div className="px-2 py-4 border-t border-white/10 space-y-1">
          {sidebarOpen && (
            <div className="px-3 py-2 mb-1">
              <p className="text-white text-sm font-medium truncate">{user?.name || user?.email}</p>
              <p className="text-white/40 text-xs capitalize">{user?.role}</p>
            </div>
          )}
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/60 hover:bg-white/10 hover:text-white transition-all duration-150">
            <LogOut size={17} className="flex-shrink-0" />
            {sidebarOpen && <span className="text-sm">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${sidebarOpen ? 'ml-60' : 'ml-16'}`}>
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-4 sticky top-0 z-20 shadow-sm">
          <button onClick={() => setSidebarOpen(o => !o)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <Menu size={17} className="text-gray-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-base font-semibold text-[#001840]">
              {navItems.find(n => n.id === activeTab)?.label}
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {new Date().toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <button onClick={() => setRefreshKey(k => k + 1)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors" title="Refresh">
            <RefreshCw size={15} className="text-gray-500" />
          </button>
          <div className="w-8 h-8 bg-[#001840] rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">
              {(user?.name || user?.email || 'R')[0].toUpperCase()}
            </span>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6">
          {activeTab === 'overview' && (
            dataLoading ? (
              <div className="flex items-center justify-center py-20 gap-2 text-gray-400 text-sm">
                <RefreshCw size={15} className="animate-spin" /> Loading dashboard...
              </div>
            ) : (
              <OverviewTab
                stats={stats}
                recentEnrollments={recentEnrollments}
                onRefresh={() => setRefreshKey(k => k + 1)}
              />
            )
          )}
          {activeTab === 'enrollments' && (
            <EnrollmentsTab onActionSuccess={() => setRefreshKey(k => k + 1)} />
          )}
          {activeTab === 'sections' && <SectionsTab />}
        </main>
      </div>
    </div>
  );
}

export default RegistrarDashboard;
