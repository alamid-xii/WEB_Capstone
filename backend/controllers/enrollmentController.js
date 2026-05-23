/*
MIT License

Copyright (c) 2025 Christian I. Cabrera || XianFire Framework
Mindoro State University - Philippines

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

import { EnrollmentRecord } from "../models/enrollmentRecordModel.js";
import { EnrollmentSubject } from "../models/enrollmentSubjectModel.js";
import { User } from "../models/userModel.js";
import { sequelize } from "../models/db.js";
import jwt from "jsonwebtoken";
import { generateEnrollmentPDF, formatEnrollmentData } from "../services/pdfGenerator.js";

await sequelize.sync();

const JWT_SECRET = process.env.JWT_SECRET || "emc-secret-key-2025";

// Authentication Middleware

/**
 * Middleware to verify JWT token and authenticate user
 * Requirements: 20.3
 */
export const requireAuth = async (req, res, next) => {
  try {
    // Check for JWT token in Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findByPk(decoded.id);
        
        if (!user) {
          return res.status(401).json({ message: 'User not found' });
        }
        
        req.user = user;
        return next();
      } catch (jwtError) {
        return res.status(401).json({ message: 'Invalid or expired token' });
      }
    }
    
    // Fallback to session-based auth
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const user = await User.findByPk(req.session.userId);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    req.user = user;
    next();
  } catch (err) {
    console.error("Auth error:", err);
    res.status(500).json({ message: 'Authentication error' });
  }
};

/**
 * Middleware to check admin role
 * Requirements: 16.1, 18.2
 */
export const requireAdmin = async (req, res, next) => {
  try {
    // Check for JWT token in Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findByPk(decoded.id);
        
        if (!user || user.role !== 'admin') {
          return res.status(403).json({ message: 'Admin access required' });
        }
        
        req.user = user;
        return next();
      } catch (jwtError) {
        return res.status(401).json({ message: 'Invalid or expired token' });
      }
    }
    
    // Fallback to session-based auth
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const user = await User.findByPk(req.session.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    req.user = user;
    next();
  } catch (err) {
    console.error("Auth error:", err);
    res.status(500).json({ message: 'Authentication error' });
  }
};

// Validation Middleware

/**
 * Validates required fields (studentType, course)
 * Requirements: 14.3
 */
export const validateRequiredFields = (req, res, next) => {
  const errors = [];
  const level = req.body.educationLevel || 'College';

  // enrollmentType required for college only
  if (level === 'College' && !req.body.enrollmentType && !req.body.studentType) {
    errors.push({ field: 'enrollmentType', message: 'Enrollment type is required' });
  }

  // course required for college only
  if (level === 'College' && !req.body.course) {
    errors.push({ field: 'course', message: 'Course is required' });
  }

  // gradeLevel required for JHS/SHS
  if ((level === 'JHS' || level === 'SHS') && !req.body.gradeLevel) {
    errors.push({ field: 'gradeLevel', message: 'Grade level is required' });
  }

  if (errors.length > 0) {
    return res.status(400).json({ message: 'Validation failed', errors });
  }

  next();
};

/**
 * Validates date format for date fields
 * Requirements: 14.4
 */
export const validateDateFormat = (req, res, next) => {
  const errors = [];
  const dateFields = ['dateEnrolled', 'dateOfBirth'];
  
  dateFields.forEach(field => {
    if (req.body[field]) {
      const dateValue = req.body[field];
      const date = new Date(dateValue);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        errors.push({ 
          field, 
          message: `Invalid date format for ${field}. Expected format: YYYY-MM-DD` 
        });
      }
    }
  });
  
  if (errors.length > 0) {
    return res.status(400).json({ 
      message: 'Validation failed', 
      errors 
    });
  }
  
  next();
};

/**
 * Validates enum values for studentType, course, and sex
 * Requirements: 14.2
 */
