import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams, useLocation } from 'react-router';
import { toast } from 'sonner';
import { validateHSEnrollmentForm, showValidationErrors } from '../utils/enrollmentValidation';
import { uploadEnrollmentDocuments, getEnrollmentDocuments, deleteEnrollmentDocument } from '../services/enrollmentApi';
import '../styles/enrollmentForm.css';

const API = 'http://localhost:3000/api';
const getToken = () => localStorage.getItem('token');

const JHS_GRADES = ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'];
const SHS_GRADES = ['Grade 11', 'Grade 12'];
const SHS_STRANDS = ['STEM', 'ABM', 'HUMSS', 'TVL', 'Sports', 'Arts and Design'];

export function HSEnrollmentForm({ enrollmentId, readOnly = false }) {
  const { id: paramId } = useParams();
  const id = enrollmentId || paramId;
  const navigate = useNavigate();
  const location = useLocation();

  // Make educationLevel stateful so it can be set from loaded enrollment data
  const [educationLevel, setEducationLevel] = useState(
    location.state?.educationLevel || 'JHS'
  );

  const [loading, setLoading] = useState(false);
  const [savedId, setSavedId] = useState(id || null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  // Document upload state
  const [docFiles, setDocFiles] = useState({});
  const [uploadedDocs, setUploadedDocs] = useState([]);
  const [docsUploading, setDocsUploading] = useState(false);

  const gradeOptions = educationLevel === 'SHS' ? SHS_GRADES : JHS_GRADES;

  const { register, handleSubmit, setValue, watch } = useForm({
    defaultValues: {
      studentNumber: ['', '', '', '', '', ''],
      studentType: { new: false, old: false },
      admissionCredentials: { f138: false, f137a: false, cert: false, f137e: false },
      sscApplied: false
    }
  });

  const selectedGrade = watch('gradeLevel');
  const sscApplied = watch('sscApplied');
  const isSHS = educationLevel === 'SHS';
  const isGrade7 = selectedGrade === 'Grade 7';

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.name) {
      const parts = user.name.split(' ');
      setValue('firstName', parts[0] || '');
      setValue('familyName', parts[parts.length - 1] || '');
    }
    if (id) loadEnrollment(id);
  }, [id]);

  const loadEnrollment = async (eid) => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/enrollments/${eid}`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      const data = await res.json();

      // Populate form
      if (data.educationLevel) setEducationLevel(data.educationLevel);
      if (data.studentType) {
        setValue('studentType.new', data.studentType === 'New');
        setValue('studentType.old', data.studentType === 'Old');
      }
      if (data.studentNumber) {
        data.studentNumber.split('').slice(0, 6).forEach((d, i) => setValue(`studentNumber.${i}`, d));
      }
      const fields = ['gradeLevel', 'strand', 'academicYear', 'dateEnrolled', 'lrn', 'sex',
        'familyName', 'firstName', 'middleName', 'dateOfBirth', 'placeOfBirth',
        'fatherName', 'fatherOccupation', 'motherName', 'motherOccupation',
        'parentsAddress', 'guardianName', 'guardianOccupation', 'guardianAddress',
        'guardianTelephone', 'grade6School', 'grade6SchoolAddress', 'grade6Section',
        'grade6SYStart', 'grade6SYEnd', 'grade6Average', 'grade6Remarks',
        'lastHSSchool', 'lastHSCurriculumYear', 'lastHSSection', 'lastHSSYStart',
        'lastHSSYEnd', 'studentSignature', 'parentGuardianSignature'];
      fields.forEach(f => { if (data[f]) setValue(f, data[f]); });

      if (data.admissionCredentials && Array.isArray(data.admissionCredentials)) {
        data.admissionCredentials.forEach(c => setValue(`admissionCredentials.${c}`, true));
      }
      if (data.sscApplied) setValue('sscApplied', true);
      setSavedId(eid);

      // Load existing uploaded documents
      try {
        const docs = await getEnrollmentDocuments(eid);
        setUploadedDocs(Array.isArray(docs) ? docs : []);
      } catch (_) {}
    } catch (e) {
      toast.error('Failed to load enrollment');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);

      // Validate form
      const validationErrors = validateHSEnrollmentForm(data, educationLevel);
      if (validationErrors.length > 0) {
        showValidationErrors(validationErrors, toast);
        setLoading(false);
        return;
      }

      const payload = {
        educationLevel,
        gradeLevel: data.gradeLevel,
        strand: data.strand || null,
        studentType: data.studentType?.new ? 'New' : data.studentType?.old ? 'Old' : '',
        studentNumber: data.studentNumber?.join('') || '',
        academicYear: data.academicYear || '',
        dateEnrolled: data.dateEnrolled || null,
        admissionCredentials: data.admissionCredentials
          ? Object.keys(data.admissionCredentials).filter(k => data.admissionCredentials[k])
          : [],
        sscApplied: data.sscApplied || false,
        lrn: data.lrn || '',
        familyName: data.familyName || '',
        firstName: data.firstName || '',
        middleName: data.middleName || '',
        sex: data.sex || null,
        dateOfBirth: data.dateOfBirth || null,
        placeOfBirth: data.placeOfBirth || '',
        fatherName: data.fatherName || '',
        fatherOccupation: data.fatherOccupation || '',
        motherName: data.motherName || '',
        motherOccupation: data.motherOccupation || '',
        parentsAddress: data.parentsAddress || '',
        guardianName: data.guardianName || '',
        guardianOccupation: data.guardianOccupation || '',
        guardianAddress: data.guardianAddress || '',
        guardianTelephone: data.guardianTelephone || '',
        grade6School: data.grade6School || '',
        grade6SchoolAddress: data.grade6SchoolAddress || '',
        grade6Section: data.grade6Section || '',
        grade6SYStart: data.grade6SYStart || '',
        grade6SYEnd: data.grade6SYEnd || '',
        grade6Average: data.grade6Average || '',
        grade6Remarks: data.grade6Remarks || '',
        lastHSSchool: data.lastHSSchool || '',
        lastHSCurriculumYear: data.lastHSCurriculumYear || '',
        lastHSSection: data.lastHSSection || '',
        lastHSSYStart: data.lastHSSYStart || '',
        lastHSSYEnd: data.lastHSSYEnd || '',
        studentSignature: data.studentSignature || '',
        parentGuardianSignature: data.parentGuardianSignature || '',
        status: 'submitted'
      };

      const url = savedId ? `${API}/enrollments/${savedId}` : `${API}/enrollments`;
      const method = savedId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to save');
      }

      const result = await res.json();
      const eid = result.enrollment?.id || savedId;
      setSavedId(eid);
      
      // Upload any pending documents
      const pendingFiles = Object.entries(docFiles).filter(([, f]) => f);
      if (pendingFiles.length > 0) {
        setDocsUploading(true);
        try {
          const uploaded = await uploadEnrollmentDocuments(eid, docFiles);
          setUploadedDocs(uploaded.documents || []);
          setDocFiles({});
        } catch (_) {}
        finally { setDocsUploading(false); }
      }

      // Show SSC-specific messages
      if (result.sscQualified === true) {
        toast.success('SSC Qualified!', { 
          description: 'You qualify for the Special Science Class entrance exam. The registrar will contact you.' 
        });
      } else if (result.sscQualified === false) {
        toast.warning('SSC Not Qualified', { 
          description: 'Your Grade 6 average does not meet the SSC requirement (85+). You will be enrolled in Regular class.' 
        });
      } else {
        toast.success('Enrollment saved!', { description: `Enrollment ID: ${eid}` });
      }
    } catch (e) {
      toast.error(e.message || 'Failed to save enrollment');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      await fetch(`${API}/enrollments/${savedId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      toast.success('Enrollment deleted');
      setTimeout(() => navigate('/my-enrollments'), 1500);
    } catch (e) {
      toast.error('Failed to delete');
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFFDF0] via-[#FFF9E6] to-[#FFFDF0] py-8">

      {/* Action Bar */}
      {!readOnly && (
        <div className="max-w-[8.5in] mx-auto mb-6 px-4 no-print">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" onClick={() => navigate('/my-enrollments')}
                className="px-5 py-2.5 border-2 border-gray-300 text-gray-700 bg-white rounded-lg hover:bg-gray-50 font-medium">
                ← Back
              </button>
              {savedId && (
                <>
                  <button type="button" onClick={() => setShowDeleteConfirm(true)} disabled={loading}
                    className="px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50">
                    Delete
                  </button>
                  <span className="text-sm text-gray-600">
                    Enrollment ID: <span className="font-semibold text-[#102A71]">{savedId}</span>
                  </span>
                </>
              )}
              <button type="submit" form="hs-enrollment-form" disabled={loading}
                className="px-6 py-2.5 bg-[#F5C400] text-[#001840] rounded-lg hover:bg-[#FFDC5F] font-semibold shadow-md ml-auto flex items-center gap-2 disabled:opacity-50">
                {loading ? 'Saving...' : savedId ? 'Update Enrollment' : 'Save Enrollment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 no-print">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md mx-4">
            <h3 className="text-xl font-bold mb-4">Delete Enrollment?</h3>
            <p className="text-gray-600 mb-6">This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowDeleteConfirm(false)} className="px-5 py-2.5 border-2 border-gray-300 rounded-lg font-medium">Cancel</button>
              <button onClick={handleDelete} disabled={loading} className="px-5 py-2.5 bg-red-600 text-white rounded-lg font-medium disabled:opacity-50">
                {loading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <div className={`max-w-6xl mx-auto px-4 ${readOnly ? 'pointer-events-none opacity-90' : ''}`}>
        <div className="enrollment-form-container">
          <form id="hs-enrollment-form" onSubmit={handleSubmit(onSubmit)} className="enrollment-form">

            {/* ── HEADER ── */}
            <table style={{ width: '100%', marginBottom: '10px', borderCollapse: 'collapse' }}>
              <tbody><tr>
                <td style={{ width: '60%', verticalAlign: 'middle' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img src="/emc_logo_nobg.png" alt="EMC Logo" style={{ width: '58px', height: '58px', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '12pt' }}>EASTERN MINDORO COLLEGE, INC.</div>
                      <div style={{ fontSize: '9pt' }}>Calapan City, Oriental Mindoro</div>
                    </div>
                  </div>
                </td>
                <td style={{ width: '40%', textAlign: 'right', verticalAlign: 'middle' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '13pt', lineHeight: '1.3' }}>HIGH SCHOOL ENROLLMENT SLIP</div>
                </td>
              </tr></tbody>
            </table>

            {/* ── ROW 1: Grade Level + Student Number ── */}
            <table style={{ width: '100%', marginBottom: '6px', borderCollapse: 'collapse' }}>
              <tbody><tr>
                <td style={{ width: '55%', verticalAlign: 'middle', paddingRight: '12px' }}>
                  <span style={{ marginRight: '6px' }}>Grade Level / STRAND</span>
                  <select {...register('gradeLevel')} className="underlined-input" style={{ width: '110px', marginRight: '8px' }}>
                    <option value="">Select</option>
                    {gradeOptions.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                  {isSHS && (
                    <>
                      <span style={{ marginRight: '6px' }}>/</span>
                      <select {...register('strand')} className="underlined-input" style={{ width: '100px' }}>
                        <option value="">Strand</option>
                        {SHS_STRANDS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </>
                  )}
                </td>
                <td style={{ width: '45%', textAlign: 'right', verticalAlign: 'middle' }}>
                  <span style={{ marginRight: '8px' }}>Student Number</span>
                  <div className="student-number-boxes" style={{ display: 'inline-flex' }}>
                    {[0,1,2,3,4,5].map(i => (
                      <input key={i} type="text" maxLength="1"
                        {...register(`studentNumber.${i}`)} className="student-number-box" />
                    ))}
                  </div>
                </td>
              </tr></tbody>
            </table>

            {/* ── ROW 2: New/Old + School Year + Date Enrolled ── */}
            <table style={{ width: '100%', marginBottom: '8px', borderCollapse: 'collapse' }}>
              <tbody><tr>
                <td style={{ width: '55%', verticalAlign: 'middle' }}>
                  <span style={{ marginRight: '4px' }}>New</span>
                  <input type="checkbox" {...register('studentType.new')}
                    style={{ marginRight: '14px', width: '14px', height: '14px', verticalAlign: 'middle' }} />
                  <span style={{ marginRight: '4px' }}>Old</span>
                  <input type="checkbox" {...register('studentType.old')}
                    style={{ marginRight: '20px', width: '14px', height: '14px', verticalAlign: 'middle' }} />
                  <span style={{ marginRight: '6px' }}>School Year:</span>
                  <input type="text" {...register('academicYear')} className="underlined-input"
                    style={{ width: '90px' }} placeholder="2025-2026" />
                </td>
                <td style={{ width: '45%', textAlign: 'right', verticalAlign: 'middle' }}>
                  <span style={{ marginRight: '8px' }}>Date Enrolled</span>
                  <input type="date" {...register('dateEnrolled')} className="underlined-input" style={{ width: '140px' }} />
                </td>
              </tr></tbody>
            </table>

            {/* ── CREDENTIALS ── */}
            <div className="bordered-section" style={{ marginBottom: '0', padding: '6px 10px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody><tr>
                  <td style={{ fontWeight: 'bold', whiteSpace: 'nowrap', paddingRight: '16px', width: '1%' }}>
                    CREDENTIAL SUBMITTED:
                  </td>
                  {[
                    { key: 'f138', label: 'F138' },
                    { key: 'f137a', label: 'F137A' },
                    { key: 'cert', label: 'Cert' },
                    { key: 'f137e', label: 'F137E' },
                  ].map(c => (
                    <td key={c.key} style={{ paddingRight: '28px', whiteSpace: 'nowrap' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                        <input type="checkbox" {...register(`admissionCredentials.${c.key}`)}
                          style={{ width: '14px', height: '14px', flexShrink: 0 }} />
                        <span>{c.label}</span>
                      </label>
                    </td>
                  ))}
                </tr></tbody>
              </table>
            </div>

            {/* ── DOCUMENT UPLOADS ── */}
            {!readOnly && (
              <HSCredentialUploadSection
                credentials={[
                  { key: 'f138', label: 'F-138' },
                  { key: 'f137a', label: 'F-137-A' },
                  { key: 'cert', label: 'Certificate' },
                  { key: 'f137e', label: 'F-137-E' },
                ]}
                watchCredentials={watch('admissionCredentials')}
                docFiles={docFiles}
                setDocFiles={setDocFiles}
                uploadedDocs={uploadedDocs}
                setUploadedDocs={setUploadedDocs}
                enrollmentId={savedId}
                docsUploading={docsUploading}
              />
            )}

            {/* ── SSC APPLICATION (Grade 7 only) ── */}
            {isGrade7 && (
              <div className="bordered-section" style={{ marginBottom: '0', backgroundColor: '#FFFDE7', padding: '8px 10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                  <input type="checkbox" {...register('sscApplied')}
                    style={{ width: '16px', height: '16px', flexShrink: 0 }} />
                  <span>Apply for Special Science Class (SSC)</span>
                </label>
                {sscApplied && (
                  <div style={{ marginTop: '6px', paddingLeft: '24px', fontSize: '10pt', color: '#555' }}>
                    Grade 6 General Average must be <strong>85 or higher</strong> to qualify for the SSC entrance exam.
                  </div>
                )}
              </div>
            )}

            {/* ── PERSONAL INFO ── */}
            <div className="bordered-section" style={{ marginBottom: '0', padding: '8px 10px' }}>

              {/* 1. Name */}
              <div style={{ marginBottom: '2px' }}>
                <span><strong>1.</strong> Name: </span>
                <input type="text" {...register('familyName')} className="underlined-input"
                  style={{ width: '185px' }} placeholder="Family Name" />
                <span style={{ margin: '0 4px' }}>,</span>
                <input type="text" {...register('firstName')} className="underlined-input"
                  style={{ width: '145px' }} placeholder="First Name" />
                <span style={{ margin: '0 4px' }}></span>
                <input type="text" {...register('middleName')} className="underlined-input"
                  style={{ width: '115px' }} placeholder="Middle Name" />
                <span style={{ margin: '0 16px 0 18px' }}>LRN:</span>
                <input type="text" {...register('lrn')} className="underlined-input" style={{ width: '105px' }} />
                <span style={{ margin: '0 8px 0 18px' }}>Sex:</span>
                <select {...register('sex')} className="underlined-input" style={{ width: '78px' }}>
                  <option value="">—</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <div style={{ fontSize: '8.5pt', paddingLeft: '44px', marginBottom: '5px', color: '#555', display: 'flex' }}>
                <span style={{ display: 'inline-block', width: '192px' }}>(Family Name)</span>
                <span style={{ display: 'inline-block', width: '152px' }}>(First Name)</span>
                <span>(Middle Name)</span>
              </div>

              {/* 2. Date/Place of Birth */}
              <div style={{ marginBottom: '5px' }}>
                <span><strong>2.</strong> Date of Birth: </span>
                <input type="date" {...register('dateOfBirth')} className="underlined-input" style={{ width: '140px' }} />
                <span style={{ margin: '0 10px 0 22px' }}>Place of Birth: </span>
                <input type="text" {...register('placeOfBirth')} className="underlined-input"
                  style={{ width: 'calc(100% - 400px)' }} />
              </div>

              {/* 3. Father */}
              <div style={{ marginBottom: '5px' }}>
                <span><strong>3.</strong> Father: </span>
                <input type="text" {...register('fatherName')} className="underlined-input" style={{ width: '255px' }} />
                <span style={{ margin: '0 10px 0 22px' }}>Occupation: </span>
                <input type="text" {...register('fatherOccupation')} className="underlined-input"
                  style={{ width: 'calc(100% - 400px)' }} />
              </div>

              {/* 4. Mother */}
              <div style={{ marginBottom: '5px' }}>
                <span><strong>4.</strong> Mother: </span>
                <input type="text" {...register('motherName')} className="underlined-input" style={{ width: '255px' }} />
                <span style={{ margin: '0 10px 0 22px' }}>Occupation: </span>
                <input type="text" {...register('motherOccupation')} className="underlined-input"
                  style={{ width: 'calc(100% - 400px)' }} />
              </div>

              {/* 5. Address of Parents */}
              <div style={{ marginBottom: '5px' }}>
                <span><strong>5.</strong> Address of Parents: </span>
                <input type="text" {...register('parentsAddress')} className="underlined-input"
                  style={{ width: 'calc(100% - 165px)' }} />
              </div>

              {/* 6. Guardian */}
              <div style={{ marginBottom: '5px' }}>
                <span><strong>6.</strong> Guardian if any: </span>
                <input type="text" {...register('guardianName')} className="underlined-input" style={{ width: '215px' }} />
                <span style={{ margin: '0 10px 0 22px' }}>Occupation: </span>
                <input type="text" {...register('guardianOccupation')} className="underlined-input"
                  style={{ width: 'calc(100% - 390px)' }} />
              </div>

              {/* 7. Address of Guardian */}
              <div style={{ marginBottom: '5px' }}>
                <span><strong>7.</strong> Address of Guardian: </span>
                <input type="text" {...register('guardianAddress')} className="underlined-input" style={{ width: '195px' }} />
                <span style={{ margin: '0 10px 0 22px' }}>Telephone/Mobile no. </span>
                <input type="text" {...register('guardianTelephone')} className="underlined-input"
                  style={{ width: 'calc(100% - 450px)' }} />
              </div>

              {/* 8. Grade VI School */}
              <div style={{ marginBottom: '3px' }}>
                <span><strong>8.</strong> School where you finish Grade VI </span>
                <input type="text" {...register('grade6School')} className="underlined-input"
                  style={{ width: 'calc(100% - 268px)' }} />
              </div>
              <div style={{ marginBottom: '3px', paddingLeft: '20px' }}>
                <span>Located at </span>
                <input type="text" {...register('grade6SchoolAddress')} className="underlined-input" style={{ width: '255px' }} />
                <span style={{ margin: '0 8px 0 18px' }}>Grade Six, Section </span>
                <input type="text" {...register('grade6Section')} className="underlined-input" style={{ width: '88px' }} />
              </div>
              <div style={{ marginBottom: '5px', paddingLeft: '20px' }}>
                <span>School Year Graduated </span>
                <input type="text" {...register('grade6SYStart')} className="underlined-input"
                  style={{ width: '46px' }} placeholder="2020" />
                <span style={{ margin: '0 3px' }}>-</span>
                <input type="text" {...register('grade6SYEnd')} className="underlined-input"
                  style={{ width: '46px' }} placeholder="2021" />
                <span style={{ margin: '0 8px 0 18px' }}>General Average </span>
                <input type="text" {...register('grade6Average')} className="underlined-input" style={{ width: '48px' }} />
                <span style={{ margin: '0 8px 0 18px' }}>Remarks </span>
                <input type="text" {...register('grade6Remarks')} className="underlined-input" style={{ width: '95px' }} />
              </div>

              {/* 9. Last HS Attended */}
              <div style={{ marginBottom: '3px' }}>
                <span><strong>9.</strong> Last High School Attended: </span>
                <input type="text" {...register('lastHSSchool')} className="underlined-input"
                  style={{ width: 'calc(100% - 228px)' }} />
              </div>
              <div style={{ paddingBottom: '2px', paddingLeft: '20px' }}>
                <span>Curriculum Year (G7-G8-G9-G10-G11-G12) </span>
                <input type="text" {...register('lastHSCurriculumYear')} className="underlined-input" style={{ width: '48px' }} />
                <span style={{ margin: '0 8px 0 14px' }}>Section </span>
                <input type="text" {...register('lastHSSection')} className="underlined-input" style={{ width: '78px' }} />
                <span style={{ margin: '0 8px 0 14px' }}>School Year </span>
                <input type="text" {...register('lastHSSYStart')} className="underlined-input" style={{ width: '46px' }} />
                <span style={{ margin: '0 3px' }}>-</span>
                <input type="text" {...register('lastHSSYEnd')} className="underlined-input" style={{ width: '46px' }} />
              </div>
            </div>

            {/* ── PLEDGE ── */}
            <div className="bordered-section" style={{ marginBottom: '0', fontSize: '10pt', lineHeight: '1.4' }}>
              <div style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: '6px', fontSize: '10.5pt' }}>
                Ako ay nangangako sa aking pagpapatala na aking susundin ang lahat ng mga alituntunin at regulasyon ng paaralan upang
                makatapos ng High School sa EASTERN MINDORO COLLEGE
              </div>
              <ol style={{ margin: '0', paddingLeft: '18px' }}>
                {[
                  'Ibibigay ko ang lahat ng kailangan sa pagpapatala at ang mga ito ay hindi ko na makukuha pagkatapos na ako ay makapagpatala sapagkat ang mga ito ay magiging bahagi at pag-aari ng paaralan.',
                  'MAGBABAYAD AKO SA TAKDANG ORAS NG AKING MGA OBLIGASYON TULAD NG ENTRANCE FEE, TUITION FEE AT IBA PANG DAPAT BAYARAN. Umaayon din ako na magbabayad ng ano mang pagtataas sa mga obligasyon na sinang-ayunan ng DEPED at ito ay may bisa mula sa buwan ng Hunyo.',
                  'Hindi ko pababayaan ang aking pag-aaral at gagawin ang mga kinakailangan ng bawat antas.',
                  'Isusuot ko araw-araw ang itinalagang uniform ng paaralan at hindi rin papasok na mahaba o magulo ang buhok.',
                  'Hindi ako papasok na huli, liliban sa klase o magbubulakbol sa oras ng klase.',
                  'Hindi ako papasok na nakainom, lasing, tutulog o maninigarilyo sa paaralan.',
                  'Hindi ako magdadala ng anumang patalim o manggugulo at sasali sa pag-aklas o demonstrasyon.',
                  'Hindi ako magdadala o magpapaputok ng anumang klase ng paputok tulad ng rebentador sa paaralan.',
                  'Hindi ako magdadala, iinom o kakain ng anumang ipinagbabawal na gamot o sasapi sa mga fraternies.',
                  'Hindi ko hahamunin ng away ang aking mga kamag-aral at mga guro.',
                  'Hindi ako magdadala, magnanakaw o maninira ng anumang gamit, maghuhuwad ng mga records o lulukuhin ang mga kamag-aral, guro at iba pa.',
                  'Hindi ako magsusugal sa loob at labas ng paaralan, at magiging matapat, malinis, maayos, at masunurin.',
                  "Ako'y makikiisa sa lahat ng gawaing pampaaralan.",
                  'Lalagyan ko ng pabalat ang aking mga hiniram na aklat at isasauli bago matapos ang taong panuruan at babayaran ang anumang kasiraan at pagkawala nito.',
                  'Handa akong sumama sa pagtataas ng watawat araw-araw at taos pusong aawitin ang Pambansang Awit ng Pilipinas at ang "EMC Loyalty Song".',
                  'Handa akong tumanggap ng anumang nauukol na kaparusahan kapag sinuway ko ang mga nabanggi na kautusan.',
                ].map((item, i) => (
                  <li key={i} style={{ marginBottom: '2px' }}>{item}</li>
                ))}
              </ol>
            </div>

            {/* ── SIGNATURES ── */}
            <div className="bordered-section" style={{ marginBottom: '0', padding: '14px 10px 10px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody><tr>
                  <td style={{ width: '45%', paddingRight: '20px', verticalAlign: 'bottom' }}>
                    <input type="text" {...register('parentGuardianSignature')} className="underlined-input"
                      style={{ width: '100%', marginBottom: '4px' }} placeholder="Parent/Guardian name" />
                    <div style={{ textAlign: 'center', fontSize: '9.5pt', fontStyle: 'italic' }}>
                      Pangalan at Lagda ng Magulang/Guardian
                    </div>
                  </td>
                  <td style={{ width: '10%' }}></td>
                  <td style={{ width: '45%', paddingLeft: '20px', verticalAlign: 'bottom' }}>
                    <input type="text" {...register('studentSignature')} className="underlined-input"
                      style={{ width: '100%', marginBottom: '4px' }} placeholder="Student name" />
                    <div style={{ textAlign: 'center', fontSize: '9.5pt', fontStyle: 'italic' }}>
                      Pangalan at Lagda ng Mag-aaral
                    </div>
                  </td>
                </tr></tbody>
              </table>
            </div>

            {/* ── FOOTER ── */}
            <div className="form-footer" style={{ marginTop: '8px' }}>
              <strong>E</strong>nriching <strong>M</strong>inds of <strong>C</strong>hampion
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}

// ── HSCredentialUploadSection ─────────────────────────────────────────────────
const HS_API_BASE = 'http://localhost:3000';

function HSCredentialUploadSection({
  credentials,
  watchCredentials,
  docFiles,
  setDocFiles,
  uploadedDocs,
  setUploadedDocs,
  enrollmentId,
  docsUploading,
}) {
  const checkedCreds = credentials.filter(c => watchCredentials && watchCredentials[c.key] === true);

  if (checkedCreds.length === 0) return null;

  function handleFileChange(key, file) {
    setDocFiles(prev => ({ ...prev, [key]: file || null }));
  }

  async function handleUploadSingle(key) {
    if (!enrollmentId) {
      toast.error('Please save the enrollment form first before uploading documents.');
      return;
    }
    const file = docFiles[key];
    if (!file) return;
    try {
      const result = await uploadEnrollmentDocuments(enrollmentId, { [key]: file });
      setUploadedDocs(result.documents || []);
      setDocFiles(prev => ({ ...prev, [key]: null }));
      toast.success('Document uploaded successfully');
    } catch (err) {
      toast.error(err.message || 'Upload failed');
    }
  }

  async function handleDeleteDoc(eid, docId) {
    try {
      await deleteEnrollmentDocument(eid, docId);
      setUploadedDocs(prev => prev.filter(d => d.id !== docId));
      toast.success('Document removed');
    } catch (err) {
      toast.error(err.message || 'Failed to remove document');
    }
  }

  return (
    <div className="no-print bg-amber-50 border border-amber-200 rounded-xl p-4 my-3">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm font-bold text-amber-800">📎 Upload Supporting Documents</span>
        <span className="text-xs text-amber-600">(PDF, JPG, PNG — max 10MB each)</span>
      </div>
      {!enrollmentId && (
        <p className="text-xs text-amber-700 bg-amber-100 rounded-lg px-3 py-2 mb-3">
          Save the enrollment form first — documents will be uploaded automatically on save.
        </p>
      )}
      <div className="space-y-3">
        {checkedCreds.map(cred => {
          const uploaded = uploadedDocs.find(d => d.documentType === cred.key);
          const pendingFile = docFiles[cred.key];
          return (
            <div key={cred.key} className="bg-white rounded-lg border border-amber-100 p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-700">{cred.label}</span>
                {uploaded && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">✓ Uploaded</span>
                )}
              </div>
              {uploaded ? (
                <div className="flex items-center gap-3">
                  <a
                    href={`${HS_API_BASE}${uploaded.filePath}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1 truncate max-w-[200px]"
                  >
                    📄 {uploaded.originalName}
                  </a>
                  <button
                    type="button"
                    onClick={() => handleDeleteDoc(enrollmentId, uploaded.id)}
                    className="text-xs text-red-500 hover:text-red-700 ml-auto shrink-0"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 flex-wrap">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={e => handleFileChange(cred.key, e.target.files[0])}
                    className="text-xs text-gray-600 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-[#102A71] file:text-white hover:file:bg-[#001840] flex-1 min-w-0"
                  />
                  {pendingFile && enrollmentId && (
                    <button
                      type="button"
                      onClick={() => handleUploadSingle(cred.key)}
                      disabled={docsUploading}
                      className="text-xs px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 shrink-0"
                    >
                      Upload
                    </button>
                  )}
                  {pendingFile && !enrollmentId && (
                    <span className="text-xs text-green-600 shrink-0">✓ Ready — will upload on save</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {docsUploading && (
        <p className="text-xs text-amber-700 mt-2 animate-pulse">Uploading documents...</p>
      )}
    </div>
  );
}
