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
import fs from "fs";
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
  getEnrollmentDocuments,
  deleteEnrollmentDocument,
} from "../controllers/documentController.js";
import { sendEnrollmentSubmittedEmail } from '../services/emailService.js';
import { sequelize } from "../models/db.js";
import { EnrollmentDocument } from "../models/enrollmentDocumentModel.js";
import { EnrollmentRecord } from "../models/enrollmentRecordModel.js";

const CREDENTIAL_LABELS = {
  f138: "F-138", f137a: "F-137-A", cgmc: "CGMC", tor: "TOR",
  birthCert: "Birth Certificate", marriageCert: "Marriage Certificate",
  cert: "Certificate", f137e: "F-137-E",
};

// Memory storage multer — files held in buffer, saved to disk in handler
const memUploadInstance = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];
    cb(null, allowed.includes(file.mimetype));
  },
  limits: { fileSize: 10 * 1024 * 1024 },
});

// Pre-bound middleware for credential document uploads (used in /:id/documents)
const memUpload = memUploadInstance.fields([
  { name: "f138", maxCount: 1 }, { name: "f137a", maxCount: 1 },
  { name: "cgmc", maxCount: 1 }, { name: "tor", maxCount: 1 },
  { name: "birthCert", maxCount: 1 }, { name: "marriageCert", maxCount: 1 },
  { name: "cert", maxCount: 1 }, { name: "f137e", maxCount: 1 },
]);

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

// GET /api/enrollments/check-lrn?lrn=xxx - Check if LRN is already taken
router.get("/check-lrn", requireAuth, async (req, res) => {
  const { lrn } = req.query;
  if (!lrn || lrn.length < 12) return res.json({ taken: false });
  const [rows] = await sequelize.query(
    "SELECT id FROM enrollment_records WHERE lrn = ? LIMIT 1",
    { replacements: [lrn] }
  );
  res.json({ taken: rows.length > 0 });
});

// GET /api/enrollments/ssc-application/status - Check if student already applied for SSC
router.get("/ssc-application/status", requireAuth, async (req, res) => {
  try {
    const [rows] = await sequelize.query(
      "SELECT id FROM enrollment_records WHERE userId = ? AND sscApplied = 1 LIMIT 1",
      { replacements: [req.user.id] }
    );
    res.json({ applied: rows.length > 0 });
  } catch (err) {
    res.json({ applied: false });
  }
});

