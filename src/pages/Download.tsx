import { Link } from 'react-router';
import { Smartphone, Apple } from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation';
import screenProfile from '../assets/screen-profile.webp';
import { AppStoreBadge } from '../components/AppStoreBadge';
import { usePageMeta } from '../components/PageMeta';

export default function Download() {
  const { t, href } = useTranslation();
  usePageMeta('/download');

  return (
    <div className="flex-1 w-full flex flex-col items-center relative overflow-hidden pt-28 pb-16 md:py-32 px-5 sm:px-6">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] max-w-[150vw] bg-[#EB571E]/5 blur-[150px] rounded-full pointer-events-none -z-10" />

      <div className="flex flex-col items-center text-center max-w-3xl relative z-10 w-full">
        <div className="w-[260px] md:w-[300px] aspect-[9/16] rounded-[32px] overflow-hidden shadow-[0_8px_60px_rgba(0,0,0,0.1)] border border-black/5 bg-[#f8f6f2] mb-14">
          <img
            src={screenProfile}
            alt={t('download.screenshot_alt')}
            width={640}
            height={1391}
            loading="eager"
            fetchPriority="high"
            decoding="async"
            className="w-full h-[145%] object-cover object-bottom"
          />
        </div>

        <h1 className="text-[32px] sm:text-[40px] md:text-[64px] font-bold tracking-tighter mb-7 leading-tight text-[#1e1e23]">
          {t('download.h1')}
        </h1>
        <p className="text-[18px] text-[#1e1e23]/65 mb-10 max-w-xl leading-relaxed">{t('download.hero_subtitle')}</p>

        <div className="mb-14">
          <AppStoreBadge className="h-[64px]" />
        </div>

        <div className="max-w-2xl text-left flex flex-col gap-5 text-[16px] text-[#1e1e23]/65 leading-relaxed">
          <p>{t('download.p1')}</p>
          <p>{t('download.p2')}</p>
        </div>

        <div className="flex flex-col items-center gap-8 border-t border-black/5 pt-14 mt-14 w-full">
          <div className="flex flex-col md:flex-row justify-center gap-6 text-left">
            <div className="flex items-center gap-4 text-[#1e1e23]/65">
              <div className="w-10 h-10 rounded-full bg-[#f4f2ee] flex items-center justify-center shrink-0"><Smartphone className="w-5 h-5 text-[#1e1e23]" /></div>
              <span className="font-medium text-[16px]">{t('download.req_ios')}</span>
            </div>
            <div className="flex items-center gap-4 text-[#1e1e23]/65">
              <div className="w-10 h-10 rounded-full bg-[#f4f2ee] flex items-center justify-center shrink-0"><Apple className="w-5 h-5 text-[#1e1e23]" /></div>
              <span className="font-medium text-[16px]">{t('download.req_iphone')}</span>
            </div>
            <div className="flex items-center gap-4 text-[#1e1e23]/65">
              <div className="w-10 h-10 rounded-full bg-[#f4f2ee] flex items-center justify-center text-[#1e1e23] font-bold font-mono shrink-0">0</div>
              <span className="font-medium text-[16px]">{t('download.req_free')}</span>
            </div>
          </div>

          <nav className="flex flex-wrap justify-center gap-x-7 gap-y-1 text-[16px] font-medium">
            <Link to={href('/features')} className="flex min-h-[44px] items-center text-[#EB571E] hover:underline">{t('download.link_features')}</Link>
            <Link to={href('/privacy')} className="flex min-h-[44px] items-center text-[#EB571E] hover:underline">{t('download.link_privacy')}</Link>
          </nav>
        </div>
      </div>
    </div>
  );
}
