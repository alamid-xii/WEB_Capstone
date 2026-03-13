import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Clock, ChevronRight, Sparkles, BookOpen, FileText, Calendar, GraduationCap } from "lucide-react";


const quickFAQs = [
  "What are the admission requirements?",
  "When is the enrollment deadline?",
  "How do I submit documents?",
  "What courses are available?",
  "Where is the registrar's office?",
  "How to get a student ID?",
];

const categories = [
  { icon: FileText, label: "Requirements" },
  { icon: Calendar, label: "Deadlines" },
  { icon: GraduationCap, label: "Programs" },
  { icon: BookOpen, label: "Enrollment" },
];

const botResponses = {
  "What are the admission requirements?":
    "For admission to Eastern Mindoro College, you'll need: (1) Original Form 138/SF9 with school seal, (2) Certificate of Good Moral Character, (3) PSA Birth Certificate (original + photocopy), (4) 2x2 ID photos (4 pieces), (5) Medical Certificate from licensed physician, and (6) Accomplished admission form. For transferees, additionally provide a Transfer Credential/Honorable Dismissal.",
  "When is the enrollment deadline?":
    "The enrollment period for Academic Year 2025–2026 is as follows:\n• New Students: June 2 – June 20, 2025\n• Returning Students: May 26 – June 13, 2025\n• Transferees: June 2 – June 20, 2025\n\nLate enrollment may be subject to additional fees. Please visit the Registrar's Office for extensions.",
  "How do I submit documents?":
    "You may submit documents in two ways:\n\n1. In-Person: Bring original documents and photocopies to the Registrar's Office (Admin Building, Ground Floor) during office hours (Mon–Fri, 8AM–5PM).\n\n2. Online Pre-submission: Upload scanned copies via the EMC Student Portal at portal.emc.edu.ph. Physical originals must still be presented during actual enrollment.",
  "What courses are available?":
    "Eastern Mindoro College offers programs across several departments:\n\n• College of Education (BSEd, BEEd)\n• College of Business (BSA, BSBA)\n• College of Engineering & Technology\n• College of Arts & Sciences\n• College of Nursing\n• Technical-Vocational Programs\n\nVisit the Campus Map page to locate each department building!",
  "Where is the registrar's office?":
    "The Registrar's Office is located at the Ground Floor of the Administration Building (Dr. Angel Francisco Hall). Office Hours: Monday–Friday, 8:00 AM – 5:00 PM. You can use our AR Navigation feature to get real-time directions from any point on campus!",
  "How to get a student ID?":
    "To get your Student ID:\n1. Complete enrollment and pay the ID fee at the Cashier\n2. Bring your official receipt to the Guidance Office (2nd Floor, Admin Building)\n3. Have your photo taken on-site\n4. ID release is within 5–7 working days\n\nBring your Enrollment Assessment Form as proof of enrollment.",
};

function getTime() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const initialMessages = [
  {
    id: 1,
    from: "bot",
    text: "Hello! 👋 I'm your UniNav Admission Assistant. I'm here to help you with everything about Eastern Mindoro College — from admission requirements to campus navigation. How can I assist you today?",
    time: getTime(),
  },
];

