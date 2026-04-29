import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Plus, Edit2, Trash2, Users, Search, X, RefreshCw,
  BookOpen, GraduationCap, School, ChevronLeft, ChevronRight,
  Filter, Save, AlertCircle, UserMinus, ArrowRightLeft, UserPlus,
  Zap, ChevronDown, ChevronUp
} from 'lucide-react';

const API = 'http://localhost:3000/api';
const tok = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' });

const COURSES = ['JHS', 'SHS', 'BSIS', 'BSBA', 'BEED', 'BSED', 'BSCrim'];
const SEMESTERS = ['1st Semester', '2nd Semester', 'Summer'];
const SCHOOL_YEARS = ['2024-2025', '2025-2026', '2026-2027'];
const PAGE_SIZE = 10;

// ── Section Students Panel ────────────────────────────────────────────────────
function SectionStudentsPanel({ section, allSections, onClose, onChanged }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [movingId, setMovingId] = useState(null); // enrollmentId being moved
  const [moveTarget, setMoveTarget] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/admin/sections/${section.id}/students`, { headers: tok() });
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setStudents(data.students || []);
    } catch (err) {
      toast.error('Failed to load section students');
    } finally {
      setLoading(false);
    }
  }, [section.id]);

  useEffect(() => { load(); }, [load]);

  async function handleRemove(enrollmentId, name) {
    if (!confirm(`Remove ${name} from section ${section.code}?`)) return;
    try {
      const res = await fetch(`${API}/admin/sections/students/${enrollmentId}/section`, {
        method: 'DELETE', headers: tok(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      toast.success(`${name} removed from section`);
      load();
      onChanged();
    } catch (err) { toast.error(err.message); }
  }

  async function handleMove(enrollmentId, name) {
    if (!moveTarget) { toast.error('Select a target section first'); return; }
    try {
      const res = await fetch(`${API}/admin/sections/students/${enrollmentId}/section`, {
        method: 'PUT', headers: tok(),
        body: JSON.stringify({ sectionId: parseInt(moveTarget) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      toast.success(`${name} moved to ${data.section?.code}`);
      setMovingId(null);
      setMoveTarget('');
      load();
      onChanged();
    } catch (err) { toast.error(err.message); }
  }

  const otherSections = allSections.filter(s => s.id !== section.id && s.course === section.course);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl z-10 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h3 className="text-lg font-semibold text-[#001840]">
              Section {section.code} — Students
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {section.course} · {section.currentEnrollment || 0} / {section.capacity} enrolled
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-12 gap-2 text-gray-400 text-sm">
              <RefreshCw size={15} className="animate-spin" /> Loading students...
            </div>
          ) : students.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Users size={36} className="mb-3 opacity-40" />
              <p className="text-sm font-medium">No students assigned yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {students.map(s => (
                <div key={s.id} className="bg-gray-50 rounded-xl border border-gray-100 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-[#001840] text-sm truncate">
                        {s.familyName}, {s.firstName}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {s.studentNumber || '—'} · {s.course || s.gradeLevel || s.educationLevel}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {movingId === s.id ? (
                        <>
                          <select
                            value={moveTarget}
                            onChange={e => setMoveTarget(e.target.value)}
                            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#001840]/20"
                          >
                            <option value="">Select section...</option>
                            {otherSections.map(sec => (
                              <option key={sec.id} value={sec.id}>
                                {sec.code} ({sec.currentEnrollment}/{sec.capacity})
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleMove(s.id, `${s.firstName} ${s.familyName}`)}
                            className="text-xs px-2.5 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Move
                          </button>
                          <button
                            onClick={() => { setMovingId(null); setMoveTarget(''); }}
                            className="text-xs px-2.5 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          {otherSections.length > 0 && (
                            <button
                              onClick={() => { setMovingId(s.id); setMoveTarget(''); }}
                              className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-colors"
                              title="Move to another section"
                            >
                              <ArrowRightLeft size={12} /> Move
                            </button>
                          )}
                          <button
                            onClick={() => handleRemove(s.id, `${s.firstName} ${s.familyName}`)}
                            className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors"
                            title="Remove from section"
                          >
                            <UserMinus size={12} /> Remove
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Unassigned Students Panel ─────────────────────────────────────────────────
function UnassignedPanel({ allSections, onChanged }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [assigningId, setAssigningId] = useState(null);
  const [assignTarget, setAssignTarget] = useState('');
  const [autoRunning, setAutoRunning] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/admin/sections/students/unassigned`, { headers: tok() });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setStudents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Load unassigned error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleAutoAssign() {
    setAutoRunning(true);
    try {
      const res = await fetch(`${API}/admin/sections/students/auto-assign`, {
        method: 'POST', headers: tok(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      toast.success(data.message);
      load();
      onChanged();
    } catch (err) { toast.error(err.message); }
    finally { setAutoRunning(false); }
  }

  async function handleManualAssign(enrollmentId, name) {
    if (!assignTarget) { toast.error('Select a section first'); return; }
    try {
      const res = await fetch(`${API}/admin/sections/students/${enrollmentId}/assign`, {
        method: 'POST', headers: tok(),
        body: JSON.stringify({ sectionId: parseInt(assignTarget) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      toast.success(`${name} assigned to ${data.section?.code}`);
      setAssigningId(null);
      setAssignTarget('');
      load();
      onChanged();
    } catch (err) { toast.error(err.message); }
  }

  if (loading) return null;
  if (students.length === 0) return null;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-amber-100/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-amber-400 rounded-lg flex items-center justify-center">
            <AlertCircle size={16} className="text-white" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-amber-900 text-sm">
              {students.length} student{students.length !== 1 ? 's' : ''} need section assignment
            </p>
            <p className="text-xs text-amber-700">Approved but not yet assigned to a section</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={e => { e.stopPropagation(); handleAutoAssign(); }}
            disabled={autoRunning}
            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition-colors disabled:opacity-60"
          >
            <Zap size={12} />
            {autoRunning ? 'Assigning...' : 'Auto-Assign All'}
          </button>
          {expanded ? <ChevronUp size={16} className="text-amber-700" /> : <ChevronDown size={16} className="text-amber-700" />}
        </div>
      </button>

      {/* Student list */}
      {expanded && (
        <div className="border-t border-amber-200 px-5 py-4 space-y-2 max-h-72 overflow-y-auto">
          {students.map(s => (
            <div key={s.id} className="bg-white rounded-xl border border-amber-100 p-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-[#001840] text-sm truncate">
                  {s.familyName}, {s.firstName}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {s.studentNumber || '—'} · {s.course || s.gradeLevel || s.educationLevel}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {assigningId === s.id ? (
                  <>
                    <select
                      value={assignTarget}
                      onChange={e => setAssignTarget(e.target.value)}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#001840]/20"
                    >
                      <option value="">Select section...</option>
                      {allSections
                        .filter(sec => {
                          const course = s.educationLevel === 'College' ? s.course : s.educationLevel;
                          return sec.course === course && sec.currentEnrollment < sec.capacity;
                        })
                        .map(sec => (
                          <option key={sec.id} value={sec.id}>
                            {sec.code} ({sec.currentEnrollment}/{sec.capacity})
                          </option>
                        ))}
                    </select>
                    <button
                      onClick={() => handleManualAssign(s.id, `${s.firstName} ${s.familyName}`)}
                      className="text-xs px-2.5 py-1.5 bg-[#001840] text-white rounded-lg hover:bg-[#002a6e] transition-colors"
                    >
                      Assign
                    </button>
                    <button
                      onClick={() => { setAssigningId(null); setAssignTarget(''); }}
                      className="text-xs px-2.5 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => { setAssigningId(s.id); setAssignTarget(''); }}
                    className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 bg-[#001840] text-white rounded-lg hover:bg-[#002a6e] transition-colors"
                  >
                    <UserPlus size={12} /> Assign
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const LEVEL_BADGE = {
  JHS:    { bg: 'bg-indigo-100 text-indigo-700', icon: School },
  SHS:    { bg: 'bg-purple-100 text-purple-700', icon: BookOpen },
  BSIS:   { bg: 'bg-blue-100 text-blue-700',     icon: GraduationCap },
  BSBA:   { bg: 'bg-green-100 text-green-700',   icon: GraduationCap },
  BEED:   { bg: 'bg-yellow-100 text-yellow-700', icon: GraduationCap },
  BSED:   { bg: 'bg-orange-100 text-orange-700', icon: GraduationCap },
  BSCrim: { bg: 'bg-red-100 text-red-700',       icon: GraduationCap },
};

function CourseBadge({ course }) {
  const cfg = LEVEL_BADGE[course] || { bg: 'bg-gray-100 text-gray-600', icon: BookOpen };
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.bg}`}>
      <Icon size={11} />{course}
    </span>
  );
}

const EMPTY_FORM = {
  code: '', course: 'BSIS', yearLevel: '1', semester: '1st Semester',
  schoolYear: '2025-2026', instructor: '', schedule: '', room: '', capacity: '40',
};

// ── Section Form Modal ────────────────────────────────────────────────────────
function SectionFormModal({ section, onClose, onSaved }) {
  const isEdit = !!section;
  const [form, setForm] = useState(isEdit ? {
    code: section.code || '',
    course: section.course || 'BSIS',
    yearLevel: String(section.yearLevel || '1'),
    semester: section.semester || '1st Semester',
    schoolYear: section.schoolYear || '2025-2026',
    instructor: section.instructor || '',
    schedule: section.schedule || '',
    room: section.room || '',
    capacity: String(section.capacity || '40'),
  } : { ...EMPTY_FORM });
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.code.trim()) { toast.error('Section code is required'); return; }
    setLoading(true);
    try {
      const url = isEdit ? `${API}/admin/sections/${section.id}` : `${API}/admin/sections`;
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method, headers: tok(),
        body: JSON.stringify({ ...form, yearLevel: Number(form.yearLevel), capacity: Number(form.capacity) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to save');
      toast.success(isEdit ? 'Section updated' : 'Section created');
      onSaved();
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  }

  const yearLevels = ['JHS', 'SHS'].includes(form.course)
    ? (form.course === 'JHS' ? ['7','8','9','10'] : ['11','12'])
    : ['1','2','3','4'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg z-10 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
          <h3 className="text-lg font-semibold text-[#001840]">
            {isEdit ? `Edit Section — ${section.code}` : 'Create New Section'}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Row 1: Code + Course */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Section Code <span className="text-red-500">*</span>
              </label>
              <input value={form.code} onChange={e => set('code', e.target.value)} required
                placeholder="e.g. BSIS-1A"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#001840]/20 focus:border-[#001840]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Course / Level</label>
              <select value={form.course} onChange={e => { set('course', e.target.value); set('yearLevel', '1'); }}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#001840]/20 focus:border-[#001840] bg-white">
                {COURSES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Row 2: Year Level + Semester */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                {['JHS','SHS'].includes(form.course) ? 'Grade Level' : 'Year Level'}
              </label>
              <select value={form.yearLevel} onChange={e => set('yearLevel', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#001840]/20 focus:border-[#001840] bg-white">
                {yearLevels.map(y => (
                  <option key={y} value={y}>
                    {['JHS','SHS'].includes(form.course) ? `Grade ${y}` : `Year ${y}`}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Semester</label>
              <select value={form.semester} onChange={e => set('semester', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#001840]/20 focus:border-[#001840] bg-white">
                {SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Row 3: School Year + Capacity */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">School Year</label>
              <select value={form.schoolYear} onChange={e => set('schoolYear', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#001840]/20 focus:border-[#001840] bg-white">
                {SCHOOL_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Capacity</label>
              <input type="number" value={form.capacity} onChange={e => set('capacity', e.target.value)}
                min="1" max="100"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#001840]/20 focus:border-[#001840]" />
            </div>
          </div>

          {/* Row 4: Instructor */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Instructor / Adviser</label>
            <input value={form.instructor} onChange={e => set('instructor', e.target.value)}
              placeholder="e.g. Ms. Ana Reyes"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#001840]/20 focus:border-[#001840]" />
          </div>

          {/* Row 5: Schedule + Room */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Schedule</label>
              <input value={form.schedule} onChange={e => set('schedule', e.target.value)}
                placeholder="e.g. MWF 7:30-9:00 AM"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#001840]/20 focus:border-[#001840]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Room</label>
              <input value={form.room} onChange={e => set('room', e.target.value)}
                placeholder="e.g. Room 101"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#001840]/20 focus:border-[#001840]" />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 px-4 py-2.5 bg-[#001840] text-white rounded-lg text-sm font-semibold hover:bg-[#002a6e] transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
              <Save size={14} />
              {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Section'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export function SectionManagement() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');
  const [semesterFilter, setSemesterFilter] = useState('all');
  const [schoolYearFilter, setSchoolYearFilter] = useState('2025-2026');
  const [page, setPage] = useState(1);
  const [formModal, setFormModal] = useState(null); // null | 'create' | section object
  const [studentsPanel, setStudentsPanel] = useState(null); // section object

  const loadSections = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/admin/sections`, { headers: tok() });
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setSections(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error('Failed to load sections');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadSections(); }, [loadSections]);

  async function handleDelete(section) {
    if (!confirm(`Delete section "${section.code}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`${API}/admin/sections/${section.id}`, {
        method: 'DELETE', headers: tok(),
      });
      if (!res.ok) throw new Error('Failed to delete');
      toast.success(`Section "${section.code}" deleted`);
      loadSections();
    } catch (err) { toast.error(err.message); }
  }

  // Filter
  const filtered = sections.filter(s => {
    const matchSearch = !search ||
      (s.code || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.instructor || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.room || '').toLowerCase().includes(search.toLowerCase());
    const matchCourse = courseFilter === 'all' || s.course === courseFilter;
    const matchSemester = semesterFilter === 'all' || s.semester === semesterFilter;
    const matchYear = !schoolYearFilter || s.schoolYear === schoolYearFilter;
    return matchSearch && matchCourse && matchSemester && matchYear;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Summary stats
  const totalCapacity = sections.reduce((sum, s) => sum + (s.capacity || 0), 0);
  const totalEnrolled = sections.reduce((sum, s) => sum + (s.currentEnrollment || 0), 0);
  const fullSections = sections.filter(s => (s.currentEnrollment || 0) >= (s.capacity || 0)).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#001840]">Section Management</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {sections.length} sections &bull; {totalEnrolled} / {totalCapacity} students enrolled
          </p>
        </div>
        <button onClick={() => setFormModal('create')}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#001840] text-white rounded-xl text-sm font-semibold hover:bg-[#002a6e] transition-colors shadow-sm">
          <Plus size={16} /> New Section
        </button>
      </div>

      {/* Unassigned students alert */}
      <UnassignedPanel allSections={sections} onChanged={loadSections} />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Sections', value: sections.length, color: 'bg-[#001840] text-white' },
          { label: 'Total Capacity', value: totalCapacity, color: 'bg-blue-600 text-white' },
          { label: 'Total Enrolled', value: totalEnrolled, color: 'bg-green-600 text-white' },
          { label: 'Full Sections', value: fullSections, color: fullSections > 0 ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-700' },
        ].map(c => (
          <div key={c.label} className={`${c.color} rounded-xl p-4`}>
            <p className="text-2xl font-bold">{c.value}</p>
            <p className="text-xs opacity-80 mt-0.5">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search section, instructor, room..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#001840]/20 focus:border-[#001840]" />
        </div>
        <select value={courseFilter} onChange={e => { setCourseFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#001840]/20 appearance-none">
          <option value="all">All Courses</option>
          {COURSES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={semesterFilter} onChange={e => { setSemesterFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#001840]/20 appearance-none">
          <option value="all">All Semesters</option>
          {SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={schoolYearFilter} onChange={e => { setSchoolYearFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#001840]/20 appearance-none">
          <option value="">All School Years</option>
          {SCHOOL_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <button onClick={loadSections} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
          <RefreshCw size={14} className="text-gray-500" />
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-gray-400 text-sm">
            <RefreshCw size={15} className="animate-spin" /> Loading sections...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <BookOpen size={36} className="mb-3 opacity-40" />
            <p className="text-sm font-medium">No sections found</p>
            <p className="text-xs mt-1">Try adjusting your filters or create a new section</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60">
                    {['Section Code', 'Course', 'Grade/Year', 'Semester', 'School Year', 'Instructor', 'Schedule', 'Room', 'Enrolled / Cap', 'Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginated.map(s => {
                    const enrolled = s.currentEnrollment || 0;
                    const cap = s.capacity || 0;
                    const pct = cap > 0 ? Math.round((enrolled / cap) * 100) : 0;
                    const isFull = enrolled >= cap;
                    return (
                      <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <span className="font-bold text-[#001840]">{s.code}</span>
                        </td>
                        <td className="px-4 py-3">
                          <CourseBadge course={s.course} />
                        </td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                          {['JHS','SHS'].includes(s.course) ? `Grade ${s.yearLevel}` : `Year ${s.yearLevel}`}
                        </td>
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{s.semester}</td>
                        <td className="px-4 py-3 text-gray-500">{s.schoolYear}</td>
                        <td className="px-4 py-3 text-gray-700">{s.instructor || <span className="text-gray-300">—</span>}</td>
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{s.schedule || <span className="text-gray-300">—</span>}</td>
                        <td className="px-4 py-3 text-gray-500">{s.room || <span className="text-gray-300">—</span>}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className={`font-semibold text-sm ${isFull ? 'text-red-500' : 'text-gray-700'}`}>
                              {enrolled} / {cap}
                            </span>
                            <div className="w-14 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full transition-all ${pct >= 100 ? 'bg-red-400' : pct >= 80 ? 'bg-yellow-400' : 'bg-green-400'}`}
                                style={{ width: `${Math.min(pct, 100)}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button onClick={() => setStudentsPanel(s)}
                              className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors" title="View Students">
                              <Users size={14} />
                            </button>
                            <button onClick={() => setFormModal(s)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                              <Edit2 size={14} />
                            </button>
                            <button onClick={() => handleDelete(s)}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-50 bg-gray-50/30">
                <p className="text-xs text-gray-400">
                  Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} sections
                </p>
                <div className="flex items-center gap-1">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="p-1.5 border border-gray-200 rounded-lg hover:bg-white disabled:opacity-40 transition-colors">
                    <ChevronLeft size={14} />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button key={p} onClick={() => setPage(p)}
                      className={`w-8 h-8 text-xs rounded-lg transition-colors ${p === page ? 'bg-[#001840] text-white font-semibold' : 'border border-gray-200 hover:bg-white text-gray-600'}`}>
                      {p}
                    </button>
                  ))}
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    className="p-1.5 border border-gray-200 rounded-lg hover:bg-white disabled:opacity-40 transition-colors">
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Form Modal */}
      {formModal && (
        <SectionFormModal
          section={formModal === 'create' ? null : formModal}
          onClose={() => setFormModal(null)}
          onSaved={() => { setFormModal(null); loadSections(); }}
        />
      )}

      {/* Students Panel */}
      {studentsPanel && (
        <SectionStudentsPanel
          section={studentsPanel}
          allSections={sections}
          onClose={() => setStudentsPanel(null)}
          onChanged={loadSections}
        />
      )}
    </div>
  );
}
