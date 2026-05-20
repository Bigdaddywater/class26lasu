import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Send, MessageSquare, Loader2, Sparkles, User } from "lucide-react";
import { messageService } from "../lib/api-client";
import { useAuthStore } from "../stores/authStore";
import { useWebSockets } from "../hooks/useWebSockets";

interface Message {
  id: number;
  text: string;
  authorName: string;
  created_at?: string;
}

export default function MessagesList() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [authorNameInput, setAuthorNameInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  
  const { user } = useAuthStore();

  // Set default author name based on logged in user
  useEffect(() => {
    if (user?.full_name) {
      setAuthorNameInput(user.full_name);
    }
  }, [user]);

  // Initial Rest Hydration 
  useEffect(() => {
    const hydrate = async () => {
      try {
        const data = await messageService.getMessages();
        if (Array.isArray(data)) {
          const unique: any[] = [];
          const seen = new Set();
          data.forEach((m) => {
            const mId = m.id?.toString();
            if (mId && !seen.has(mId)) {
              seen.add(mId);
              unique.push(m);
            }
          });
          setMessages(unique);
        }
      } catch (err) {
        console.warn("Rest messages hydration fallback:", err);
      }
    };
    hydrate();
  }, []);

  // Shared highly stable WebSocket hook
  const { sendMessage, isConnected } = useWebSockets((data) => {
    // Handle live messages
    if (data && data.text) {
      // Prevent duplicate items with type comparison safety (coercing ID to string)
      setMessages((prev) => {
        const exists = prev.some((msg) => String(msg.id) === String(data.id));
        if (exists) {
          return prev;
        }
        return [...prev, data];
      });
    }
  });

  const status = isConnected ? "connected" : "connecting";

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setIsSending(true);
    const textToSend = inputText.trim();
    const finalAuthorName = authorNameInput.trim() || user?.full_name || "Anonymous Graduate";

    try {
      if (isConnected) {
        const payload = {
          id: Date.now() + Math.random() * 100000,
          text: textToSend,
          authorName: finalAuthorName,
          created_at: new Date().toISOString()
        };
        sendMessage(payload);
        setInputText("");
      } else {
        // HTTP Fallback
        const result = await messageService.postMessage({
          text: textToSend,
          authorName: finalAuthorName
        });
        setMessages(prev => {
          if (prev.some(m => String(m.id) === String(result.id))) return prev;
          return [...prev, result];
        });
        setInputText("");
      }
    } catch (err) {
      console.error("Failed to transmit message:", err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="relative min-h-screen pt-24 md:pt-32 pb-24 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto flex flex-col justify-start">
      {/* Background Ambience */}
      <div className="absolute inset-x-0 top-0 h-[600px] bg-gradient-to-b from-[#D4AF37]/5 via-transparent to-transparent pointer-events-none z-0" />
      
      {/* Header Info */}
      <div className="z-10 mb-12 text-center md:text-left flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-8 animate-fade-in">
        <div className="space-y-2">
          <span className="inline-flex items-center space-x-1.5 bg-white/5 border border-white/10 px-3 py-1 rounded-full text-[9px] uppercase tracking-[0.25em] font-black text-[#D4AF37]">
            <Sparkles size={10} className="animate-pulse" />
            <span>Legacy Ticker</span>
          </span>
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter">Live Guestbook</h1>
          <p className="text-white/40 text-xs uppercase tracking-widest font-medium">Leave your footprints in the digital sand of LASU Class of 2026.</p>
        </div>

        {/* Live Status indicator */}
        <div className="flex items-center justify-center space-x-3 bg-[#0A0A0A]/60 border border-white/5 px-4 py-2 rounded-md">
          <div className="relative flex items-center justify-center">
            {status === "connected" ? (
              <>
                <span className="absolute inline-flex h-2.5 w-2.5 rounded-full bg-green-400 opacity-75 animate-ping" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
              </>
            ) : status === "connecting" ? (
              <>
                <span className="absolute inline-flex h-2.5 w-2.5 rounded-full bg-yellow-400 opacity-75 animate-ping" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-yellow-500" />
              </>
            ) : (
              <>
                <span className="absolute inline-flex h-2.5 w-2.5 rounded-full bg-red-400 opacity-75 animate-ping" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
              </>
            )}
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-white/55">
            {status === "connected" ? "Syncing Live" : status === "connecting" ? "Synchronizing..." : "Link Interrupted"}
          </span>
        </div>
      </div>

      {/* Message Creation Board */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="z-10 bg-[#0A0A0A]/50 border border-white/10 p-6 md:p-8 mb-10 shadow-xl"
      >
        <form onSubmit={handleSendMessage} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1 md:col-span-1">
              <label className="text-[9px] font-bold text-[#D4AF37] uppercase tracking-[0.2em] block">Your Signature</label>
              <div className="relative">
                <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                <input 
                  type="text" 
                  value={authorNameInput}
                  onChange={(e) => setAuthorNameInput(e.target.value)}
                  placeholder="Anonymous Graduate"
                  className="w-full bg-[#050505] border border-white/10 py-3 pl-10 pr-4 text-xs tracking-wider outline-none text-white focus:border-[#D4AF37] transition-all"
                />
              </div>
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-[9px] font-bold text-[#D4AF37] uppercase tracking-[0.2em] block">Your Legacy Word / congratulations</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={inputText}
                  required
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="E.g., We forged our path, now we conquer the world! Congrats class of '26!"
                  className="flex-1 bg-[#050505] border border-white/10 px-4 py-3 text-xs tracking-wider outline-none text-white focus:border-[#D4AF37] transition-all"
                />
                
                <button 
                  type="submit"
                  disabled={isSending || !inputText.trim()}
                  className="px-6 bg-[#D4AF37] text-black hover:bg-[#b8952d] disabled:opacity-50 font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-1.5 transition-all outline-none"
                >
                  {isSending ? <Loader2 size={14} className="animate-spin" /> : <Send size={12} />}
                  <span className="hidden sm:inline">Broadcast</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      </motion.div>

      {/* Messages Grid */}
      <div className="z-10 flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence initial={false}>
          {messages.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:col-span-2 text-center py-16 bg-[#0A0A0A]/25 border border-white/5"
            >
              <MessageSquare size={36} className="text-white/10 mx-auto mb-3" />
              <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold">No live congratulations posted yet</p>
              <p className="text-[9px] uppercase tracking-widest text-white/20 mt-1">Be the first to claim your line in history</p>
            </motion.div>
          ) : (
            // Reverse list to show newest on top
            [...messages].reverse().map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="bg-[#0A0A0A]/80 border border-white/5 hover:border-[#D4AF37]/30 p-5 shadow-sm transition-all flex flex-col justify-between group h-full hover:scale-[1.01]"
              >
                <div>
                  <div className="flex items-start justify-between mb-3 border-b border-white/5 pb-2">
                    <span className="text-[10px] font-black text-[#D4AF37] uppercase tracking-wider block">
                      {message.authorName}
                    </span>
                    <span className="text-[8px] tracking-widest text-white/20 font-mono">
                      {message.created_at ? new Date(message.created_at).toLocaleTimeString() : new Date().toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-white/90 text-xs sm:text-sm tracking-wide leading-relaxed font-serif italic selection:bg-[#D4AF37] selection:text-black">
                    "{message.text}"
                  </p>
                </div>
                <div className="h-2" />
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
