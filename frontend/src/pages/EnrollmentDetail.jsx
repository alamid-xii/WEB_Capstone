import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router';
import { toast } from 'sonner';
import { getEnrollmentById, downloadEnrollmentPDF, deleteEnrollment } from '../services/enrollmentApi';
import { EnrollmentForm } from './EnrollmentForm';
import { HSEnrollmentForm } from './HSEnrollmentForm';
import { 
  FileText, Download, Edit, Trash2, Copy, 
  CheckCircle, Clock, XCircle, AlertCircle, BarChart3, Zap, BookOpen
} from 'lucide-react';

export function EnrollmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // Check if user came from admin panel — only trust router state, not referrer
  const isFromAdmin = location.state?.fromAdmin === true;
  
  // Also check user role as a fallback
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdminUser = currentUser.role === 'admin' || currentUser.role === 'registrar';
  
  useEffect(() => {
    loadEnrollment();
  }, [id]);
  
  const loadEnrollment = async () => {
    try {
      setLoading(true);
      const data = await getEnrollmentById(id);
      setEnrollment(data);
    } catch (error) {
      toast.error(error.message || 'Failed to load enrollment');
      navigate(isFromAdmin ? '/admin/enrollments' : '/my-enrollments');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDownloadPDF = async () => {
    try {
      await downloadEnrollmentPDF(id);
      toast.success('PDF downloaded successfully!');
    } catch (error) {
      toast.error(error.message || 'Failed to download PDF');
    }
  };
  
  const handleDelete = async () => {
    try {
      setDeleting(true);
      await deleteEnrollment(id);
      toast.success('Enrollment deleted successfully!');
      navigate(isFromAdmin ? '/admin/enrollments' : '/my-enrollments');
    } catch (error) {
      toast.error(error.message || 'Failed to delete enrollment');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };
  
  const handleDuplicate = () => {
    navigate('/enrollment-form', { state: { duplicateFrom: enrollment } });
  };
  
  const handleBackToList = () => {
    if (isFromAdmin || isAdminUser) {
      navigate('/admin', { state: { tab: 'enrollments' } });
    } else {
      navigate('/my-enrollments');
    }
  };

  const handleGoToDashboard = () => {
    navigate(`/student-dashboard/${id}`);
  };

  const handleSelectSubjects = () => {
    navigate(`/subject-selection/${id}`);
  };
  
  const getStatusConfig = (status) => {
    const configs = {
      draft: {
        icon: Clock,
        color: 'bg-gray-100 text-gray-700 border-gray-300',
        label: 'Draft'
      },
      submitted: {
        icon: AlertCircle,
        color: 'bg-blue-100 text-blue-700 border-blue-300',
        label: 'Submitted'
      },
      pending_exam: {
        icon: Clock,
        color: 'bg-yellow-100 text-yellow-700 border-yellow-300',
        label: 'Pending Exam'
      },
      approved: {
        icon: CheckCircle,
        color: 'bg-green-100 text-green-700 border-green-300',
        label: 'Approved'
      },
      enrolled: {
        icon: CheckCircle,
        color: 'bg-emerald-100 text-emerald-700 border-emerald-300',
        label: 'Enrolled'
      },
      rejected: {
        icon: XCircle,
        color: 'bg-red-100 text-red-700 border-red-300',
        label: 'Rejected'
      }
    };
    return configs[status] || configs.draft;
  };
  
  const calculateProgress = () => {
    if (!enrollment) return 0;
    const fields = [
      enrollment.studentType,
      enrollment.course || enrollment.gradeLevel,
      enrollment.familyName,
      enrollment.firstName,
      enrollment.sex,
      enrollment.dateOfBirth,
      enrollment.email
    ];
    const filled = fields.filter(f => f && f !== '').length;
    return Math.round((filled / fields.length) * 100);
  };

  const getNextAction = () => {
    if (!enrollment) return null;
    const status = enrollment.status;
    
    if (status === 'approved') {
      return {
        label: 'Select Subjects',
        action: handleSelectSubjects,
        icon: BookOpen,
        color: 'bg-blue-600 hover:bg-blue-700'
      };
    }
    if (status === 'enrolled' || status === 'subjects_enrolled') {
      return {
        label: 'View Dashboard',
        action: handleGoToDashboard,
        icon: BarChart3,
        color: 'bg-green-600 hover:bg-green-700'
      };
    }
    if (status === 'submitted' || status === 'pending_exam') {
      return {
        label: 'Waiting for Approval',
        action: null,
        icon: Clock,
        color: 'bg-gray-400 cursor-not-allowed',
        disabled: true
      };
    }
    return null;
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFFDF0] via-[#FFF9E6] to-[#FFFDF0] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#F5C400] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading enrollment...</p>
        </div>
      </div>
    );
  }
  
  if (!enrollment) {
    return null;
  }
  
  // Determine which form to show based on education level
  const isHS = enrollment.educationLevel === 'JHS' || enrollment.educationLevel === 'SHS';
  
  // If admin is viewing, show the enrollment form in read-only mode
  if (isFromAdmin) {
    const statusConfig = getStatusConfig(enrollment.status || 'draft');
    const StatusIcon = statusConfig.icon;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFFDF0] via-[#FFF9E6] to-[#FFFDF0] py-8">
        {/* Action Bar */}
        <div className="max-w-6xl mx-auto mb-6 px-4 no-print">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
            <div className="flex flex-wrap items-center gap-3">
              <button 
                onClick={handleBackToList}
                className="px-4 py-2 border-2 border-gray-300 text-gray-700 bg-white rounded-lg hover:bg-gray-50 transition-all font-medium"
              >
                ← Back to List
              </button>
              
              <button 
                onClick={handleDownloadPDF}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all font-medium flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download PDF
              </button>
              
              <div className="ml-auto flex items-center gap-3">
                <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 ${statusConfig.color}`}>
                  <StatusIcon className="w-5 h-5" />
                  <span className="font-semibold">{statusConfig.label}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Enrollment Form View */}
        <div className="max-w-6xl mx-auto px-4">
          {isHS ? (
            <HSEnrollmentForm enrollmentId={id} readOnly={true} />
          ) : (
            <EnrollmentForm enrollmentId={id} readOnly={true} />
          )}
        </div>
      </div>
    );
  }
  
  const statusConfig = getStatusConfig(enrollment.status || 'draft');
  const StatusIcon = statusConfig.icon;
  const progress = calculateProgress();
  const nextAction = getNextAction();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFFDF0] via-[#FFF9E6] to-[#FFFDF0] py-8">
      {/* Action Bar - No Print */}
      <div className="max-w-6xl mx-auto mb-6 px-4 no-print">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={handleBackToList}
              className="px-4 py-2 border-2 border-gray-300 text-gray-700 bg-white rounded-lg hover:bg-gray-50 transition-all font-medium"
            >
              ← Back to List
            </button>
            
            {!isFromAdmin && !isAdminUser && (
              <button 
                onClick={() => {
                  const isHS = enrollment.educationLevel === 'JHS' || enrollment.educationLevel === 'SHS';
                  const route = isHS ? `/hs-enrollment-form/${id}` : `/enrollment-form/${id}`;
                  navigate(route, { state: { educationLevel: enrollment.educationLevel } });
                }}
                className="px-4 py-2 bg-[#102A71] text-white rounded-lg hover:bg-[#001840] transition-all font-medium flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
            )}
            
            <button 
              onClick={handleDownloadPDF}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all font-medium flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </button>
            
            {!isFromAdmin && !isAdminUser && (
              <>
                <button 
                  onClick={handleDuplicate}
                  className="px-4 py-2 border-2 border-gray-300 text-gray-700 bg-white rounded-lg hover:bg-gray-50 transition-all font-medium flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Duplicate
                </button>
                
                {nextAction && (
                  <button 
                    onClick={nextAction.action}
                    disabled={nextAction.disabled}
                    className={`px-4 py-2 text-white rounded-lg transition-all font-medium flex items-center gap-2 ${nextAction.color} ${nextAction.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <nextAction.icon className="w-4 h-4" />
                    {nextAction.label}
                  </button>
                )}
                
                <button 
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all font-medium flex items-center gap-2 ml-auto"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4">
        {/* Status Card - No Print */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6 no-print">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 ${statusConfig.color}`}>
                <StatusIcon className="w-5 h-5" />
                <span className="font-semibold">{statusConfig.label}</span>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Enrollment ID</p>
                <p className="font-semibold text-[#102A71]">#{enrollment.id}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Level</p>
                <p className="font-semibold">{enrollment.educationLevel}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Created</p>
                <p className="font-semibold">{new Date(enrollment.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
            
            {/* Progress Indicator */}
            <div className="w-full sm:w-auto">
              <div className="flex items-center gap-3">
                <div className="flex-1 sm:w-48">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Completion</span>
                    <span className="font-semibold text-[#102A71]">{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-[#F5C400] to-[#FFDC5F] h-2 rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Enrollment Details */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          <div className="flex items-center gap-3 mb-6">
            <FileText className="w-6 h-6 text-[#102A71]" />
            <h1 className="text-2xl font-bold text-[#001840]">Enrollment Details</h1>
          </div>
          
          {/* Student Information */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-[#102A71] mb-4 pb-2 border-b-2 border-[#F5C400]">
              Student Information
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <InfoField label="Student Type" value={enrollment.studentType} />
              <InfoField label="Student Number" value={enrollment.studentNumber} />
              <InfoField label="Full Name" value={`${enrollment.firstName || ''} ${enrollment.middleName || ''} ${enrollment.familyName || ''}`} />
              <InfoField label="Sex" value={enrollment.sex} />
              <InfoField label="Date of Birth" value={enrollment.dateOfBirth} />
              <InfoField label="Place of Birth" value={enrollment.placeOfBirth} />
              <InfoField label="Email" value={enrollment.email} />
              <InfoField label="Mobile Number" value={enrollment.mobileNumber} />
            </div>
          </div>
          
          {/* Enrollment Period */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-[#102A71] mb-4 pb-2 border-b-2 border-[#F5C400]">
              Enrollment Period
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              <InfoField label="Semester" value={enrollment.semester} />
              <InfoField label="Academic Year" value={enrollment.academicYear} />
              <InfoField label="Date Enrolled" value={enrollment.dateEnrolled} />
            </div>
          </div>
          
          {/* Course Information */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-[#102A71] mb-4 pb-2 border-b-2 border-[#F5C400]">
              {enrollment.educationLevel === 'College' ? 'Course Information' : 'Education Level Information'}
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              {enrollment.educationLevel === 'College' ? (
                <>
                  <InfoField label="Course" value={enrollment.course} />
                  <InfoField label="Major" value={enrollment.major} />
                  <InfoField label="Curriculum Year" value={enrollment.curriculumYear} />
                </>
              ) : (
                <>
                  <InfoField label="Grade Level" value={enrollment.gradeLevel} />
                  <InfoField label="Strand" value={enrollment.strand} />
                  <InfoField label="Enrollment Type" value={enrollment.enrollmentType} />
                </>
              )}
            </div>
          </div>

          {/* SSC Status (Only for JHS) */}
          {enrollment.educationLevel === 'JHS' && (
            <div className="mb-8 bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-blue-900 mb-4 pb-2 border-b-2 border-blue-300">
                Special Science Class (SSC) Status
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <InfoField 
                  label="SSC Applied" 
                  value={enrollment.sscApplied ? 'Yes' : 'No'} 
                />
                {enrollment.sscApplied && (
                  <>
                    <InfoField 
                      label="SSC Qualified" 
                      value={enrollment.sscQualified ? 'Yes' : 'No'} 
                    />
                    <InfoField 
                      label="SSC Class" 
                      value={enrollment.sscClass || '—'} 
                    />
                    <InfoField 
                      label="SSC Result" 
                      value={enrollment.sscResult || '—'} 
                    />
                    {enrollment.sscExamDate && (
                      <InfoField 
                        label="Exam Date" 
                        value={new Date(enrollment.sscExamDate).toLocaleDateString()} 
                      />
                    )}
                    {enrollment.sscExamScore && (
                      <InfoField 
                        label="Exam Score" 
                        value={`${enrollment.sscExamScore}/100`} 
                      />
                    )}
                  </>
                )}
              </div>
            </div>
          )}
          
          {/* Subjects */}
          {enrollment.subjects && enrollment.subjects.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-[#102A71] mb-4 pb-2 border-b-2 border-[#F5C400]">
                Enrolled Subjects
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-[#FFFDF0]">
                      <th className="border border-gray-300 px-4 py-2 text-left">Code</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Description</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Units</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Time</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Day/Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrollment.subjects.map((subject, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="border border-gray-300 px-4 py-2">{subject.code}</td>
                        <td className="border border-gray-300 px-4 py-2">{subject.description}</td>
                        <td className="border border-gray-300 px-4 py-2">{subject.units}</td>
                        <td className="border border-gray-300 px-4 py-2">{subject.time}</td>
                        <td className="border border-gray-300 px-4 py-2">{subject.dayTime}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600">
              <span className="font-bold text-[#102A71]">E</span>nriching{' '}
              <span className="font-bold text-[#102A71]">M</span>inds of{' '}
              <span className="font-bold text-[#102A71]">C</span>hampion
            </p>
          </div>
        </div>
      </div>
      
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
                disabled={deleting}
                className="px-5 py-2.5 border-2 border-gray-300 text-gray-700 bg-white rounded-lg hover:bg-gray-50 transition-all font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all font-medium disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoField({ label, value }) {
  return (
    <div>
      <p className="text-sm text-gray-600 mb-1">{label}</p>
      <p className="font-medium text-gray-900">{value || '—'}</p>
    </div>
  );
}
