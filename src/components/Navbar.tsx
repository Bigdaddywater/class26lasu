import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Archive, Camera, Home, Menu, X, MessageSquare } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import { useAuthStore } from '../stores/authStore';
import { LogIn, LogOut, User as UserIcon } from 'lucide-react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isAuthenticated, logout, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const navLinks = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Explore Archive', path: '/archive', icon: Archive },
    { name: 'Upload', path: '/archive?upload=true', icon: Camera },
    { name: 'Guestbook', path: '/guestbook', icon: MessageSquare },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#050505]/80 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center group">
            <div className="flex flex-col">
              <span className="text-[#D4AF37] font-bold text-xl tracking-tighter uppercase leading-none">LASU 2026</span>
              <span className="text-white/60 text-[10px] uppercase tracking-widest mt-1">Digital Archive</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={`nav-desktop-${link.name}`}
                to={link.path}
                className="text-white/70 hover:text-[#D4AF37] text-sm font-medium tracking-wide transition-colors uppercase"
              >
                {link.name}
              </Link>
            ))}

            {isAuthenticated ? (
              <div className="flex items-center space-x-6 pl-6 border-l border-white/10">
                <div className="flex items-center space-x-3">
                   <div className="w-8 h-8 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/30 flex items-center justify-center overflow-hidden">
                     {user?.profile_picture ? (
                       <img src={user.profile_picture} alt={user.full_name} className="w-full h-full object-cover" />
                     ) : (
                       <UserIcon size={16} className="text-[#D4AF37]" />
                     )}
                   </div>
                   <div className="flex flex-col">
                     <span className="text-white font-bold text-[10px] uppercase tracking-widest leading-none">{user?.username}</span>
                     <span className="text-white/30 text-[8px] uppercase tracking-widest mt-1">{user?.role}</span>
                   </div>
                </div>
                <button 
                  onClick={logout}
                  className="text-white/40 hover:text-red-500 transition-colors"
                  title="Logout"
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <Link 
                to="/archive?auth=login"
                className="bg-white text-black px-5 py-2 font-black text-[10px] uppercase tracking-widest hover:bg-[#D4AF37] transition-all flex items-center space-x-2"
              >
                <LogIn size={14} />
                <span>Join Now</span>
              </Link>
            )}

            <div className="flex items-center space-x-4 pl-4 border-l border-white/10 group/echelon">
              <div className="flex flex-col items-end">
                <span className="text-[8px] text-white/30 uppercase tracking-[0.2em]">Powered by</span>
                <span className="text-white/70 font-black text-[10px] tracking-widest group-hover/echelon:text-[#D4AF37] transition-colors leading-none">ECHELONTIX</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover/echelon:border-[#D4AF37]/50 transition-all">
                <div className="relative">
                    <div className="text-[#D4AF37] scale-150 flex justify-center">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        {/* Crown */}
                        <path d="M12 4L15 7L19 5L17.5 13H6.5L5 5L9 7L12 4Z" fill="currentColor"/>
                        {/* Head */}
                        <rect x="8" y="13" width="8" height="6" rx="1" fill="currentColor"/>
                        {/* Eyes */}
                        <circle cx="10" cy="15.5" r="0.5" fill="black"/>
                        <circle cx="14" cy="15.5" r="0.5" fill="black"/>
                        {/* Cloak/Body hint */}
                        <path d="M7 19L5 22H19L17 19" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
                      </svg>
                    </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-white p-2"
            >
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden bg-[#050505] border-b border-white/10"
          >
            <div className="px-4 pt-2 pb-6 space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={`nav-mobile-${link.name}`}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center space-x-4 text-white/80 hover:text-[#D4AF37] text-lg font-medium p-2"
                >
                  <link.icon size={20} />
                  <span>{link.name}</span>
                </Link>
              ))}
              <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                <span className="text-[10px] text-white/40 uppercase tracking-widest">Powered by Echelontix</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
