import { Smartphone, Apple } from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation';
import screenProfile from '../assets/screen-profile.png';
import { AppStoreBadge } from '../components/AppStoreBadge';
import { usePageMeta } from '../components/PageMeta';

export default function Download() {
  const { t, lang } = useTranslation();
  usePageMeta(
    lang === 'ru' ? 'Скачать TripTrack бесплатно — App Store' : 'Download TripTrack Free — App Store',
    lang === 'ru' ? 'Скачайте TripTrack для iPhone бесплатно. iOS 17+, без аккаунта, без подписок. Все данные на вашем устройстве.' : 'Download TripTrack for iPhone for free. iOS 17+, no account, no subscriptions. All data stays on your device.',
  );

  return (
    <div className="flex-1 w-full min-h-screen flex flex-col items-center justify-center relative overflow-hidden py-40 px-6">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#EB571E]/5 blur-[150px] rounded-full pointer-events-none -z-10" />

      <div className="flex flex-col items-center text-center max-w-3xl relative z-10 w-full">
        {/* iPhone Mockup — stays dark */}
        <div className="w-[280px] md:w-[320px] aspect-[9/16] rounded-[32px] overflow-hidden shadow-[0_8px_60px_rgba(0,0,0,0.1)] border border-black/5 bg-[#f8f6f2] mb-16">
          <img src={screenProfile} alt="TripTrack Driver Profile" className="w-full h-[145%] object-cover object-bottom" />
        </div>

        <h1 className="text-[40px] md:text-[72px] font-bold tracking-tighter mb-8 leading-tight text-[#1e1e23]">
          {t('download.hero_title_1')}<span className="text-[#EB571E]">{t('download.hero_title_2')}</span>.
        </h1>
        <p className="text-[18px] text-[#1e1e23]/50 mb-16 max-w-xl leading-relaxed">{t('download.hero_subtitle')}</p>

        <div className="mb-16">
          <AppStoreBadge className="h-[64px]" />
        </div>

        <div className="flex flex-col items-center gap-8 border-t border-black/5 pt-16 mt-8 w-full">
          <div className="flex flex-col md:flex-row justify-center gap-6 text-left">
            <div className="flex items-center gap-4 text-[#1e1e23]/50">
              <div className="w-10 h-10 rounded-full bg-[#f4f2ee] flex items-center justify-center"><Smartphone className="w-5 h-5 text-[#1e1e23]" /></div>
              <span className="font-medium text-[16px]">{t('download.req_ios')}</span>
            </div>
            <div className="flex items-center gap-4 text-[#1e1e23]/50">
              <div className="w-10 h-10 rounded-full bg-[#f4f2ee] flex items-center justify-center"><Apple className="w-5 h-5 text-[#1e1e23]" /></div>
              <span className="font-medium text-[16px]">{t('download.req_iphone')}</span>
            </div>
            <div className="flex items-center gap-4 text-[#1e1e23]/50">
               <div className="w-10 h-10 rounded-full bg-[#f4f2ee] flex items-center justify-center text-[#1e1e23] font-bold font-mono">0</div>
               <span className="font-medium text-[16px]">{t('download.req_free')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
