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

import express from "express";
import multer from "multer";
import path from "path";
import {
  requireAuth,
  requireAdmin,
  validateRequiredFields,
  validateDateFormat,
  validateEnumValues,
  createEnrollment,
  createEnrollmentWithTOR,
  getAllEnrollments,
  getEnrollmentById,
  getUserEnrollments,
  updateEnrollment,
  updateEnrollmentStatus,
  deleteEnrollment,
  downloadEnrollmentPDF,
  scheduleSSCExam,
  recordSSCResult
} from "../controllers/enrollmentController.js";
import { requireAdminOrRegistrar } from "../middleware/auth.js";
import {
  uploadDocuments,
  uploadEnrollmentDocuments,
  getEnrollmentDocuments,
  deleteEnrollmentDocument,
} from "../controllers/documentController.js";

const router = express.Router();

// Multer setup for TOR uploads
const torStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/uploads/tor/'),
  filename: (req, file, cb) => {
    const unique = `tor-${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, unique + path.extname(file.originalname));
  }
});
const uploadTOR = multer({ storage: torStorage, limits: { fileSize: 10 * 1024 * 1024 } });

// POST /api/enrollments/with-tor - Create enrollment with TOR file (transferees)
router.post('/with-tor', requireAuth, uploadTOR.single('tor'), async (req, res) => {
  try {
    const enrollmentData = JSON.parse(req.body.enrollmentData || '{}');
    if (req.file) enrollmentData.torFilePath = req.file.path.replace(/\\/g, '/');
    req.body = enrollmentData;
    createEnrollmentWithTOR(req, res);
  } catch (err) {
    res.status(400).json({ message: 'Invalid enrollment data' });
  }
});

// POST /api/enrollments - Create new enrollment (authenticated users)
router.post(
  "/",
  requireAuth,
  validateRequiredFields,
  validateDateFormat,
  validateEnumValues,
  createEnrollment
);

// GET /api/enrollments - Get all enrollments (admin only)
// Requirements: 16.1, 16.2, 16.3, 16.4
router.get("/", requireAdmin, getAllEnrollments);

// GET /api/enrollments/user/:userId - Get enrollments for specific user
// Requirements: 19.1, 19.4
router.get("/user/:userId", requireAuth, getUserEnrollments);

// GET /api/enrollments/:id/pdf - Download enrollment PDF
// Requirements: 13.2, 13.4, 13.5, 17.2, 17.3, 17.4
router.get("/:id/pdf", requireAuth, downloadEnrollmentPDF);

// GET /api/enrollments/:id - Get single enrollment by ID
// Requirements: 20.2
router.get("/:id", requireAuth, getEnrollmentById);

// PUT /api/enrollments/:id - Update enrollment (owner only)
// Requirements: 20.4
router.put(
  "/:id",
  requireAuth,
  validateDateFormat,
  validateEnumValues,
  updateEnrollment
);

// PUT /api/enrollments/:id/status - Update enrollment status (admin only)
// Requirements: 18.2, 18.3, 18.5
router.put("/:id/status", requireAdmin, updateEnrollmentStatus);

// PUT /api/enrollments/:id/ssc-schedule - Registrar/Admin schedules SSC entrance exam
router.put("/:id/ssc-schedule", requireAuth, requireAdminOrRegistrar, scheduleSSCExam);

// PUT /api/enrollments/:id/ssc-result - Registrar/Admin records SSC exam score
router.put("/:id/ssc-result", requireAuth, requireAdminOrRegistrar, recordSSCResult);

// DELETE /api/enrollments/:id - Delete enrollment
router.delete("/:id", requireAuth, deleteEnrollment);

// ── Document upload routes ────────────────────────────────────────────────────
// POST /api/enrollments/:id/documents - Upload credential documents
router.post(
  "/:id/documents",
  requireAuth,
  uploadDocuments.fields([
    { name: "f138", maxCount: 1 },
    { name: "f137a", maxCount: 1 },
    { name: "cgmc", maxCount: 1 },
    { name: "tor", maxCount: 1 },
    { name: "birthCert", maxCount: 1 },
    { name: "marriageCert", maxCount: 1 },
  ]),
  uploadEnrollmentDocuments
);

// GET /api/enrollments/:id/documents - Get all documents for an enrollment
router.get("/:id/documents", requireAuth, getEnrollmentDocuments);

// DELETE /api/enrollments/:id/documents/:docId - Delete a specific document
router.delete("/:id/documents/:docId", requireAuth, deleteEnrollmentDocument);

export default router;
