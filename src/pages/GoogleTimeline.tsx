import { Link } from 'react-router';
import { useTranslation } from '../i18n/useTranslation';
import { usePageMeta } from '../components/PageMeta';
import { AppStoreBadge } from '../components/AppStoreBadge';
import { CheckCircle2, Map, Shield, Smartphone } from 'lucide-react';
import screenFeed from '../assets/screen-feed.webp';

const CAPABILITIES = ["row_works", "row_auto", "row_speed", "row_photos", "row_stats", "row_offline", "row_noaccount", "row_ondevice", "row_fog", "row_badges"];

export default function GoogleTimeline() {
  const { t, href } = useTranslation();
  usePageMeta('/google-timeline-alternative');

  return (
    <div className="flex-1 w-full max-w-3xl mx-auto px-5 sm:px-6 pt-28 pb-16 md:py-32">
      {/* Hero */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 bg-[#EB571E]/10 text-[#ad3e15] rounded-full px-4 py-1.5 text-[14px] font-medium mb-8">
          <Map aria-hidden className="w-4 h-4 shrink-0" />
          {t('gt.badge')}
        </div>
        <h1 className="text-[30px] sm:text-4xl md:text-6xl font-bold tracking-tighter mb-6 text-[#1e1e23]">{t('gt.h1')}</h1>
        <p className="text-[18px] text-[#1e1e23]/65 max-w-2xl mx-auto leading-relaxed">{t('gt.lead')}</p>
      </div>

      {/* What happened */}
      <section className="bg-white border border-black/5 rounded-2xl p-7 sm:p-8 shadow-sm mb-8">
        <h2 className="text-[22px] md:text-2xl font-bold mb-5 text-[#1e1e23]">{t('gt.what_title')}</h2>
        <div className="flex flex-col gap-4 text-[16px] text-[#1e1e23]/65 leading-relaxed">
          <p>{t('gt.what_p1')}</p>
          <p>{t('gt.what_p2')}</p>
          <p>{t('gt.what_p3')}</p>
          <a href="https://support.google.com/maps/answer/6258979" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center text-[#EB571E] underline underline-offset-4">{t('gt.source_link')}</a>
        </div>
      </section>

      <section className="bg-white border border-black/5 rounded-2xl p-7 sm:p-8 shadow-sm mb-8">
        <h2 className="text-[22px] font-bold mb-6 text-[#1e1e23]">{t('gt.table_title')}</h2>
        <ul className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
          {CAPABILITIES.map((key) => (
            <li key={key} className="flex items-start gap-3 text-[15px] leading-relaxed text-[#1e1e23]/70">
              <CheckCircle2 aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-[#2EAE50]" />
              {t(`gt.${key}`)}
            </li>
          ))}
        </ul>
      </section>

      {/* Key features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[
          { icon: <Map className="w-8 h-8 text-[#EB571E] mx-auto mb-3" />, title: 'gt.speed_title', desc: 'gt.speed_desc' },
          { icon: <Shield className="w-8 h-8 text-[#2EAE50] mx-auto mb-3" />, title: 'gt.private_title', desc: 'gt.private_desc' },
          { icon: <Smartphone className="w-8 h-8 text-[#3884E0] mx-auto mb-3" />, title: 'gt.free_title', desc: 'gt.free_desc' },
        ].map((card) => (
          <div key={card.title} className="bg-white border border-black/5 rounded-2xl p-6 shadow-sm text-center">
            {card.icon}
            <h3 className="font-bold text-[#1e1e23] mb-1 text-[17px]">{t(card.title)}</h3>
            <p className="text-[15px] text-[#1e1e23]/65 leading-relaxed">{t(card.desc)}</p>
          </div>
        ))}
      </div>

      {/* Moving over */}
      <section className="bg-white border border-black/5 rounded-2xl p-7 sm:p-8 shadow-sm mb-12">
        <h2 className="text-[22px] md:text-2xl font-bold mb-5 text-[#1e1e23]">{t('gt.import_title')}</h2>
        <div className="flex flex-col gap-4 text-[16px] text-[#1e1e23]/65 leading-relaxed">
          <p>{t('gt.import_p1')}</p>
          <p>{t('gt.import_p2')}</p>
          <a href="https://support.google.com/maps/answer/14169818" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center text-[#EB571E] underline underline-offset-4">{t('gt.export_link')}</a>
        </div>
      </section>

      {/* Screenshot */}
      <div className="flex justify-center mb-12">
        <div className="w-[240px] aspect-[9/16] rounded-[28px] overflow-hidden shadow-lg border border-black/5 bg-[#f8f6f2]">
          <img src={screenFeed} alt={t('gt.screenshot_alt')} width={480} height={1043} loading="lazy" decoding="async" className="w-full h-[145%] object-cover object-bottom" />
        </div>
      </div>

      {/* CTA */}
      <div className="text-center">
        <h2 className="text-[26px] md:text-3xl font-bold mb-4 text-[#1e1e23]">{t('gt.cta_title')}</h2>
        <p className="text-[#1e1e23]/65 mb-8 text-[15px]">{t('gt.cta_note')}</p>
        <AppStoreBadge className="h-[56px]" />
        <nav className="mt-10 flex flex-wrap justify-center gap-x-7 gap-y-1 text-[16px] font-medium">
          <Link to={href('/fog-of-war-map')} className="flex min-h-[44px] items-center text-[#EB571E] hover:underline">{t('gt.link_fog')}</Link>
          <Link to={href('/features')} className="flex min-h-[44px] items-center text-[#EB571E] hover:underline">{t('gt.link_features')}</Link>
        </nav>
      </div>
    </div>
  );
}