export const validateEnumValues = (req, res, next) => {
  const errors = [];
  
  // Validate enrollmentType (new field)
  const validEnrollmentTypes = ['first-time', 'continuing', 'returnee', 'transferee'];
  if (req.body.enrollmentType && !validEnrollmentTypes.includes(req.body.enrollmentType)) {
    errors.push({ field: 'enrollmentType', message: `Enrollment type must be one of: ${validEnrollmentTypes.join(', ')}` });
  }

  // Validate studentType (legacy - optional now)
  if (req.body.studentType && !['New', 'Old'].includes(req.body.studentType)) {
    errors.push({ field: 'studentType', message: 'Student type must be either "New" or "Old"' });
  }

  // Validate studentStatus
  if (req.body.studentStatus && !['regular', 'irregular'].includes(req.body.studentStatus)) {
    errors.push({ field: 'studentStatus', message: 'Student status must be "regular" or "irregular"' });
  }

  // Validate educationLevel
  if (req.body.educationLevel && !['JHS', 'SHS', 'College'].includes(req.body.educationLevel)) {
    errors.push({ field: 'educationLevel', message: 'Education level must be JHS, SHS, or College' });
  }
  
  // Validate course
  const validCourses = ['BEED', 'BSIS', 'BSBA', 'BSED', 'BSCrim'];
  if (req.body.course && !validCourses.includes(req.body.course)) {
    errors.push({ field: 'course', message: `Course must be one of: ${validCourses.join(', ')}` });
  }
  
  // Validate sex (optional field)
  if (req.body.sex && !['Male', 'Female'].includes(req.body.sex)) {
    errors.push({ field: 'sex', message: 'Sex must be either "Male" or "Female"' });
  }
  
  if (errors.length > 0) {
    return res.status(400).json({ message: 'Validation failed', errors });
  }
  
  next();
};

// Controller Functions

/**
 * SSC qualification check helper
 * Returns true if grade6Average >= 85
 */
const checkSSCQualification = (grade6Average) => {
  const avg = parseFloat(grade6Average);
  return !isNaN(avg) && avg >= 85;
};

/**
 * Create new enrollment record
 * POST /api/enrollments
 * Requirements: 12.2, 12.3, 14.1
 *
 * SSC Logic (JHS Grade 7 only):
 *   - If sscApplied=true AND grade6Average >= 85 → status='pending_exam', sscQualified=true
 *   - If sscApplied=true AND grade6Average < 85  → status='submitted', sscQualified=false, sscClass='Regular'
 *   - If sscApplied=false                        → status='submitted', normal flow
 */
export const createEnrollment = async (req, res) => {
  try {
    const body = { ...req.body };
    let status = 'submitted';
    let sscQualified = null;
    let sscClass = null;

    // ── One enrollment per student ────────────────────────────────────────────
    // Allow if the only existing record is an SSC-only application (no firstName filled yet)
    const [existing] = await sequelize.query(
      `SELECT id, status, firstName, sscApplied FROM enrollment_records WHERE userId = ? AND status NOT IN ('rejected') LIMIT 1`,
      { replacements: [req.user.id] }
    );
    if (existing && existing.length > 0) {
      const existingRecord = existing[0];
      // If it's an SSC placeholder (sscApplied=1 and no name filled), update it with full form data
      if (existingRecord.sscApplied && !existingRecord.firstName) {
        const safeFields = ['educationLevel','gradeLevel','strand','studentType','academicYear','dateEnrolled',
          'lrn','familyName','firstName','middleName','sex','dateOfBirth','placeOfBirth',
          'fatherName','fatherOccupation','motherName','motherOccupation','parentsAddress',
          'guardianName','guardianOccupation','guardianAddress','guardianTelephone',
          'grade6School','grade6SchoolAddress','grade6Section','grade6SYStart','grade6SYEnd',
          'grade6Average','grade6Remarks','lastHSSchool','lastHSCurriculumYear','lastHSSection',
          'lastHSSYStart','lastHSSYEnd','admissionCredentials','studentSignature','parentGuardianSignature'];
        const updates = safeFields.filter(k => body[k] !== undefined);
        if (updates.length > 0) {
          const setClause = updates.map(k => `${k} = ?`).join(', ');
          const values = updates.map(k => k === 'admissionCredentials' ? JSON.stringify(body[k]) : body[k]);
          await sequelize.query(
            `UPDATE enrollment_records SET ${setClause}, updatedAt = datetime('now') WHERE id = ?`,
            { replacements: [...values, existingRecord.id] }
          );
        }
        const [[updated]] = await sequelize.query('SELECT * FROM enrollment_records WHERE id = ?', { replacements: [existingRecord.id] });
        try { await sendEnrollmentSubmittedEmail(req.user, updated); } catch (_) {}
        return res.status(200).json({ message: 'Enrollment updated successfully', enrollment: updated });
      }
      return res.status(400).json({
        message: 'You already have an active enrollment. You cannot submit another one until your current enrollment is rejected or completed.'
      });
    }

    // LRN uniqueness check
    if (body.lrn) {
      const [lrnCheck] = await sequelize.query(
        `SELECT id FROM enrollment_records WHERE lrn = ? LIMIT 1`,
        { replacements: [body.lrn] }
      );
      if (lrnCheck && lrnCheck.length > 0) {
        return res.status(400).json({ message: 'This LRN is already registered in the system. Please check your LRN and try again.' });
      }
    }

    // SSC evaluation — only for JHS Grade 7
    if (
      body.educationLevel === 'JHS' &&
      body.gradeLevel === 'Grade 7' &&
      body.sscApplied === true
    ) {
      if (checkSSCQualification(body.grade6Average)) {
        status = 'pending_exam';
        sscQualified = true;
      } else {
        status = 'submitted';
        sscQualified = false;
        sscClass = 'Regular';
      }
    }

    const enrollmentData = {
      userId: req.user.id,
      ...body,
      status,
      ...(sscQualified !== null && { sscQualified }),
      ...(sscClass !== null && { sscClass }),
    };

    const enrollment = await EnrollmentRecord.create(enrollmentData);

    const message = status === 'pending_exam'
      ? 'You qualify for the Special Science Class entrance exam! The registrar will contact you for the exam schedule.'
      : sscQualified === false
        ? 'Your Grade 6 average does not meet the SSC requirement (85+). You have been enrolled in the Regular class.'
        : 'Enrollment saved successfully';

        // Send submission email (non-blocking)
    try {
      await sendEnrollmentSubmittedEmail(req.user, enrollment.toJSON());
    } catch (_) {}
    res.status(201).json({ message, enrollment, sscQualified, status });
  } catch (error) {
    console.error('Create enrollment error:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        message: 'Validation failed',
        errors: error.errors.map(e => ({ field: e.path, message: e.message }))
      });
    }
    res.status(500).json({ message: 'Failed to save enrollment. Please try again.' });
  }
};

