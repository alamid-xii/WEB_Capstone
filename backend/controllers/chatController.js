/*
    MIT License
    
    Copyright (c) 2025 Christian I. Cabrera || XianFire Framework
    Mindoro State University - Philippines
*/

import Groq from "groq-sdk";
import { FAQ } from "../models/faqModel.js";
import { ChatLog } from "../models/chatLogModel.js";
import { sequelize } from "../models/db.js";
import dotenv from "dotenv";

dotenv.config();

await sequelize.sync();

// Initialize Groq (much faster than OpenAI)
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// Simple NLP-based similarity matching (for retrieval part of RAG)
function calculateSimilarity(userInput, faqKeywords) {
  const userWords = userInput.toLowerCase().split(/\s+/);
  const keywords = JSON.parse(faqKeywords || '[]');
  
  let matches = 0;
  userWords.forEach(word => {
    if (keywords.some(kw => kw.toLowerCase().includes(word) || word.includes(kw.toLowerCase()))) {
      matches++;
    }
  });
  
  return matches / Math.max(userWords.length, 1);
}

export const sendMessage = async (req, res) => {
  try {
    const { message, sessionId, conversationHistory = [] } = req.body;
    const startTime = Date.now();
    
    if (!message || !sessionId) {
      return res.status(400).json({ error: "Message and sessionId required" });
    }

    // ── Off-topic guardrail (fast pre-check) ─────────────────────────────────
    const offTopicPatterns = [
      /\b(recipe|cook|food|weather|sport|football|basketball|movie|music|song|game|play|joke|story|poem|capital of|president of|history of|math|algebra|calculus|physics|chemistry|biology|code|program|javascript|python|java|html|css|sql|who is|what is the meaning|translate|synonym|antonym|define|dictionary)\b/i,
    ];
    const isOffTopic = offTopicPatterns.some(p => p.test(message)) &&
      !/\b(emc|eastern mindoro|enroll|admission|registrar|course|program|tuition|scholarship|requirement|document|campus|college|school|grade|strand|jhs|shs|bsed|bsis|bsba|beed|bscrim|fee|schedule|deadline|transfer|returnee|first.time|continuing)\b/i.test(message);

    if (isOffTopic) {
      const offTopicReply = "I'm sorry, I can only assist with questions about Eastern Mindoro College admissions, enrollment, and campus information. For other topics, please consult the appropriate resource.";
      await ChatLog.create({
        userId: req.session.userId || null,
        sessionId,
        userMessage: message,
        botResponse: offTopicReply,
        confidence: 0,
        matchedFaqId: null,
        responseTime: Date.now() - startTime
      });
      return res.json({ response: offTopicReply, confidence: 0, suggestedQuestions: [] });
    }

    // ── RETRIEVAL: Multi-source knowledge base ────────────────────────────────

    // 1. FAQs — keyword similarity matching
    const faqs = await FAQ.findAll({ where: { isActive: true } });
    const scoredFAQs = faqs.map(faq => ({
      faq,
      score: calculateSimilarity(message, faq.keywords)
    })).sort((a, b) => b.score - a.score);
    const topFAQs = scoredFAQs.slice(0, 5).filter(item => item.score > 0.05);
    const bestMatch = topFAQs[0];

    // 2. Detect what live data to fetch based on message keywords
    const msgLower = message.toLowerCase();
    const needsSubjects = /subject|course|curriculum|units|bsed|bsis|bsba|beed|bscrim|jhs|shs|stem|abm|humss|tvl|grade \d/i.test(message);
    const needsSections = /section|class|room|schedule|instructor|teacher|professor/i.test(message);
    const needsBuildings = /building|office|location|where|campus|registrar|library|gym|canteen|clinic/i.test(message);
    const needsPrograms = /program|course|strand|college|senior high|junior high|what course/i.test(message);

    let liveContext = "";

    // 3. Fetch subjects if relevant
    if (needsSubjects) {
      try {
        const [subjects] = await sequelize.query(
          `SELECT code, description, units, programCode, strand, gradeLevel, semester 
           FROM subjects WHERE isActive = 1 ORDER BY programCode, gradeLevel, semester, code LIMIT 80`
        );
        if (subjects.length > 0) {
          liveContext += "\n\nSUBJECTS OFFERED AT EMC:\n";
          // Group by program
          const grouped = {};
          subjects.forEach(s => {
            const key = s.strand ? `${s.programCode} - ${s.strand}` : s.programCode;
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(`  • ${s.code}: ${s.description} (${s.units} units, Grade/Year ${s.gradeLevel}, ${s.semester} Sem)`);
          });
          Object.entries(grouped).forEach(([prog, list]) => {
            liveContext += `\n${prog}:\n${list.slice(0, 15).join('\n')}`;
          });
        }
      } catch (_) {}
    }

    // 4. Fetch sections if relevant
    if (needsSections) {
      try {
        const [sections] = await sequelize.query(
          `SELECT code, course, yearLevel, strand, semester, schoolYear, instructor, schedule, room, capacity, currentEnrollment
           FROM sections WHERE isActive = 1 ORDER BY course, yearLevel LIMIT 50`
        );
        if (sections.length > 0) {
          liveContext += "\n\nCURRENT SECTIONS AT EMC:\n";
          sections.forEach(s => {
            const info = [
              s.instructor ? `Instructor: ${s.instructor}` : null,
              s.schedule ? `Schedule: ${s.schedule}` : null,
              s.room ? `Room: ${s.room}` : null,
              `Enrolled: ${s.currentEnrollment}/${s.capacity}`
            ].filter(Boolean).join(', ');
            liveContext += `• Section ${s.code} (${s.course}${s.strand ? ' - ' + s.strand : ''}, Grade/Year ${s.yearLevel}, ${s.semester} Sem, SY ${s.schoolYear}) — ${info}\n`;
          });
        }
      } catch (_) {}
    }

    // 5. Fetch buildings if relevant
    if (needsBuildings) {
      try {
        const [buildings] = await sequelize.query(
          `SELECT name, shortName, category, description, offices, hours FROM Buildings WHERE isActive = 1`
        );
        if (buildings.length > 0) {
          liveContext += "\n\nCAMPUS BUILDINGS & FACILITIES:\n";
          buildings.forEach(b => {
            let offices = '';
            try { offices = JSON.parse(b.offices || '[]').join(', '); } catch (_) {}
            liveContext += `• ${b.name} (${b.category})\n  ${b.description || ''}\n  Offices: ${offices || 'N/A'}\n  Hours: ${b.hours || 'N/A'}\n`;
          });
        }
      } catch (_) {}
    }

    // 6. Fetch programs if relevant
    if (needsPrograms) {
      try {
        const [programs] = await sequelize.query(
          `SELECT code, name, majors FROM programs WHERE isActive = 1`
        );
        if (programs.length > 0) {
          liveContext += "\n\nPROGRAMS OFFERED AT EMC:\n";
          programs.forEach(p => {
            let majors = '';
            try { majors = JSON.parse(p.majors || '[]').join(', '); } catch (_) {}
            liveContext += `• ${p.code}: ${p.name}${majors ? ' (Majors: ' + majors + ')' : ''}\n`;
          });
        }
      } catch (_) {}
    }

    // ── BUILD SYSTEM CONTEXT ──────────────────────────────────────────────────
    let systemContext = `You are GabAI, the helpful AI assistant for Eastern Mindoro College (EMC) in the Philippines.

STRICT SCOPE — CRITICAL RULES:
1. You ONLY answer questions related to EMC: admissions, enrollment, requirements, courses, subjects, sections, campus buildings, fees, schedules, and academic programs.
2. If a question is NOT related to EMC, respond: "I'm sorry, I can only assist with questions about Eastern Mindoro College admissions, enrollment, and campus information."
3. NEVER hallucinate — only use the knowledge base and live data provided below.
4. If you don't have specific information, direct to the Registrar's Office.
5. Respond in the SAME LANGUAGE the user is using (English or Filipino/Tagalog).
6. Be warm, concise, and professional. Max 3–4 paragraphs.

`;

    if (topFAQs.length > 0) {
      systemContext += "FREQUENTLY ASKED QUESTIONS (verified answers):\n\n";
      topFAQs.forEach((item, index) => {
        systemContext += `${index + 1}. Q: ${item.faq.question}\n   A: ${item.faq.answer}\n\n`;
      });
    }

    if (liveContext) {
      systemContext += "\nLIVE DATABASE INFORMATION (current, accurate data):" + liveContext;
    }


    // ── HARDCODED EMC KNOWLEDGE BASE ─────────────────────────────────────────
    const EMC_KNOWLEDGE = `
EASTERN MINDORO COLLEGE (EMC) — INSTITUTIONAL KNOWLEDGE BASE

ABOUT THE SCHOOL:
- Full Name: Eastern Mindoro College, Inc.
- Location: Vicente Ylagan St. Bagong Bayan II, Bongabong, Oriental Mindoro, Philippines 5211
- Type: Private Higher Education Institution
- Vision: A premier institution of higher learning committed to excellence.
- Mission: To provide quality education that develops competent, values-driven graduates.

CONTACT INFORMATION:
- Registrar's Office: (043) 123-4567
- Email: emc_1945@yahoo.com
- Website: www.emc.edu.ph (official)
- Office Hours: Monday–Friday, 8:00 AM – 5:00 PM

PROGRAMS OFFERED:
College Programs:
- BEED: Bachelor of Elementary Education
- BSIS: Bachelor of Science in Information Systems
- BSBA: Bachelor of Science in Business Administration (Majors: Financial Management, Marketing Management)
- BSED: Bachelor of Secondary Education (Majors: Filipino, English, Mathematics, Science, Social Studies)
- BSCrim: Bachelor of Science in Criminology

Senior High School (SHS) Strands:
- STEM: Science, Technology, Engineering, and Mathematics
- ABM: Accountancy, Business, and Management
- HUMSS: Humanities and Social Sciences
- TVL: Technical-Vocational-Livelihood
- Sports Track
- Arts and Design Track

Junior High School (JHS):
- Grade 7 to Grade 10
- Special Science Class (SSC) available for qualified Grade 7 students (Grade 6 average of 85 or higher)

ENROLLMENT TYPES (College):
- First-time: New students enrolling for the first time
- Continuing: Currently enrolled students proceeding to next semester
- Returnee: Previously enrolled students returning after a break
- Transferee: Students coming from another school (must submit TOR)

ENROLLMENT PROCESS:
1. Create an account on the GabAI system
2. Verify your email address
3. Select your academic level (JHS, SHS, or College)
4. Fill out the enrollment form
5. Upload required admission credentials
6. Wait for Registrar to verify documents
7. Admin approves enrollment
8. Get assigned to a section automatically
9. Subjects are auto-enrolled based on curriculum

ADMISSION REQUIREMENTS (General):
- Form 138 (Report Card)
- Form 137-A (Permanent Record)
- Certificate of Good Moral Character (CGMC)
- Birth Certificate (PSA)
- 2x2 ID Photos

Additional for Transferees:
- Transcript of Records (TOR) from previous school
- Honorable Dismissal / Transfer Credentials

Additional for SHS:
- F-137-A (Junior High School Permanent Record)
- F-137-E (Elementary Permanent Record)

SPECIAL SCIENCE CLASS (SSC) — JHS Grade 7:
- Available for Grade 7 applicants only
- Requirement: Grade 6 General Average of 85 or higher
- Process: Apply → System checks average → If qualified → Schedule entrance exam → If passed → Enrolled in SSC class
- If not qualified or fails exam → Enrolled in Regular class

TUITION AND FEES:
- Fees vary per program and semester
- Contact the Cashier/Finance Office for exact amounts
- Payment is per semester for College and SHS
- Payment is per grading period for JHS (4 grading periods per year)

SCHOOL CALENDAR:
- First Semester: June – October
- Second Semester: November – March
- Summer: April – May (select programs only)
- JHS Grading Periods: 4 times per year

OFFICES AND LOCATIONS:
- Registrar's Office: Admin Building, Ground Floor — handles enrollment, records, TOR requests
- Cashier/Finance: Admin Building, Ground Floor — handles payments and fees
- Guidance & Counseling: Admin Building, 2nd Floor — student support services
- Office of the President: Admin Building, 2nd Floor
- Student Affairs: Admin Building
- Library: Library Building — open Mon-Fri 7:30AM-6PM, Sat 8AM-12PM
- Medical/Dental Clinic: Health Services Building
- Gymnasium: Sports Complex — PE classes and events
- Canteen/Cafeteria: Main Hall, 1st Floor

CHATBOT SYSTEM (GabAI):
- GabAI is the AI-powered admission and enrollment assistant of EMC
- It uses RAG (Retrieval Augmented Generation) technology
- It retrieves information from the school database and knowledge base
- It can answer questions about enrollment, subjects, sections, buildings, and programs
- It supports English and Filipino languages
- It is available 24/7

ENROLLMENT STATUS MEANINGS:
- Draft: Form started but not yet submitted
- Submitted: Form submitted, waiting for Registrar review
- Pending Exam: SSC entrance exam scheduled (JHS Grade 7 only)
- Verified: Documents verified by Registrar, waiting for Admin approval
- Returned: Documents need correction, student must resubmit
- Approved: Admin approved, section being assigned
- Enrolled: Fully enrolled with section and subjects assigned
- Rejected: Enrollment not approved (reason provided)
`;

    systemContext += "\n\nEMC INSTITUTIONAL KNOWLEDGE (always available, use this for general school questions):\n" + EMC_KNOWLEDGE;
    systemContext += "\n\nCONTACT INFO:\n- Registrar's Office: (043) 123-4567\n- Email: emc_1945@yahoo.com\n- Hours: Mon-Fri, 8AM-5PM";
    
    // Build conversation messages with context awareness
    const messages = [
      {
        role: "system",
        content: systemContext
      }
    ];
    
    // Add conversation history for context (last 6 messages)
    if (conversationHistory && conversationHistory.length > 0) {
      const recentHistory = conversationHistory.slice(-6);
      recentHistory.forEach(msg => {
        messages.push({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        });
      });
    }
    
    // Add current user message
    messages.push({
      role: "user",
      content: message
    });
    
    // GENERATION: Use Groq AI to generate response
    let response;
    let confidence = bestMatch?.score || 0;
    let matchedFaqId = bestMatch?.faq.id || null;
    let suggestedQuestions = [];
    
    try {
      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: messages,
        temperature: 0.2, // Very low for accuracy and consistency
        max_tokens: 400,
        top_p: 0.85,
        frequency_penalty: 0.5, // Reduce repetition
        presence_penalty: 0.3,
      });
      
      response = completion.choices[0].message.content.trim();
      
      // Generate suggested follow-up questions based on category
      if (bestMatch) {
        const category = bestMatch.faq.category;
        const relatedFAQs = faqs
          .filter(f => f.category === category && f.id !== bestMatch.faq.id)
          .slice(0, 3);
        
        suggestedQuestions = relatedFAQs.map(f => f.question);
      }
      
      // Update FAQ views if we had a good match
      if (bestMatch && bestMatch.score > 0.1) {
        await bestMatch.faq.increment('views');
      }
      
    } catch (groqError) {
      console.error("Groq API error:", groqError.message);
      
      // Robust fallback system
      if (bestMatch && bestMatch.score > 0.15) {
        response = bestMatch.faq.answer;
      } else if (topFAQs.length > 0) {
        response = "Here's what I found that might help:\n\n";
        topFAQs.slice(0, 2).forEach((item, idx) => {
          response += `${idx + 1}. ${item.faq.answer}\n\n`;
        });
        response += "For more specific information, please contact the Registrar's Office at (043) 123-4567.";
      } else {
        response = "I apologize, but I don't have specific information about that. For accurate details, please contact:\n\n📞 Registrar's Office: (043) 123-4567\n📧 emc_1945@yahoo.com\n🌐 www.emc.edu.ph\n\nOffice hours: Monday-Friday, 8:00 AM - 5:00 PM";
      }
    }
    
    const responseTime = Date.now() - startTime;
    
    // Log the conversation
    const chatLog = await ChatLog.create({
      userId: req.session.userId || null,
      sessionId,
      userMessage: message,
      botResponse: response,
      confidence,
      matchedFaqId,
      responseTime
    });
    
    res.json({
      response,
      confidence,
      matchedFaqId,
      chatLogId: chatLog.id,
      suggestedQuestions: suggestedQuestions.slice(0, 3)
    });
    
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ 
      response: "I apologize, but I'm experiencing technical difficulties. Please try again in a moment or contact the Registrar's Office at (043) 123-4567 for immediate assistance.",
      error: true
    });
  }
};

export const rateFeedback = async (req, res) => {
  try {
    const { chatLogId, helpful } = req.body;
    
    const chatLog = await ChatLog.findByPk(chatLogId);
    if (!chatLog) {
      return res.status(404).json({ error: "Chat log not found" });
    }
    
    await chatLog.update({ wasHelpful: helpful });
    
    // Update FAQ helpful/notHelpful counts
    if (chatLog.matchedFaqId) {
      const faq = await FAQ.findByPk(chatLog.matchedFaqId);
      if (faq) {
        if (helpful) {
          await faq.increment('helpful');
        } else {
          await faq.increment('notHelpful');
        }
      }
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error("Feedback error:", error);
    res.status(500).json({ error: "Failed to save feedback" });
  }
};
