/**
 * Auto-section assignment service
 * Runs when an enrollment is approved.
 * Finds the best matching section and assigns the student.
 */
import { sequelize } from '../models/db.js';

/**
 * Map enrollment fields to a section course code
 * College → course code (BSIS, BSBA, etc.)
 * JHS/SHS → educationLevel (JHS / SHS)
 */
function resolveSectionCourse(enrollment) {
  if (enrollment.educationLevel === 'College') return enrollment.course || null;
  return enrollment.educationLevel || null; // 'JHS' or 'SHS'
}

/**
 * Resolve year level from enrollment
 * College → 1 (first-time / returnee / transferee) or keep existing
 * JHS/SHS → numeric grade (7-12)
 */
function resolveYearLevel(enrollment) {
  if (enrollment.educationLevel === 'JHS' || enrollment.educationLevel === 'SHS') {
    const grade = parseInt((enrollment.gradeLevel || '').replace(/\D/g, ''));
    return isNaN(grade) ? null : grade;
  }
  // College: default to year 1 for new students
  return 1;
}

/**
 * Auto-assign a student to a section on approval.
 * Returns { assigned: true, section } or { assigned: false, reason }
 */
export async function autoAssignSection(enrollmentId) {
  try {
    // Fetch enrollment
    const [[enrollment]] = await sequelize.query(
      'SELECT * FROM enrollment_records WHERE id = ?',
      { replacements: [enrollmentId] }
    );

    if (!enrollment) return { assigned: false, reason: 'Enrollment not found' };

    const sectionCourse = resolveSectionCourse(enrollment);
    const yearLevel = resolveYearLevel(enrollment);

    if (!sectionCourse) return { assigned: false, reason: 'Cannot determine course/level' };

    // Find sections with available capacity, ordered by least-filled first
    const [sections] = await sequelize.query(
      `SELECT * FROM sections
       WHERE course = ?
         AND isActive = 1
         AND currentEnrollment < capacity
       ORDER BY currentEnrollment ASC
       LIMIT 1`,
      { replacements: [sectionCourse] }
    );

    if (!sections || sections.length === 0) {
      return { assigned: false, reason: `No available sections for ${sectionCourse}` };
    }

    const section = sections[0];

    // Assign: update enrollment record with section info
    await sequelize.query(
      `UPDATE enrollment_records
       SET sectionId = ?,
           sectionName = ?,
           status = 'enrolled',
           updatedAt = datetime('now')
       WHERE id = ?`,
      { replacements: [section.id, section.code, enrollmentId] }
    );

    // Increment section's currentEnrollment
    await sequelize.query(
      `UPDATE sections
       SET currentEnrollment = currentEnrollment + 1,
           updatedAt = datetime('now')
       WHERE id = ?`,
      { replacements: [section.id] }
    );

    return { assigned: true, section };
  } catch (error) {
    console.error('Auto-assign section error:', error);
    return { assigned: false, reason: error.message };
  }
}

/**
 * Remove a student from their current section
 */
export async function removeFromSection(enrollmentId) {
  try {
    const [[enrollment]] = await sequelize.query(
      'SELECT * FROM enrollment_records WHERE id = ?',
      { replacements: [enrollmentId] }
    );

    if (!enrollment || !enrollment.sectionId) {
      return { success: false, reason: 'Student not assigned to any section' };
    }

    const oldSectionId = enrollment.sectionId;

    // Clear section from enrollment
    await sequelize.query(
      `UPDATE enrollment_records
       SET sectionId = NULL,
           sectionName = NULL,
           status = 'approved',
           updatedAt = datetime('now')
       WHERE id = ?`,
      { replacements: [enrollmentId] }
    );

    // Decrement old section count (floor at 0)
    await sequelize.query(
      `UPDATE sections
       SET currentEnrollment = MAX(0, currentEnrollment - 1),
           updatedAt = datetime('now')
       WHERE id = ?`,
      { replacements: [oldSectionId] }
    );

    return { success: true };
  } catch (error) {
    console.error('Remove from section error:', error);
    return { success: false, reason: error.message };
  }
}

/**
 * Move a student from one section to another
 */
export async function moveToSection(enrollmentId, newSectionId) {
  try {
    const [[enrollment]] = await sequelize.query(
      'SELECT * FROM enrollment_records WHERE id = ?',
      { replacements: [enrollmentId] }
    );
    if (!enrollment) return { success: false, reason: 'Enrollment not found' };

    const [[newSection]] = await sequelize.query(
      'SELECT * FROM sections WHERE id = ? AND isActive = 1',
      { replacements: [newSectionId] }
    );
    if (!newSection) return { success: false, reason: 'Target section not found' };

    if (newSection.currentEnrollment >= newSection.capacity) {
      return { success: false, reason: `Section ${newSection.code} is full (${newSection.capacity}/${newSection.capacity})` };
    }

    const oldSectionId = enrollment.sectionId;

    // Update enrollment
    await sequelize.query(
      `UPDATE enrollment_records
       SET sectionId = ?,
           sectionName = ?,
           status = 'enrolled',
           updatedAt = datetime('now')
       WHERE id = ?`,
      { replacements: [newSection.id, newSection.code, enrollmentId] }
    );

    // Decrement old section if had one
    if (oldSectionId) {
      await sequelize.query(
        `UPDATE sections
         SET currentEnrollment = MAX(0, currentEnrollment - 1),
             updatedAt = datetime('now')
         WHERE id = ?`,
        { replacements: [oldSectionId] }
      );
    }

    // Increment new section
    await sequelize.query(
      `UPDATE sections
       SET currentEnrollment = currentEnrollment + 1,
           updatedAt = datetime('now')
       WHERE id = ?`,
      { replacements: [newSection.id] }
    );

    return { success: true, section: newSection };
  } catch (error) {
    console.error('Move to section error:', error);
    return { success: false, reason: error.message };
  }
}
