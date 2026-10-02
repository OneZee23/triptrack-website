import { Map, Camera, Target, Compass, MapPin, ShieldCheck, ChevronDown, Sparkles, Monitor } from 'lucide-react';
import { Link } from 'react-router';
import { useTranslation } from '../i18n/useTranslation';
import { usePageMeta } from '../components/PageMeta';
import { AppStoreBadge } from '../components/AppStoreBadge';
import { FAQ_IDS } from '../lib/faq';
import GlobeHero from '../components/globe/GlobeHero';

import screenRecording from '../assets/screen-recording.webp';
import screenDetail from '../assets/screen-detail.webp';
import screenLockscreen from '../assets/screen-lockscreen.webp';

const PROBLEMS = [
  { icon: Map, key: 'timeline' },
  { icon: Camera, key: 'photos' },
  { icon: Target, key: 'noapp' },
] as const;

// All three are below the hero — the first of them by a screen and a half —
// so none of them is eager. Step 1 used to be, and it put an 85 KB photograph
// on the critical path of a page whose largest element is a line of text.
const STEPS = [
  { n: '01', image: screenLockscreen, key: 'step1', ring: 'emerald' },
  { n: '02', image: screenRecording, key: 'step2', ring: 'accent' },
  { n: '03', image: screenDetail, key: 'step3', ring: 'red' },
] as const;

const RING: Record<string, string> = {
  emerald: 'bg-emerald-500/20 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]',
  accent: 'bg-[#EB571E]/20 border-[#EB571E] shadow-[0_0_20px_rgba(235,87,30,0.3)]',
  red: 'bg-red-500/20 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)]',
};
const DOT: Record<string, string> = { emerald: 'bg-emerald-500', accent: 'bg-[#EB571E]', red: 'bg-red-500' };

