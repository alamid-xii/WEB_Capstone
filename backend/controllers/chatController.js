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

    // RETRIEVAL: Fetch all active FAQs and find best matches
    const faqs = await FAQ.findAll({ where: { isActive: true } });
    
    // Calculate similarity scores for all FAQs
    const scoredFAQs = faqs.map(faq => ({
      faq,
      score: calculateSimilarity(message, faq.keywords)
    })).sort((a, b) => b.score - a.score);
    
    // Get top 5 most relevant FAQs for better context
    const topFAQs = scoredFAQs.slice(0, 5).filter(item => item.score > 0.05);
    const bestMatch = topFAQs[0];
    
    // Build comprehensive context from retrieved FAQs
    let systemContext = `You are a highly knowledgeable and friendly admission assistant for Eastern Mindoro College (EMC) in the Philippines.

CRITICAL INSTRUCTIONS - FOLLOW STRICTLY:
1. NEVER hallucinate or make up information
2. ONLY use information from the knowledge base provided below
3. If you don't have specific information, say "I don't have that specific information" and direct to Registrar
4. Be accurate, helpful, and professional
5. Respond in the SAME LANGUAGE the user is using (English, Filipino/Tagalog, etc.)
6. Format responses clearly with bullet points or numbered lists when appropriate
7. Be conversational and warm
8. NEVER repeat the same information - if already mentioned, acknowledge and add new details
9. Keep responses concise and to the point (max 3-4 paragraphs)
10. If user asks follow-up, build on previous context

`;
    
    if (topFAQs.length > 0) {
      systemContext += "KNOWLEDGE BASE (ONLY use this information):\n\n";
      topFAQs.forEach((item, index) => {
        systemContext += `${index + 1}. Q: ${item.faq.question}\n   A: ${item.faq.answer}\n   Category: ${item.faq.category}\n\n`;
      });
    }
    
    systemContext += "\nCONTACT INFO (use when you don't have specific info):\n- Registrar's Office: (043) 123-4567\n- Website: www.emc.edu.ph\n- Email: registrar@emc.edu.ph\n- Hours: Mon-Fri, 8AM-5PM";
    
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
        response = "I apologize, but I don't have specific information about that. For accurate details, please contact:\n\n📞 Registrar's Office: (043) 123-4567\n📧 registrar@emc.edu.ph\n🌐 www.emc.edu.ph\n\nOffice hours: Monday-Friday, 8:00 AM - 5:00 PM";
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