/**
 * Admin: Schedule SSC exam for a qualified applicant
 * PUT /api/enrollments/:id/ssc-schedule
 */
export const scheduleSSCExam = async (req, res) => {
  try {
    const { examDate, passingScore } = req.body;
    const enrollment = await EnrollmentRecord.findByPk(req.params.id);

    if (!enrollment) return res.status(404).json({ message: 'Enrollment not found' });
    if (enrollment.status !== 'pending_exam') {
      return res.status(400).json({ message: 'Enrollment is not pending an SSC exam' });
    }
    if (!examDate) return res.status(400).json({ message: 'Exam date is required' });

    await enrollment.update({
      sscExamDate: examDate,
      ...(passingScore && { sscPassingScore: passingScore })
    });

    res.json({ message: 'SSC exam scheduled', enrollment });
  } catch (error) {
    console.error('Schedule SSC exam error:', error);
    res.status(500).json({ message: 'Failed to schedule exam' });
  }
};

/**
 * Admin: Record SSC exam result
 * PUT /api/enrollments/:id/ssc-result
 * Auto-routes: score >= passingScore → SSC class, else → Regular class
 */
export const recordSSCResult = async (req, res) => {
  try {
    const { examScore } = req.body;
    const enrollment = await EnrollmentRecord.findByPk(req.params.id);

    if (!enrollment) return res.status(404).json({ message: 'Enrollment not found' });
    if (enrollment.status !== 'pending_exam') {
      return res.status(400).json({ message: 'Enrollment is not pending an SSC exam' });
    }
    if (examScore === undefined || examScore === null) {
      return res.status(400).json({ message: 'Exam score is required' });
    }

    const score = parseFloat(examScore);
    const passing = parseFloat(enrollment.sscPassingScore) || 75;
    const passed = score >= passing;

    await enrollment.update({
      sscExamScore: score,
      sscResult: passed ? 'passed' : 'failed',
      sscClass: passed ? 'SSC' : 'Regular',
      status: 'submitted' // moves to normal approval queue
    });

    res.json({
      message: passed
        ? `Passed! Student is eligible for the Special Science Class.`
        : `Did not pass. Student will be enrolled in the Regular class.`,
      sscResult: passed ? 'passed' : 'failed',
      sscClass: passed ? 'SSC' : 'Regular',
      enrollment
    });
  } catch (error) {
    console.error('Record SSC result error:', error);
    res.status(500).json({ message: 'Failed to record exam result' });
  }
};

/**
 * Create enrollment with TOR file upload (transferees)
 * POST /api/enrollments/with-tor
 */
