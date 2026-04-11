import { Shield, Heart, MessageCircle, Play } from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation';
import { usePageMeta } from '../components/PageMeta';
import logo from '../assets/avatar.png';

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
    </svg>
  );
}

const STORY_STEPS = [
  {
    emoji: '🗺️',
    color: '#DC3C32',
    titleEn: 'Google killed my memories',
    titleRu: 'Google убил мои воспоминания',
    textEn: 'Early 2025. Google deletes years of location history overnight. That spontaneous weekend trip to the mountains? The scenic coastal road last summer? Gone. Millions of people lost their travel diaries without warning.',
    textRu: 'Начало 2025. Google удаляет годы истории местоположений за одну ночь. Та спонтанная поездка в горы на выходных? Живописная дорога вдоль побережья прошлым летом? Исчезли. Миллионы людей потеряли дневники путешествий без предупреждения.',
  },
  {
    emoji: '🚗',
    color: '#EB571E',
    titleEn: 'I just drive a lot',
    titleRu: 'Я просто много езжу',
    textEn: "I'm OneZee, indie developer from Krasnodar. 71,000 km on my car. Weekly commutes, road trips to the coast, spontaneous drives to the mountains. Nothing extreme — just a regular guy who drives every day and wants to remember where he's been.",
    textRu: 'Я OneZee, инди-разработчик из Краснодара. 71 000 км на одометре. Еженедельные поездки, путешествия на побережье, спонтанные выезды в горы. Ничего экстремального — просто обычный парень, который ездит каждый день и хочет помнить, где был.',
  },
  {
    emoji: '🤷',
    color: '#3884E0',
    titleEn: 'Nothing existed for this',
    titleRu: 'Для этого ничего не было',
    textEn: 'Strava is for athletes. Polarsteps is for vacation itineraries. MileIQ counts business miles. I searched for something simple: press start, drive, see your route later. An album for roads. Nothing.',
    textRu: 'Strava для спортсменов. Polarsteps для отпускных маршрутов. MileIQ считает рабочие мили. Я искал что-то простое: нажми старт, езжай, потом посмотри маршрут. Альбом для дорог. Ничего такого не было.',
  },
  {
    emoji: '🔨',
    color: '#2EAE50',
    titleEn: 'So I built it myself',
    titleRu: 'И я сделал сам',
    textEn: "TripTrack started as a weekend project. Auto-recording, route colored by speed, trip photos, fog of war exploration map. 60+ trips tracked so far. It's open source, it's free, and your data never leaves your phone.",
    textRu: 'TripTrack начался как проект на выходных. Автозапись, маршрут по цветам скорости, фото к поездкам, карта тумана войны. 60+ поездок записано. Открытый код, бесплатно, данные не покидают телефон.',
  },
];

export default function About() {
  const { t, lang } = useTranslation();
  usePageMeta(
    lang === 'ru' ? 'О проекте TripTrack — Инди-приложение от водителя для водителей' : 'About TripTrack — Indie App Built by a Driver, for Drivers',
    lang === 'ru' ? 'Как появился TripTrack. История создания дневника поездок после того, как Google удалил историю местоположений.' : 'How TripTrack was born. The story behind building a drive diary after Google killed location history.',
  );

  return (
    <div className="flex-1 w-full max-w-3xl mx-auto px-6 py-32 flex flex-col items-center">
      {/* Header */}
      <img src={logo} alt="TripTrack" className="w-20 h-20 rounded-2xl shadow-lg mb-8" />
      <h1 className="text-4xl md:text-6xl font-bold tracking-tighter text-center mb-4 text-[#1e1e23]">
        {lang === 'ru' ? 'Как появился TripTrack' : 'How TripTrack was born'}
      </h1>
      <p className="text-[#1e1e23]/40 text-center mb-20">
        {lang === 'ru' ? 'Не стартап. Не бизнес. Просто нужное приложение.' : 'Not a startup. Not a business. Just a needed app.'}
      </p>

      {/* Story Timeline */}
      <div className="w-full relative">
        {/* Vertical line */}
        <div className="absolute left-6 md:left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#DC3C32] via-[#EB571E] via-[#3884E0] to-[#2EAE50]" />

        <div className="flex flex-col gap-12">
          {STORY_STEPS.map((step, i) => (
            <div key={i} className="relative pl-16 md:pl-20">
              {/* Dot on the line */}
              <div
                className="absolute left-[14px] md:left-[22px] top-1 w-6 h-6 rounded-full border-[3px] bg-white flex items-center justify-center z-10"
                style={{ borderColor: step.color }}
              >
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: step.color }} />
              </div>

              {/* Card */}
              <div className="bg-white border border-black/5 rounded-2xl p-6 md:p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">{step.emoji}</span>
                  <h3 className="text-xl font-bold text-[#1e1e23]">
                    {lang === 'ru' ? step.titleRu : step.titleEn}
                  </h3>
                </div>
                <p className="text-[#1e1e23]/55 leading-relaxed">
                  {lang === 'ru' ? step.textRu : step.textEn}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* End dot */}
        <div className="absolute left-[14px] md:left-[22px] bottom-0 w-6 h-6 rounded-full bg-[#2EAE50] flex items-center justify-center z-10">
          <div className="w-2 h-2 rounded-full bg-white" />
        </div>
      </div>

      {/* Values */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mt-20 mb-20">
        <div className="bg-white border border-black/5 rounded-2xl p-8 flex items-start gap-5 shadow-sm">
          <div className="w-11 h-11 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold mb-2 text-[#1e1e23]">{t('about.private_title')}</h3>
            <p className="text-[#1e1e23]/50 leading-relaxed text-sm">{t('about.private_desc')}</p>
          </div>
        </div>
        <div className="bg-white border border-black/5 rounded-2xl p-8 flex items-start gap-5 shadow-sm">
          <div className="w-11 h-11 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
            <Heart className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold mb-2 text-[#1e1e23]">{t('about.indie_title')}</h3>
            <p className="text-[#1e1e23]/50 leading-relaxed text-sm">{t('about.indie_desc')}</p>
          </div>
        </div>
      </div>

      {/* Social links */}
      <div className="flex flex-col items-center border-t border-black/5 pt-16 w-full">
        <h2 className="text-2xl font-bold mb-8 text-[#1e1e23]">{t('about.connect_title')}</h2>
        <div className="flex flex-wrap justify-center gap-4">
          <a href="https://github.com/OneZee23/trip-track-ios" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 bg-white hover:bg-[#f4f2ee] border border-black/10 rounded-full px-7 py-3.5 font-semibold transition-all hover:scale-105 text-[#1e1e23] shadow-sm text-sm">
            <GithubIcon className="w-5 h-5" /> {t('about.open_source')}
          </a>
          <a href="https://t.me/triptrack_app" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 bg-white hover:bg-[#f4f2ee] border border-black/10 rounded-full px-7 py-3.5 font-semibold transition-all hover:scale-105 text-[#1e1e23] shadow-sm text-sm">
            <MessageCircle className="w-5 h-5" /> {t('about.telegram')}
          </a>
          <a href="https://www.youtube.com/@onezee_dev" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 bg-white hover:bg-[#f4f2ee] border border-black/10 rounded-full px-7 py-3.5 font-semibold transition-all hover:scale-105 text-[#1e1e23] shadow-sm text-sm">
            <Play className="w-5 h-5" /> {t('about.youtube')}
          </a>
        </div>
      </div>
    </div>
  );
}
