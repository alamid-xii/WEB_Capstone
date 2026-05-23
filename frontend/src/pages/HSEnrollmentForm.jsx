import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { CheckCircle2, Upload, X, Loader2, FileText, ArrowLeft } from "lucide-react";
import { uploadEnrollmentDocuments } from "../services/enrollmentApi";
const JHS_GRADES = ["Grade 7","Grade 8","Grade 9","Grade 10"];
const SHS_GRADES = ["Grade 11","Grade 12"];
const SHS_STRANDS = ["STEM","ABM","HUMSS","TVL","Sports","Arts and Design"];
const HS_CREDS = [{key:"f138",label:"F-138"},{key:"f137a",label:"F-137-A"},{key:"cert",label:"Certificate"},{key:"f137e",label:"F-137-E"}];
const API = "http://localhost:3000/api";
const onlyDigits = (e) => { if (!/[0-9]/.test(e.key) && !["Backspace","Tab","ArrowLeft","ArrowRight","Delete"].includes(e.key)) e.preventDefault(); };
const onlyLetters = (e) => { if (!/[a-zA-Z\s\-']/.test(e.key) && !["Backspace","Tab","ArrowLeft","ArrowRight","Delete"].includes(e.key)) e.preventDefault(); };
function F({label,required,error,children}){return(<div className="flex flex-col gap-1"><label className="text-sm font-semibold text-[#001840]">{label}{required&&<span className="text-red-500 ml-1">*</span>}</label>{children}{error&&<p className="text-xs text-red-500 mt-0.5">{error}</p>}</div>);}
function I({error,...p}){return(<input {...p} className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all ${error?"border-red-400 focus:ring-red-200":"border-gray-200 focus:ring-[#102A71]/20 focus:border-[#102A71]"} bg-white text-[#001840]`}/>);}
function S({error,children,...p}){return(<select {...p} className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all bg-white text-[#001840] ${error?"border-red-400 focus:ring-red-200":"border-gray-200 focus:ring-[#102A71]/20 focus:border-[#102A71]"}`}>{children}</select>);}
const SAVE_KEY = "hs_enrollment_draft";

export function HSEnrollmentForm({enrollmentId:propId,readOnly=false}){
  const navigate=useNavigate();
  const [step,setStep]=useState(()=>{
    try { const s=localStorage.getItem(SAVE_KEY+"_step"); return s?parseInt(s):1; } catch(_){return 1;}
  });
  const [errors,setErrors]=useState({});
  const [submitting,setSubmitting]=useState(false);
  const [showBackDialog,setShowBackDialog]=useState(false);

  const defaultForm = {educationLevel:"JHS",gradeLevel:"",strand:"",studentType:"New",academicYear:"2025-2026",dateEnrolled:"",studentNumber:["","","","","",""],lrn:"",familyName:"",firstName:"",middleName:"",sex:"",dateOfBirth:"",placeOfBirth:"",fatherName:"",fatherOccupation:"",motherName:"",motherOccupation:"",parentsAddress:"",guardianName:"",guardianOccupation:"",guardianAddress:"",guardianTelephone:"",grade6School:"",grade6SchoolAddress:"",grade6Section:"",grade6SYStart:"",grade6SYEnd:"",grade6Average:"",grade6Remarks:"",lastHSSchool:"",lastHSCurriculumYear:"",lastHSSection:"",lastHSSYStart:"",lastHSSYEnd:"",sscApplied:false,studentSignature:"",parentGuardianSignature:"",credentials:{},docFiles:{}};

  // Load saved draft on mount (exclude docFiles — can't serialize File objects)
  const [form,setF]=useState(()=>{
    try {
      const saved = localStorage.getItem(SAVE_KEY);
      if (saved) { const parsed = JSON.parse(saved); return {...defaultForm,...parsed,docFiles:{}}; }
    } catch(_) {}
    return defaultForm;
  });
  // Auto-save form to localStorage on every change (skip docFiles)
  useEffect(()=>{
    try {
      const {docFiles,...saveable}=form;
      localStorage.setItem(SAVE_KEY, JSON.stringify(saveable));
    } catch(_){}
  },[form]);
  useEffect(()=>{ localStorage.setItem(SAVE_KEY+"_step", step); },[step]);
  const set=(k,v)=>setF(p=>({...p,[k]:v}));
  const [previewModal, setPreviewModal] = useState(null); // { url, name, isPdf }
  const [lrnTaken, setLrnTaken] = useState(false);
  const lrnTimer = useRef(null);
  const checkLrn = (val) => {
    clearTimeout(lrnTimer.current);
    if (val.length < 12) { setLrnTaken(false); return; }
    lrnTimer.current = setTimeout(async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API}/enrollments/check-lrn?lrn=${val}`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        setLrnTaken(data.taken);
      } catch { setLrnTaken(false); }
    }, 500);
  };
  const isG7=form.gradeLevel==="Grade 7";
  const isSHS=form.educationLevel==="SHS";
  const grades=isSHS?SHS_GRADES:JHS_GRADES;
  const total=5;
  const docStep=5;
  const labels=["Grade & Type","Personal Info","Family","Education","Documents"];
  function validate(s){
    const e={};
    if(s===1){if(!form.gradeLevel)e.gradeLevel="Grade level is required";if(isSHS&&!form.strand)e.strand="Strand is required";}
    if(s===2){if(!form.familyName.trim())e.familyName="Required";else if(/\d/.test(form.familyName))e.familyName="No numbers";if(!form.firstName.trim())e.firstName="Required";else if(/\d/.test(form.firstName))e.firstName="No numbers";if(!form.sex)e.sex="Required";if(!form.dateOfBirth)e.dateOfBirth="Required";}
    if(s===docStep){const uploaded=HS_CREDS.filter(c=>form.docFiles[c.key]);if(uploaded.length===0)e.credentials="Please upload at least one document before submitting.";}
    return e;
  }
  function stepFill(s){
    if(s===1){const fields=[form.gradeLevel,isSHS?form.strand:null].filter(f=>f!==null);const filled=fields.filter(Boolean).length;return Math.round((filled/fields.length)*100);}
    if(s===2){const fields=[form.familyName,form.firstName,form.sex,form.dateOfBirth];const filled=fields.filter(Boolean).length;return Math.round((filled/fields.length)*100);}
    if(s===3){const fields=[form.fatherName,form.motherName,form.parentsAddress];const filled=fields.filter(Boolean).length;return Math.round((filled/fields.length)*100);}
    if(s===4){const fields=[form.grade6School,form.grade6Average];const filled=fields.filter(Boolean).length;return Math.round((filled/fields.length)*100);}
    if(s===docStep){const uploaded=HS_CREDS.filter(c=>form.docFiles[c.key]).length;return Math.round((uploaded/HS_CREDS.length)*100);}
    return 0;
  }

  function goToStep(target){
    if(target===step)return;
    setErrors({});setStep(target);window.scrollTo({top:0,behavior:"smooth"});
  }
  function handleBack(){ setShowBackDialog(true); }
  function clearDraft(){ localStorage.removeItem(SAVE_KEY); localStorage.removeItem(SAVE_KEY+"_step"); }
  async function submit(){
    const e=validate(docStep);if(Object.keys(e).length>0){setErrors(e);return;}
    setSubmitting(true);
    try{
      const payload={educationLevel:form.educationLevel,gradeLevel:form.gradeLevel,strand:form.strand||null,studentType:form.studentType,studentNumber:form.studentNumber.join(""),academicYear:form.academicYear,dateEnrolled:form.dateEnrolled||null,lrn:form.lrn,familyName:form.familyName,firstName:form.firstName,middleName:form.middleName,sex:form.sex,dateOfBirth:form.dateOfBirth,placeOfBirth:form.placeOfBirth,fatherName:form.fatherName,fatherOccupation:form.fatherOccupation,motherName:form.motherName,motherOccupation:form.motherOccupation,parentsAddress:form.parentsAddress,guardianName:form.guardianName,guardianOccupation:form.guardianOccupation,guardianAddress:form.guardianAddress,guardianTelephone:form.guardianTelephone,grade6School:form.grade6School,grade6SchoolAddress:form.grade6SchoolAddress,grade6Section:form.grade6Section,grade6SYStart:form.grade6SYStart,grade6SYEnd:form.grade6SYEnd,grade6Average:form.grade6Average,grade6Remarks:form.grade6Remarks,lastHSSchool:form.lastHSSchool,lastHSCurriculumYear:form.lastHSCurriculumYear,lastHSSection:form.lastHSSection,lastHSSYStart:form.lastHSSYStart,lastHSSYEnd:form.lastHSSYEnd,sscApplied:form.sscApplied,studentSignature:form.studentSignature,parentGuardianSignature:form.parentGuardianSignature,admissionCredentials:HS_CREDS.filter(c=>form.docFiles[c.key]).map(c=>c.key),status:"submitted",enrollmentType:"first-time"};
      const token=localStorage.getItem("token");
      const res=await fetch(`${API}/enrollments`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify(payload)});
      const data=await res.json();
      if(!res.ok)throw new Error(data.message||"Failed");
      const eid=data.enrollment?.id;
      if(eid){
        const files={};
        Object.entries(form.docFiles).forEach(([k,f])=>{if(f)files[k]=f;});
        if(Object.keys(files).length>0){
          try{
            await uploadEnrollmentDocuments(eid,files);
          }catch(uploadErr){
            // Delete the enrollment so student can retry cleanly
            try{
              await fetch(`${API}/enrollments/${eid}`,{method:"DELETE",headers:{Authorization:`Bearer ${localStorage.getItem("token")}`}});
            }catch(_){}
            throw new Error("Document upload failed: "+uploadErr.message+". Please try again.");
          }
        }
        toast.success("Enrollment submitted successfully!",{description:`Enrollment ID: ${eid}`});
        clearDraft();
        navigate("/my-enrollments");
      }
    }catch(err){toast.error(err.message||"Failed to submit enrollment");}
    finally{setSubmitting(false);}
  }
  const pct=Math.round(((step-1)/(total-1))*100);
  return(
    <div className="min-h-screen bg-gradient-to-br from-[#FFFDF0] via-[#FFF9E6] to-[#FFFDF0]">

      {/* File preview modal */}
      {previewModal&&(
        <div className="fixed inset-0 bg-black/70 z-50 flex flex-col">
          <div className="flex items-center justify-between bg-[#001840] px-4 py-3 shrink-0">
            <span className="text-white text-sm font-medium truncate max-w-xs">{previewModal.name}</span>
            <button
              onClick={()=>setPreviewModal(null)}
              className="flex items-center gap-1.5 text-white bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all"
            >
              <X size={14}/> Close
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            {previewModal.isPdf?(
              <iframe src={previewModal.url} className="w-full h-full border-0" title={previewModal.name}/>
            ):(
              <div className="w-full h-full flex items-center justify-center p-4">
                <img src={previewModal.url} alt={previewModal.name} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"/>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Save progress dialog */}
      {showBackDialog&&(
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-[#001840] mb-2">Save your progress?</h3>
            <p className="text-sm text-gray-600 mb-5">Your form data is automatically saved. When you come back, you can continue where you left off.</p>
            <div className="flex gap-3">
              <button onClick={()=>{clearDraft();navigate("/enroll");}} className="flex-1 py-2.5 border-2 border-red-300 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-50 transition-all">Discard & Leave</button>
              <button onClick={()=>{setShowBackDialog(false);navigate("/enroll");}} className="flex-1 py-2.5 bg-[#102A71] text-white rounded-xl text-sm font-semibold hover:bg-[#001840] transition-all">Save & Leave</button>
            </div>
            <button onClick={()=>setShowBackDialog(false)} className="w-full mt-2 py-2 text-sm text-gray-400 hover:text-gray-600">Stay on form</button>
          </div>
        </div>
      )}

      <div className="bg-white border-b border-gray-100 shadow-sm sticky top-16 lg:top-20 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4">
          {/* Back button */}
          <button onClick={handleBack} className="flex items-center gap-1.5 text-sm text-[#102A71] hover:text-[#001840] font-medium mb-3 transition-colors">
            <ArrowLeft size={15}/> Back to Level Selection
          </button>
          <div className="flex items-center justify-between mb-3 relative">
            <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 z-0"/>
            <div className="absolute top-4 left-0 h-0.5 bg-[#102A71] z-0 transition-all duration-500" style={{width:`${pct}%`}}/>
            {labels.map((lbl,i)=>{
              const sid=i+1;
              const active=sid===step;
              const fill=stepFill(sid);
              const complete=fill===100&&sid!==step;
              // Circle style: active=yellow, complete=solid blue, partial=conic-gradient, empty=outline only
              const circleStyle = complete
                ? {background:"#102A71",border:"2px solid #102A71",color:"#fff"}
                : active
                  ? {background:"#F5C400",border:"2px solid #F5C400",color:"#001840"}
                  : fill>0
                    ? {background:`conic-gradient(#102A71 ${fill*3.6}deg, #e5e7eb ${fill*3.6}deg)`,border:"2px solid #102A71",color:"#102A71"}
                    : {background:"#fff",border:"2px solid #d1d5db",color:"#9ca3af"};
              return(
                <div key={sid} onClick={()=>goToStep(sid)} className="flex flex-col items-center z-10 gap-1 cursor-pointer group">
                  <div style={circleStyle} className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 group-hover:scale-110 group-hover:shadow-md">
                    {/* Inner white circle for partial fill to show number */}
                    {fill>0&&!complete&&!active?(
                      <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center text-[10px] font-bold text-[#102A71]">{sid}</div>
                    ):complete?<CheckCircle2 size={14}/>:sid}
                  </div>
                  <span className={`text-[9px] font-medium hidden sm:block text-center leading-tight max-w-[60px] transition-colors ${active?"text-[#001840]":complete?"text-[#102A71]":fill>0?"text-[#102A71]":"text-gray-400 group-hover:text-[#102A71]"}`}>{lbl}</span>
                </div>
              );
            })}          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5"><div className="bg-gradient-to-r from-[#102A71] to-[#F5C400] h-1.5 rounded-full transition-all duration-500" style={{width:`${pct}%`}}/></div>
          <p className="text-xs text-gray-400 mt-1 text-right">Step {step} of {total}</p>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 pt-4 pb-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-[#001840]">{labels[step-1]}</h2>
          <p className="text-sm text-gray-500 mt-1">Step {step} of {total}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-8">
          {step===1&&(<div className="space-y-5">
            <div className="flex gap-3 mb-2">{["JHS","SHS"].map(lvl=>(<button key={lvl} type="button" onClick={()=>{set("educationLevel",lvl);set("gradeLevel","");set("strand","");}} className={`px-6 py-2.5 rounded-xl border-2 font-semibold text-sm transition-all ${form.educationLevel===lvl?"border-[#102A71] bg-[#EEF2FF] text-[#001840]":"border-gray-200 text-gray-600 hover:border-gray-300"}`}>{lvl}</button>))}</div>
            <F label="Grade Level" required error={errors.gradeLevel}><S value={form.gradeLevel} error={errors.gradeLevel} onChange={e=>{set("gradeLevel",e.target.value);set("strand","");}}><option value="">Select grade level</option>{grades.map(g=><option key={g} value={g}>{g}</option>)}</S></F>
            {isSHS&&(<F label="Strand" required error={errors.strand}><S value={form.strand} error={errors.strand} onChange={e=>set("strand",e.target.value)}><option value="">Select strand</option>{SHS_STRANDS.map(s=><option key={s} value={s}>{s}</option>)}</S></F>)}
            <div className="grid grid-cols-2 gap-4">
              <F label="Student Type"><div className="flex gap-3">{["New","Old"].map(t=>(<button key={t} type="button" onClick={()=>set("studentType",t)} className={`px-4 py-2 rounded-xl border-2 text-sm font-medium transition-all ${form.studentType===t?"border-[#102A71] bg-[#EEF2FF] text-[#001840]":"border-gray-200 text-gray-600"}`}>{t}</button>))}</div></F>
              <F label="School Year"><I value={form.academicYear} placeholder="2025-2026" onChange={e=>set("academicYear",e.target.value)}/></F>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <F label="Date Enrolled"><I type="date" value={form.dateEnrolled} onChange={e=>set("dateEnrolled",e.target.value)}/></F>
            </div>
          </div>)}
          {step===2&&(<div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <F label="Family Name" required error={errors.familyName}><I value={form.familyName} error={errors.familyName} placeholder="Family Name" onKeyDown={onlyLetters} onChange={e=>set("familyName",e.target.value)}/></F>
              <F label="First Name" required error={errors.firstName}><I value={form.firstName} error={errors.firstName} placeholder="First Name" onKeyDown={onlyLetters} onChange={e=>set("firstName",e.target.value)}/></F>
              <F label="Middle Name"><I value={form.middleName} placeholder="Middle Name" onKeyDown={onlyLetters} onChange={e=>set("middleName",e.target.value)}/></F>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <F label="LRN" error={lrnTaken ? "This LRN is already registered" : undefined}><I value={form.lrn} placeholder="12-digit LRN" maxLength={12} onKeyDown={onlyDigits} error={lrnTaken} onChange={e=>{set("lrn",e.target.value);checkLrn(e.target.value);}}/></F>
              <F label="Sex" required error={errors.sex}><S value={form.sex} error={errors.sex} onChange={e=>set("sex",e.target.value)}><option value="">Select</option><option value="Male">Male</option><option value="Female">Female</option></S></F>
              <F label="Date of Birth" required error={errors.dateOfBirth}><I type="date" value={form.dateOfBirth} error={errors.dateOfBirth} onChange={e=>set("dateOfBirth",e.target.value)}/></F>
            </div>
            <F label="Place of Birth"><I value={form.placeOfBirth} placeholder="Place of birth" onChange={e=>set("placeOfBirth",e.target.value)}/></F>
          </div>)}
          {step===3&&(<div className="space-y-5">
            <div><h3 className="text-sm font-bold text-[#001840] mb-3 pb-2 border-b border-gray-100">Father</h3><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><F label="Full Name"><I value={form.fatherName} placeholder="Father name" onKeyDown={onlyLetters} onChange={e=>set("fatherName",e.target.value)}/></F><F label="Occupation"><I value={form.fatherOccupation} placeholder="Occupation" onChange={e=>set("fatherOccupation",e.target.value)}/></F></div></div>
            <div><h3 className="text-sm font-bold text-[#001840] mb-3 pb-2 border-b border-gray-100">Mother</h3><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><F label="Full Name"><I value={form.motherName} placeholder="Mother name" onKeyDown={onlyLetters} onChange={e=>set("motherName",e.target.value)}/></F><F label="Occupation"><I value={form.motherOccupation} placeholder="Occupation" onChange={e=>set("motherOccupation",e.target.value)}/></F></div></div>
            <F label="Parents Address"><I value={form.parentsAddress} placeholder="Complete address" onChange={e=>set("parentsAddress",e.target.value)}/></F>
            <div><h3 className="text-sm font-bold text-[#001840] mb-3 pb-2 border-b border-gray-100">Guardian (if any)</h3><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><F label="Full Name"><I value={form.guardianName} placeholder="Guardian name" onKeyDown={onlyLetters} onChange={e=>set("guardianName",e.target.value)}/></F><F label="Occupation"><I value={form.guardianOccupation} placeholder="Occupation" onChange={e=>set("guardianOccupation",e.target.value)}/></F><F label="Address"><I value={form.guardianAddress} placeholder="Address" onChange={e=>set("guardianAddress",e.target.value)}/></F><F label="Telephone / Mobile"><I value={form.guardianTelephone} placeholder="09XXXXXXXXX" maxLength={11} onKeyDown={onlyDigits} onChange={e=>set("guardianTelephone",e.target.value)}/></F></div></div>
          </div>)}
          {step===4&&(<div className="space-y-5">
            <div><h3 className="text-sm font-bold text-[#001840] mb-3 pb-2 border-b border-gray-100">Grade VI School</h3><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><F label="School Name"><I value={form.grade6School} placeholder="School name" onChange={e=>set("grade6School",e.target.value)}/></F><F label="School Address"><I value={form.grade6SchoolAddress} placeholder="Address" onChange={e=>set("grade6SchoolAddress",e.target.value)}/></F><F label="Section"><I value={form.grade6Section} placeholder="Section" onChange={e=>set("grade6Section",e.target.value)}/></F><F label="General Average"><I value={form.grade6Average} placeholder="e.g. 88" maxLength={5} onKeyDown={onlyDigits} onChange={e=>set("grade6Average",e.target.value)}/></F><F label="SY Start"><I value={form.grade6SYStart} placeholder="2020" maxLength={4} onKeyDown={onlyDigits} onChange={e=>set("grade6SYStart",e.target.value)}/></F><F label="SY End"><I value={form.grade6SYEnd} placeholder="2021" maxLength={4} onKeyDown={onlyDigits} onChange={e=>set("grade6SYEnd",e.target.value)}/></F></div></div>
            <div><h3 className="text-sm font-bold text-[#001840] mb-3 pb-2 border-b border-gray-100">Last High School Attended</h3><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><F label="School Name"><I value={form.lastHSSchool} placeholder="School name" onChange={e=>set("lastHSSchool",e.target.value)}/></F><F label="Curriculum Year"><I value={form.lastHSCurriculumYear} placeholder="e.g. G7" onChange={e=>set("lastHSCurriculumYear",e.target.value)}/></F><F label="Section"><I value={form.lastHSSection} placeholder="Section" onChange={e=>set("lastHSSection",e.target.value)}/></F><F label="SY Start"><I value={form.lastHSSYStart} placeholder="2023" maxLength={4} onKeyDown={onlyDigits} onChange={e=>set("lastHSSYStart",e.target.value)}/></F><F label="SY End"><I value={form.lastHSSYEnd} placeholder="2024" maxLength={4} onKeyDown={onlyDigits} onChange={e=>set("lastHSSYEnd",e.target.value)}/></F></div></div>
          </div>)}
          {step===docStep&&(<div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-[#001840] mb-1">Upload Required Documents <span className="text-red-500">*</span></p>
              <p className="text-xs text-gray-500 mb-4">Upload a clear scan or photo of each document. At least one is required.</p>
            </div>
            {HS_CREDS.map(cred=>{
              const file=form.docFiles[cred.key];
              const previewUrl=file?URL.createObjectURL(file):null;
              return(
                <div key={cred.key} className={`p-4 rounded-xl border-2 transition-all ${file?"border-green-400 bg-green-50":"border-gray-200 bg-gray-50"}`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold text-[#001840]">{cred.label}</span>
                    {file&&<span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Uploaded</span>}
                  </div>
                  {file?(
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 bg-white rounded-lg px-3 py-2 border border-green-200">
                        <FileText size={14} className="text-green-600 shrink-0"/>
                        <span className="text-xs text-green-700 truncate flex-1">{file.name}</span>
                        <button
                          type="button"
                          onClick={()=>setPreviewModal({url:previewUrl,name:file.name,isPdf:file.type==="application/pdf"})}
                          className="text-xs text-[#102A71] hover:text-[#001840] font-semibold shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg border border-[#102A71]/30 hover:bg-[#EEF2FF] transition-all"
                        >
                          View
                        </button>
                        <button type="button" onClick={()=>set("docFiles",{...form.docFiles,[cred.key]:null})} className="text-red-400 hover:text-red-600 shrink-0"><X size={14}/></button>
                      </div>
                    </div>
                  ):(
                    <label className="flex items-center justify-between gap-2 cursor-pointer border border-gray-200 rounded-lg px-3 py-2.5 bg-white hover:bg-gray-50 transition-all">
                      <span className="text-sm text-gray-500">Drag and Drop or Upload File</span>
                      <Upload size={16} className="text-gray-400 shrink-0"/>
                      <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={e=>{
                        const f=e.target.files[0];
                        if(!f)return;
                        if(f.size>3*1024*1024){alert("File exceeds 3MB limit.");return;}
                        set("docFiles",{...form.docFiles,[cred.key]:f});
                      }}/>
                    </label>
                  )}
                  <p className="text-[10px] text-gray-400 mt-2 italic">Formats: PDF, JPG, JPEG, PNG · Max file size: 3.0MB</p>
                </div>
              );
            })}
            {errors.credentials&&<p className="text-xs text-red-500">{errors.credentials}</p>}
            {errors.docFiles&&<p className="text-xs text-red-500">{errors.docFiles}</p>}
          </div>)}
        </div>
        {step===total&&(
          <div className="flex justify-end mt-6">
            <button onClick={submit} disabled={submitting} className="flex items-center gap-2 px-8 py-3 bg-[#F5C400] text-[#001840] rounded-xl font-bold hover:bg-[#FFDC5F] transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed">
              {submitting?<><Loader2 size={18} className="animate-spin"/> Submitting...</>:<><CheckCircle2 size={18}/> Submit Enrollment</>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