export function QAChat() {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  function sendMessage(text) {
    if (!text.trim()) return;
    const userMsg = { id: Date.now(), from: "user", text, time: getTime() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setTyping(true);

    setTimeout(() => {
      const response =
        botResponses[text] ||
        "Thank you for your question! For more specific information, please visit the Registrar's Office or call (043) 123-4567. You can also check the EMC official website at www.emc.edu.ph for the latest updates.";
      const botMsg = { id: Date.now() + 1, from: "bot", text: response, time: getTime() };
      setMessages((prev) => [...prev, botMsg]);
      setTyping(false);
    }, 1200);
  }

  return (
    <div className="min-h-screen bg-[#FFFDF0] flex flex-col">
      {/* Page Header */}
      <div className="bg-[#001840] text-white px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-[#F5C400] w-10 h-10 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-[#001840]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Admission Assistant</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="w-2 h-2 bg-[#FFDC5F] rounded-full animate-pulse" />
                <span className="text-[#FFDC5F] text-sm">Online · NLP-Powered</span>
              </div>
            </div>
          </div>
          <p className="text-[#FFFDF0]/70 text-sm mt-2 max-w-xl">
            Ask me anything about admissions, enrollment, requirements, or campus navigation. I'm available 24/7.
          </p>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6 h-[calc(100vh-260px)] min-h-[500px]">

          {/* Sidebar */}
          <aside className="hidden md:flex flex-col w-64 shrink-0 gap-4">
            {/* Categories */}
            <div className="bg-[#102A71] rounded-2xl p-5">
              <h3 className="text-[#FFDC5F] font-semibold mb-4 text-sm uppercase tracking-wider">Categories</h3>
              <div className="grid grid-cols-2 gap-2">
                {categories.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <button
                      key={cat.label}
                      className="flex flex-col items-center gap-2 bg-[#001840]/40 hover:bg-[#F5C400]/20 p-3 rounded-xl transition-colors duration-150 group"
                    >
                      <Icon className="w-5 h-5 text-[#FFDC5F] group-hover:text-[#F5C400]" />
                      <span className="text-[#FFFDF0] text-xs">{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Deadlines Badge */}
            <div className="bg-[#FFDC5F] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-5 h-5 text-[#001840]" />
                <h3 className="text-[#001840] font-semibold text-sm">Upcoming Deadlines</h3>
              </div>
              <ul className="space-y-2">
                <li className="bg-[#001840]/10 rounded-lg p-2">
                  <p className="text-[#001840] text-xs font-semibold">New Student Enrollment</p>
                  <p className="text-[#001840]/70 text-xs">June 2 – 20, 2025</p>
                </li>
                <li className="bg-[#001840]/10 rounded-lg p-2">
                  <p className="text-[#001840] text-xs font-semibold">Document Submission</p>
                  <p className="text-[#001840]/70 text-xs">June 20, 2025</p>
                </li>
                <li className="bg-[#001840]/10 rounded-lg p-2">
                  <p className="text-[#001840] text-xs font-semibold">Entrance Exam</p>
                  <p className="text-[#001840]/70 text-xs">May 28, 2025</p>
                </li>
              </ul>
            </div>

            {/* Quick FAQs */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 flex-1 overflow-y-auto">
              <h3 className="text-[#001840] font-semibold mb-3 text-sm uppercase tracking-wider">Quick FAQs</h3>
              <ul className="space-y-1.5">
                {quickFAQs.map((q) => (
                  <li key={q}>
                    <button
                      onClick={() => sendMessage(q)}
                      className="w-full text-left text-xs text-[#102A71] hover:text-[#001840] hover:bg-[#FFFDF0] px-3 py-2 rounded-lg transition-colors duration-150 flex items-center gap-2 group"
                    >
                      <ChevronRight className="w-3 h-3 shrink-0 text-[#F5C400] group-hover:translate-x-0.5 transition-transform" />
                      {q}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.from === "user" ? "flex-row-reverse" : ""}`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-9 h-9 rounded-full shrink-0 flex items-center justify-center ${msg.from === "bot" ? "bg-[#102A71]" : "bg-[#F5C400]"
                      }`}
                  >
                    {msg.from === "bot" ? (
                      <Bot className="w-5 h-5 text-white" />
                    ) : (
                      <User className="w-5 h-5 text-[#001840]" />
                    )}
                  </div>

                  {/* Bubble */}
                  <div className={`max-w-[75%] space-y-1 ${msg.from === "user" ? "items-end" : "items-start"} flex flex-col`}>
                    <div
                      className={`px-5 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${msg.from === "bot"
                          ? "bg-[#FFDC5F]/30 text-[#001840] rounded-tl-none border border-[#FFDC5F]/40"
                          : "bg-[#102A71] text-[#FFFDF0] rounded-tr-none"
                        }`}
                    >
                      {msg.text}
                    </div>
                    <span className="text-[10px] text-gray-400 px-1">{msg.time}</span>
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {typing && (
                <div className="flex gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#102A71] flex items-center justify-center shrink-0">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div className="bg-[#FFDC5F]/30 border border-[#FFDC5F]/40 px-5 py-3 rounded-2xl rounded-tl-none">
                    <div className="flex gap-1.5 items-center h-4">
                      <span className="w-2 h-2 bg-[#102A71]/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 bg-[#102A71]/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 bg-[#102A71]/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Quick FAQ chips (mobile) */}
            <div className="md:hidden px-4 py-2 flex gap-2 overflow-x-auto border-t border-gray-100">
              {quickFAQs.slice(0, 3).map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="shrink-0 text-xs bg-[#FFFDF0] border border-[#FFDC5F] text-[#102A71] px-3 py-1.5 rounded-full hover:bg-[#FFDC5F]/30 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-100 bg-[#FFFDF0]">
              <form
                onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
                className="flex gap-3 items-center"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about admissions, requirements, campus…"
                  className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-[#001840] placeholder-gray-400 focus:outline-none focus:border-[#102A71] focus:ring-2 focus:ring-[#102A71]/10 transition"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || typing}
                  className="bg-[#F5C400] hover:bg-[#FFDC5F] disabled:opacity-50 disabled:cursor-not-allowed text-[#001840] w-11 h-11 rounded-xl flex items-center justify-center transition-colors shrink-0 shadow"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
              <p className="text-[10px] text-gray-400 text-center mt-2">
                UniNav AI is for guidance only. Always verify with the Registrar's Office.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}