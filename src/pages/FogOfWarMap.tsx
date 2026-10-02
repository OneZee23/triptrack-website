import { Link } from 'react-router';
import { useTranslation } from '../i18n/useTranslation';
import { usePageMeta } from '../components/PageMeta';
import { AppStoreBadge } from '../components/AppStoreBadge';
import { CheckCircle2, MapPin, Eye, EyeOff, Compass, Trophy } from 'lucide-react';
import screenFeed from '../assets/screen-feed.webp';

const STEPS = [
  { icon: <EyeOff className="w-5 h-5 text-[#1e1e23]/65" />, key: 'step1' },
  { icon: <MapPin className="w-5 h-5 text-[#EB571E]" />, key: 'step2' },
  { icon: <Eye className="w-5 h-5 text-[#2EAE50]" />, key: 'step3' },
  { icon: <Compass className="w-5 h-5 text-[#F5A623]" />, key: 'step4' },
];

const CAPABILITIES = ["row_fog", "row_diary", "row_speed", "row_photos", "row_badges", "row_garage", "row_free", "row_offline", "row_noaccount"];

export default function FogOfWarMap() {
  const { t, href } = useTranslation();
  usePageMeta('/fog-of-war-map');

  return (
    <div className="flex-1 w-full max-w-3xl mx-auto px-5 sm:px-6 pt-28 pb-16 md:py-32">
      {/* Hero */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 rounded-full px-4 py-1.5 text-[14px] font-medium mb-8">
          <Eye className="w-4 h-4 shrink-0" />
          {t('fog.badge')}
        </div>
        <h1 className="text-[30px] sm:text-4xl md:text-6xl font-bold tracking-tighter mb-6 text-[#1e1e23]">{t('fog.h1')}</h1>
        <p className="text-[18px] text-[#1e1e23]/65 max-w-2xl mx-auto leading-relaxed">{t('fog.lead')}</p>
      </div>

      {/* Fog illustration — the page is about a picture, so it shows one */}
      <div className="relative mb-8 h-[220px] md:h-[280px] overflow-hidden rounded-3xl border border-black/10 bg-[#0a1628] shadow-lg" aria-hidden>
        <div className="absolute inset-0 opacity-25" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.22) 1px, transparent 0)', backgroundSize: '22px 22px' }} />
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 600 280" preserveAspectRatio="xMidYMid slice">
          <defs>
            <radialGradient id="fogClear">
              <stop offset="0%" stopColor="rgba(235,87,30,0.22)" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>
          <circle cx="300" cy="140" r="150" fill="url(#fogClear)" />
          <path d="M 60 230 Q 150 180, 230 165 Q 330 145, 380 95 Q 430 45, 545 70" fill="none" stroke="#EB571E" strokeWidth="6" strokeLinecap="round" opacity="0.9" />
          <circle cx="60" cy="230" r="7" fill="#2EAE50" />
          <circle cx="545" cy="70" r="7" fill="#EF4444" />
        </svg>
      </div>

      {/* What is it */}
      <section className="bg-white border border-black/5 rounded-2xl p-7 sm:p-8 shadow-sm mb-8">
        <h2 className="text-[22px] md:text-2xl font-bold mb-5 text-[#1e1e23]">{t('fog.what_title')}</h2>
        <div className="flex flex-col gap-4 text-[16px] text-[#1e1e23]/65 leading-relaxed">
          <p>{t('fog.what_p1')}</p>
          <p>{t('fog.what_p2')}</p>
          <p>{t('fog.what_p3')}</p>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white border border-black/5 rounded-2xl p-7 sm:p-8 shadow-sm mb-8">
        <h2 className="text-[20px] font-bold mb-6 text-[#1e1e23]">{t('fog.how_title')}</h2>
        <div className="flex flex-col gap-6">
          {STEPS.map((step) => (
            <div key={step.key} className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-[#f4f2ee] flex items-center justify-center shrink-0">{step.icon}</div>
              <div>
                <h3 className="font-bold text-[#1e1e23] mb-1 text-[17px]">{t(`fog.${step.key}_title`)}</h3>
                <p className="text-[15px] text-[#1e1e23]/65 leading-relaxed">{t(`fog.${step.key}_desc`)}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white border border-black/5 rounded-2xl p-7 sm:p-8 shadow-sm mb-8">
        <h2 className="text-[22px] font-bold mb-6 text-[#1e1e23]">{t('fog.table_title')}</h2>
        <ul className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
          {CAPABILITIES.map((key) => (
            <li key={key} className="flex items-start gap-3 text-[15px] leading-relaxed text-[#1e1e23]/70">
              <CheckCircle2 aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-[#2EAE50]" />
              {t(`fog.${key}`)}
            </li>
          ))}
        </ul>
      </section>

      {/* Screenshot */}
      <div className="flex justify-center mb-12">
        <div className="w-[240px] aspect-[9/16] rounded-[28px] overflow-hidden shadow-lg border border-black/5 bg-[#f8f6f2]">
          <img src={screenFeed} alt={t('fog.screenshot_alt')} width={480} height={1043} loading="lazy" decoding="async" className="w-full h-[145%] object-cover object-bottom" />
        </div>
      </div>

      {/* CTA */}
      <div className="text-center">
        <h2 className="text-[26px] md:text-3xl font-bold mb-4 text-[#1e1e23] flex items-center justify-center gap-3">
          <Trophy aria-hidden className="w-6 h-6 text-[#F5A623]" />
          {t('fog.cta_title')}
        </h2>
        <p className="text-[#1e1e23]/65 mb-8 text-[15px]">{t('fog.cta_note')}</p>
        <AppStoreBadge className="h-[56px]" />
        <nav className="mt-10 flex flex-wrap justify-center gap-x-7 gap-y-1 text-[16px] font-medium">
          <Link to={href('/features')} className="flex min-h-[44px] items-center text-[#EB571E] hover:underline">{t('fog.link_features')}</Link>
          <Link to={href('/google-timeline-alternative')} className="flex min-h-[44px] items-center text-[#EB571E] hover:underline">{t('fog.link_timeline')}</Link>
        </nav>
      </div>
    </div>
  );
}
