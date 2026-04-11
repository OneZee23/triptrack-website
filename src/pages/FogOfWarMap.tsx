import { useTranslation } from '../i18n/useTranslation';
import { usePageMeta } from '../components/PageMeta';
import { AppStoreBadge } from '../components/AppStoreBadge';
import { CheckCircle2, XCircle, MapPin, Eye, EyeOff, Trophy } from 'lucide-react';
import screenFeed from '../assets/screen-feed.png';

export default function FogOfWarMap() {
  const { lang } = useTranslation();
  usePageMeta(
    lang === 'ru' ? 'Fog of War карта для iPhone — TripTrack' : 'Fog of War Map App for iPhone — TripTrack',
    lang === 'ru' ? 'Откройте карту как в видеоигре! TripTrack покрывает мир туманом войны и открывает территорию по мере ваших поездок. Бесплатно, офлайн, приватно.' : 'Uncover the map like a video game! TripTrack covers the world in fog of war and reveals territory as you drive. Free, offline, private.',
  );

  return (
    <div className="flex-1 w-full max-w-3xl mx-auto px-6 py-28 md:py-32">
      {/* Hero */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-600 rounded-full px-4 py-1.5 text-sm font-medium mb-8">
          <Eye className="w-4 h-4" />
          {lang === 'ru' ? 'Карта-игра для водителей' : 'A game map for drivers'}
        </div>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-6 text-[#1e1e23]">
          {lang === 'ru' ? 'Fog of War карта' : 'Fog of War Map'}
        </h1>
        <p className="text-lg text-[#1e1e23]/50 max-w-2xl mx-auto leading-relaxed">
          {lang === 'ru'
            ? 'Помните туман войны из стратегий? TripTrack покрывает весь мир туманом и открывает территорию по мере ваших поездок. Каждый километр — новое открытие.'
            : 'Remember fog of war from strategy games? TripTrack covers the entire world in fog and reveals territory as you drive. Every kilometer is a new discovery.'}
        </p>
      </div>

      {/* What is Fog of War */}
      <div className="bg-white border border-black/5 rounded-2xl p-8 shadow-sm mb-8">
        <h2 className="text-2xl font-bold mb-4 text-[#1e1e23]">
          {lang === 'ru' ? 'Что такое Fog of War?' : 'What is Fog of War?'}
        </h2>
        <p className="text-[#1e1e23]/55 leading-relaxed mb-4">
          {lang === 'ru'
            ? 'Fog of War (туман войны) — механика из видеоигр, где карта скрыта тёмным туманом пока вы не исследуете территорию. В TripTrack это работает так же: вся карта мира покрыта туманом, и он рассеивается только там, где вы реально проехали.'
            : 'Fog of War is a video game mechanic where the map is hidden by dark fog until you explore the territory. In TripTrack it works the same way: the entire world map is covered in fog, and it only clears where you\'ve actually driven.'}
        </p>
        <p className="text-[#1e1e23]/55 leading-relaxed">
          {lang === 'ru'
            ? 'Это превращает каждую поездку в маленькое приключение. Выбираете новый маршрут на работу? Открываете новый район. Едете в отпуск? Целая полоса тумана исчезает. Со временем ваша карта становится уникальной историей всех мест, где вы побывали.'
            : 'This turns every drive into a small adventure. Taking a new route to work? You uncover a new neighborhood. Going on a road trip? A whole strip of fog disappears. Over time your map becomes a unique story of everywhere you\'ve been.'}
        </p>
      </div>

      {/* How it works */}
      <div className="bg-white border border-black/5 rounded-2xl p-8 shadow-sm mb-8">
        <h2 className="text-xl font-bold mb-6 text-[#1e1e23]">
          {lang === 'ru' ? 'Как это работает' : 'How it works'}
        </h2>
        <div className="space-y-6">
          {[
            {
              icon: <EyeOff className="w-5 h-5 text-[#1e1e23]/30" />,
              title: lang === 'ru' ? 'Весь мир в тумане' : 'The whole world in fog',
              desc: lang === 'ru'
                ? 'При первом запуске вся карта покрыта туманом. Вы начинаете с нуля — как в новой игре.'
                : 'When you first start, the entire map is covered in fog. You begin from scratch — like a new game.',
            },
            {
              icon: <MapPin className="w-5 h-5 text-[#EB571E]" />,
              title: lang === 'ru' ? 'Езжайте — туман рассеивается' : 'Drive — the fog clears',
              desc: lang === 'ru'
                ? 'Каждая записанная поездка открывает полосу на карте. Чем больше ездите, тем больше открываете.'
                : 'Every recorded trip reveals a strip on the map. The more you drive, the more you uncover.',
            },
            {
              icon: <Eye className="w-5 h-5 text-[#2EAE50]" />,
              title: lang === 'ru' ? 'Смотрите свой прогресс' : 'See your progress',
              desc: lang === 'ru'
                ? 'Открывайте карту и смотрите, сколько территории вы уже исследовали. Находите белые пятна и планируйте новые маршруты.'
                : 'Open the map and see how much territory you\'ve explored. Find blank spots and plan new routes.',
            },
            {
              icon: <Trophy className="w-5 h-5 text-[#F5A623]" />,
              title: lang === 'ru' ? 'Получайте достижения' : 'Earn achievements',
              desc: lang === 'ru'
                ? 'Открывайте бейджи за исследование новых территорий, городов и регионов.'
                : 'Unlock badges for exploring new territories, cities, and regions.',
            },
          ].map((step, i) => (
            <div key={i} className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-[#f4f2ee] flex items-center justify-center flex-shrink-0">
                {step.icon}
              </div>
              <div>
                <h3 className="font-bold text-[#1e1e23] mb-1">{step.title}</h3>
                <p className="text-sm text-[#1e1e23]/50">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Comparison */}
      <div className="bg-white border border-black/5 rounded-2xl shadow-sm mb-8 overflow-hidden">
        <h2 className="text-xl font-bold p-8 pb-4 text-[#1e1e23]">
          {lang === 'ru' ? 'TripTrack vs Fog of World' : 'TripTrack vs Fog of World'}
        </h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-black/5">
              <th className="py-3 px-6 text-left text-[#1e1e23]/35 font-medium text-xs uppercase tracking-wider">{lang === 'ru' ? 'Функция' : 'Feature'}</th>
              <th className="py-3 px-4 text-center font-bold text-[#1e1e23]">TripTrack</th>
              <th className="py-3 px-4 text-center text-[#1e1e23]/40">Fog of World</th>
            </tr>
          </thead>
          <tbody>
            {[
              { feature: 'Fog of War', tt: true, fow: true },
              { feature: lang === 'ru' ? 'Дневник поездок' : 'Trip diary & feed', tt: true, fow: false },
              { feature: lang === 'ru' ? 'Маршрут по скорости' : 'Speed-colored routes', tt: true, fow: false },
              { feature: lang === 'ru' ? 'Фото на маршруте' : 'Photos on route', tt: true, fow: false },
              { feature: lang === 'ru' ? 'Бейджи и уровни' : 'Badges & levels', tt: true, fow: false },
              { feature: lang === 'ru' ? 'Гараж машин' : 'Vehicle garage', tt: true, fow: false },
              { feature: lang === 'ru' ? 'Бесплатно' : 'Free', tt: true, fow: false },
              { feature: lang === 'ru' ? 'Открытый код' : 'Open source', tt: true, fow: false },
              { feature: lang === 'ru' ? '100% офлайн' : '100% offline', tt: true, fow: true },
            ].map((row, i) => (
              <tr key={i} className="border-b border-black/5 last:border-b-0">
                <td className="py-3 px-6 text-[#1e1e23]/70">{row.feature}</td>
                <td className="py-3 px-4 text-center"><CheckCircle2 className="w-5 h-5 text-[#2EAE50] mx-auto" /></td>
                <td className="py-3 px-4 text-center">{row.fow ? <CheckCircle2 className="w-5 h-5 text-[#1e1e23]/15 mx-auto" /> : <XCircle className="w-5 h-5 text-red-400/40 mx-auto" />}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Screenshot */}
      <div className="flex justify-center mb-12">
        <div className="w-[240px] aspect-[9/16] rounded-[28px] overflow-hidden shadow-lg border border-black/5 bg-[#f8f6f2]">
          <img src={screenFeed} alt="TripTrack Feed" className="w-full h-[145%] object-cover object-bottom" />
        </div>
      </div>

      {/* CTA */}
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-4 text-[#1e1e23]">
          {lang === 'ru' ? 'Начните открывать карту' : 'Start uncovering the map'}
        </h2>
        <p className="text-[#1e1e23]/40 mb-8">
          {lang === 'ru' ? 'iPhone · iOS 17+ · Бесплатно · Без регистрации' : 'iPhone · iOS 17+ · Free · No sign-up'}
        </p>
        <AppStoreBadge className="h-[56px]" />
      </div>
    </div>
  );
}
