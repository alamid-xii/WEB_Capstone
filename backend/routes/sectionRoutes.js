import express from 'express';
import { requireAdminOrRegistrar } from '../middleware/auth.js';
import {
  getAllSections,
  createSection,
  updateSection,
  deleteSection,
  getAvailableStudents,
  getAvailableSubjects,
  assignStudentToSection,
  getSectionStudents,
  getUnassignedStudents,
  removeStudentFromSection,
  moveStudentToSection,
  manualAssignStudent,
  autoAssignAll,
} from '../controllers/sectionController.js';

const router = express.Router();

// All section routes require admin or registrar
router.use(requireAdminOrRegistrar);

// Section CRUD
router.get('/', getAllSections);
router.post('/', createSection);
router.put('/:id', updateSection);
router.delete('/:id', deleteSection);

// Students in a section
router.get('/:id/students', getSectionStudents);

// Unassigned students (approved but no section)
router.get('/students/unassigned', getUnassignedStudents);

// Auto-assign all unassigned students
router.post('/students/auto-assign', autoAssignAll);

// Remove student from their section
router.delete('/students/:enrollmentId/section', removeStudentFromSection);

// Move student to a different section
router.put('/students/:enrollmentId/section', moveStudentToSection);

// Manually assign an unassigned student to a section
router.post('/students/:enrollmentId/assign', manualAssignStudent);

// Legacy routes (kept for compatibility)
router.get('/:sectionId/available-students', getAvailableStudents);
router.get('/:sectionId/available-subjects', getAvailableSubjects);
router.post('/assign/:enrollmentId', assignStudentToSection);

export default router;
