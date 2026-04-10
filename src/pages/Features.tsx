import { Lock, CheckCircle2, XCircle } from 'lucide-react';
import screenProfile from '../assets/screen-profile.png';
import { Link } from 'react-router';
import { useTranslation } from '../i18n/useTranslation';

export default function Features() {
  const { t } = useTranslation();

  const comparisonRows = [
    { name: t('features.auto_recording'), t: true, g: false, p: false },
    { name: t('features.trip_diary'), t: true, g: false, p: true },
    { name: t('features.attach_photos'), t: true, g: false, p: true },
    { name: t('features.fog_map'), t: true, g: false, p: false },
    { name: t('features.offline_private'), t: true, g: false, p: false },
    { name: t('features.no_account'), t: true, g: false, p: false },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-32 flex flex-col items-center relative z-10">
      <section className="text-center mb-24 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#EB571E]/5 blur-[100px] rounded-full pointer-events-none -z-10" />
        <h1 className="text-[40px] md:text-[72px] font-bold tracking-tighter mb-6 text-[#1e1e23]">{t('features.hero_title')}</h1>
        <p className="text-[16px] md:text-[18px] text-[#1e1e23]/50 max-w-2xl mx-auto leading-relaxed">{t('features.hero_subtitle')}</p>
      </section>

      {/* GAMIFICATION — profile screenshot first (looks good) */}
      <section className="w-full max-w-5xl mx-auto pb-24 relative z-10">
        <div className="flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-[40px] font-bold mb-6 text-[#1e1e23]">{t('features.gamification_title')}</h2>
            <p className="text-[16px] text-[#1e1e23]/50 mb-8 leading-relaxed max-w-lg">{t('features.gamification_desc')}</p>
            <p className="text-[13px] text-[#1e1e23]/35 font-medium">{t('features.gamification_note')}</p>
          </div>
          <div className="w-[260px] md:w-[300px] aspect-[9/16] rounded-[32px] overflow-hidden shadow-lg border border-black/5 bg-[#f8f6f2] flex-shrink-0">
            <img src={screenProfile} alt="Driver Profile with levels and badges" className="w-full h-[145%] object-cover object-bottom" />
          </div>
        </div>
      </section>

      {/* COMPARISON TABLE */}
      <section className="w-full max-w-5xl mx-auto py-24 text-left border-t border-black/5">
        <h2 className="text-[40px] font-bold mb-16 text-center text-[#1e1e23]">{t('features.comparison_title')}</h2>
        <div className="overflow-x-auto pb-8 bg-white rounded-3xl border border-black/5 shadow-sm">
          <table className="w-full min-w-[600px] border-collapse">
            <thead>
              <tr className="border-b border-black/5">
                <th className="py-6 px-6 text-left font-bold text-[12px] uppercase tracking-wider text-[#1e1e23]/35 w-1/3">{t('features.comparison_features')}</th>
                <th className="py-6 px-4 text-center font-bold text-[#1e1e23] text-[20px]">TripTrack</th>
                <th className="py-6 px-4 text-center font-bold text-[14px] text-[#1e1e23]/40">Google Timeline</th>
                <th className="py-6 px-4 text-center font-bold text-[14px] text-[#1e1e23]/40">Polarsteps</th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row, i) => (
                <tr key={i} className="border-b border-black/5 last:border-b-0 hover:bg-[#f8f6f2] transition-colors">
                  <td className="py-6 px-6 font-medium text-[16px] text-[#1e1e23]/70">{row.name}</td>
                  <td className="py-6 px-4 text-center"><CheckCircle2 className="w-6 h-6 text-[#2EAE50] mx-auto" /></td>
                  <td className="py-6 px-4 text-center">{row.g ? <CheckCircle2 className="w-5 h-5 text-[#2EAE50]/60 mx-auto" /> : <XCircle className="w-5 h-5 text-red-400/50 mx-auto" />}</td>
                  <td className="py-6 px-4 text-center">{row.p ? <CheckCircle2 className="w-5 h-5 text-[#2EAE50]/60 mx-auto" /> : <XCircle className="w-5 h-5 text-red-400/50 mx-auto" />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* CTA */}
      <div className="pt-12 pb-24 w-full flex flex-col items-center border-b border-black/5">
        <Link to="/download" className="bg-[#EB571E] hover:bg-[#d14e1a] text-white rounded-full px-12 py-5 text-[20px] font-bold transition-all hover:scale-105 active:scale-95 shadow-[0_2px_20px_rgba(235,87,30,0.3)] mb-4">{t('features.get_started')}</Link>
      </div>

      {/* BENTO GRID — feature details at the bottom */}
      <section className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 pt-24">
        <div className="md:col-span-2 row-span-2 bg-white border border-black/5 rounded-[32px] p-10 relative overflow-hidden group shadow-sm">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#EB571E]/5 blur-[80px] rounded-full group-hover:bg-[#EB571E]/10 transition-colors" />
          <h3 className="text-[24px] font-bold mb-4 relative z-10 text-[#1e1e23]">{t('features.records_title')}</h3>
          <p className="text-[16px] text-[#1e1e23]/50 mb-8 max-w-sm relative z-10 leading-relaxed">{t('features.records_desc')}</p>
          <div className="w-full h-[400px] bg-[#141518] rounded-3xl border border-black/10 mt-auto relative overflow-hidden flex items-center justify-center shadow-lg flex-col p-6">
            <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
            <div className="text-[#EB571E] font-mono text-[80px] font-bold leading-none mb-4 z-10">45<span className="text-[24px]">km/h</span></div>
            <div className="w-full max-w-md h-2 bg-white/10 rounded-full overflow-hidden z-10"><div className="w-1/2 h-full bg-[#EB571E] rounded-full" /></div>
          </div>
        </div>

        <div className="bg-white border border-black/5 rounded-[32px] p-8 flex flex-col justify-between group h-[340px] shadow-sm">
          <div>
            <h3 className="text-[20px] font-bold mb-2 text-[#1e1e23]">{t('features.photos_title')}</h3>
            <p className="text-[#1e1e23]/50 text-[12px] leading-relaxed">{t('features.photos_desc')}</p>
          </div>
          <div className="w-full h-[140px] bg-[#f4f2ee] rounded-2xl mt-6 border border-black/5 flex items-center justify-center group-hover:scale-105 transition-transform overflow-hidden relative">
            <div className="w-20 h-20 bg-white rounded-xl rotate-12 absolute -right-4 -bottom-4 shadow-md border border-black/5" />
            <div className="w-20 h-20 bg-white rounded-xl -rotate-6 absolute left-10 top-10 shadow-md border border-black/5 flex items-center justify-center"><span className="text-2xl">📸</span></div>
          </div>
        </div>

        <div className="bg-white border border-black/5 rounded-[32px] p-8 flex flex-col justify-between group h-[340px] shadow-sm">
          <div>
            <h3 className="text-[20px] font-bold mb-2 text-[#1e1e23]">{t('features.stats_title')}</h3>
            <p className="text-[#1e1e23]/50 text-[12px] leading-relaxed">{t('features.stats_desc')}</p>
          </div>
          <div className="w-full h-[140px] bg-[#f4f2ee] rounded-2xl mt-6 border border-black/5 flex flex-col items-center justify-center p-4 group-hover:scale-105 transition-transform gap-2">
             <div className="w-full flex justify-between items-end h-12 gap-2">
               {[40, 70, 45, 90, 60, 30].map((h, i) => (<div key={i} className="w-full bg-[#EB571E] rounded-t-sm" style={{ height: `${h}%` }} />))}
             </div>
          </div>
        </div>

        <div className="md:col-span-2 bg-white border border-black/5 rounded-[32px] p-10 flex flex-col md:flex-row gap-8 items-center overflow-hidden relative group shadow-sm">
          <div className="flex-1 relative z-10">
            <h3 className="text-[24px] font-bold mb-4 text-[#1e1e23]">{t('features.fog_title')}</h3>
            <p className="text-[16px] text-[#1e1e23]/50 max-w-sm leading-relaxed">{t('features.fog_desc')}</p>
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
            <h3 className="text-[20px] font-bold mb-2 text-[#1e1e23]">{t('features.private_title')}</h3>
            <p className="text-[#1e1e23]/50 text-[12px] leading-relaxed">{t('features.private_desc')}</p>
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