// POST /api/enrollments/ssc-application - Student submits SSC application with report card
router.post("/ssc-application", requireAuth, memUploadInstance.single("sscCard"), async (req, res) => {
  try {
    const userId = req.user.id;
    // Check if already applied
    const [existing] = await sequelize.query(
      "SELECT id FROM enrollment_records WHERE userId = ? AND sscApplied = 1 LIMIT 1",
      { replacements: [userId] }
    );
    if (existing && existing.length > 0) {
      return res.status(400).json({ message: "You have already submitted an SSC application." });
    }
    if (!req.file) return res.status(400).json({ message: "Report card file is required." });

    // Create a placeholder enrollment record for SSC tracking
    const enrollment = await EnrollmentRecord.create({
      userId,
      educationLevel: "JHS",
      gradeLevel: "Grade 7",
      studentType: "New",
      sscApplied: true,
      status: "pending_exam",
    });

    // Save the uploaded file to disk
    const uploadDir = path.join(process.cwd(), "public", "uploads", "documents", `enrollment-${enrollment.id}`);
    fs.mkdirSync(uploadDir, { recursive: true });
    const ext = path.extname(req.file.originalname) || ".jpg";
    const filename = `sscCard-${Date.now()}${ext}`;
    fs.writeFileSync(path.join(uploadDir, filename), req.file.buffer);
    const relativePath = `/uploads/documents/enrollment-${enrollment.id}/${filename}`;

    await EnrollmentDocument.create({
      enrollmentId: enrollment.id,
      documentType: "sscCard",
      documentLabel: "Grade 6 Report Card",
      filePath: relativePath,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
    });

    res.status(201).json({ message: "SSC application submitted successfully.", enrollmentId: enrollment.id });
  } catch (err) {
    console.error("SSC application error:", err);
    res.status(500).json({ message: "Failed to submit SSC application." });
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
router.post("/:id/documents", requireAuth, (req, res) => {
  memUpload(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message || "Upload error" });
    try {
      const enrollmentId = parseInt(req.params.id);
      const enrollment = await EnrollmentRecord.findByPk(enrollmentId);
      if (!enrollment) return res.status(404).json({ error: "Enrollment not found" });

      const isOwner = enrollment.userId === req.user.id;
      const isStaff = ["admin", "registrar"].includes(req.user.role);
      if (!isOwner && !isStaff) return res.status(403).json({ error: "Access denied" });

      if (!req.files || Object.keys(req.files).length === 0)
        return res.status(400).json({ error: "No files uploaded" });

      const uploadDir = path.join(process.cwd(), "public", "uploads", "documents", `enrollment-${enrollmentId}`);
      fs.mkdirSync(uploadDir, { recursive: true });

      const saved = [];
      for (const [docType, files] of Object.entries(req.files)) {
        const file = files[0];
        // Remove old doc of same type
        const existing = await EnrollmentDocument.findOne({ where: { enrollmentId, documentType: docType } });
        if (existing) {
          const oldPath = path.join(process.cwd(), "public", existing.filePath);
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
          await existing.destroy();
        }
        // Save buffer to disk
        const ext = path.extname(file.originalname) || ".jpg";
        const filename = `${docType}-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
        fs.writeFileSync(path.join(uploadDir, filename), file.buffer);
        const relativePath = `/uploads/documents/enrollment-${enrollmentId}/${filename}`;
        const doc = await EnrollmentDocument.create({
          enrollmentId,
          documentType: docType,
          documentLabel: CREDENTIAL_LABELS[docType] || docType,
          filePath: relativePath,
          originalName: file.originalname,
          mimeType: file.mimetype,
          fileSize: file.size,
        });
        saved.push(doc);
      }
      res.json({ message: "Documents uploaded successfully", documents: saved });
    } catch (e) {
      console.error("Document upload error:", e);
      res.status(500).json({ error: "Failed to upload documents", details: e.message });
    }
  });
});

// GET /api/enrollments/:id/documents - Get all documents for an enrollment
router.get("/:id/documents", requireAuth, getEnrollmentDocuments);

// DELETE /api/enrollments/:id/documents/:docId - Delete a specific document
router.delete("/:id/documents/:docId", requireAuth, deleteEnrollmentDocument);


// POST /api/enrollments/:id/resubmit - Student resubmits a returned enrollment
router.post("/:id/resubmit", requireAuth, async (req, res) => {
  try {
    const enrollmentId = parseInt(req.params.id);
    const [[enrollment]] = await sequelize.query(
      "SELECT * FROM enrollment_records WHERE id = ?",
      { replacements: [enrollmentId] }
    );
    if (!enrollment) return res.status(404).json({ error: "Enrollment not found" });
    if (enrollment.userId !== req.user.id) return res.status(403).json({ error: "Access denied" });
    if (enrollment.status !== "returned") return res.status(400).json({ error: "Only returned enrollments can be resubmitted" });

    await sequelize.query(
      "UPDATE enrollment_records SET status = 'submitted', updatedAt = datetime('now') WHERE id = ?",
      { replacements: [enrollmentId] }
    );
    const [[updated]] = await sequelize.query("SELECT * FROM enrollment_records WHERE id = ?", { replacements: [enrollmentId] });
          // Send email notification
      try {
        const [[user]] = await sequelize.query("SELECT * FROM users WHERE id = ?", { replacements: [updated.userId] });
        if (user) await sendEnrollmentSubmittedEmail(user, updated);
      } catch (_) {}
      res.json({ message: "Enrollment resubmitted successfully", enrollment: updated });
  } catch (e) {
    console.error("Resubmit error:", e);
    res.status(500).json({ error: "Failed to resubmit enrollment" });
  }
});
export default router;
