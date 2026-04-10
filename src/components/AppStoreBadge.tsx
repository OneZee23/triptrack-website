const APP_STORE_URL = 'https://apps.apple.com/us/app/triptrack-road-journal/id6760650361';

export function AppStoreBadge({ className = 'h-[56px]' }: { className?: string }) {
  return (
    <a href={APP_STORE_URL} target="_blank" rel="noopener" className="inline-block hover:scale-105 active:scale-95 transition-transform">
      <img
        src="https://tools.applemediaservices.com/api/badges/download-on-the-app-store/black/en-us?size=250x83"
        alt="Download on the App Store"
        className={className}
      />
    </a>
  );
}

export { APP_STORE_URL };
