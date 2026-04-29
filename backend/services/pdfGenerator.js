import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateHSEnrollmentPDF } from './hsPdfGenerator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const formatEnrollmentData = (enrollment) => {
  return {
    ...enrollment,
    studentNumber: enrollment.studentNumber || '',
    semester: enrollment.semester || '',
    academicYear: enrollment.academicYear || '',
    dateEnrolled: enrollment.dateEnrolled || '',
    course: enrollment.course || '',
    major: enrollment.major || '',
    curriculumYear: enrollment.curriculumYear || '',
    admissionCredentials: enrollment.admissionCredentials || [],
    familyName: enrollment.familyName || '',
    firstName: enrollment.firstName || '',
    middleName: enrollment.middleName || '',
    sex: enrollment.sex || '',
    dateOfBirth: enrollment.dateOfBirth || '',
    placeOfBirth: enrollment.placeOfBirth || '',
    email: enrollment.email || '',
    mobileNumber: enrollment.mobileNumber || '',
    fatherName: enrollment.fatherName || '',
    fatherOccupation: enrollment.fatherOccupation || '',
    fatherAddress: enrollment.fatherAddress || '',
    motherName: enrollment.motherName || '',
    motherOccupation: enrollment.motherOccupation || '',
    motherAddress: enrollment.motherAddress || '',
    guardianName: enrollment.guardianName || '',
    guardianOccupation: enrollment.guardianOccupation || '',
    guardianAddress: enrollment.guardianAddress || '',
    educationalBackground: enrollment.educationalBackground || {},
    subjects: enrollment.subjects || [],
    studentSignature: enrollment.studentSignature || '',
    referredBy: enrollment.referredBy || ''
  };
};

