import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-[#050505] border-t border-white/10 py-20 px-4 text-center flex flex-col items-center">
      <div className="max-w-7xl mx-auto flex flex-col items-center gap-12">
        <div className="flex flex-col items-center">
          <div className="flex flex-col mb-6 items-center">
            <span className="text-[#D4AF37] font-bold text-2xl tracking-tighter uppercase leading-none">LASU 2026</span>
            <span className="text-white/60 text-xs uppercase tracking-widest mt-2">Digital Archive</span>
          </div>
          <p className="text-white/50 text-sm max-w-sm leading-relaxed">
            A permanent digital memory vault for the Lagos State University graduating Class of 2026. 
            Preserving our journey, our legacy, and the friendships that built us.
          </p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-12 w-full justify-center">
        <div>
          <h4 className="text-white font-medium text-sm uppercase tracking-widest mb-6 text-center">Explore</h4>
          <ul className="space-y-4 text-center">
            <li><Link to="/archive" className="text-white/40 hover:text-[#D4AF37] text-sm transition-colors">Faculty Archives</Link></li>
            <li><Link to="/archive" className="text-white/40 hover:text-[#D4AF37] text-sm transition-colors">The Gallery</Link></li>
            <li><Link to="/archive" className="text-white/40 hover:text-[#D4AF37] text-sm transition-colors">Timeline Mode</Link></li>
          </ul>
        </div>
        
        <div>
          <h4 className="text-white font-medium text-sm uppercase tracking-widest mb-6 text-center">Contribute</h4>
          <ul className="space-y-4 text-center">
            <li><Link to="/archive?upload=true" className="text-white/40 hover:text-[#D4AF37] text-sm transition-colors">Upload Memories</Link></li>
            <li><Link to="/archive" className="text-white/40 hover:text-[#D4AF37] text-sm transition-colors">Community Feed</Link></li>
            <li><Link to="/admin" className="text-white/40 hover:text-[#D4AF37] text-sm transition-colors">Admin Login</Link></li>
          </ul>
        </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-white/30 text-[10px] uppercase tracking-widest">
          © 2026 LASU Digital Archive. All rights reserved.
        </p>
        <div className="flex items-center space-x-2">
          <span className="text-white/30 text-[10px] uppercase tracking-widest">A product of</span>
          <span className="text-white/60 font-bold text-xs tracking-tight">ECHELONTIX</span>
        </div>
      </div>
    </footer>
  );
}
