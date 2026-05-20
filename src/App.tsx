/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import Home from './pages/Home';
import Archive from './pages/Archive';
import Admin from './pages/Admin';
import MessagesList from './pages/MessagesList';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { WebSocketProvider } from './hooks/useWebSockets';

export default function App() {
  return (
    <WebSocketProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-[#D4AF37] selection:text-black">
          <Navbar />
          <main>
            <AnimatePresence mode="wait">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/archive" element={<Archive />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/guestbook" element={<MessagesList />} />
              </Routes>
            </AnimatePresence>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </WebSocketProvider>
  );
}
