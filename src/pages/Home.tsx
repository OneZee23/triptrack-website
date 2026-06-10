import { Map, Camera, Target, Star } from 'lucide-react';
import { Link } from 'react-router';
import { useTranslation } from '../i18n/useTranslation';
import { usePageMeta } from '../components/PageMeta';
import GlobeHero from '../components/globe/GlobeHero';

import screenRecording from '../assets/screen-recording.png';
import screenDetail from '../assets/screen-detail.png';
import screenLockscreen from '../assets/screen-lockscreen.png';

export default function Home() {
  const { t, lang } = useTranslation();
  usePageMeta(
    lang === 'ru' ? 'TripTrack — Дневник поездок | Трекер маршрутов для iOS' : 'TripTrack — Drive Diary | Trip Tracker for iOS',
    lang === 'ru' ? 'Автоматический дневник поездок для iPhone. Записывает каждую поездку, строит визуальный журнал маршрутов, фото и статистики. Бесплатно, приватно.' : 'Auto trip diary for iOS. Records every drive, builds a visual journal of routes, photos, and stats. Free, private, Google Timeline alternative.',
  );

  return (
    <div className="w-full flex flex-col items-center">

      {/* GLOBE HERO */}
      <GlobeHero />

      {/* PROBLEM STATEMENT */}
      <section className="w-full max-w-6xl mx-auto px-6 py-20 border-t border-black/5 mt-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-black/5 p-8 rounded-[32px] hover:-translate-y-2 transition-transform shadow-sm">
            <Map className="w-8 h-8 text-[#EB571E] mb-6" />
            <h3 className="text-xl font-semibold mb-3 text-[#1e1e23]">{t('home.problem_timeline_title')}</h3>
            <p className="text-[#1e1e23]/50 text-sm leading-relaxed">{t('home.problem_timeline_desc')}</p>
          </div>
          <div className="bg-white border border-black/5 p-8 rounded-[32px] hover:-translate-y-2 transition-transform shadow-sm">
            <Camera className="w-8 h-8 text-[#EB571E] mb-6" />
            <h3 className="text-xl font-semibold mb-3 text-[#1e1e23]">{t('home.problem_photos_title')}</h3>
            <p className="text-[#1e1e23]/50 text-sm leading-relaxed">{t('home.problem_photos_desc')}</p>
          </div>
          <div className="bg-white border border-black/5 p-8 rounded-[32px] hover:-translate-y-2 transition-transform shadow-sm">
            <Target className="w-8 h-8 text-[#EB571E] mb-6" />
            <h3 className="text-xl font-semibold mb-3 text-[#1e1e23]">{t('home.problem_noapp_title')}</h3>
            <p className="text-[#1e1e23]/50 text-sm leading-relaxed">{t('home.problem_noapp_desc')}</p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="w-full max-w-6xl mx-auto px-6 py-32 text-center relative border-t border-black/5">
        <h2 className="text-[40px] font-bold mb-24 text-[#1e1e23]">{t('home.how_title')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-16 relative">
          <div className="absolute top-[20%] left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-emerald-500/20 via-[#EB571E]/50 to-red-500/20 hidden md:block" />
          {/* Step 1: Start */}
          <div className="relative z-10 flex flex-col items-center">
            <span className="absolute -top-12 text-[120px] font-bold text-black/[0.03] leading-none select-none">01</span>
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mb-8 shadow-[0_0_20px_rgba(16,185,129,0.3)]"><div className="w-3 h-3 rounded-full bg-emerald-500" /></div>
            <div className="w-[240px] h-[380px] rounded-[28px] mb-6 shadow-lg overflow-hidden border border-black/5 bg-[#f8f6f2]">
              <img src={screenLockscreen} alt="Live Activity on Lock Screen" className="w-full h-[150%] object-cover object-bottom" />
            </div>
            <h4 className="text-xl font-semibold mb-3 text-[#1e1e23]">{t('home.step1_title')}</h4>
            <p className="text-[#1e1e23]/50 text-sm px-4">{t('home.step1_desc')}</p>
          </div>
          {/* Step 2: Drive */}
          <div className="relative z-10 flex flex-col items-center">
            <span className="absolute -top-12 text-[120px] font-bold text-black/[0.03] leading-none select-none">02</span>
            <div className="w-12 h-12 rounded-full bg-[#EB571E]/20 border-2 border-[#EB571E] flex items-center justify-center mb-8 shadow-[0_0_20px_rgba(235,87,30,0.3)]"><div className="w-3 h-3 rounded-full bg-[#EB571E]" /></div>
            <div className="w-[240px] h-[380px] rounded-[28px] mb-6 shadow-lg overflow-hidden border border-black/5 bg-[#f8f6f2]">
              <img src={screenRecording} alt="Recording a trip" className="w-full h-[150%] object-cover object-bottom" />
            </div>
            <h4 className="text-xl font-semibold mb-3 text-[#1e1e23]">{t('home.step2_title')}</h4>
            <p className="text-[#1e1e23]/50 text-sm px-4">{t('home.step2_desc')}</p>
          </div>
          {/* Step 3: Remember */}
          <div className="relative z-10 flex flex-col items-center">
            <span className="absolute -top-12 text-[120px] font-bold text-black/[0.03] leading-none select-none">03</span>
            <div className="w-12 h-12 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center mb-8 shadow-[0_0_20px_rgba(239,68,68,0.3)]"><div className="w-3 h-3 rounded-full bg-red-500" /></div>
            <div className="w-[240px] h-[380px] rounded-[28px] mb-6 shadow-lg overflow-hidden border border-black/5 bg-[#f8f6f2]">
              <img src={screenDetail} alt="Trip detail view" className="w-full h-[150%] object-cover object-bottom" />
            </div>
            <h4 className="text-xl font-semibold mb-3 text-[#1e1e23]">{t('home.step3_title')}</h4>
            <p className="text-[#1e1e23]/50 text-sm px-4">{t('home.step3_desc')}</p>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section className="w-full py-32 bg-[#f4f2ee] border-y border-black/5 text-center relative z-10">
        <div className="flex justify-center items-center gap-2 mb-4">
          {[1,2,3,4,5].map(i => <Star key={i} className="w-6 h-6 fill-[#EB571E] text-[#EB571E]" />)}
        </div>
        <p className="text-[20px] font-bold mb-12 text-[#1e1e23]">{t('home.rating')}</p>
        <div className="max-w-2xl mx-auto px-6">
          <div className="bg-white border border-black/5 p-10 rounded-3xl text-center shadow-sm">
            <div className="flex justify-center gap-1 mb-6">
              {[1,2,3,4,5].map(i => <Star key={i} className="w-5 h-5 fill-[#EB571E] text-[#EB571E]" />)}
            </div>
            <p className="text-[18px] leading-relaxed mb-6 text-[#1e1e23] italic">{t('home.review1')}</p>
            <p className="font-semibold text-[13px] text-[#1e1e23]/40">OKOPOK &middot; <a href="https://apps.apple.com/us/app/triptrack-road-journal/id6760650361" target="_blank" rel="noopener noreferrer" className="text-[#EB571E] hover:underline">App Store</a></p>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="w-full max-w-4xl mx-auto px-6 py-40 text-center relative z-10">
        <h2 className="text-[40px] md:text-[72px] font-bold tracking-tighter mb-8 text-[#1e1e23]">{t('home.cta_title')}</h2>
        <Link to="/download" className="inline-block bg-[#EB571E] hover:bg-[#d14e1a] text-white rounded-full px-12 py-5 text-[20px] font-bold transition-all hover:scale-105 active:scale-95 mb-6 shadow-[0_2px_20px_rgba(235,87,30,0.3)]">{t('home.cta_button')}</Link>
        <p className="text-[12px] text-[#1e1e23]/35 font-medium">{t('home.cta_note')}</p>
      </section>
    </div>
  );
}
