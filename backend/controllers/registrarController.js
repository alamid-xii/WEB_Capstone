import { sequelize } from '../models/db.js';

// ── Dashboard stats (registrar-specific) ─────────────────────────────────────
export const getRegistrarStats = async (req, res) => {
  try {
    const [[summary]] = await sequelize.query(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'submitted'    THEN 1 ELSE 0 END) as submitted,
        SUM(CASE WHEN status = 'pending_exam' THEN 1 ELSE 0 END) as pending_exam,
        SUM(CASE WHEN status = 'verified'     THEN 1 ELSE 0 END) as verified,
        SUM(CASE WHEN status = 'returned'     THEN 1 ELSE 0 END) as returned,
        SUM(CASE WHEN educationLevel = 'JHS'     THEN 1 ELSE 0 END) as jhs,
        SUM(CASE WHEN educationLevel = 'SHS'     THEN 1 ELSE 0 END) as shs,
        SUM(CASE WHEN educationLevel = 'College' THEN 1 ELSE 0 END) as college
      FROM enrollment_records
      WHERE status IN ('submitted', 'pending_exam', 'verified', 'returned')
    `);

    const [recentActivity] = await sequelize.query(`
      SELECT er.id, er.firstName, er.familyName, er.educationLevel,
             er.course, er.gradeLevel, er.status, er.verified_at, er.updatedAt,
             u.email as userEmail
      FROM enrollment_records er
      LEFT JOIN users u ON er.userId = u.id
      WHERE er.status IN ('submitted', 'pending_exam', 'verified', 'returned')
      ORDER BY er.updatedAt DESC
      LIMIT 10
    `);

    res.json({
      summary: {
        submitted:    Number(summary?.submitted)    || 0,
        pending_exam: Number(summary?.pending_exam) || 0,
        verified:     Number(summary?.verified)     || 0,
        returned:     Number(summary?.returned)     || 0,
        jhs:          Number(summary?.jhs)          || 0,
        shs:          Number(summary?.shs)          || 0,
        college:      Number(summary?.college)      || 0,
      },
      recentActivity: recentActivity || []
    });
  } catch (error) {
    console.error('Registrar stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};

// ── Get enrollments for registrar (submitted + pending_exam + verified + returned) ──
export const getRegistrarEnrollments = async (req, res) => {
  try {
    const { status, educationLevel, search } = req.query;

    let query = `
      SELECT er.*, u.name as user_name, u.email as user_email
      FROM enrollment_records er
      LEFT JOIN users u ON er.userId = u.id
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== 'all') {
      query += ` AND er.status = ?`;
      params.push(status);
    } else {
      // Default: show only what registrar needs to act on
      query += ` AND er.status IN ('submitted', 'pending_exam', 'verified', 'returned')`;
    }

    if (educationLevel && educationLevel !== 'all') {
      query += ` AND er.educationLevel = ?`;
      params.push(educationLevel);
    }

    if (search) {
      query += ` AND (er.firstName LIKE ? OR er.familyName LIKE ? OR er.studentNumber LIKE ? OR er.course LIKE ? OR er.gradeLevel LIKE ?)`;
      const s = `%${search}%`;
      params.push(s, s, s, s, s);
    }

    query += ` ORDER BY er.createdAt ASC`;

    const [results] = await sequelize.query(query, { replacements: params });
    res.json(results || []);
  } catch (error) {
    console.error('Get registrar enrollments error:', error);
    res.status(500).json({ error: 'Failed to fetch enrollments' });
  }
};

// ── Verify enrollment (submitted → verified) ──────────────────────────────────
export const verifyEnrollment = async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;
    const registrarId = req.user.id;

    const [[enrollment]] = await sequelize.query(
      'SELECT * FROM enrollment_records WHERE id = ?',
      { replacements: [id] }
    );

    if (!enrollment) return res.status(404).json({ error: 'Enrollment not found' });

    if (!['submitted', 'returned'].includes(enrollment.status)) {
      return res.status(400).json({ error: `Cannot verify enrollment with status: ${enrollment.status}` });
    }

    await sequelize.query(
      `UPDATE enrollment_records
       SET status = 'verified',
           registrar_remarks = ?,
           verified_by = ?,
           verified_at = datetime('now'),
           updatedAt = datetime('now')
       WHERE id = ?`,
      { replacements: [remarks || null, registrarId, id] }
    );

    const [[updated]] = await sequelize.query(
      'SELECT * FROM enrollment_records WHERE id = ?',
      { replacements: [id] }
    );

    res.json({ message: 'Enrollment verified successfully', enrollment: updated });
  } catch (error) {
    console.error('Verify enrollment error:', error);
    res.status(500).json({ error: 'Failed to verify enrollment' });
  }
};

// ── Return enrollment to student (submitted/verified → returned) ──────────────
export const returnEnrollment = async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;
    const registrarId = req.user.id;

    if (!remarks || !remarks.trim()) {
      return res.status(400).json({ error: 'Remarks are required when returning an enrollment' });
    }

    const [[enrollment]] = await sequelize.query(
      'SELECT * FROM enrollment_records WHERE id = ?',
      { replacements: [id] }
    );

    if (!enrollment) return res.status(404).json({ error: 'Enrollment not found' });

    if (!['submitted', 'verified'].includes(enrollment.status)) {
      return res.status(400).json({ error: `Cannot return enrollment with status: ${enrollment.status}` });
    }

    await sequelize.query(
      `UPDATE enrollment_records
       SET status = 'returned',
           registrar_remarks = ?,
           verified_by = ?,
           verified_at = datetime('now'),
           updatedAt = datetime('now')
       WHERE id = ?`,
      { replacements: [remarks, registrarId, id] }
    );

    const [[updated]] = await sequelize.query(
      'SELECT * FROM enrollment_records WHERE id = ?',
      { replacements: [id] }
    );

    res.json({ message: 'Enrollment returned to student', enrollment: updated });
  } catch (error) {
    console.error('Return enrollment error:', error);
    res.status(500).json({ error: 'Failed to return enrollment' });
  }
};

