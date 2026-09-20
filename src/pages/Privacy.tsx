import { Link } from 'react-router';
import { Smartphone, Cloud, Bug, Cookie, ShieldCheck, Mail } from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation';
import { usePageMeta } from '../components/PageMeta';

const CONTACT = 'nikitona123@gmail.com';

/**
 * The privacy policy. It is a page of the site rather than a file on GitHub
 * because the App Store listing points at it, the footer points at it, and a
 * policy that lives outside the site it describes is a policy nobody reads.
 *
 * Every claim here is one the code actually makes good on — the cookie section
 * names the analytics build we run and the tile host the trips map fetches
 * from, because "we respect your privacy" is not a statement about anything.
 */
export default function Privacy() {
  const { t, href } = useTranslation();
  usePageMeta('/privacy');

  return (
    <div className="flex-1 w-full max-w-3xl mx-auto px-5 sm:px-6 py-28 md:py-32">
      <header className="mb-12">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-6 text-[#1e1e23]">{t('privacy.h1')}</h1>
        <p className="text-[18px] text-[#1e1e23]/60 leading-relaxed">{t('privacy.lead')}</p>
        <p className="mt-5 text-[15px] text-[#1e1e23]/45 font-medium">{t('privacy.updated')}</p>
      </header>

      <section className="bg-white border border-black/5 rounded-2xl p-7 sm:p-8 shadow-sm mb-8">
        <h2 className="text-[22px] font-bold mb-5 text-[#1e1e23]">{t('privacy.summary_title')}</h2>
        <ul className="flex flex-col gap-3 text-[16px] text-[#1e1e23]/65 leading-relaxed">
          {['summary_1', 'summary_2', 'summary_3'].map((key) => (
            <li key={key} className="flex gap-3">
              <span aria-hidden className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#EB571E]" />
              <span>{t(`privacy.${key}`)}</span>
            </li>
          ))}
        </ul>
      </section>

      <Block icon={<Smartphone className="w-5 h-5 text-[#EB571E]" />} title={t('privacy.phone_title')}>
        <p>{t('privacy.phone_p1')}</p>
        <p>{t('privacy.phone_p2')}</p>
      </Block>

      <Block icon={<Cloud className="w-5 h-5 text-[#3884E0]" />} title={t('privacy.cloud_title')}>
        <p>{t('privacy.cloud_p1')}</p>
        <p>{t('privacy.cloud_p2')}</p>
        <p>{t('privacy.cloud_p3')}</p>
      </Block>

      <Block icon={<Bug className="w-5 h-5 text-[#1e1e23]/50" />} title={t('privacy.crash_title')}>
        <p>{t('privacy.crash_p1')}</p>
      </Block>

      <Block id="cookies" icon={<Cookie className="w-5 h-5 text-[#F5A623]" />} title={t('privacy.cookies_title')}>
        <p>{t('privacy.cookies_p1')}</p>
        <p>{t('privacy.cookies_p2')}</p>
        <p>{t('privacy.cookies_p3')}</p>
        <p>{t('privacy.cookies_p4')}</p>
        <p className="font-medium text-[#1e1e23]/80">{t('privacy.cookies_p5')}</p>
      </Block>

      <Block icon={<ShieldCheck className="w-5 h-5 text-[#2EAE50]" />} title={t('privacy.rights_title')}>
        <p>{t('privacy.rights_p1')}</p>
        <p>{t('privacy.rights_p2')}</p>
      </Block>

      <Block icon={<Mail className="w-5 h-5 text-[#EB571E]" />} title={t('privacy.contact_title')}>
        <p className="text-[16px]">
          {t('privacy.contact_p1')}{' '}
          <a href={`mailto:${CONTACT}`} className="text-[#EB571E] font-medium hover:underline break-all">
            {CONTACT}
          </a>
        </p>
      </Block>

      <nav className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-[16px] font-medium">
        <Link to={href('/')} className="flex min-h-[44px] items-center text-[#EB571E] hover:underline">
          {t('page.home')}
        </Link>
        <Link to={href('/features')} className="flex min-h-[44px] items-center text-[#EB571E] hover:underline">
          {t('page.features')}
        </Link>
        <Link to={href('/download')} className="flex min-h-[44px] items-center text-[#EB571E] hover:underline">
          {t('page.download')}
        </Link>
      </nav>
    </div>
  );
}

function Block({
  id,
  icon,
  title,
  children,
}: {
  id?: string;
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    // scroll-mt clears the fixed header when the footer's #cookies link lands here
    <section id={id} className="bg-white border border-black/5 rounded-2xl p-7 sm:p-8 shadow-sm mb-8 scroll-mt-28">
      <h2 className="flex items-center gap-3 text-[22px] font-bold mb-5 text-[#1e1e23]">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f4f2ee]">{icon}</span>
        {title}
      </h2>
      <div className="flex flex-col gap-4 text-[16px] text-[#1e1e23]/65 leading-relaxed">{children}</div>
    </section>
  );
}