export const createEnrollmentWithTOR = async (req, res) => {
  try {
    // ── One enrollment per student ──────────────────────────────────────────
    const [existing] = await sequelize.query(
      `SELECT id FROM enrollment_records WHERE userId = ? AND status NOT IN ('rejected') LIMIT 1`,
      { replacements: [req.user.id] }
    );
    if (existing && existing.length > 0) {
      return res.status(400).json({
        message: 'You already have an active enrollment. You cannot submit another one until your current enrollment is rejected or completed.'
      });
    }

    // LRN uniqueness check
    if (req.body.lrn) {
      const [lrnCheck] = await sequelize.query(
        `SELECT id FROM enrollment_records WHERE lrn = ? LIMIT 1`,
        { replacements: [req.body.lrn] }
      );
      if (lrnCheck && lrnCheck.length > 0) {
        return res.status(400).json({ message: 'This LRN is already registered in the system. Please check your LRN and try again.' });
      }
    }

    const enrollmentData = {
      userId: req.user.id,
      ...req.body,
      status: 'submitted'
    };
    const enrollment = await EnrollmentRecord.create(enrollmentData);
    res.status(201).json({ message: 'Enrollment saved successfully', enrollment });
  } catch (error) {
    console.error('Create enrollment with TOR error:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        message: 'Validation failed',
        errors: error.errors.map(e => ({ field: e.path, message: e.message }))
      });
    }
    res.status(500).json({ message: 'Failed to save enrollment. Please try again.' });
  }
};

/**
 * Get all enrollments (admin only)
 * GET /api/enrollments
 * Requirements: 16.1, 16.3, 16.4
 */
export const getAllEnrollments = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    const where = {};
    
    // Filter by status
    if (status) {
      where.status = status;
    }
    
    const queryOptions = {
      where,
      include: [{ 
        model: User, 
        as: 'user',
        attributes: ['id', 'name', 'email']
      }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    };
    
    // Search by student name
    if (search) {
      queryOptions.include[0].where = {
        name: {
          [sequelize.Sequelize.Op.like]: `%${search}%`
        }
      };
    }
    
    const { count, rows } = await EnrollmentRecord.findAndCountAll(queryOptions);
    
    res.json({
      enrollments: rows,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit)
    });
  } catch (error) {
    console.error('Error fetching enrollments:', error);
    res.status(500).json({ 
      message: 'Failed to fetch enrollments' 
    });
  }
};

/**
 * Get single enrollment by ID
 * GET /api/enrollments/:id
 * Requirements: 20.2
 */
export const getEnrollmentById = async (req, res) => {
  try {
    const enrollment = await EnrollmentRecord.findByPk(req.params.id, {
      include: [{ 
        model: User, 
        as: 'user',
        attributes: ['id', 'name', 'email']
      }]
    });
    
    if (!enrollment) {
      return res.status(404).json({ 
        message: 'Enrollment not found' 
      });
    }
    
    // Check authorization: user can only view own enrollment, admin/registrar can view all
    if (req.user.role !== 'admin' && req.user.role !== 'registrar' && enrollment.userId !== req.user.id) {
      return res.status(403).json({ 
        message: 'You do not have permission to view this enrollment' 
      });
    }
    
    res.json(enrollment);
  } catch (error) {
    console.error('Error fetching enrollment:', error);
    res.status(500).json({ 
      message: 'Failed to fetch enrollment' 
    });
  }
};

/**
 * Update enrollment record
 * PUT /api/enrollments/:id
 * Note: Only allows updating optional fields, not required fields
 */
export const updateEnrollment = async (req, res) => {
  try {
    const enrollment = await EnrollmentRecord.findByPk(req.params.id);
    
    if (!enrollment) {
      return res.status(404).json({ 
        message: 'Enrollment not found' 
      });
    }
    
    // Check authorization: user can only update own enrollment
    if (enrollment.userId !== req.user.id) {
      return res.status(403).json({ 
        message: 'You do not have permission to update this enrollment' 
      });
    }
    
    // Only allow updating specific fields (not required fields)
    const allowedFields = [
      'mobileNumber', 'email', 'fatherOccupation', 'motherOccupation',
      'guardianOccupation', 'fatherAddress', 'motherAddress', 'guardianAddress',
      'referredBy', 'studentSignature'
    ];
    
    const updateData = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });
    
    await enrollment.update(updateData);
    
    res.json({
      message: 'Enrollment updated successfully',
      id: enrollment.id,
      enrollment
    });
  } catch (error) {
    console.error('Error updating enrollment:', error);
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        message: 'Validation failed',
        errors: error.errors.map(e => ({
          field: e.path,
          message: e.message
        }))
      });
    }
    
    res.status(500).json({ 
      message: 'Failed to update enrollment' 
    });
  }
};

