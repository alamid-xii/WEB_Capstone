import multer from "multer";
import path from "path";
import fs from "fs";
import { EnrollmentDocument } from "../models/enrollmentDocumentModel.js";
import { EnrollmentRecord } from "../models/enrollmentRecordModel.js";

const CREDENTIAL_LABELS = {
  f138: "F-138",
  f137a: "F-137-A",
  cgmc: "CGMC",
  tor: "TOR",
  birthCert: "Birth Certificate",
  marriageCert: "Marriage Certificate",
};

// Multer storage — saves to public/uploads/documents/enrollment-{id}/
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const enrollmentId = req.params.id;
    const dir = path.join(process.cwd(), "public", "uploads", "documents", `enrollment-${enrollmentId}`);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const docType = file.fieldname; // fieldname = documentType key
    const ext = path.extname(file.originalname);
    const unique = `${docType}-${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, unique + ext);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF, JPG, and PNG files are allowed"), false);
  }
};

export const uploadDocuments = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per file
});

// POST /api/enrollments/:id/documents
// Accepts multiple files, each field name = documentType key
export const uploadEnrollmentDocuments = async (req, res) => {
  try {
    const enrollmentId = parseInt(req.params.id);

    // Verify enrollment exists and belongs to user (or is admin/registrar)
    const enrollment = await EnrollmentRecord.findByPk(enrollmentId);
    if (!enrollment) {
      return res.status(404).json({ error: "Enrollment not found" });
    }

    const isOwner = enrollment.userId === req.user.id;
    const isStaff = ["admin", "registrar"].includes(req.user.role);
    if (!isOwner && !isStaff) {
      return res.status(403).json({ error: "Access denied" });
    }

    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    const saved = [];

    for (const [docType, files] of Object.entries(req.files)) {
      const file = files[0]; // one file per credential type

      // Remove old document of same type if exists
      const existing = await EnrollmentDocument.findOne({
        where: { enrollmentId, documentType: docType },
      });
      if (existing) {
        // Delete old file from disk
        const oldPath = path.join(process.cwd(), "public", existing.filePath);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        await existing.destroy();
      }

      // Store relative path (from public/)
      const relativePath = file.path
        .replace(path.join(process.cwd(), "public"), "")
        .replace(/\\/g, "/");

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
  } catch (error) {
    console.error("Upload documents error:", error);
    res.status(500).json({ error: "Failed to upload documents" });
  }
};

// GET /api/enrollments/:id/documents
export const getEnrollmentDocuments = async (req, res) => {
  try {
    const enrollmentId = parseInt(req.params.id);

    const enrollment = await EnrollmentRecord.findByPk(enrollmentId);
    if (!enrollment) {
      return res.status(404).json({ error: "Enrollment not found" });
    }

    const isOwner = enrollment.userId === req.user.id;
    const isStaff = ["admin", "registrar"].includes(req.user.role);
    if (!isOwner && !isStaff) {
      return res.status(403).json({ error: "Access denied" });
    }

    const documents = await EnrollmentDocument.findAll({
      where: { enrollmentId },
      order: [["createdAt", "ASC"]],
    });

    res.json(documents);
  } catch (error) {
    console.error("Get documents error:", error);
    res.status(500).json({ error: "Failed to fetch documents" });
  }
};

// DELETE /api/enrollments/:id/documents/:docId
export const deleteEnrollmentDocument = async (req, res) => {
  try {
    const enrollmentId = parseInt(req.params.id);
    const docId = parseInt(req.params.docId);

    const enrollment = await EnrollmentRecord.findByPk(enrollmentId);
    if (!enrollment) return res.status(404).json({ error: "Enrollment not found" });

    const isOwner = enrollment.userId === req.user.id;
    const isStaff = ["admin", "registrar"].includes(req.user.role);
    if (!isOwner && !isStaff) return res.status(403).json({ error: "Access denied" });

    const doc = await EnrollmentDocument.findOne({ where: { id: docId, enrollmentId } });
    if (!doc) return res.status(404).json({ error: "Document not found" });

    // Delete file from disk
    const fullPath = path.join(process.cwd(), "public", doc.filePath);
    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);

    await doc.destroy();
    res.json({ message: "Document deleted" });
  } catch (error) {
    console.error("Delete document error:", error);
    res.status(500).json({ error: "Failed to delete document" });
  }
};
