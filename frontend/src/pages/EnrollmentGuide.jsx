import { useState } from "react";
import {
  CheckCircle2,
  Circle,
  Download,
  FileText,
  ClipboardList,
  CreditCard,
  UserCheck,
  BookOpen,
  Camera,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from "lucide-react";

const steps = [
  {
    id: 1,
    icon: FileText,
    title: "Gather Required Documents",
    description:
      "Collect all required documents before visiting the campus. Incomplete submissions will delay enrollment.",
    requirements: [
      "Original Form 138 / SF9 with school seal",
      "Certificate of Good Moral Character",
      "PSA Birth Certificate (original + 2 photocopies)",
      "4 pieces 2x2 ID photos (white background)",
      "Medical Certificate from licensed physician",
      "Barangay Clearance",
    ],
    downloadLabel: "Download Document Checklist",
    color: "from-[#001840] to-[#102A71]",
  },
  {
    id: 2,
    icon: ClipboardList,
    title: "Fill Out Admission Form",
    description:
      "Accomplish the official EMC Admission Form accurately. Forms are available at the Registrar's Office or online.",
    requirements: [
      "Download or pick up admission form at Registrar's Office",
      "Fill in personal and academic information",
      "Attach 2x2 ID photo on the form",
      "Have parent / guardian sign the form",
      "Do not leave any field blank",
    ],
    downloadLabel: "Download Admission Form",
    color: "from-[#102A71] to-[#1a3a8f]",
  },
  {
    id: 3,
    icon: UserCheck,
    title: "Submit Documents & Interview",
    description:
      "Bring all requirements to the Registrar's Office. Undergo brief admission interview and document validation.",
    requirements: [
      "Visit Registrar's Office (Admin Building, GF)",
      "Submit all required documents",
      "Undergo document verification process",
      "Complete admission interview with guidance counselor",
      "Receive your student reference number",
    ],
    downloadLabel: "Download Interview Guide",
    color: "from-[#001840] to-[#102A71]",
  },
  {
    id: 4,
    icon: BookOpen,
    title: "Entrance Examination",
    description:
      "Take the Eastern Mindoro College Entrance Exam (EMCEE). Results are released within 3–5 working days.",
    requirements: [
      "Bring admission slip and 2 valid IDs",
      "Arrive 30 minutes before the exam",
      "Exam covers English, Math, Science, and General Knowledge",
      "No electronic devices allowed inside the room",
      "Claim results at the Guidance Office after 3–5 days",
    ],
    downloadLabel: "Download Exam Tips & Coverage",
    color: "from-[#102A71] to-[#1a3a8f]",
  },
  {
    id: 5,
    icon: CreditCard,
    title: "Pay Enrollment Fees",
    description:
      "Proceed to the Cashier's Office to settle tuition and miscellaneous fees. Keep all official receipts.",
    requirements: [
      "Bring Enrollment Assessment Form from Registrar",
      "Pay at the EMC Cashier's Office (Admin Building, GF)",
      "Online payment available via GCash / Maya",
      "Request Official Receipt (OR) for all payments",
      "Free tuition available for qualified students (UniFAST)",
    ],
    downloadLabel: "Download Fee Schedule",
    color: "from-[#001840] to-[#102A71]",
  },
  {
    id: 6,
    icon: Camera,
    title: "Get Your Student ID",
    description:
      "Present your Official Receipt to the Guidance Office for ID photo capture and student ID processing.",
    requirements: [
      "Bring Official Receipt of payment",
      "Visit Guidance Office (Admin Building, 2F)",
      "Have photo taken on-site (wear appropriate attire)",
      "ID released within 5–7 working days",
      "Wear student ID at all times while on campus",
    ],
    downloadLabel: "Download ID Guidelines",
    color: "from-[#102A71] to-[#1a3a8f]",
  },
];

export function EnrollmentGuide() {
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [expanded, setExpanded] = useState<number | null>(1);

  function toggle(id) {
    setExpanded((prev) => (prev === id ? null : id));
  }

  function toggleComplete(id) {
    setCompleted((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const progress = Math.round((completed.size / steps.length) * 100);

  return (
    <div className="min-h-screen bg-[#FFFDF0]">
      {/* Page Header */}
      <div className="bg-[#001840] text-white px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-[#F5C400] w-10 h-10 rounded-xl flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-[#001840]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Digital Enrollment Guide</h1>
              <p className="text-[#FFDC5F] text-sm">Step-by-step guide for Eastern Mindoro College</p>
            </div>
          </div>
          <p className="text-[#FFFDF0]/70 text-sm mt-2 max-w-xl">
            Follow each step carefully to complete your enrollment. Mark steps as done to track your progress.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Progress Tracker */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[#001840] font-semibold">Enrollment Progress</h2>
            <span className="text-[#102A71] font-bold text-lg">{progress}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
            <div
              className="h-3 rounded-full bg-gradient-to-r from-[#F5C400] to-[#FFDC5F] transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex gap-4 mt-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#F5C400]" />
              <span className="text-sm text-gray-600">{completed.size} completed</span>
            </div>
            <div className="flex items-center gap-2">
              <Circle className="w-4 h-4 text-gray-300" />
              <span className="text-sm text-gray-600">{steps.length - completed.size} remaining</span>
            </div>
          </div>

          {/* Step indicators */}
          <div className="flex gap-2 mt-4 flex-wrap">
            {steps.map((s) => (
              <div
                key={s.id}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 ${
                  completed.has(s.id)
                    ? "bg-[#F5C400] text-[#001840]"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {s.id}
              </div>
            ))}
          </div>
        </div>

        {/* Important Note */}
        <div className="bg-[#FFDC5F]/30 border border-[#FFDC5F] rounded-xl p-4 flex gap-3 mb-6">
          <AlertCircle className="w-5 h-5 text-[#001840] shrink-0 mt-0.5" />
          <p className="text-[#001840] text-sm leading-relaxed">
            <strong>Enrollment Period:</strong> June 2 – June 20, 2025 for new students. All steps must be completed before the deadline to secure your slot.
          </p>
        </div>

        {/* Step Cards */}
        <div className="space-y-4">
          {steps.map((step) => {
            const Icon = step.icon;
            const isOpen = expanded === step.id;
            const done = completed.has(step.id);

            return (
              <div
                key={step.id}
                className={`bg-white rounded-2xl shadow-sm border transition-all duration-200 overflow-hidden ${
                  done ? "border-[#F5C400]" : "border-gray-100"
                }`}
              >
                {/* Card Header */}
                <div
                  className="flex items-center gap-4 p-5 cursor-pointer select-none"
                  onClick={() => toggle(step.id)}
                >
                  {/* Step number */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold text-sm ${
                      done ? "bg-[#F5C400] text-[#001840]" : "bg-[#102A71] text-[#FFDC5F]"
                    }`}
                  >
                    {done ? <CheckCircle2 className="w-5 h-5" /> : `0${step.id}`}
                  </div>

                  {/* Icon */}
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br ${step.color}`}
                  >
                    <Icon className="w-5 h-5 text-[#FFDC5F]" />
                  </div>

                  {/* Title */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[#001840]">{step.title}</h3>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{step.description}</p>
                  </div>

                  {/* Expand toggle */}
                  {isOpen ? (
                    <ChevronUp className="w-5 h-5 text-gray-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />
                  )}
                </div>

                {/* Expanded Content */}
                {isOpen && (
                  <div className="px-5 pb-5 border-t border-gray-50">
                    <p className="text-gray-600 text-sm mt-4 mb-4 leading-relaxed">{step.description}</p>

                    {/* Requirements list */}
                    <div className="bg-[#FFFDF0] rounded-xl p-4 mb-4">
                      <h4 className="text-[#001840] text-sm font-semibold mb-3">Requirements / Instructions:</h4>
                      <ul className="space-y-2">
                        {step.requirements.map((req, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#F5C400] mt-1.5 shrink-0" />
                            {req}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button className="flex items-center justify-center gap-2 bg-[#F5C400] hover:bg-[#FFDC5F] text-[#001840] px-5 py-3 rounded-xl text-sm font-semibold transition-colors shadow">
                        <Download className="w-4 h-4" />
                        {step.downloadLabel}
                      </button>
                      <button
                        onClick={() => toggleComplete(step.id)}
                        className={`flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold border-2 transition-all ${
                          done
                            ? "border-[#F5C400] bg-[#F5C400]/10 text-[#001840]"
                            : "border-[#102A71] text-[#102A71] hover:bg-[#102A71] hover:text-white"
                        }`}
                      >
                        {done ? (
                          <>
                            <CheckCircle2 className="w-4 h-4" /> Marked Complete
                          </>
                        ) : (
                          <>
                            <Circle className="w-4 h-4" /> Mark as Complete
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* All done banner */}
        {completed.size === steps.length && (
          <div className="mt-8 bg-gradient-to-r from-[#001840] to-[#102A71] rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-[#F5C400] rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-[#001840]" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Enrollment Complete! 🎉</h3>
            <p className="text-[#FFDC5F] text-lg">
              Congratulations! You've successfully completed all enrollment steps at Eastern Mindoro College.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