export const generateEnrollmentPDF = (enrollment) => {
  // Route to appropriate PDF generator based on education level
  const level = enrollment.educationLevel || 'College';
  
  if (level === 'JHS' || level === 'SHS') {
    return generateHSEnrollmentPDF(enrollment);
  }
  
  // College PDF (existing logic)
  return new Promise((resolve, reject) => {
    try {
      // Legal size: 8.5" x 14" = 612 x 1008 points
      const doc = new PDFDocument({ 
        size: [612, 1008], 
        margins: { top: 30, bottom: 30, left: 30, right: 30 } 
      });
      
      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      
      const L = 30;  // Left margin
      const R = 582; // Right edge
      const W = 552; // Width
      let y = 30;    // Current Y position
      
      // ============ HEADER ============
      try {
        const logoPath = path.join(__dirname, '../public/emc_logo_nobg.png');
        if (fs.existsSync(logoPath)) {
          doc.image(logoPath, L, y, { width: 55, height: 55 });
        }
      } catch (err) {
        console.error('Logo error:', err);
      }
      
      doc.fontSize(11).font('Times-Bold').text('EASTERN MINDORO COLLEGE, INC.', L + 65, y + 20);
      doc.fontSize(12).text('COLLEGE ENROLLMENT SLIP', R - 210, y + 15, { width: 210, align: 'right' });
      y += 45;
      
      // Student Number boxes
      doc.fontSize(10).font('Times-Roman').text('Student No.', R - 135, y);
      const studentNum = (enrollment.studentNumber || '000000').padEnd(6, '0').substring(0, 6);
      let boxX = R - 78;
      for (let i = 0; i < 6; i++) {
        doc.rect(boxX, y - 2, 12, 14).stroke();
        doc.fontSize(11).font('Times-Bold').text(studentNum[i], boxX + 3.5, y);
        doc.font('Times-Roman');
        boxX += 13;
      }
      y += 16;
      
      // ============ STUDENT TYPE & DATE ============
      doc.fontSize(10);
      doc.text('New', L, y);
      doc.rect(L + 25, y - 1, 10, 10).stroke();
      if (enrollment.studentType === 'New') {
        doc.fontSize(13).font('ZapfDingbats').text('4', L + 26, y + 8);
        doc.font('Times-Roman').fontSize(10);
      }
      
      doc.text('/', L + 38, y);
      
      doc.rect(L + 48, y - 1, 10, 10).stroke();
      if (enrollment.studentType === 'Old') {
        doc.fontSize(13).font('ZapfDingbats').text('4', L + 49, y + 8);
        doc.font('Times-Roman').fontSize(10);
      }
      doc.text('Old Student', L + 61, y);
      
      doc.text('Date Enrolled', R - 175, y);
      doc.moveTo(R - 95, y + 11).lineTo(R, y + 11).stroke();
      doc.text(enrollment.dateEnrolled || '', R - 90, y, { width: 90, align: 'center' });
      y += 14;
      
      // ============ SEMESTER & AY ============
      doc.text('Semester', L, y);
      doc.moveTo(L + 50, y + 11).lineTo(L + 72, y + 11).stroke();
      doc.text(enrollment.semester || '', L + 54, y, { width: 15, align: 'center' });
      
      doc.text('AY', L + 82, y);
      doc.moveTo(L + 97, y + 11).lineTo(L + 175, y + 11).stroke();
      doc.text(enrollment.academicYear || '', L + 102, y, { width: 68, align: 'center' });
      y += 14;
      
      // ============ CURRICULUM, COURSE, MAJOR ============
      doc.text('Curriculum Year', L, y);
      doc.moveTo(L + 80, y + 11).lineTo(L + 130, y + 11).stroke();
      doc.text(enrollment.curriculumYear || '', L + 85, y, { width: 40, align: 'center' });
      
      doc.text('Course', L + 140, y);
      doc.moveTo(L + 175, y + 11).lineTo(L + 265, y + 11).stroke();
      doc.text(enrollment.course || '', L + 180, y, { width: 80, align: 'center' });
      
      doc.text('Major', L + 275, y);
      doc.moveTo(L + 305, y + 11).lineTo(R, y + 11).stroke();
      doc.text(enrollment.major || '', L + 310, y, { width: R - L - 310, align: 'center' });
      y += 16;
      
      // ============ ADMISSION CREDENTIALS ============
      doc.rect(L, y, W, 20).stroke();
      y += 6;
      doc.fontSize(10).font('Times-Bold').text('Admission Credential Submitted:', L + 5, y);
      doc.font('Times-Roman').fontSize(9);
      
      const credentials = [
        { key: 'f138', label: 'F-138', x: 165 },
        { key: 'f137a', label: 'F-137-A', x: 220 },
        { key: 'cgmc', label: 'CGMC', x: 290 },
        { key: 'tor', label: 'TOR', x: 355 },
        { key: 'birthCert', label: 'Birth Cert.', x: 405 },
        { key: 'marriageCert', label: 'Marriage Cert.', x: 480 }
      ];
      
      credentials.forEach(cred => {
        const isChecked = enrollment.admissionCredentials && enrollment.admissionCredentials.includes(cred.key);
        doc.text(cred.label, L + cred.x, y);
        const labelWidth = doc.widthOfString(cred.label);
        const boxX = L + cred.x + labelWidth + 3;
        doc.rect(boxX, y + 1, 8, 8).stroke();
        if (isChecked) {
          doc.fontSize(10).font('ZapfDingbats').text('4', boxX + 0.5, y + 8);
          doc.font('Times-Roman').fontSize(9);
        }
      });
      y += 16;
      
      // ============ DECLARATION ============
      doc.rect(L, y, W, 28).stroke();
      y += 8;
      doc.fontSize(9).font('Times-Bold').text(
        'I promise upon enrollment, as evidenced by my signature below, to obey the rules and regulations of the EASTERN MINDORO COLLEGE, INC. in order that I may not be deprived of my rights to finish my course.',
        L + 5, y, { width: W - 10, align: 'justify', lineGap: 1 }
      );
      y += 26;

      // ============ SECTION A: CONDUCT AND DISCIPLINE ============
      doc.rect(L, y, W, 196).stroke();
      y += 5;
      doc.fontSize(10).font('Times-Italic').text('A. CONDUCT AND DISCIPLINE', L + 5, y);
      y += 13;
      doc.fontSize(9).font('Times-Roman');
      
      const conductRules = [
        '1. I am enrolling with an honest purpose to uphold and recognized the standards of the college on ACADEMIC, MORALITY, CONDUCT and DISCIPLINE',
        '2. I will not enter the campus, more so attend my classes, if under the influence of liquor or drugs, nor will I smoke in the school premises.',
        '3. I will not commit vandalism and immorality. I will not instigate or join strikes and demonstrations against the administration or any of its staff. I will not become a member of or organize any fraternity unauthorized by the school nor encourage other students to organized or join such organizations.',
        '4. I will not tamper any school records nor present to the school false records.',
        '5. I will not slander or assault physically any teacher, school official or his agent, staff member or student.',
        '6. If found guilty of any regulations mentioned above (#2 to #5), I am willing to undergo any disciplinary measure the school may impose upon me. The school authorities may call my parents/guardian for a dialogue, then impose any punishment they may deem necessary.',
        '7. I will study my lesson and attend the classes regularly. I may be dropped for 10 successive absences. I will wear the required college uniform every day and submit to any corresponding uniform penalties.',
        '8. I will observe "dress code" if and when at times EMC uniform will not be required. I will not wear short pants and slippers. I am fully aware that tinted or fancy colored hair is prohibited and that male students should have proper haircut and are not allowed to wear earrings.',
        '9. That I will wear my school I. D. every time I am inside the EMC campus.'
      ];
      
      conductRules.forEach((rule, idx) => {
        const height = doc.heightOfString(rule, { width: W - 16, align: 'justify' });
        doc.text(rule, L + 8, y, { width: W - 16, align: 'justify', lineGap: 1 });
        y += height + 3;
      });
      y += 2;
      
      // ============ SECTION B: GENERAL REQUIREMENTS ============
      doc.rect(L, y, W, 95).stroke();
      y += 5;
      doc.fontSize(10).font('Times-Italic').text('B. GENERAL REQUIREMENTS', L + 5, y);
      y += 13;
      doc.fontSize(9).font('Times-Roman');
      
      const genReqs = [
        '1. I will submit upon enrolment the required admission credential which will become a part of the school record and which I CANNOT WITHDRAW AFTER ENROLMENT.',
        '2. TO BE OFFICIALLY ENROLLED, I HAVE TO PAY MY REGISTRATION, TUITION AND OTHER FEES including any increase approved by the CHED.',
        '3. I will consult the Dean or Registrar in the preparation of my advisement slip and registration form and for the solution of problems if any.',
        '4. I will drop my subjects or changed my course only upon the approval of the Dean or Registrar.',
        '5. I will not be credited for advance subjects taken the pre-requisites of which I have not taken or passed or subjects I have not officially enrolled in.'
      ];
      
      genReqs.forEach((req, idx) => {
        const height = doc.heightOfString(req, { width: W - 16, align: 'justify' });
        doc.text(req, L + 8, y, { width: W - 16, align: 'justify', lineGap: 1 });
        y += height + 2;
      });
      y += 3;
      
      // ============ SECTION C: ADVISEMENT SLIP ============
      doc.rect(L, y, W, 346).stroke();
      y += 5;
      doc.fontSize(10).font('Times-Italic').text('C. ADVISEMENT SLIP', L + 5, y);
      y += 13;
      doc.fontSize(9).font('Times-Roman');
      
      // Name with Sex
      doc.text('Name:', L + 8, y);
      doc.moveTo(L + 40, y + 11).lineTo(R - 95, y + 11).stroke();
      doc.text(enrollment.familyName || '', L + 45, y, { width: 135 });
      doc.text(enrollment.firstName || '', L + 190, y, { width: 135 });
      doc.text(enrollment.middleName || '', L + 335, y, { width: 135 });
      
      doc.text('Sex:', R - 90, y);
      doc.moveTo(R - 65, y + 11).lineTo(R - 8, y + 11).stroke();
      doc.text(enrollment.sex || '', R - 60, y);
      y += 13;
      
      doc.fontSize(8);
      doc.text('(Family Name)', L + 45, y, { width: 135, align: 'center' });
      doc.text('(First Name)', L + 190, y, { width: 135, align: 'center' });
      doc.text('(Middle Name)', L + 335, y, { width: 135, align: 'center' });
      y += 12;
      
      doc.fontSize(9);
      // Birth Info
      doc.text('Date of Birth:', L + 8, y);
      doc.moveTo(L + 65, y + 11).lineTo(L + 150, y + 11).stroke();
      doc.text(enrollment.dateOfBirth || '', L + 68, y);
      
      doc.text('Place of Birth:', L + 160, y);
      doc.moveTo(L + 225, y + 11).lineTo(R - 8, y + 11).stroke();
      doc.text(enrollment.placeOfBirth || '', L + 228, y, { width: R - L - 236 });
      y += 14;
      
      // Father
      doc.text('Father:', L + 8, y);
      doc.moveTo(L + 42, y + 11).lineTo(L + 190, y + 11).stroke();
      doc.text(enrollment.fatherName || '', L + 45, y, { width: 140 });
      
      doc.text('Occupation:', L + 195, y);
      doc.moveTo(L + 250, y + 11).lineTo(L + 340, y + 11).stroke();
      doc.text(enrollment.fatherOccupation || '', L + 253, y, { width: 82 });
      
      doc.text('Address:', L + 345, y);
      doc.moveTo(L + 390, y + 11).lineTo(R - 8, y + 11).stroke();
      doc.text(enrollment.fatherAddress || '', L + 393, y, { width: R - L - 401 });
      y += 14;
      
      // Mother
      doc.text('Mother:', L + 8, y);
      doc.moveTo(L + 44, y + 11).lineTo(L + 190, y + 11).stroke();
      doc.text(enrollment.motherName || '', L + 47, y, { width: 138 });
      
      doc.text('Occupation:', L + 195, y);
      doc.moveTo(L + 250, y + 11).lineTo(L + 340, y + 11).stroke();
      doc.text(enrollment.motherOccupation || '', L + 253, y, { width: 82 });
      
      doc.text('Address:', L + 345, y);
      doc.moveTo(L + 390, y + 11).lineTo(R - 8, y + 11).stroke();
      doc.text(enrollment.motherAddress || '', L + 393, y, { width: R - L - 401 });
      y += 14;
      
      // Guardian
      doc.text('Guardian:', L + 8, y);
      doc.moveTo(L + 50, y + 11).lineTo(L + 190, y + 11).stroke();
      doc.text(enrollment.guardianName || '', L + 53, y, { width: 132 });
      
      doc.text('Occupation:', L + 195, y);
      doc.moveTo(L + 250, y + 11).lineTo(L + 340, y + 11).stroke();
      doc.text(enrollment.guardianOccupation || '', L + 253, y, { width: 82 });
      
      doc.text('Address:', L + 345, y);
      doc.moveTo(L + 390, y + 11).lineTo(R - 8, y + 11).stroke();
      doc.text(enrollment.guardianAddress || '', L + 393, y, { width: R - L - 401 });
      y += 14;
      
      // Educational Background
      const edu = enrollment.educationalBackground || {};
      
      doc.text('Primary School Completed at (School)', L + 8, y);
      doc.moveTo(L + 180, y + 11).lineTo(R - 95, y + 11).stroke();
      doc.text(edu.primary?.school || '', L + 183, y, { width: R - L - 288 });
      doc.text('AY', R - 90, y);
      doc.moveTo(R - 75, y + 11).lineTo(R - 48, y + 11).stroke();
      doc.text(edu.primary?.ayStart || '', R - 73, y, { width: 22, align: 'center' });
      doc.text('-', R - 45, y);
      doc.moveTo(R - 40, y + 11).lineTo(R - 8, y + 11).stroke();
      doc.text(edu.primary?.ayEnd || '', R - 38, y, { width: 27, align: 'center' });
      y += 13;
      
      doc.text('Intermediate School Completed at (School)', L + 8, y);
      doc.moveTo(L + 195, y + 11).lineTo(R - 95, y + 11).stroke();
      doc.text(edu.intermediate?.school || '', L + 198, y, { width: R - L - 303 });
      doc.text('AY', R - 90, y);
      doc.moveTo(R - 75, y + 11).lineTo(R - 48, y + 11).stroke();
      doc.text(edu.intermediate?.ayStart || '', R - 73, y, { width: 22, align: 'center' });
      doc.text('-', R - 45, y);
      doc.moveTo(R - 40, y + 11).lineTo(R - 8, y + 11).stroke();
      doc.text(edu.intermediate?.ayEnd || '', R - 38, y, { width: 27, align: 'center' });
      y += 13;
      
      doc.text('Junior High School Completed at (School)', L + 8, y);
      doc.moveTo(L + 190, y + 11).lineTo(R - 95, y + 11).stroke();
      doc.text(edu.juniorHigh?.school || '', L + 193, y, { width: R - L - 298 });
      doc.text('AY', R - 90, y);
      doc.moveTo(R - 75, y + 11).lineTo(R - 48, y + 11).stroke();
      doc.text(edu.juniorHigh?.ayStart || '', R - 73, y, { width: 22, align: 'center' });
      doc.text('-', R - 45, y);
      doc.moveTo(R - 40, y + 11).lineTo(R - 8, y + 11).stroke();
      doc.text(edu.juniorHigh?.ayEnd || '', R - 38, y, { width: 27, align: 'center' });
      y += 13;
      
      doc.text('Senior High School Completed at (School)', L + 8, y);
      doc.moveTo(L + 190, y + 11).lineTo(R - 95, y + 11).stroke();
      doc.text(edu.seniorHigh?.school || '', L + 193, y, { width: R - L - 298 });
      doc.text('AY', R - 90, y);
      doc.moveTo(R - 75, y + 11).lineTo(R - 48, y + 11).stroke();
      doc.text(edu.seniorHigh?.ayStart || '', R - 73, y, { width: 22, align: 'center' });
      doc.text('-', R - 45, y);
      doc.moveTo(R - 40, y + 11).lineTo(R - 8, y + 11).stroke();
      doc.text(edu.seniorHigh?.ayEnd || '', R - 38, y, { width: 27, align: 'center' });
      y += 13;
      
      doc.text('Complete Address of Senior High School', L + 8, y);
      doc.moveTo(L + 170, y + 11).lineTo(R - 8, y + 11).stroke();
      doc.text(edu.seniorHighAddress || '', L + 173, y, { width: R - L - 181 });
      y += 13;
      
      doc.text('Last College Attended:', L + 8, y);
      doc.moveTo(L + 105, y + 11).lineTo(L + 350, y + 11).stroke();
      doc.text(edu.lastCollege?.name || '', L + 108, y, { width: 237 });
      
      doc.text('Course Taken', L + 355, y);
      doc.moveTo(L + 415, y + 11).lineTo(R - 8, y + 11).stroke();
      doc.text(edu.lastCollege?.course || '', L + 418, y, { width: R - L - 426 });
      y += 13;
      
      doc.text('Addres of Last College Attended:', L + 8, y);
      doc.moveTo(L + 150, y + 11).lineTo(R - 95, y + 11).stroke();
      doc.text(edu.lastCollege?.address || '', L + 153, y, { width: R - L - 258 });
      doc.text('AY', R - 90, y);
      doc.moveTo(R - 75, y + 11).lineTo(R - 48, y + 11).stroke();
      doc.text(edu.lastCollege?.ayStart || '', R - 73, y, { width: 22, align: 'center' });
      doc.text('-', R - 45, y);
      doc.moveTo(R - 40, y + 11).lineTo(R - 8, y + 11).stroke();
      doc.text(edu.lastCollege?.ayEnd || '', R - 38, y, { width: 27, align: 'center' });
      y += 15;
      
      // Subject Table Instruction
      doc.fontSize(9);
      doc.text('Please enroll me in the following subjects, I have already taken and passed their pre-requisites; otherwise, I shall', L + 8, y);
      y += 10;
      doc.text('not claim credits for them.', L + 8, y);
      y += 13;
      
      // Subject Table Header
      doc.rect(L + 8, y, 70, 14).stroke();
      doc.text('Subject Code', L + 12, y + 3, { width: 62 });
      doc.rect(L + 78, y, 250, 14).stroke();
      doc.text('Subject Description', L + 82, y + 3, { width: 242 });
      doc.rect(L + 328, y, 50, 14).stroke();
      doc.text('Units', L + 332, y + 3, { width: 42 });
      doc.rect(L + 378, y, 60, 14).stroke();
      doc.text('Time', L + 382, y + 3, { width: 52 });
      doc.rect(L + 438, y, 106, 14).stroke();
      doc.text('Day/Time', L + 442, y + 3, { width: 98 });
      y += 14;
      
      // Subject Table Rows (8 rows)
      for (let i = 0; i < 8; i++) {
        const subject = enrollment.subjects && enrollment.subjects[i] ? enrollment.subjects[i] : {};
        doc.rect(L + 8, y, 70, 14).stroke();
        doc.text(subject.code || '', L + 12, y + 3, { width: 62 });
        doc.rect(L + 78, y, 250, 14).stroke();
        doc.text(subject.description || '', L + 82, y + 3, { width: 242 });
        doc.rect(L + 328, y, 50, 14).stroke();
        doc.text(subject.units || '', L + 332, y + 3, { width: 42 });
        doc.rect(L + 378, y, 60, 14).stroke();
        doc.text(subject.time || '', L + 382, y + 3, { width: 52 });
        doc.rect(L + 438, y, 106, 14).stroke();
        doc.text(subject.dayTime || '', L + 442, y + 3, { width: 98 });
        y += 14;
      }
      y += 20;
      
      // Bottom Section
      doc.fontSize(9);
      doc.text('Approved:', L + 8, y);
      doc.moveTo(L + 8, y + 25).lineTo(L + 200, y + 25).stroke();
      
      doc.text('Student Signature:', R - 240, y);
      doc.moveTo(R - 240, y + 25).lineTo(R - 8, y + 25).stroke();
      doc.text(enrollment.studentSignature || '', R - 235, y);
      y += 28;
      
      doc.text('Date:', L + 8, y);
      doc.moveTo(L + 35, y + 11).lineTo(L + 140, y + 11).stroke();
      
      doc.text('Email Address:', R - 240, y);
      doc.moveTo(R - 165, y + 11).lineTo(R - 8, y + 11).stroke();
      doc.text(enrollment.email || '', R - 160, y);
      y += 14;
      
      doc.text('Mobile No.:', R - 240, y);
      doc.moveTo(R - 185, y + 11).lineTo(R - 8, y + 11).stroke();
      doc.text(enrollment.mobileNumber || '', R - 180, y);
      y += 14;
      
      doc.text('Referred by:', R - 240, y);
      doc.moveTo(R - 180, y + 11).lineTo(R - 8, y + 11).stroke();
      doc.text(enrollment.referredBy || '', R - 175, y);
      y += 22;
      
      // Footer - "Enriching Minds of Champion" with E, M, C bolded
      doc.fontSize(10).font('Times-Roman');
      const footerText = 'Enriching Minds of Champion';
      const footerParts = footerText.split(' ');
      let footerX = L + (W / 2) - 75;
      
      footerParts.forEach((word, idx) => {
        if (idx === 0) {
          // Bold E in "Enriching"
          doc.font('Times-Bold').text(word.charAt(0), footerX, y);
          footerX += doc.widthOfString(word.charAt(0));
          doc.font('Times-Roman').text(word.substring(1) + ' ', footerX, y);
          footerX += doc.widthOfString(word.substring(1) + ' ');
        } else if (idx === 1) {
          // Bold M in "Minds"
          doc.font('Times-Bold').text(word.charAt(0), footerX, y);
          footerX += doc.widthOfString(word.charAt(0));
          doc.font('Times-Roman').text(word.substring(1) + ' ', footerX, y);
          footerX += doc.widthOfString(word.substring(1) + ' ');
        } else if (idx === 2) {
          // Regular "of"
          doc.text(word + ' ', footerX, y);
          footerX += doc.widthOfString(word + ' ');
        } else if (idx === 3) {
          // Bold C in "Champion"
          doc.font('Times-Bold').text(word.charAt(0), footerX, y);
          footerX += doc.widthOfString(word.charAt(0));
          doc.font('Times-Roman').text(word.substring(1), footerX, y);
          footerX += doc.widthOfString(word.substring(1));
        }
      });
      
      doc.end();
    } catch (error) {
      console.error('PDF Generation Error:', error);
      reject(error);
    }
  });
};