// ── Schedule SSC exam (JHS Grade 7 only) ─────────────────────────────────────
export const scheduleSSCExam = async (req, res) => {
  try {
    const { id } = req.params;
    const { examDate, passingScore } = req.body;

    if (!examDate) return res.status(400).json({ error: 'Exam date is required' });

    const [[enrollment]] = await sequelize.query(
      'SELECT * FROM enrollment_records WHERE id = ?',
      { replacements: [id] }
    );

    if (!enrollment) return res.status(404).json({ error: 'Enrollment not found' });

    if (enrollment.educationLevel !== 'JHS') {
      return res.status(400).json({ error: 'SSC exam only applies to JHS enrollments' });
    }

    if (!enrollment.sscApplied) {
      return res.status(400).json({ error: 'Student did not apply for SSC' });
    }

    if (!enrollment.sscQualified) {
      return res.status(400).json({ error: `Student is not qualified for SSC. Grade 6 average is ${enrollment.grade6Average} (minimum 85 required)` });
    }

    if (!['submitted', 'verified'].includes(enrollment.status)) {
      return res.status(400).json({ error: `Cannot schedule exam for enrollment with status: ${enrollment.status}` });
    }

    await sequelize.query(
      `UPDATE enrollment_records
       SET status = 'pending_exam',
           sscExamDate = ?,
           sscPassingScore = ?,
           updatedAt = datetime('now')
       WHERE id = ?`,
      { replacements: [examDate, passingScore || 75, id] }
    );

    const [[updated]] = await sequelize.query(
      'SELECT * FROM enrollment_records WHERE id = ?',
      { replacements: [id] }
    );

    res.json({ message: 'SSC exam scheduled', enrollment: updated });
  } catch (error) {
    console.error('Schedule SSC exam error:', error);
    res.status(500).json({ error: 'Failed to schedule SSC exam' });
  }
};

// ── Record SSC exam result ────────────────────────────────────────────────────
export const recordSSCResult = async (req, res) => {
  try {
    const { id } = req.params;
    const { examScore } = req.body;

    if (examScore === undefined || examScore === null) {
      return res.status(400).json({ error: 'Exam score is required' });
    }

    const [[enrollment]] = await sequelize.query(
      'SELECT * FROM enrollment_records WHERE id = ?',
      { replacements: [id] }
    );

    if (!enrollment) return res.status(404).json({ error: 'Enrollment not found' });

    if (enrollment.status !== 'pending_exam') {
      return res.status(400).json({ error: 'Enrollment is not pending an SSC exam' });
    }

    const score = parseFloat(examScore);
    const passing = parseFloat(enrollment.sscPassingScore) || 75;
    const passed = score >= passing;

    await sequelize.query(
      `UPDATE enrollment_records
       SET sscExamScore = ?,
           sscResult = ?,
           sscClass = ?,
           status = 'submitted',
           updatedAt = datetime('now')
       WHERE id = ?`,
      { replacements: [score, passed ? 'passed' : 'failed', passed ? 'SSC' : 'Regular', id] }
    );

    const [[updated]] = await sequelize.query(
      'SELECT * FROM enrollment_records WHERE id = ?',
      { replacements: [id] }
    );

    res.json({
      message: passed
        ? 'Passed! Student is eligible for the Special Science Class.'
        : 'Did not pass. Student will be enrolled in the Regular class.',
      sscResult: passed ? 'passed' : 'failed',
      sscClass: passed ? 'SSC' : 'Regular',
      enrollment: updated
    });
  } catch (error) {
    console.error('Record SSC result error:', error);
    res.status(500).json({ error: 'Failed to record SSC result' });
  }
};

// ── Evaluate TOR for college transferees ─────────────────────────────────────
export const evaluateTOR = async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;
    const registrarId = req.user.id;

    const [[enrollment]] = await sequelize.query(
      'SELECT * FROM enrollment_records WHERE id = ?',
      { replacements: [id] }
    );

    if (!enrollment) return res.status(404).json({ error: 'Enrollment not found' });

    if (enrollment.educationLevel !== 'College' || enrollment.enrollmentType !== 'transferee') {
      return res.status(400).json({ error: 'TOR evaluation only applies to college transferees' });
    }

    await sequelize.query(
      `UPDATE enrollment_records
       SET tor_evaluated = 1,
           tor_remarks = ?,
           verified_by = ?,
           updatedAt = datetime('now')
       WHERE id = ?`,
      { replacements: [remarks || null, registrarId, id] }
    );

    const [[updated]] = await sequelize.query(
      'SELECT * FROM enrollment_records WHERE id = ?',
      { replacements: [id] }
    );

    res.json({ message: 'TOR evaluated successfully', enrollment: updated });
  } catch (error) {
    console.error('TOR evaluation error:', error);
    res.status(500).json({ error: 'Failed to evaluate TOR' });
  }
};