/**
 * Update enrollment status (admin only)
 * PUT /api/enrollments/:id/status
 * Requirements: 18.2, 18.3
 */
export const updateEnrollmentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    // Validate status value
    if (!['submitted', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ 
        message: 'Invalid status. Must be one of: submitted, approved, rejected' 
      });
    }
    
    const enrollment = await EnrollmentRecord.findByPk(req.params.id);
    
    if (!enrollment) {
      return res.status(404).json({ 
        message: 'Enrollment not found' 
      });
    }
    
    await enrollment.update({ status });
    
    res.json({
      message: 'Status updated successfully',
      enrollment
    });
  } catch (error) {
    console.error('Error updating enrollment status:', error);
    res.status(500).json({ 
      message: 'Failed to update enrollment status' 
    });
  }
};

/**
 * Get all enrollments for a specific user
 * GET /api/enrollments/user/:userId
 * Requirements: 19.1
 */
export const getUserEnrollments = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    // Check authorization: user can only view own enrollments, admin can view all
    if (req.user.role !== 'admin' && req.user.id !== userId) {
      return res.status(403).json({ 
        message: 'You do not have permission to view these enrollments' 
      });
    }
    
    const enrollments = await EnrollmentRecord.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']]
    });
    
    res.json(enrollments);
  } catch (error) {
    console.error('Error fetching user enrollments:', error);
    res.status(500).json({ 
      message: 'Failed to fetch enrollments' 
    });
  }
};

/**
 * Delete enrollment record
 * DELETE /api/enrollments/:id
 */
export const deleteEnrollment = async (req, res) => {
  try {
    const enrollment = await EnrollmentRecord.findByPk(req.params.id);
    
    if (!enrollment) {
      return res.status(404).json({ 
        message: 'Enrollment not found' 
      });
    }
    
    // Check authorization: user can only delete own enrollment, admin can delete all
    if (req.user.role !== 'admin' && enrollment.userId !== req.user.id) {
      return res.status(403).json({ 
        message: 'You do not have permission to delete this enrollment' 
      });
    }
    
    // Delete related enrollment subjects first (foreign key constraint)
    try {
      await EnrollmentSubject.destroy({
        where: { enrollmentId: req.params.id }
      });
    } catch (subError) {
      console.error('Error deleting enrollment subjects:', subError);
    }
    
    // Then delete the enrollment
    await enrollment.destroy();
    
    res.json({ 
      message: 'Enrollment deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting enrollment:', error);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    res.status(500).json({ 
      message: 'Failed to delete enrollment',
      error: error.message
    });
  }
};

/**
 * Generate and download enrollment PDF
 * GET /api/enrollments/:id/pdf
 * Requirements: 13.2, 13.4, 13.5, 17.2, 17.3, 17.4
 */
export const downloadEnrollmentPDF = async (req, res) => {
  try {
    const enrollment = await EnrollmentRecord.findByPk(req.params.id, {
      include: [{ 
        model: User, 
        as: 'user',
        attributes: ['id', 'name', 'email']
      }]
    });
    
    if (!enrollment) {
      return res.status(404).json({ 
        message: 'Enrollment not found' 
      });
    }
    
    // Check authorization: user can only download own enrollment, admin/registrar can download all
    if (req.user.role !== 'admin' && req.user.role !== 'registrar' && enrollment.userId !== req.user.id) {
      return res.status(403).json({ 
        message: 'You do not have permission to download this enrollment PDF' 
      });
    }
    
    // Format enrollment data for PDF generation
    const formattedData = formatEnrollmentData(enrollment.toJSON());
    
    // Generate PDF
    const pdfBuffer = await generateEnrollmentPDF(formattedData);
    
    // Set appropriate headers
    res.setHeader('Content-Type', 'application/pdf');
    const safeName = `${enrollment.firstName || ''}_${enrollment.familyName || ''}`.replace(/[^a-zA-Z0-9_-]/g, '');
    res.setHeader('Content-Disposition', `attachment; filename="enrollment-${enrollment.id}-${safeName}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    // Stream PDF to response
    res.send(pdfBuffer);
    
  } catch (error) {
    console.error('Error generating enrollment PDF:', error);
    res.status(500).json({ 
      message: 'Failed to generate PDF. Please try again later.' 
    });
  }
};
