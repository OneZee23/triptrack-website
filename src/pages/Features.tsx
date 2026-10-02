import { Lock, CheckCircle2, Compass, MapPin, Car, Monitor } from 'lucide-react';
import screenProfile from '../assets/screen-profile.webp';
import { Link } from 'react-router';
import { useTranslation } from '../i18n/useTranslation';
import { usePageMeta } from '../components/PageMeta';

export default function Features() {
  const { t, href } = useTranslation();
  usePageMeta('/features');

  const included = ['auto_recording', 'trip_diary', 'attach_photos', 'fog_map', 'offline_private', 'no_account'];

  return (
    <div className="w-full max-w-7xl mx-auto px-5 sm:px-6 pt-28 pb-16 md:py-32 flex flex-col items-center relative z-10">
      <section className="text-center mb-16 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] max-w-[150vw] bg-[#EB571E]/5 blur-[100px] rounded-full pointer-events-none -z-10" />
        <h1 className="text-[32px] sm:text-[40px] md:text-[64px] font-bold tracking-tighter mb-6 text-[#1e1e23]">{t('features.h1')}</h1>
        <p className="text-[18px] text-[#1e1e23]/65 max-w-2xl mx-auto leading-relaxed">{t('features.hero_subtitle')}</p>
        <div className="mx-auto mt-8 flex max-w-2xl flex-col gap-4 text-left text-[16px] leading-relaxed text-[#1e1e23]/65">
          <p>{t('features.intro_p1')}</p>
          <p>{t('features.intro_p2')}</p>
        </div>
      </section>

      {/* What 0.6.8-0.8.0 added: the three blocks the old page never mentioned */}
      <section className="mb-20 grid w-full max-w-5xl grid-cols-1 gap-6 md:grid-cols-3">
        {[
          { icon: <Compass className="w-7 h-7 text-[#EB571E]" />, title: 'features.atlas_title', desc: 'features.atlas_desc' },
          { icon: <MapPin className="w-7 h-7 text-[#3884E0]" />, title: 'features.places_title', desc: 'features.places_desc' },
          { icon: <Car className="w-7 h-7 text-[#2EAE50]" />, title: 'features.garage_title', desc: 'features.garage_desc' },
        ].map((card) => (
          <div key={card.title} className="rounded-[28px] border border-black/5 bg-white p-7 shadow-sm">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f4f2ee]">{card.icon}</div>
            <h2 className="mb-3 text-[20px] font-bold text-[#1e1e23]">{t(card.title)}</h2>
            <p className="text-[15px] leading-relaxed text-[#1e1e23]/65">{t(card.desc)}</p>
          </div>
        ))}
      </section>

      {/* GAMIFICATION — profile screenshot first (looks good) */}
      <section className="w-full max-w-5xl mx-auto pb-14 md:pb-24 relative z-10">
        <div className="flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-[40px] font-bold mb-6 text-[#1e1e23]">{t('features.gamification_title')}</h2>
            <p className="text-[16px] text-[#1e1e23]/65 mb-8 leading-relaxed max-w-lg">{t('features.gamification_desc')}</p>
            <p className="text-[15px] text-[#1e1e23]/65 font-medium">{t('features.gamification_note')}</p>
          </div>
          <div className="w-[260px] md:w-[300px] aspect-[9/16] rounded-[32px] overflow-hidden shadow-lg border border-black/5 bg-[#f8f6f2] flex-shrink-0">
            <img src={screenProfile} alt={t('download.screenshot_alt')} width={640} height={1391} loading="lazy" decoding="async" className="w-full h-[145%] object-cover object-bottom" />
          </div>
        </div>
      </section>

      <section className="mb-12 grid w-full max-w-5xl gap-6 lg:grid-cols-2">
        <div className="rounded-[28px] border border-black/5 bg-white p-7 sm:p-8 shadow-sm">
          <Monitor aria-hidden className="mb-5 h-7 w-7 text-[#EB571E]" />
          <h2 className="mb-4 text-2xl font-bold">{t('features.web_title')}</h2>
          <p className="text-[16px] leading-relaxed text-[#1e1e23]/70">{t('features.web_desc')}</p>
          <Link to={href('/app')} className="mt-5 inline-flex min-h-11 items-center font-semibold text-[#EB571E] hover:underline">{t('features.web_link')} <span aria-hidden className="ml-2">→</span></Link>
          <p className="mt-3 text-[14px] leading-relaxed text-[#1e1e23]/65">{t('features.web_note')}</p>
        </div>
        <div className="rounded-[28px] border border-black/5 bg-[#f4f2ee] p-7 sm:p-8">
          <h2 className="mb-4 text-2xl font-bold">{t('features.pro_title')}</h2>
          <p className="text-[16px] leading-relaxed text-[#1e1e23]/70">{t('features.pro_desc')}</p>
          <Link to={href('/roadmap')} className="mt-5 inline-flex min-h-11 items-center font-semibold text-[#EB571E] hover:underline">{t('features.roadmap_link')} <span aria-hidden className="ml-2">→</span></Link>
        </div>
      </section>

      <section className="w-full max-w-5xl mx-auto py-12 text-left border-t border-black/5">
        <h2 className="text-[28px] sm:text-[36px] font-bold mb-8 text-[#1e1e23]">{t('features.comparison_title')}</h2>
        <ul className="grid gap-x-10 gap-y-4 sm:grid-cols-2">
          {included.map((key) => <li key={key} className="flex items-center gap-3 text-[17px] text-[#1e1e23]/75"><CheckCircle2 aria-hidden className="h-5 w-5 shrink-0 text-[#2EAE50]" />{t(`features.${key}`)}</li>)}
        </ul>
      </section>

      {/* CTA */}
      <div className="pt-8 pb-14 md:pt-12 md:pb-24 w-full flex flex-col items-center border-b border-black/5">
        <Link to={href('/download')} className="bg-[#EB571E] hover:bg-[#d14e1a] text-white rounded-full px-12 py-5 text-[20px] font-bold transition-transform hover:scale-105 active:scale-95 shadow-[0_2px_20px_rgba(235,87,30,0.3)] mb-4">{t('features.get_started')}</Link>
        <nav className="mt-6 flex flex-wrap justify-center gap-x-7 gap-y-1 text-[16px] font-medium">
          <Link to={href('/fog-of-war-map')} className="flex min-h-[44px] items-center text-[#EB571E] hover:underline">{t('features.link_fog')}</Link>
          <Link to={href('/google-timeline-alternative')} className="flex min-h-[44px] items-center text-[#EB571E] hover:underline">{t('features.link_timeline')}</Link>
        </nav>
      </div>

      {/* BENTO GRID — feature details at the bottom */}
      <section className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 pt-14 md:pt-24">
        <div className="md:col-span-2 row-span-2 bg-white border border-black/5 rounded-[32px] p-10 relative overflow-hidden group shadow-sm">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#EB571E]/5 blur-[80px] rounded-full group-hover:bg-[#EB571E]/10 transition-colors" />
          <h2 className="text-[24px] font-bold mb-4 relative z-10 text-[#1e1e23]">{t('features.records_title')}</h2>
          <p className="text-[16px] text-[#1e1e23]/65 mb-8 max-w-sm relative z-10 leading-relaxed">{t('features.records_desc')}</p>
          <div className="w-full h-[400px] bg-[#141518] rounded-3xl border border-black/10 mt-auto relative overflow-hidden flex items-center justify-center shadow-lg flex-col p-6">
            <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
            <div className="text-[#EB571E] font-mono text-[80px] font-bold leading-none mb-4 z-10">45<span className="text-[24px]">{t('home.globe.unit_kmh')}</span></div>
            <div className="w-full max-w-md h-2 bg-white/10 rounded-full overflow-hidden z-10"><div className="w-1/2 h-full bg-[#EB571E] rounded-full" /></div>
          </div>
        </div>

        <div className="bg-white border border-black/5 rounded-[32px] p-8 flex flex-col justify-between group h-[340px] shadow-sm">
          <div>
            <h2 className="text-[20px] font-bold mb-2 text-[#1e1e23]">{t('features.photos_title')}</h2>
            <p className="text-[#1e1e23]/65 text-[15px] leading-relaxed">{t('features.photos_desc')}</p>
          </div>
          <div className="w-full h-[140px] bg-[#f4f2ee] rounded-2xl mt-6 border border-black/5 flex items-center justify-center group-hover:scale-105 transition-transform overflow-hidden relative">
            <div className="w-20 h-20 bg-white rounded-xl rotate-12 absolute -right-4 -bottom-4 shadow-md border border-black/5" />
            <div className="w-20 h-20 bg-white rounded-xl -rotate-6 absolute left-10 top-10 shadow-md border border-black/5 flex items-center justify-center"><span className="text-2xl">📸</span></div>
          </div>
        </div>

        <div className="bg-white border border-black/5 rounded-[32px] p-8 flex flex-col justify-between group h-[340px] shadow-sm">
          <div>
            <h2 className="text-[20px] font-bold mb-2 text-[#1e1e23]">{t('features.stats_title')}</h2>
            <p className="text-[#1e1e23]/65 text-[15px] leading-relaxed">{t('features.stats_desc')}</p>
          </div>
          <div className="w-full h-[140px] bg-[#f4f2ee] rounded-2xl mt-6 border border-black/5 flex flex-col items-center justify-center p-4 group-hover:scale-105 transition-transform gap-2">
             <div className="w-full flex justify-between items-end h-12 gap-2">
               {[40, 70, 45, 90, 60, 30].map((h, i) => (<div key={i} className="w-full bg-[#EB571E] rounded-t-sm" style={{ height: `${h}%` }} />))}
             </div>
          </div>
        </div>

        <div className="md:col-span-2 bg-white border border-black/5 rounded-[32px] p-10 flex flex-col md:flex-row gap-8 items-center overflow-hidden relative group shadow-sm">
          <div className="flex-1 relative z-10">
            <h2 className="text-[24px] font-bold mb-4 text-[#1e1e23]">{t('features.fog_title')}</h2>
            <p className="text-[16px] text-[#1e1e23]/65 max-w-sm leading-relaxed">{t('features.fog_desc')}</p>
          </div>
          <div className="w-full md:w-1/2 h-[240px] bg-[#141518] rounded-3xl border border-black/10 relative overflow-hidden shadow-lg">
            <div className="absolute inset-0 bg-[#0a1628] z-10" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-[#EB571E] rounded-full blur-[50px] z-20 opacity-20" />
            <div className="absolute inset-0 z-30" style={{ background: 'radial-gradient(circle at 50% 50%, transparent 0%, rgba(10,22,40,0.95) 35%)' }}>
              <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.2) 1px, transparent 0)', backgroundSize: '20px 20px' }} />
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 240" preserveAspectRatio="none">
                <path d="M 50 180 Q 80 140, 120 130 Q 160 120, 180 90 Q 200 60, 250 80" fill="none" stroke="#EB571E" strokeWidth="4" strokeLinecap="round" opacity="0.8" />
                <circle cx="50" cy="180" r="4" fill="#2EAE50" />
                <circle cx="250" cy="80" r="4" fill="#EF4444" />
                <circle cx="150" cy="120" r="60" fill="url(#fogReveal)" />
                <defs><radialGradient id="fogReveal"><stop offset="0%" stopColor="rgba(56,132,224,0.15)" /><stop offset="100%" stopColor="transparent" /></radialGradient></defs>
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white border border-black/5 rounded-[32px] p-8 flex flex-col justify-between shadow-sm">
          <div>
            <h2 className="text-[20px] font-bold mb-2 text-[#1e1e23]">{t('features.private_title')}</h2>
            <p className="text-[#1e1e23]/65 text-[15px] leading-relaxed">{t('features.private_desc')}</p>
          </div>
          <div className="w-full h-[140px] bg-emerald-50 rounded-2xl mt-6 border border-emerald-500/20 flex flex-col items-center justify-center text-emerald-600 gap-3">
            <Lock className="w-8 h-8" />
            <span className="font-bold tracking-widest uppercase text-[10px]">{t('features.encrypted_offline')}</span>
          </div>
        </div>
      </section>
    </div>
  );
}