export default function Home() {
  const { t, href } = useTranslation();
  usePageMeta('/');

  return (
    <div className="w-full flex flex-col items-center">

      {/* GLOBE HERO — carries the page's one <h1> */}
      <GlobeHero />

      {/* PROBLEM STATEMENT */}
      <section className="w-full max-w-6xl mx-auto px-5 sm:px-6 py-12 md:py-20 border-t border-black/5 mt-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PROBLEMS.map(({ icon: Icon, key }) => (
            <div key={key} className="bg-white border border-black/5 p-8 rounded-[32px] hover:-translate-y-2 transition-transform shadow-sm">
              <Icon aria-hidden className="w-8 h-8 text-[#EB571E] mb-6" />
              <h2 className="text-xl font-semibold mb-3 text-[#1e1e23]">{t(`home.problem_${key}_title`)}</h2>
              <p className="text-[#1e1e23]/65 text-[15px] leading-relaxed">{t(`home.problem_${key}_desc`)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="w-full max-w-6xl mx-auto px-5 sm:px-6 py-16 md:py-32 text-center relative border-t border-black/5">
        <h2 className="text-[32px] md:text-[40px] font-bold mb-20 text-[#1e1e23]">{t('home.how_title')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-16 relative">
          <div aria-hidden className="absolute top-[20%] left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-emerald-500/20 via-[#EB571E]/50 to-red-500/20 hidden md:block" />
          {STEPS.map((step) => (
            <div key={step.n} className="relative z-10 flex flex-col items-center">
              <span aria-hidden className="absolute -top-12 text-[120px] font-bold text-black/[0.03] leading-none select-none">{step.n}</span>
              <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center mb-8 ${RING[step.ring]}`}>
                <div className={`w-3 h-3 rounded-full ${DOT[step.ring]}`} />
              </div>
              <div className="w-[240px] max-w-full h-[380px] rounded-[28px] mb-6 shadow-lg overflow-hidden border border-black/5 bg-[#f8f6f2]">
                <img
                  src={step.image}
                  alt={t(`home.${step.key}_alt`)}
                  width={480}
                  height={1043}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-[150%] object-cover object-bottom"
                />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-[#1e1e23]">{t(`home.${step.key}_title`)}</h3>
              <p className="text-[#1e1e23]/65 text-[15px] px-4 leading-relaxed">{t(`home.${step.key}_desc`)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ATLAS — the fog of war map */}
      <section className="w-full bg-[#f4f2ee] border-y border-black/5">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 py-14 md:py-28 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
              <Compass aria-hidden className="w-6 h-6 text-[#EB571E]" />
            </div>
            <h2 className="text-[30px] md:text-[40px] font-bold mb-6 text-[#1e1e23]">{t('home.atlas.title')}</h2>
            <div className="flex flex-col gap-4 text-[16px] text-[#1e1e23]/65 leading-relaxed">
              <p>{t('home.atlas.p1')}</p>
              <p>{t('home.atlas.p2')}</p>
            </div>
            <Link to={href('/fog-of-war-map')} className="mt-7 inline-flex min-h-[44px] items-center gap-2 text-[16px] font-semibold text-[#EB571E] hover:underline">
              {t('home.atlas.link')} <span aria-hidden>→</span>
            </Link>
          </div>
          {/* Not a screenshot: there is no atlas screenshot in the press kit yet,
              and a drawing that says so is better than a picture that implies
              it is one. */}
          <div aria-hidden className="relative h-[260px] md:h-[320px] overflow-hidden rounded-[32px] border border-black/10 bg-[#0a1628] shadow-lg">
            <div className="absolute inset-0 opacity-25" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.22) 1px, transparent 0)', backgroundSize: '22px 22px' }} />
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 600 320" preserveAspectRatio="xMidYMid slice">
              <defs>
                <radialGradient id="homeFogClear">
                  <stop offset="0%" stopColor="rgba(235,87,30,0.22)" />
                  <stop offset="100%" stopColor="transparent" />
                </radialGradient>
              </defs>
              <circle cx="300" cy="160" r="170" fill="url(#homeFogClear)" />
              <path d="M 50 270 Q 160 215, 250 195 Q 350 172, 400 110 Q 450 55, 560 85" fill="none" stroke="#EB571E" strokeWidth="7" strokeLinecap="round" opacity="0.9" />
              <circle cx="50" cy="270" r="8" fill="#2EAE50" />
              <circle cx="560" cy="85" r="8" fill="#EF4444" />
            </svg>
          </div>
        </div>
      </section>

      {/* PLACES AND JOURNEYS */}
      <section className="w-full max-w-6xl mx-auto px-5 sm:px-6 py-14 md:py-28 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div className="order-2 md:order-1 flex justify-center">
          <div className="w-[240px] max-w-full aspect-[9/16] rounded-[32px] overflow-hidden shadow-lg border border-black/5 bg-[#f8f6f2]">
            <img src={screenDetail} alt={t('home.step3_alt')} width={480} height={1043} loading="lazy" decoding="async" className="w-full h-[145%] object-cover object-bottom" />
          </div>
        </div>
        <div className="order-1 md:order-2">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f4f2ee]">
            <MapPin aria-hidden className="w-6 h-6 text-[#3884E0]" />
          </div>
          <h2 className="text-[30px] md:text-[40px] font-bold mb-6 text-[#1e1e23]">{t('home.places.title')}</h2>
          <div className="flex flex-col gap-4 text-[16px] text-[#1e1e23]/65 leading-relaxed">
            <p>{t('home.places.p1')}</p>
            <p>{t('home.places.p2')}</p>
          </div>
          <Link to={href('/features')} className="mt-7 inline-flex min-h-[44px] items-center gap-2 text-[16px] font-semibold text-[#EB571E] hover:underline">
            {t('home.places.link')} <span aria-hidden>→</span>
          </Link>
        </div>
      </section>

      {/* Your library is already available on the web. */}
      <section className="w-full max-w-6xl mx-auto px-5 sm:px-6 pb-14 md:pb-24">
        <div className="rounded-[32px] bg-[#1e252b] text-white p-7 sm:p-10 md:p-12 grid gap-7 md:grid-cols-[1fr_auto] md:items-center">
          <div className="max-w-2xl">
            <Monitor aria-hidden className="mb-5 h-8 w-8 text-[#ffb47d]" />
            <h2 className="text-[28px] sm:text-[34px] font-bold text-balance">{t('home.web.title')}</h2>
            <p className="mt-4 text-base leading-relaxed text-white/80">{t('home.web.desc')}</p>
            <p className="mt-3 text-sm leading-relaxed text-white/65">{t('home.web.note')}</p>
          </div>
          <Link to={href('/app/trips')} className="inline-flex min-h-[48px] items-center justify-center gap-3 rounded-xl bg-white px-6 py-3 font-semibold text-[#1e252b] transition-[background-color,transform] hover:bg-[#fff0df] active:scale-[0.96]">
            {t('home.web.cta')} <span aria-hidden>→</span>
          </Link>
        </div>
      </section>

      {/* PRIVACY */}
      <section className="w-full bg-[#f4f2ee] border-y border-black/5">
        <div className="max-w-4xl mx-auto px-5 sm:px-6 py-14 md:py-28 text-center">
          <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
            <ShieldCheck aria-hidden className="w-6 h-6 text-[#2EAE50]" />
          </div>
          <h2 className="text-[30px] md:text-[40px] font-bold mb-6 text-[#1e1e23]">{t('home.privacy.title')}</h2>
          <p className="mx-auto max-w-2xl text-[16px] text-[#1e1e23]/65 leading-relaxed">{t('home.privacy.p1')}</p>
          <ul className="mx-auto mt-10 grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
            {['point_device', 'point_account', 'point_ads'].map((key) => (
              <li key={key} className="rounded-2xl border border-black/5 bg-white px-5 py-6 text-[15px] font-medium leading-relaxed text-[#1e1e23]/70 shadow-sm">
                {t(`home.privacy.${key}`)}
              </li>
            ))}
          </ul>
          <Link to={href('/privacy')} className="mt-8 inline-flex min-h-[44px] items-center gap-2 text-[16px] font-semibold text-[#EB571E] hover:underline">
            {t('home.privacy.link')} <span aria-hidden>→</span>
          </Link>
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section className="w-full py-14 md:py-28 text-center relative z-10 px-5 sm:px-6">
        <p className="text-[20px] font-bold mb-12 text-[#1e1e23]">{t('home.rating')}</p>
        <div className="max-w-2xl mx-auto">
          <figure className="bg-white border border-black/5 p-8 sm:p-10 rounded-3xl text-center shadow-sm">
            <blockquote className="text-[18px] leading-relaxed mb-6 text-[#1e1e23] italic">{t('home.review1')}</blockquote>
            <figcaption className="font-semibold text-[14px] text-[#1e1e23]/65">
              OKOPOK &middot;{' '}
              <a href="https://apps.apple.com/us/app/triptrack-road-journal/id6760650361" target="_blank" rel="noopener noreferrer" className="text-[#EB571E] hover:underline">App Store</a>
            </figcaption>
          </figure>
        </div>
      </section>

      {/* PLUS — one line, no prices */}
      <section className="w-full max-w-4xl mx-auto px-5 sm:px-6 pb-8">
        <div className="flex flex-col items-start gap-4 rounded-[28px] border border-black/5 bg-white p-7 sm:flex-row sm:items-center sm:gap-6 sm:p-8 shadow-sm">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#f4f2ee]">
            <Sparkles aria-hidden className="w-6 h-6 text-[#F5A623]" />
          </div>
          <div>
            <h2 className="text-[20px] font-bold text-[#1e1e23] mb-2">{t('home.plus.title')}</h2>
            <p className="text-[16px] text-[#1e1e23]/65 leading-relaxed">{t('home.plus.p1')}</p>
          </div>
        </div>
      </section>

      {/* FAQ — the questions here are the ones in the FAQPage JSON-LD */}
      <section className="w-full max-w-3xl mx-auto px-5 sm:px-6 py-12 md:py-24">
        <h2 className="text-[30px] md:text-[40px] font-bold mb-10 text-center text-[#1e1e23]">{t('home.faq_title')}</h2>
        <div className="flex flex-col gap-3">
          {FAQ_IDS.map((id) => (
            <details key={id} className="group rounded-2xl border border-black/5 bg-white px-6 shadow-sm">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 text-[17px] font-semibold text-[#1e1e23] [&::-webkit-details-marker]:hidden">
                {t(`home.faq.${id}.q`)}
                <ChevronDown aria-hidden className="w-5 h-5 shrink-0 text-[#1e1e23]/65 transition-transform group-open:rotate-180" />
              </summary>
              <p className="pb-5 text-[16px] leading-relaxed text-[#1e1e23]/65">{t(`home.faq.${id}.a`)}</p>
            </details>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="w-full max-w-4xl mx-auto px-5 sm:px-6 py-16 md:py-32 text-center relative z-10">
        <h2 className="text-[36px] md:text-[64px] font-bold tracking-tighter mb-8 text-[#1e1e23]">{t('home.cta_title')}</h2>
        <div className="mb-6 flex justify-center">
          <AppStoreBadge className="h-[60px]" />
        </div>
        <Link to={href('/download')} className="inline-flex min-h-[44px] items-center text-[16px] font-semibold text-[#EB571E] hover:underline">
          {t('home.cta_button')}
        </Link>
        <p className="mt-8 text-[14px] text-[#1e1e23]/65 font-medium">{t('home.cta_note')}</p>
      </section>
    </div>
  );
}
