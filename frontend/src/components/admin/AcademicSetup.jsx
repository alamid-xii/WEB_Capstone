import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Plus, Trash2, Edit, BookOpen, Calendar, Check } from 'lucide-react';

const API = 'http://localhost:3000/api';
const token = () => localStorage.getItem('token');
const headers = () => ({ 'Authorization': `Bearer ${token()}`, 'Content-Type': 'application/json' });

const PROGRAMS = ['BEED', 'BSIS', 'BSBA', 'BSED', 'BSCrim'];
const SEMESTERS = ['1st Semester', '2nd Semester', 'Summer'];
const YEAR_LEVELS = [1, 2, 3, 4];
const SCHOOL_YEARS = ['2024-2025', '2025-2026', '2026-2027'];

export function AcademicSetup() {
  const [tab, setTab] = useState('subjects');
  const [subjects, setSubjects] = useState([]);
  const [schoolYears, setSchoolYears] = useState([]);
  const [filterProgram, setFilterProgram] = useState('BSED');
  const [filterYear, setFilterYear] = useState('');
  const [filterSem, setFilterSem] = useState('');
  const [showSubjectForm, setShowSubjectForm] = useState(false);
  const [showSYForm, setShowSYForm] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [subjectForm, setSubjectForm] = useState({ code: '', description: '', units: 3, programCode: 'BSED', yearLevel: 1, semester: '1st' });
  const [syForm, setSyForm] = useState({ year: '' });

  useEffect(() => { loadAll(); }, []);
  useEffect(() => { loadSubjects(); }, [filterProgram, filterYear, filterSem]);

  async function loadAll() {
    loadSubjects();
    loadSchoolYears();
  }

  async function loadSubjects() {
    const params = new URLSearchParams({ programCode: filterProgram });
    if (filterYear) params.append('yearLevel', filterYear);
    if (filterSem) params.append('semester', filterSem);
    const res = await fetch(`${API}/academic/subjects?${params}`);
    setSubjects(await res.json());
  }

  async function loadSchoolYears() {
    const res = await fetch(`${API}/academic/school-years`);
    setSchoolYears(await res.json());
  }

  async function saveSubject() {
    const url = editingSubject ? `${API}/admin/academic/subjects/${editingSubject.id}` : `${API}/admin/academic/subjects`;
    const method = editingSubject ? 'PUT' : 'POST';
    const res = await fetch(url, { method, headers: headers(), body: JSON.stringify(subjectForm) });
    if (res.ok) {
      toast.success(editingSubject ? 'Subject updated' : 'Subject added');
      setShowSubjectForm(false); setEditingSubject(null);
      setSubjectForm({ code: '', description: '', units: 3, programCode: 'BSED', yearLevel: 1, semester: '1st' });
      loadSubjects();
    } else toast.error('Failed to save subject');
  }

  async function deleteSubject(id) {
    if (!confirm('Delete this subject?')) return;
    await fetch(`${API}/admin/academic/subjects/${id}`, { method: 'DELETE', headers: headers() });
    toast.success('Subject deleted'); loadSubjects();
  }

  async function addSchoolYear() {
    const res = await fetch(`${API}/admin/academic/school-years`, { method: 'POST', headers: headers(), body: JSON.stringify(syForm) });
    if (res.ok) { toast.success('School year added'); setShowSYForm(false); setSyForm({ year: '' }); loadSchoolYears(); }
    else toast.error('Failed to add school year');
  }

  async function activateSchoolYear(id) {
    await fetch(`${API}/admin/academic/school-years/${id}/activate`, { method: 'PUT', headers: headers() });
    toast.success('Active school year updated'); loadSchoolYears();
  }

  const tabs = [
    { id: 'subjects',    label: 'Subjects',     icon: BookOpen },
    { id: 'schoolyears', label: 'School Years', icon: Calendar },
  ];

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#001840] mb-1">Academic Setup</h2>
        <p className="text-gray-500 text-sm">Manage subjects, sections, and school years</p>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t.id ? 'border-[#102A71] text-[#102A71]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              <Icon className="w-4 h-4" />{t.label}
            </button>
          );
        })}
      </div>

      {/* SUBJECTS TAB */}
      {tab === 'subjects' && (
        <div>
          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-4">
            <select value={filterProgram} onChange={e => setFilterProgram(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
              {PROGRAMS.map(p => <option key={p}>{p}</option>)}
            </select>
            <select value={filterYear} onChange={e => setFilterYear(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
              <option value="">All Years</option>
              {YEAR_LEVELS.map(y => <option key={y} value={y}>Year {y}</option>)}
            </select>
            <select value={filterSem} onChange={e => setFilterSem(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
              <option value="">All Semesters</option>
              {SEMESTERS.map(s => <option key={s}>{s}</option>)}
            </select>
            <button onClick={() => { setEditingSubject(null); setSubjectForm({ code: '', description: '', units: 3, programCode: filterProgram, yearLevel: 1, semester: '1st' }); setShowSubjectForm(true); }}
              className="ml-auto flex items-center gap-2 px-4 py-2 bg-[#102A71] text-white rounded-lg text-sm font-medium hover:bg-[#001840]">
              <Plus className="w-4 h-4" /> Add Subject
            </button>
          </div>

          {/* Subject Form */}
          {showSubjectForm && (
            <div className="bg-[#FFFDF0] border border-[#F5C400] rounded-xl p-4 mb-4">
              <h3 className="font-semibold text-[#001840] mb-3">{editingSubject ? 'Edit Subject' : 'New Subject'}</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <input placeholder="Subject Code" value={subjectForm.code} onChange={e => setSubjectForm(p => ({ ...p, code: e.target.value }))} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                <input placeholder="Description" value={subjectForm.description} onChange={e => setSubjectForm(p => ({ ...p, description: e.target.value }))} className="px-3 py-2 border border-gray-300 rounded-lg text-sm col-span-2" />
                <input type="number" placeholder="Units" value={subjectForm.units} onChange={e => setSubjectForm(p => ({ ...p, units: e.target.value }))} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                <select value={subjectForm.programCode} onChange={e => setSubjectForm(p => ({ ...p, programCode: e.target.value }))} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  {PROGRAMS.map(p => <option key={p}>{p}</option>)}
                </select>
                <select value={subjectForm.yearLevel} onChange={e => setSubjectForm(p => ({ ...p, yearLevel: parseInt(e.target.value) }))} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  {YEAR_LEVELS.map(y => <option key={y} value={y}>Year {y}</option>)}
                </select>
                <select value={subjectForm.semester} onChange={e => setSubjectForm(p => ({ ...p, semester: e.target.value }))} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  {SEMESTERS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={saveSubject} className="px-4 py-2 bg-[#F5C400] text-[#001840] rounded-lg text-sm font-semibold">Save</button>
                <button onClick={() => { setShowSubjectForm(false); setEditingSubject(null); }} className="px-4 py-2 border border-gray-300 rounded-lg text-sm">Cancel</button>
              </div>
            </div>
          )}

          {/* Subjects Table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Code</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Description</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Units</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Year</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Semester</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {subjects.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No subjects found</td></tr>
                ) : subjects.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono font-semibold text-[#102A71]">{s.code}</td>
                    <td className="px-4 py-3">{s.description}</td>
                    <td className="px-4 py-3">{s.units}</td>
                    <td className="px-4 py-3">Year {s.yearLevel}</td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">{s.semester}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => { setEditingSubject(s); setSubjectForm({ code: s.code, description: s.description, units: s.units, programCode: s.programCode, yearLevel: s.yearLevel, semester: s.semester }); setShowSubjectForm(true); }} className="p-1.5 text-[#102A71] hover:bg-blue-50 rounded"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => deleteSubject(s.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SCHOOL YEARS TAB */}
      {tab === 'schoolyears' && (
        <div>
          <div className="flex justify-end mb-4">
            <button onClick={() => setShowSYForm(true)} className="flex items-center gap-2 px-4 py-2 bg-[#102A71] text-white rounded-lg text-sm font-medium hover:bg-[#001840]">
              <Plus className="w-4 h-4" /> Add School Year
            </button>
          </div>

          {showSYForm && (
            <div className="bg-[#FFFDF0] border border-[#F5C400] rounded-xl p-4 mb-4">
              <h3 className="font-semibold text-[#001840] mb-3">New School Year</h3>
              <input placeholder="e.g. 2026-2027" value={syForm.year} onChange={e => setSyForm({ year: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg text-sm mr-3" />
              <button onClick={addSchoolYear} className="px-4 py-2 bg-[#F5C400] text-[#001840] rounded-lg text-sm font-semibold mr-2">Save</button>
              <button onClick={() => setShowSYForm(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm">Cancel</button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {schoolYears.map(sy => (
              <div key={sy.id} className={`p-4 rounded-xl border-2 ${sy.isActive ? 'border-[#F5C400] bg-[#FFFDF0]' : 'border-gray-200 bg-white'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-[#001840] text-lg">{sy.year}</p>
                    {sy.isActive && <span className="text-xs font-semibold text-green-600 flex items-center gap-1"><Check className="w-3 h-3" /> Active</span>}
                  </div>
                  {!sy.isActive && (
                    <button onClick={() => activateSchoolYear(sy.id)} className="px-3 py-1.5 text-xs font-semibold bg-[#102A71] text-white rounded-lg hover:bg-[#001840]">
                      Set Active
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
