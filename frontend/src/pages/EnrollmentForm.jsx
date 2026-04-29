import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams, useLocation } from 'react-router';
import { toast } from 'sonner';
import { createEnrollment, createEnrollmentWithTOR, getEnrollmentById, downloadEnrollmentPDF, deleteEnrollment, uploadEnrollmentDocuments, getEnrollmentDocuments, deleteEnrollmentDocument } from '../services/enrollmentApi';
import { validateEnrollmentForm, showValidationErrors } from '../utils/enrollmentValidation';
import '../styles/enrollmentForm.css';

const ENROLLMENT_TYPES = [
  { value: 'first-time', label: 'First-time', desc: 'New college student' },
  { value: 'continuing', label: 'Continuing', desc: 'Currently enrolled student' },
  { value: 'returnee', label: 'Returnee', desc: 'Previously enrolled, returning' },
  { value: 'transferee', label: 'Transferee', desc: 'Coming from another school' },
];

const BSED_MAJORS = ['Filipino', 'English', 'Mathematics', 'Science', 'Social Studies'];
const BSBA_MAJORS = ['Financial Management', 'Marketing Management'];

export function EnrollmentForm({ enrollmentId, readOnly = false }) {
  const { id: paramId } = useParams();
  const id = enrollmentId || paramId;
  const navigate = useNavigate();
  const location = useLocation();
  // Use location state first, fall back to 'College' — will be overridden when enrollment loads
  const [educationLevel, setEducationLevel] = useState(location.state?.educationLevel || 'College');

  const [loading, setLoading] = useState(false);
  const [savedEnrollmentId, setSavedEnrollmentId] = useState(id || null);
  const [formChanged, setFormChanged] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [enrollmentType, setEnrollmentType] = useState('');
  const [studentStatus, setStudentStatus] = useState('');
  const [torFile, setTorFile] = useState(null);
  // Document upload state: { docType: File }
  const [docFiles, setDocFiles] = useState({});
  // Already-uploaded documents from server: [{ id, documentType, documentLabel, filePath, originalName }]
  const [uploadedDocs, setUploadedDocs] = useState([]);
  const [docsUploading, setDocsUploading] = useState(false);
  
  const { register, handleSubmit, setValue, watch } = useForm({
    defaultValues: {
      studentNumber: ['', '', '', '', '', ''],
      subjects: Array(8).fill(null).map(() => ({ code: '', description: '', units: '', time: '', dayTime: '' })),
      studentType: { new: false, old: false },
      admissionCredentials: {
        f138: false,
        f137a: false,
        cgmc: false,
        tor: false,
        birthCert: false,
        marriageCert: false
      },
      father: { name: '', occupation: '', address: '' },
      mother: { name: '', occupation: '', address: '' },
      guardian: { name: '', occupation: '', address: '' },
      education: {
        primary: { school: '', ayStart: '', ayEnd: '' },
        intermediate: { school: '', ayStart: '', ayEnd: '' },
        juniorHigh: { school: '', ayStart: '', ayEnd: '' },
        seniorHigh: { school: '', ayStart: '', ayEnd: '' },
        seniorHighAddress: '',
        lastCollege: { name: '', course: '', address: '', ayStart: '', ayEnd: '' }
      },
      approval: { name: '', date: '' }
    }
  });
  
  // Helper function to register inputs with disabled state for read-only mode
  const registerField = (name, options = {}) => {
    return register(name, { ...options, disabled: readOnly });
  };
  
  // Watch for form changes
  useEffect(() => {
    const subscription = watch(() => setFormChanged(true));
    return () => subscription.unsubscribe();
  }, [watch]);
  
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.name) {
      const nameParts = user.name.split(' ');
      setValue('firstName', nameParts[0] || '');
      setValue('familyName', nameParts[nameParts.length - 1] || '');
    }
    if (user.email) setValue('email', user.email);
    
    if (id) loadEnrollment(id);
  }, [id, setValue]);
  
  const loadEnrollment = async (enrollmentId) => {
    try {
      setLoading(true);
      const enrollment = await getEnrollmentById(enrollmentId);
      
      // Transform backend data to form format
      if (enrollment.studentType) {
        setValue('studentType.new', enrollment.studentType === 'New');
        setValue('studentType.old', enrollment.studentType === 'Old');
      }
      if (enrollment.enrollmentType) setEnrollmentType(enrollment.enrollmentType);
      if (enrollment.studentStatus) setStudentStatus(enrollment.studentStatus);
      if (enrollment.educationLevel) setEducationLevel(enrollment.educationLevel);
      
      // Student Number - split string into array
      if (enrollment.studentNumber) {
        const numArray = enrollment.studentNumber.split('').slice(0, 6);
        numArray.forEach((digit, i) => setValue(`studentNumber.${i}`, digit));
      }
      
      // Enrollment Period
      if (enrollment.semester) setValue('semester', enrollment.semester);
      if (enrollment.academicYear) {
        const [start, end] = enrollment.academicYear.split('-');
        setValue('yearStart', start?.substring(2) || '');
        setValue('yearEnd', end?.substring(2) || '');
      }
      if (enrollment.dateEnrolled) setValue('dateEnrolled', enrollment.dateEnrolled);
      
      // Course Information
      if (enrollment.course) setValue('course', enrollment.course);
      if (enrollment.major) setValue('major', enrollment.major);
      if (enrollment.curriculumYear) setValue('curriculumYear', enrollment.curriculumYear);
      
      // Admission Credentials - convert array to object
      if (enrollment.admissionCredentials && Array.isArray(enrollment.admissionCredentials)) {
        enrollment.admissionCredentials.forEach(cred => {
          setValue(`admissionCredentials.${cred}`, true);
        });
      }
      
      // Personal Information
      if (enrollment.familyName) setValue('familyName', enrollment.familyName);
      if (enrollment.firstName) setValue('firstName', enrollment.firstName);
      if (enrollment.middleName) setValue('middleName', enrollment.middleName);
      if (enrollment.sex) setValue('sex', enrollment.sex);
      if (enrollment.dateOfBirth) setValue('dateOfBirth', enrollment.dateOfBirth);
      if (enrollment.placeOfBirth) setValue('placeOfBirth', enrollment.placeOfBirth);
      
      // Contact Information
      if (enrollment.email) setValue('email', enrollment.email);
      if (enrollment.mobileNumber) setValue('mobileNumber', enrollment.mobileNumber);
      
      // Parent Information
      if (enrollment.fatherName) setValue('father.name', enrollment.fatherName);
      if (enrollment.fatherOccupation) setValue('father.occupation', enrollment.fatherOccupation);
      if (enrollment.fatherAddress) setValue('father.address', enrollment.fatherAddress);
      if (enrollment.motherName) setValue('mother.name', enrollment.motherName);
      if (enrollment.motherOccupation) setValue('mother.occupation', enrollment.motherOccupation);
      if (enrollment.motherAddress) setValue('mother.address', enrollment.motherAddress);
      
      // Guardian Information
      if (enrollment.guardianName) setValue('guardian.name', enrollment.guardianName);
      if (enrollment.guardianOccupation) setValue('guardian.occupation', enrollment.guardianOccupation);
      if (enrollment.guardianAddress) setValue('guardian.address', enrollment.guardianAddress);
      
      // Educational Background
      if (enrollment.educationalBackground) {
        const edu = enrollment.educationalBackground;
        if (edu.primary) {
          setValue('education.primary.school', edu.primary.school || '');
          setValue('education.primary.ayStart', edu.primary.ayStart || '');
          setValue('education.primary.ayEnd', edu.primary.ayEnd || '');
        }
        if (edu.intermediate) {
          setValue('education.intermediate.school', edu.intermediate.school || '');
          setValue('education.intermediate.ayStart', edu.intermediate.ayStart || '');
          setValue('education.intermediate.ayEnd', edu.intermediate.ayEnd || '');
        }
        if (edu.juniorHigh) {
          setValue('education.juniorHigh.school', edu.juniorHigh.school || '');
          setValue('education.juniorHigh.ayStart', edu.juniorHigh.ayStart || '');
          setValue('education.juniorHigh.ayEnd', edu.juniorHigh.ayEnd || '');
        }
        if (edu.seniorHigh) {
          setValue('education.seniorHigh.school', edu.seniorHigh.school || '');
          setValue('education.seniorHigh.ayStart', edu.seniorHigh.ayStart || '');
          setValue('education.seniorHigh.ayEnd', edu.seniorHigh.ayEnd || '');
        }
        if (edu.seniorHighAddress) setValue('education.seniorHighAddress', edu.seniorHighAddress);
        if (edu.lastCollege) {
          setValue('education.lastCollege.name', edu.lastCollege.name || '');
          setValue('education.lastCollege.course', edu.lastCollege.course || '');
          setValue('education.lastCollege.address', edu.lastCollege.address || '');
          setValue('education.lastCollege.ayStart', edu.lastCollege.ayStart || '');
          setValue('education.lastCollege.ayEnd', edu.lastCollege.ayEnd || '');
        }
      }
      
      // Subjects
      if (enrollment.subjects && Array.isArray(enrollment.subjects)) {
        enrollment.subjects.forEach((subject, i) => {
          if (i < 8) {
            setValue(`subjects.${i}.code`, subject.code || '');
            setValue(`subjects.${i}.description`, subject.description || '');
            setValue(`subjects.${i}.units`, subject.units || '');
            setValue(`subjects.${i}.time`, subject.time || '');
            setValue(`subjects.${i}.dayTime`, subject.dayTime || '');
          }
        });
      }
      
      // Additional Information
      if (enrollment.studentSignature) setValue('studentSignature', enrollment.studentSignature);
      if (enrollment.referredBy) setValue('referredBy', enrollment.referredBy);
      
      setSavedEnrollmentId(enrollmentId);
      toast.success('Enrollment loaded successfully');
      
      // Load existing uploaded documents
      try {
        const docs = await getEnrollmentDocuments(enrollmentId);
        setUploadedDocs(Array.isArray(docs) ? docs : []);
      } catch (_) {
        // non-critical, ignore
      }
      
    } catch (error) {
      console.error('Load error:', error);
      toast.error(error.message || 'Failed to load enrollment');
    } finally {
      setLoading(false);
    }
  };
  
  const onSubmit = async (data) => {
    try {
      setLoading(true);
      
      // Validate form
      const validationErrors = validateEnrollmentForm(data, enrollmentType, educationLevel);
      if (validationErrors.length > 0) {
        showValidationErrors(validationErrors, toast);
        setLoading(false);
        return;
      }
      
      console.log('Form data:', data); // Debug log
      
      // Transform the form data to match backend schema
      const enrollmentData = {
        // Education level and enrollment type (new Phase 1 fields)
        educationLevel: educationLevel || 'College',
        enrollmentType: enrollmentType || '',
        studentStatus: studentStatus || null,

        // Student Type - keep for backward compat
        studentType: data.studentType?.new ? 'New' : data.studentType?.old ? 'Old' : '',
        
        // Student Number - combine array into string
        studentNumber: data.studentNumber?.join('') || '',
        
        // Enrollment Period
        semester: data.semester?.trim() || '',
        academicYear: data.yearStart && data.yearEnd ? `20${data.yearStart}-20${data.yearEnd}` : '',
        dateEnrolled: data.dateEnrolled || null,
        
        // Course Information
        course: data.course || '',
        major: data.major?.trim() || '',
        curriculumYear: data.curriculumYear?.trim() || '',
        
        // Admission Credentials - convert to array
        admissionCredentials: data.admissionCredentials ? 
          Object.keys(data.admissionCredentials).filter(key => data.admissionCredentials[key]) : [],
        
        // Personal Information
        familyName: data.familyName?.trim() || '',
        firstName: data.firstName?.trim() || '',
        middleName: data.middleName?.trim() || '',
        sex: data.sex || null,
        dateOfBirth: data.dateOfBirth || null,
        placeOfBirth: data.placeOfBirth?.trim() || '',
        
        // Contact Information
        email: data.email?.trim() || '',
        mobileNumber: data.mobileNumber?.trim() || '',
        
        // Parent Information
        fatherName: data.father?.name?.trim() || '',
        fatherOccupation: data.father?.occupation?.trim() || '',
        fatherAddress: data.father?.address?.trim() || '',
        motherName: data.mother?.name?.trim() || '',
        motherOccupation: data.mother?.occupation?.trim() || '',
        motherAddress: data.mother?.address?.trim() || '',
        
        // Guardian Information
        guardianName: data.guardian?.name?.trim() || '',
        guardianOccupation: data.guardian?.occupation?.trim() || '',
        guardianAddress: data.guardian?.address?.trim() || '',
        
        // Educational Background
        educationalBackground: {
          primary: data.education?.primary || {},
          intermediate: data.education?.intermediate || {},
          juniorHigh: data.education?.juniorHigh || {},
          seniorHigh: data.education?.seniorHigh || {},
          seniorHighAddress: data.education?.seniorHighAddress || '',
          lastCollege: data.education?.lastCollege || {}
        },
        
        // Subjects - filter out empty rows
        subjects: data.subjects?.filter(s => s && (s.code?.trim() || s.description?.trim())) || [],
        
        // Additional Information
        studentSignature: data.studentSignature?.trim() || '',
        referredBy: data.referredBy?.trim() || ''
      };
      
      console.log('Transformed enrollment data:', enrollmentData); // Debug log
      
      // Validate required fields - enrollmentType and course are required
      if (!enrollmentType) {
        toast.error('Please select your enrollment type', {
          description: 'Choose from: First-time, Continuing, Returnee, or Transferee',
          duration: 5000
        });
        setLoading(false);
        return;
      }

      if (!enrollmentData.course || enrollmentData.course === '') {
        toast.error('Please select a course', {
          description: 'Choose a course from the dropdown menu',
          duration: 5000
        });
        setLoading(false);
        return;
      }
      
      // Handle TOR file upload for transferees
      if (enrollmentType === 'transferee' && torFile) {
        const formData = new FormData();
        // Add all enrollment data as JSON string
        formData.append('enrollmentData', JSON.stringify(enrollmentData));
        formData.append('tor', torFile);
        const result = await createEnrollmentWithTOR(formData);
        if (result && result.enrollment) {
          setSavedEnrollmentId(result.enrollment.id);
          setFormChanged(false);
          // Upload any additional credential documents
          const pendingFiles = Object.entries(docFiles).filter(([, f]) => f);
          if (pendingFiles.length > 0) {
            setDocsUploading(true);
            try {
              const uploaded = await uploadEnrollmentDocuments(result.enrollment.id, docFiles);
              setUploadedDocs(uploaded.documents || []);
              setDocFiles({});
            } catch (_) {}
            finally { setDocsUploading(false); }
          }
          toast.success('Enrollment saved successfully!', { description: `Enrollment ID: ${result.enrollment.id}`, duration: 5000 });
        }
        setLoading(false);
        return;
      }

      console.log('Sending to API...');
      
      const result = await createEnrollment(enrollmentData);
      
      console.log('API Response:', result); // Debug log
      
      if (result && result.enrollment) {
        setSavedEnrollmentId(result.enrollment.id);
        setFormChanged(false);
        
        // Upload any pending documents
        const pendingFiles = Object.entries(docFiles).filter(([, f]) => f);
        if (pendingFiles.length > 0) {
          setDocsUploading(true);
          try {
            const uploaded = await uploadEnrollmentDocuments(result.enrollment.id, docFiles);
            setUploadedDocs(uploaded.documents || []);
            setDocFiles({});
            toast.success('Enrollment and documents saved successfully!', {
              description: `Enrollment ID: ${result.enrollment.id} • ${pendingFiles.length} document(s) uploaded`,
              duration: 5000
            });
          } catch (docErr) {
            toast.warning('Enrollment saved but some documents failed to upload', {
              description: docErr.message,
              duration: 6000
            });
          } finally {
            setDocsUploading(false);
          }
        } else {
          toast.success('Enrollment saved successfully!', {
            description: `Enrollment ID: ${result.enrollment.id}`,
            duration: 5000
          });
        }
      } else {
        throw new Error('Invalid response from server');
      }
      
    } catch (error) {
      console.error('Save error:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      // More detailed error messages
      let errorMessage = 'Failed to save enrollment';
      let errorDescription = '';
      
      if (error.message.includes('studentType')) {
        errorMessage = 'Student Type Error';
        errorDescription = 'Please select either New or Old student';
      } else if (error.message.includes('course')) {
        errorMessage = 'Course Error';
        errorDescription = 'Please select a valid course';
      } else if (error.message.includes('Network') || error.message.includes('fetch')) {
        errorMessage = 'Network Error';
        errorDescription = 'Cannot connect to server. Make sure backend is running on http://localhost:3000';
      } else if (error.message.includes('401') || error.message.includes('Authentication')) {
        errorMessage = 'Authentication Error';
        errorDescription = 'Please log in again';
        setTimeout(() => navigate('/login'), 2000);
      } else if (error.message.includes('400') || error.message.includes('Validation')) {
        errorMessage = 'Validation Error';
        errorDescription = error.message;
      } else {
        errorDescription = error.message || 'An unexpected error occurred';
      }
      
      toast.error(errorMessage, {
        description: errorDescription,
        duration: 8000
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleDownloadPDF = async () => {
    if (!savedEnrollmentId) {
      toast.error('Please save the enrollment first before downloading PDF');
      return;
    }
    try {
      setLoading(true);
      await downloadEnrollmentPDF(savedEnrollmentId);
      toast.success('PDF downloaded successfully!');
    } catch (error) {
      console.error('Download error:', error);
      toast.error(error.message || 'Failed to download PDF');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!savedEnrollmentId) {
      toast.error('No enrollment to delete');
      return;
    }
    try {
      setLoading(true);
      await deleteEnrollment(savedEnrollmentId);
      toast.success('Enrollment deleted successfully!');
      setTimeout(() => navigate('/my-enrollments'), 1500);
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error.message || 'Failed to delete enrollment');
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFFDF0] via-[#FFF9E6] to-[#FFFDF0] py-8">
      {/* Action Buttons - Hide in read-only mode */}
      {!readOnly && (
        <div className="max-w-[8.5in] mx-auto mb-6 px-4 no-print">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
            <div className="flex flex-wrap items-center gap-3">
              <button 
                type="button" 
                onClick={() => navigate('/')}
                className="px-5 py-2.5 border-2 border-gray-300 text-gray-700 bg-white rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all font-medium"
              >
                ← Back
              </button>
              
              {savedEnrollmentId && (
                <>
                  <button 
                    type="button" 
                    onClick={handleDownloadPDF}
                    disabled={loading}
                    className="px-5 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Generating...' : 'Download PDF'}
                  </button>
                  
                  {!readOnly && (
                    <>
                      <button 
                        type="button" 
                        onClick={() => setShowDeleteConfirm(true)}
                        disabled={loading}
                        className="px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Delete
                      </button>
                      
                      <span className="text-sm text-gray-600">
                        Enrollment ID: <span className="font-semibold text-[#102A71]">{savedEnrollmentId}</span>
                      </span>
                    </>
                  )}
                </>
              )}
              
              {!readOnly && (
                <button 
                  type="submit"
                  form="enrollment-form"
                  disabled={loading}
                  className="px-6 py-2.5 bg-[#F5C400] text-[#001840] rounded-lg hover:bg-[#FFDC5F] transition-all font-semibold shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ml-auto flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      {savedEnrollmentId ? 'Update Enrollment' : 'Save Enrollment'}
                      {formChanged && savedEnrollmentId && <span className="text-xs">(Modified)</span>}
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 no-print">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Delete Enrollment?</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this enrollment? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={loading}
                className="px-5 py-2.5 border-2 border-gray-300 text-gray-700 bg-white rounded-lg hover:bg-gray-50 transition-all font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all font-medium shadow-md hover:shadow-lg disabled:opacity-50"
              >
                {loading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enrollment Type Selector - shown before the form */}
      {!readOnly && (
        <div className="max-w-[8.5in] mx-auto mb-6 px-4 no-print">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-[#001840] mb-1">College Enrollment</h2>
            <p className="text-sm text-gray-500 mb-4">Select your enrollment type to continue</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {ENROLLMENT_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setEnrollmentType(type.value)}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    enrollmentType === type.value
                      ? 'border-[#102A71] bg-[#EEF2FF]'
                      : 'border-gray-200 hover:border-gray-400'
                  }`}
                >
                  <div className="font-semibold text-sm text-[#001840]">{type.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{type.desc}</div>
                </button>
              ))}
            </div>

            {/* Continuing: Regular/Irregular */}
            {enrollmentType === 'continuing' && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm font-semibold text-[#001840] mb-2">Student Status</p>
                <div className="flex gap-3">
                  {['regular', 'irregular'].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStudentStatus(s)}
                      className={`px-4 py-2 rounded-lg border-2 text-sm font-medium capitalize transition-all ${
                        studentStatus === s
                          ? 'border-[#102A71] bg-[#EEF2FF] text-[#001840]'
                          : 'border-gray-200 text-gray-600 hover:border-gray-400'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                {studentStatus === 'irregular' && (
                  <p className="text-xs text-amber-600 mt-2">
                    Irregular students must manually select their subjects in the form below.
                  </p>
                )}
              </div>
            )}

            {/* Transferee: TOR Upload */}
            {enrollmentType === 'transferee' && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm font-semibold text-[#001840] mb-2">
                  Upload Transcript of Records (TOR) <span className="text-red-500">*</span>
                </p>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setTorFile(e.target.files[0])}
                  className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#102A71] file:text-white hover:file:bg-[#001840]"
                />
                {torFile && (
                  <p className="text-xs text-green-600 mt-1">✓ {torFile.name} selected</p>
                )}
                <p className="text-xs text-gray-400 mt-1">Accepted: PDF, JPG, PNG (max 10MB). Admin will evaluate your subjects.</p>
              </div>
            )}

            {/* Returnee notice */}
            {enrollmentType === 'returnee' && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                  As a returnee, admin will verify your previous records and reactivate your account before final approval.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Form Container - Disable all interactions in read-only mode */}
      <div className={`max-w-6xl mx-auto px-4 ${readOnly ? 'pointer-events-none opacity-90' : ''}`}>
        <div className="enrollment-form-container">
        <form id="enrollment-form" onSubmit={handleSubmit(onSubmit)} className="enrollment-form">
          
          {/* Required Fields Notice */}
          <div style={{ backgroundColor: '#FFF9E6', border: '1px solid #F5C400', padding: '8px', marginBottom: '12px', borderRadius: '4px', fontSize: '10pt' }} className="no-print">
            <strong>Note:</strong> Fields marked with <span style={{ color: 'red' }}>*</span> are required. Student Type and Course must be selected to save the form.
          </div>
          
          {/* HEADER */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img src="/emc_logo_nobg.png" alt="EMC Logo" style={{ width: '60px', height: '60px' }} />
              <div style={{ fontWeight: 'bold', fontSize: '11pt' }}>
                <strong>EASTERN MINDORO COLLEGE, INC.</strong>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 'bold', fontSize: '12pt', marginBottom: '8px' }}>
                COLLEGE ENROLLMENT SLIP
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                <span>Student No.</span>
                <div className="student-number-boxes">
                  {[0, 1, 2, 3, 4, 5].map(i => (
                    <input
                      key={i}
                      type="text"
                      maxLength="1"
                      {...register(`studentNumber.${i}`)}
                      className="student-number-box"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

            {/* TOP SECTION */}
          <div style={{ marginBottom: '10px', fontSize: '11pt' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <div>
                <span>New </span>
                <input type="checkbox" {...register('studentType.new')} />
                <span> / </span>
                <input type="checkbox" {...register('studentType.old')} />
                <span> Old Student <span style={{ color: 'red' }}>*</span></span>
              </div>
              <div>
                <span>Date Enrolled </span>
                <input type="date" {...register('dateEnrolled')} className="underlined-input" style={{ width: '120px' }} />
              </div>
            </div>
            <div style={{ marginBottom: '4px' }}>
              <span>Semester </span>
              <input type="text" {...register('semester')} className="underlined-input" style={{ width: '40px' }} placeholder="1" />
              <span> AY 20</span>
              <input type="text" {...register('yearStart')} className="underlined-input" style={{ width: '30px' }} placeholder="24" maxLength="2" />
              <span> - 20</span>
              <input type="text" {...register('yearEnd')} className="underlined-input" style={{ width: '30px' }} placeholder="25" maxLength="2" />
            </div>
            <div>
              <span>Curriculum Year </span>
              <input type="text" {...register('curriculumYear')} className="underlined-input" style={{ width: '50px' }} placeholder="2024" />
              <span> Course </span>
              <select {...register('course')} className="underlined-input" style={{ width: '150px' }} required>
                <option value="">Select Course *</option>
                <option value="BEED">BEED</option>
                <option value="BSIS">BSIS</option>
                <option value="BSBA">BSBA</option>
                <option value="BSED">BSED</option>
                <option value="BSCrim">BSCrim</option>
              </select>
              <span> Major </span>
              {watch('course') === 'BSED' ? (
                <select {...register('major')} className="underlined-input" style={{ width: '160px' }}>
                  <option value="">Select Major</option>
                  {BSED_MAJORS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              ) : watch('course') === 'BSBA' ? (
                <select {...register('major')} className="underlined-input" style={{ width: '180px' }}>
                  <option value="">Select Major</option>
                  {BSBA_MAJORS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              ) : (
                <input type="text" {...register('major')} className="underlined-input" style={{ width: '150px' }} />
              )}
            </div>
          </div>

          {/* ADMISSION CREDENTIALS */}
          <div className="bordered-section" style={{ marginBottom: '10px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '6px' }}>
              Admission Credential Submitted:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              {[
                { key: 'f138', label: 'F-138' },
                { key: 'f137a', label: 'F-137-A' },
                { key: 'cgmc', label: 'CGMC' },
                { key: 'tor', label: 'TOR' },
                { key: 'birthCert', label: 'Birth Cert.' },
                { key: 'marriageCert', label: 'Marriage Cert.' }
              ].map(cred => (
                <label key={cred.key} className="checkbox-underscore">
                  <span>{cred.label}</span>
                  <input type="checkbox" {...register(`admissionCredentials.${cred.key}`)} />
                </label>
              ))}
            </div>
          </div>

          {/* DOCUMENT UPLOADS — shown only when not read-only */}
          {!readOnly && (
            <CredentialUploadSection
              credentials={[
                { key: 'f138', label: 'F-138' },
                { key: 'f137a', label: 'F-137-A' },
                { key: 'cgmc', label: 'CGMC' },
                { key: 'tor', label: 'TOR' },
                { key: 'birthCert', label: 'Birth Certificate' },
                { key: 'marriageCert', label: 'Marriage Certificate' }
              ]}
              watchCredentials={watch('admissionCredentials')}
              docFiles={docFiles}
              setDocFiles={setDocFiles}
              uploadedDocs={uploadedDocs}
              setUploadedDocs={setUploadedDocs}
              enrollmentId={savedEnrollmentId}
              docsUploading={docsUploading}
            />
          )}

          {/* DECLARATION */}
          <div className="bordered-section" style={{ marginBottom: '10px', fontSize: '10.5pt' }}>
            <strong>I promise upon enrollment, as evidenced by my signature below, to obey the rules and regulations of the <u>EASTERN MINDORO COLLEGE, INC.</u> in order that I may not be deprived of my rights to finish my course.</strong>
          </div>

          {/* SECTION A */}
          <div className="bordered-section" style={{ marginBottom: '10px' }}>
            <div className="section-header">A. CONDUCT AND DISCIPLINE</div>
            <div style={{ fontSize: '10.5pt', lineHeight: '1.4' }}>
              <div style={{ marginBottom: '6px' }}>
                <strong>1.</strong> I am enrolling with an honest purpose to uphold and recognized the standards of the college on ACADEMIC, MORALITY, CONDUCT and DISCIPLINE
              </div>
              <div style={{ marginBottom: '6px' }}>
                <strong>2.</strong> I will not enter the campus, more so attend my classes, if under the influence of liquor or drugs, nor will I smoke in the school premises.
              </div>
              <div style={{ marginBottom: '6px' }}>
                <strong>3.</strong> I will not commit vandalism and immorality. I will not instigate or join strikes and demonstrations against the administration or any of its staff. I will not become a member of or organize any fraternity unauthorized by the school nor encourage other students to organized or join such organizations.
              </div>
              <div style={{ marginBottom: '6px' }}>
                <strong>4.</strong> I will not tamper any school records nor present to the school false records.
              </div>
              <div style={{ marginBottom: '6px' }}>
                <strong>5.</strong> I will not slander or assault physically any teacher, school official or his agent, staff member or student.
              </div>
              <div style={{ marginBottom: '6px' }}>
                <strong>6.</strong> If found guilty of any regulations mentioned above (#2 to #5), I am willing to undergo any disciplinary measure the school may impose upon me. The school authorities may call my parents/guardian for a dialogue, then impose any punishment they may deem necessary.
              </div>
              <div style={{ marginBottom: '6px' }}>
                <strong>7.</strong> I will study my lesson and attend the classes regularly. I may be dropped for 10 successive absences. I will wear the required college uniform every day and submit to any corresponding uniform penalties.
              </div>
              <div style={{ marginBottom: '6px' }}>
                <strong>8.</strong> I will observe "dress code" if and when at times EMC uniform will not be required. I will not wear short pants and slippers. I am fully aware that tinted or fancy colored hair is prohibited and that male students should have proper haircut and are not allowed to wear earrings.
              </div>
              <div>
                <strong>9.</strong> That I will wear my school I. D. every time I am inside the EMC campus.
              </div>
            </div>
          </div>

          {/* SECTION B */}
          <div className="bordered-section" style={{ marginBottom: '10px' }}>
            <div className="section-header">B. GENERAL REQUIREMENTS</div>
            <div style={{ fontSize: '10.5pt', lineHeight: '1.4' }}>
              <div style={{ marginBottom: '6px' }}>
                <strong>1.</strong> I will submit upon enrolment the required admission credential which will become a part of the school record and which I CANNOT WITHDRAW AFTER ENROLMENT.
              </div>
              <div style={{ marginBottom: '6px' }}>
                <strong>2.</strong> TO BE OFFICIALLY ENROLLED, I HAVE TO PAY MY REGISTRATION, TUITION AND OTHER FEES including any increase approved by the CHED.
              </div>
              <div style={{ marginBottom: '6px' }}>
                <strong>3.</strong> I will consult the Dean or Registrar in the preparation of my advisement slip and registration form and for the solution
              </div>
              <div style={{ marginBottom: '6px' }}>
                <strong>4.</strong> I will drop my subjects or changed my course only upon the approval of the Dean or Registrar of problems if any.
              </div>
              <div>
                <strong>5.</strong> I will not be credited for advance subjects taken the pre-requisites of which I have not taken or passed or subjects I have not officially enrolled in.
              </div>
            </div>
          </div>

          {/* SECTION C */}
          <div className="bordered-section" style={{ marginBottom: '10px' }}>
            <div className="section-header">C. ADVISEMENT SLIP</div>
            
            {/* Name */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '8px' }}>
              <div>
                <input type="text" {...register('familyName')} className="underlined-input" style={{ width: '100%' }} />
                <div style={{ fontSize: '9pt', textAlign: 'center' }}>(Family Name)</div>
              </div>
              <div>
                <input type="text" {...register('firstName')} className="underlined-input" style={{ width: '100%' }} />
                <div style={{ fontSize: '9pt', textAlign: 'center' }}>(First Name)</div>
              </div>
              <div>
                <input type="text" {...register('middleName')} className="underlined-input" style={{ width: '100%' }} />
                <div style={{ fontSize: '9pt', textAlign: 'center' }}>(Middle Name)</div>
              </div>
            </div>

            {/* Birth Info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px', marginBottom: '8px' }}>
              <div>
                <span>Date of Birth: </span>
                <input type="date" {...register('dateOfBirth')} className="underlined-input" style={{ width: '120px' }} />
              </div>
              <div>
                <span>Place of Birth: </span>
                <input type="text" {...register('placeOfBirth')} className="underlined-input" style={{ width: 'calc(100% - 100px)' }} />
              </div>
            </div>

            {/* Parents/Guardian */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '8px' }}>
              <div>
                <div><span>Father: </span><input type="text" {...register('father.name')} className="underlined-input" style={{ width: 'calc(100% - 50px)' }} /></div>
                <div><span>Occupation: </span><input type="text" {...register('father.occupation')} className="underlined-input" style={{ width: 'calc(100% - 85px)' }} /></div>
                <div><span>Address: </span><input type="text" {...register('father.address')} className="underlined-input" style={{ width: 'calc(100% - 65px)' }} /></div>
              </div>
              <div>
                <div><span>Mother: </span><input type="text" {...register('mother.name')} className="underlined-input" style={{ width: 'calc(100% - 55px)' }} /></div>
                <div><span>Occupation: </span><input type="text" {...register('mother.occupation')} className="underlined-input" style={{ width: 'calc(100% - 85px)' }} /></div>
                <div><span>Address: </span><input type="text" {...register('mother.address')} className="underlined-input" style={{ width: 'calc(100% - 65px)' }} /></div>
              </div>
              <div>
                <div><span>Guardian: </span><input type="text" {...register('guardian.name')} className="underlined-input" style={{ width: 'calc(100% - 65px)' }} /></div>
                <div><span>Occupation: </span><input type="text" {...register('guardian.occupation')} className="underlined-input" style={{ width: 'calc(100% - 85px)' }} /></div>
                <div><span>Address: </span><input type="text" {...register('guardian.address')} className="underlined-input" style={{ width: 'calc(100% - 65px)' }} /></div>
              </div>
            </div>

            {/* Sex Field */}
            <div style={{ marginBottom: '8px' }}>
              <span>Sex: </span>
              <select {...register('sex')} className="underlined-input" style={{ width: '100px' }}>
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            {/* Education History */}
            <div style={{ fontSize: '10.5pt', marginBottom: '8px' }}>
              <div style={{ marginBottom: '4px' }}>
                <span>Primary School Completed at (School) </span>
                <input type="text" {...register('education.primary.school')} className="underlined-input" style={{ width: '350px' }} />
                <span> AY </span>
                <input type="text" {...register('education.primary.ayStart')} className="underlined-input" style={{ width: '40px' }} />
                <span> - </span>
                <input type="text" {...register('education.primary.ayEnd')} className="underlined-input" style={{ width: '40px' }} />
              </div>
              <div style={{ marginBottom: '4px' }}>
                <span>Intermediate School Completed at (School) </span>
                <input type="text" {...register('education.intermediate.school')} className="underlined-input" style={{ width: '320px' }} />
                <span> AY </span>
                <input type="text" {...register('education.intermediate.ayStart')} className="underlined-input" style={{ width: '40px' }} />
                <span> - </span>
                <input type="text" {...register('education.intermediate.ayEnd')} className="underlined-input" style={{ width: '40px' }} />
              </div>
              <div style={{ marginBottom: '4px' }}>
                <span>Junior High School Completed at (School) </span>
                <input type="text" {...register('education.juniorHigh.school')} className="underlined-input" style={{ width: '310px' }} />
                <span> AY </span>
                <input type="text" {...register('education.juniorHigh.ayStart')} className="underlined-input" style={{ width: '40px' }} />
                <span> - </span>
                <input type="text" {...register('education.juniorHigh.ayEnd')} className="underlined-input" style={{ width: '40px' }} />
              </div>
              <div style={{ marginBottom: '4px' }}>
                <span>Senior High School Completed at (School) </span>
                <input type="text" {...register('education.seniorHigh.school')} className="underlined-input" style={{ width: '310px' }} />
                <span> AY </span>
                <input type="text" {...register('education.seniorHigh.ayStart')} className="underlined-input" style={{ width: '40px' }} />
                <span> - </span>
                <input type="text" {...register('education.seniorHigh.ayEnd')} className="underlined-input" style={{ width: '40px' }} />
              </div>
              <div style={{ marginBottom: '4px' }}>
                <span>Complete Address of Senior High School </span>
                <input type="text" {...register('education.seniorHighAddress')} className="underlined-input" style={{ width: 'calc(100% - 280px)' }} />
              </div>
              <div style={{ marginBottom: '4px' }}>
                <span>Last College Attended: </span>
                <input type="text" {...register('education.lastCollege.name')} className="underlined-input" style={{ width: '350px' }} />
                <span> Course Taken </span>
                <input type="text" {...register('education.lastCollege.course')} className="underlined-input" style={{ width: '150px' }} />
              </div>
              <div>
                <span>Addres of Last College Attended: </span>
                <input type="text" {...register('education.lastCollege.address')} className="underlined-input" style={{ width: '350px' }} />
                <span> AY </span>
                <input type="text" {...register('education.lastCollege.ayStart')} className="underlined-input" style={{ width: '40px' }} />
                <span> - </span>
                <input type="text" {...register('education.lastCollege.ayEnd')} className="underlined-input" style={{ width: '40px' }} />
              </div>
            </div>

            {/* Smart Subject Loader - shown outside print area */}
            <SubjectLoader
              course={watch('course')}
              enrollmentType={enrollmentType}
              studentStatus={studentStatus}
              onLoad={(loadedSubjects) => {
                loadedSubjects.forEach((s, i) => {
                  if (i < 8) {
                    setValue(`subjects.${i}.code`, s.code);
                    setValue(`subjects.${i}.description`, s.description);
                    setValue(`subjects.${i}.units`, String(s.units));
                    setValue(`subjects.${i}.time`, '');
                    setValue(`subjects.${i}.dayTime`, '');
                  }
                });
              }}
              readOnly={readOnly}
            />

            {/* Subject Table Instruction */}
            <div style={{ fontSize: '10.5pt', marginBottom: '6px' }}>
              Please enroll me in the following subjects, I have already taken and passed their pre-requisites; otherwise, I shall not claim credits for them.
            </div>

            {/* Subject Table */}
            <table className="subject-table">
              <thead>
                <tr>
                  <th style={{ width: '15%' }}>Subject Code</th>
                  <th style={{ width: '40%' }}>Subject Description</th>
                  <th style={{ width: '10%' }}>Units</th>
                  <th style={{ width: '15%' }}>Time</th>
                  <th style={{ width: '20%' }}>Day/Time</th>
                </tr>
              </thead>
              <tbody>
                {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
                  <tr key={i}>
                    <td><input type="text" {...register(`subjects.${i}.code`)} /></td>
                    <td><input type="text" {...register(`subjects.${i}.description`)} /></td>
                    <td><input type="text" {...register(`subjects.${i}.units`)} /></td>
                    <td><input type="text" {...register(`subjects.${i}.time`)} /></td>
                    <td><input type="text" {...register(`subjects.${i}.dayTime`)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* BOTTOM SECTION */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '10px' }}>
            <div>
              <div className="signature-line"></div>
              <div><span>Approved: </span><input type="text" {...register('approval.name')} className="underlined-input" style={{ width: '200px' }} /></div>
              <div><span>Date: </span><input type="text" {...register('approval.date')} className="underlined-input" style={{ width: '200px' }} /></div>
            </div>
            <div>
              <div className="signature-line"></div>
              <div><span>Student Signature: </span><input type="text" {...register('studentSignature')} className="underlined-input" style={{ width: '180px' }} /></div>
              <div><span>Email Address: </span><input type="text" {...register('email')} className="underlined-input" style={{ width: '200px' }} /></div>
              <div><span>Mobile No.: </span><input type="text" {...register('mobileNumber')} className="underlined-input" style={{ width: '200px' }} /></div>
              <div><span>Referred by: </span><input type="text" {...register('referredBy')} className="underlined-input" style={{ width: '200px' }} /></div>
            </div>
          </div>

          {/* FOOTER */}
          <div className="form-footer">
            <strong>E</strong>nriching <strong>M</strong>inds of <strong>C</strong>hampion
          </div>
        </form>
      </div>
      </div>
    </div>
  );
}

// ── CredentialUploadSection Component ────────────────────────────────────────
const API_BASE = 'http://localhost:3000';

function CredentialUploadSection({
  credentials,
  watchCredentials,
  docFiles,
  setDocFiles,
  uploadedDocs,
  setUploadedDocs,
  enrollmentId,
  docsUploading,
}) {
  // Only show credentials whose checkbox is currently checked
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
      const { uploadEnrollmentDocuments: uploadFn } = await import('../services/enrollmentApi');
      const result = await uploadFn(enrollmentId, { [key]: file });
      setUploadedDocs(result.documents || []);
      setDocFiles(prev => ({ ...prev, [key]: null }));
      toast.success('Document uploaded successfully');
    } catch (err) {
      toast.error(err.message || 'Upload failed');
    }
  }

  async function handleDeleteDoc(eid, docId) {
    try {
      const { deleteEnrollmentDocument: deleteFn } = await import('../services/enrollmentApi');
      await deleteFn(eid, docId);
      setUploadedDocs(prev => prev.filter(d => d.id !== docId));
      toast.success('Document removed');
    } catch (err) {
      toast.error(err.message || 'Failed to remove document');
    }
  }

  return (
    <div className="no-print bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
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
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                    ✓ Uploaded
                  </span>
                )}
              </div>

              {uploaded ? (
                <div className="flex items-center gap-3">
                  <a
                    href={`${API_BASE}${uploaded.filePath}`}
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

// ── SubjectLoader Component ────────────────────────────────────────────────────
function SubjectLoader({ course, enrollmentType, studentStatus, onLoad, readOnly }) {
  const [yearLevel, setYearLevel] = useState('1');
  const [semester, setSemester] = useState('1st');
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState(null); // 'auto' | 'pick'

  // Determine mode based on enrollment type + status
  useEffect(() => {
    if (!enrollmentType || !course) { setMode(null); return; }
    if (enrollmentType === 'first-time') setMode('auto');
    else if (enrollmentType === 'continuing' && studentStatus === 'regular') setMode('auto');
    else if (enrollmentType === 'continuing' && studentStatus === 'irregular') setMode('pick');
    else setMode(null);
  }, [enrollmentType, studentStatus, course]);

  // Auto-load for first-time (always year 1, sem 1)
  useEffect(() => {
    if (mode === 'auto' && course) {
      const yr = enrollmentType === 'first-time' ? '1' : yearLevel;
      fetchAndLoad(course, yr, semester);
    }
  }, [mode, course, yearLevel, semester]);

  async function fetchAndLoad(programCode, yr, sem) {
    if (!programCode) return;
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:3000/api/academic/subjects?programCode=${programCode}&yearLevel=${yr}&semester=${sem}`);
      const data = await res.json();
      if (mode === 'auto') onLoad(data);
      else setAvailableSubjects(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function loadForPick() {
    await fetchAndLoad(course, yearLevel, semester);
    setSelectedIds([]);
  }

  function toggleSubject(id) {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  }

  function applySelected() {
    const selected = availableSubjects.filter(s => selectedIds.includes(s.id));
    onLoad(selected);
  }

  if (readOnly || !mode) return null;

  return (
    <div className="no-print bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm font-semibold text-blue-800">
          {mode === 'auto' ? '✓ Subjects auto-loaded from curriculum' : '📋 Select your subjects'}
        </span>
      </div>

      {/* Year + Semester picker (for continuing students) */}
      {enrollmentType === 'continuing' && (
        <div className="flex flex-wrap gap-3 mb-3">
          <div>
            <label className="text-xs text-gray-600 block mb-1">Year Level</label>
            <select value={yearLevel} onChange={e => setYearLevel(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm">
              {[1,2,3,4].map(y => <option key={y} value={y}>Year {y}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-600 block mb-1">Semester</label>
            <select value={semester} onChange={e => setSemester(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm">
              {['1st','2nd','Summer'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          {mode === 'pick' && (
            <div className="flex items-end">
              <button onClick={loadForPick} className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                Load Subjects
              </button>
            </div>
          )}
        </div>
      )}

      {loading && <p className="text-sm text-blue-600">Loading subjects...</p>}

      {/* Irregular: subject picker */}
      {mode === 'pick' && availableSubjects.length > 0 && (
        <div>
          <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto mb-3">
            {availableSubjects.map(s => (
              <label key={s.id} className="flex items-center gap-3 p-2 bg-white rounded-lg border border-gray-200 cursor-pointer hover:bg-blue-50">
                <input type="checkbox" checked={selectedIds.includes(s.id)} onChange={() => toggleSubject(s.id)} className="w-4 h-4" />
                <span className="font-mono text-xs text-blue-700 w-20 shrink-0">{s.code}</span>
                <span className="text-sm flex-1">{s.description}</span>
                <span className="text-xs text-gray-500">{s.units} units</span>
              </label>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={applySelected} disabled={selectedIds.length === 0}
              className="px-4 py-2 bg-[#102A71] text-white rounded-lg text-sm font-semibold disabled:opacity-50">
              Add {selectedIds.length} Subject{selectedIds.length !== 1 ? 's' : ''} to Form
            </button>
            <span className="text-xs text-gray-500">Total: {availableSubjects.filter(s => selectedIds.includes(s.id)).reduce((sum, s) => sum + parseFloat(s.units), 0)} units selected</span>
          </div>
        </div>
      )}
    </div>
  );
}


