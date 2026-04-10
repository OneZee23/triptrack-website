import { useState, useEffect, createContext } from 'react';
import { motion, useMotionValue } from 'motion/react';
import { Outlet, Link, useLocation } from 'react-router';
import { Globe, Apple, Menu, X } from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation';
import logo from '../assets/avatar.png';

interface CursorContextType {
  setHoverState: (state: { text: string; active: boolean } | null) => void;
}

export const CursorContext = createContext<CursorContextType>({ setHoverState: () => {} });

export default function AppLayout() {
  const [hoverState, setHoverState] = useState<{ text: string; active: boolean } | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { t, lang, setLang } = useTranslation();

  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const toggleLang = () => setLang(lang === 'en' ? 'ru' : 'en');

  return (
    <CursorContext.Provider value={{ setHoverState }}>
      <div className="min-h-screen bg-[#f8f6f2] text-[#1e1e23] font-sans selection:bg-[#EB571E]/20 flex flex-col relative overflow-x-hidden">
        <style>{`
          .route-line {
            stroke-dasharray: 8 8;
            animation: dash 20s linear infinite;
          }
          @keyframes dash {
            to { stroke-dashoffset: -1000; }
          }
        `}</style>

        {/* Header — light glass */}
        <header className="fixed top-0 left-0 w-full z-40 bg-white/80 backdrop-blur-xl border-b border-black/5">
          <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3 group" onClick={() => setHoverState(null)} onMouseEnter={() => setHoverState({text: t('nav.home'), active: true})} onMouseLeave={() => setHoverState(null)}>
              <img src={logo} alt="TripTrack" className="w-10 h-10 rounded-xl shadow-[0_0_20px_rgba(235,87,30,0.2)] group-hover:scale-105 transition-transform" />
              <div>
                <h1 className="text-xl font-bold tracking-tight text-[#1e1e23]">TripTrack</h1>
                <p className="text-[10px] text-[#1e1e23]/40 tracking-widest uppercase">Drive Diary</p>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-8">
              <Link to="/" className={`text-sm font-medium transition-colors ${location.pathname === '/' ? 'text-[#1e1e23]' : 'text-[#1e1e23]/40 hover:text-[#1e1e23]'}`} onMouseEnter={() => setHoverState({text: t('nav.home'), active: true})} onMouseLeave={() => setHoverState(null)}>{t('nav.home')}</Link>
              <Link to="/features" className={`text-sm font-medium transition-colors ${location.pathname === '/features' ? 'text-[#1e1e23]' : 'text-[#1e1e23]/40 hover:text-[#1e1e23]'}`} onMouseEnter={() => setHoverState({text: t('nav.features'), active: true})} onMouseLeave={() => setHoverState(null)}>{t('nav.features')}</Link>
              <Link to="/about" className={`text-sm font-medium transition-colors ${location.pathname === '/about' ? 'text-[#1e1e23]' : 'text-[#1e1e23]/40 hover:text-[#1e1e23]'}`} onMouseEnter={() => setHoverState({text: t('nav.about'), active: true})} onMouseLeave={() => setHoverState(null)}>{t('nav.about')}</Link>
              <Link to="/roadmap" className={`text-sm font-medium transition-colors ${location.pathname === '/roadmap' ? 'text-[#1e1e23]' : 'text-[#1e1e23]/40 hover:text-[#1e1e23]'}`} onMouseEnter={() => setHoverState({text: t('nav.roadmap'), active: true})} onMouseLeave={() => setHoverState(null)}>{t('nav.roadmap')}</Link>
            </nav>

            <div className="flex items-center gap-4 md:gap-6">
              <button
                onClick={toggleLang}
                className="flex items-center gap-1.5 text-xs font-semibold text-[#1e1e23]/40 hover:text-[#1e1e23] transition-colors"
                onMouseEnter={() => setHoverState({text: t('nav.switch_lang'), active: true})} onMouseLeave={() => setHoverState(null)}
                aria-label={t('nav.switch_lang')}
              >
                <Globe className="w-4 h-4" />
                {lang.toUpperCase()}
              </button>
              <Link
                to="/download"
                className="hidden md:flex bg-[#EB571E] hover:bg-[#d14e1a] text-white rounded-full px-5 py-2.5 text-sm font-bold items-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-[0_2px_12px_rgba(235,87,30,0.3)]"
                onMouseEnter={() => setHoverState({text: 'App Store', active: true})} onMouseLeave={() => setHoverState(null)}
              >
                <Apple className="w-4 h-4" />
                {t('nav.download_free')}
              </Link>
              <button
                className="md:hidden w-10 h-10 flex items-center justify-center text-[#1e1e23]/50 hover:text-[#1e1e23] transition-colors"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden bg-white/95 backdrop-blur-xl border-t border-black/5 px-6 py-6 flex flex-col gap-4">
              <Link to="/" className={`text-lg font-medium py-2 ${location.pathname === '/' ? 'text-[#1e1e23]' : 'text-[#1e1e23]/40'}`}>{t('nav.home')}</Link>
              <Link to="/features" className={`text-lg font-medium py-2 ${location.pathname === '/features' ? 'text-[#1e1e23]' : 'text-[#1e1e23]/40'}`}>{t('nav.features')}</Link>
              <Link to="/about" className={`text-lg font-medium py-2 ${location.pathname === '/about' ? 'text-[#1e1e23]' : 'text-[#1e1e23]/40'}`}>{t('nav.about')}</Link>
              <Link to="/roadmap" className={`text-lg font-medium py-2 ${location.pathname === '/roadmap' ? 'text-[#1e1e23]' : 'text-[#1e1e23]/40'}`}>{t('nav.roadmap')}</Link>
              <Link to="/download" className="bg-[#EB571E] text-white rounded-full px-6 py-3 text-center font-bold flex items-center justify-center gap-2 mt-2">
                <Apple className="w-5 h-5" />
                {t('nav.download_free')}
              </Link>
            </div>
          )}
        </header>

        <main className="flex-1 flex flex-col w-full">
          <Outlet />
        </main>

        {/* Footer — warm light */}
        <footer className="w-full border-t border-black/5 bg-[#f4f2ee] py-12 px-6 flex flex-col md:flex-row items-center justify-between text-[#1e1e23]/40 text-[14px]">
          <div className="flex items-center gap-2 mb-6 md:mb-0">
            <img src={logo} alt="" className="w-8 h-8 rounded-lg" />
            <span className="font-bold text-[#1e1e23]/70">TripTrack</span>
            <span className="ml-2">&copy; 2026 OneZee</span>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-8 font-medium">
            <a href="https://onezee23.github.io/trip-track-ios/privacy-policy.html" target="_blank" rel="noopener" className="hover:text-[#1e1e23] transition-colors">{t('footer.privacy_policy')}</a>
            <a href="https://github.com/OneZee23/trip-track-ios" target="_blank" rel="noopener" className="hover:text-[#1e1e23] transition-colors">{t('footer.github')}</a>
            <a href="https://t.me/triptrack_app" target="_blank" rel="noopener" className="hover:text-[#1e1e23] transition-colors">{t('footer.telegram')}</a>
            <a href="https://www.youtube.com/@onezee_dev" target="_blank" rel="noopener" className="hover:text-[#1e1e23] transition-colors">{t('footer.youtube')}</a>
          </div>
          <div className="mt-6 md:mt-0 font-medium">
            {t('footer.made_with')}
          </div>
        </footer>

        {/* Custom cursor */}
        <motion.div
          className="fixed top-0 left-0 pointer-events-none z-[100] items-center justify-center overflow-hidden hidden md:flex"
          style={{ x: mouseX, y: mouseY, translateX: '-50%', translateY: '-50%' }}
          animate={{
            width: hoverState?.active ? 120 : 20,
            height: hoverState?.active ? 40 : 20,
            backgroundColor: hoverState?.active ? '#1e1e23' : '#EB571E',
            borderRadius: hoverState?.active ? 20 : 10,
            scale: 1
          }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          <motion.span
            className="text-white font-medium text-sm whitespace-nowrap"
            initial={{ opacity: 0 }}
            animate={{ opacity: hoverState?.active ? 1 : 0 }}
            transition={{ duration: 0.15 }}
          >
            {hoverState?.text || ''}
          </motion.span>
        </motion.div>
      </div>
    </CursorContext.Provider>
  );
}
