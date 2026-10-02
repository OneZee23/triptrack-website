import { useTranslation } from '../i18n/useTranslation';
import badge from '../assets/app-store-badge.svg';

const APP_STORE_URL = 'https://apps.apple.com/us/app/triptrack-road-journal/id6760650361';

export function AppStoreBadge({ className = 'h-[56px]' }: { className?: string }) {
  const { lang } = useTranslation();
  return (
    <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer" className="inline-block hover:scale-105 active:scale-[0.96] transition-transform">
      <img src={badge} alt={lang === 'ru' ? 'Загрузить в App Store' : 'Download on the App Store'} width={180} height={60} decoding="async" className={className} />
    </a>
  );
}

export { APP_STORE_URL };
