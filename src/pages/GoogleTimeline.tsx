import { Link } from 'react-router';
import { useTranslation } from '../i18n/useTranslation';
import { usePageMeta } from '../components/PageMeta';
import { AppStoreBadge } from '../components/AppStoreBadge';
import { CheckCircle2, XCircle, Map, Shield, Smartphone } from 'lucide-react';
import screenFeed from '../assets/screen-feed.png';

export default function GoogleTimeline() {
  const { lang } = useTranslation();
  usePageMeta(
    lang === 'ru' ? 'Замена Google Timeline — TripTrack для iPhone' : 'Google Timeline Alternative — TripTrack for iPhone',
    lang === 'ru' ? 'Google удалил историю местоположений в 2025. TripTrack — бесплатная замена для iPhone: автозапись поездок, маршруты, фото, статистика. Приватно, офлайн.' : 'Google killed location history in 2025. TripTrack is a free Google Timeline alternative for iPhone: auto-records drives, routes, photos, stats. Private, offline.',
  );

  return (
    <div className="flex-1 w-full max-w-3xl mx-auto px-6 py-28 md:py-32">
      {/* Hero */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 bg-red-50 text-red-600 rounded-full px-4 py-1.5 text-sm font-medium mb-8">
          <XCircle className="w-4 h-4" />
          {lang === 'ru' ? 'Google Timeline закрыт в 2025' : 'Google Timeline shut down in 2025'}
        </div>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-6 text-[#1e1e23]">
          {lang === 'ru' ? 'Замена Google Timeline для iPhone' : 'The Google Timeline Alternative'}
        </h1>
        <p className="text-lg text-[#1e1e23]/50 max-w-2xl mx-auto leading-relaxed">
          {lang === 'ru'
            ? 'В 2025 году Google удалил годы истории местоположений без предупреждения. TripTrack — бесплатное приложение которое записывает ваши поездки и хранит всё на вашем iPhone.'
            : 'In 2025 Google wiped years of location history without warning. TripTrack is a free app that records your drives and keeps everything on your iPhone.'}
        </p>
      </div>

      {/* What happened */}
      <div className="bg-white border border-black/5 rounded-2xl p-8 shadow-sm mb-8">
        <h2 className="text-2xl font-bold mb-4 text-[#1e1e23]">
          {lang === 'ru' ? 'Что случилось с Google Timeline?' : 'What happened to Google Timeline?'}
        </h2>
        <p className="text-[#1e1e23]/55 leading-relaxed mb-4">
          {lang === 'ru'
            ? 'Google Timeline (история местоположений) отслеживала все ваши перемещения и показывала где вы были каждый день. В 2025 году Google прекратил поддержку Timeline в веб-версии и начал удалять данные. Миллионы пользователей потеряли многолетнюю историю передвижений.'
            : 'Google Timeline (Location History) tracked everywhere you went and showed where you\'d been each day. In 2025 Google discontinued the web version and started deleting data. Millions of users lost years of travel history.'}
        </p>
        <p className="text-[#1e1e23]/55 leading-relaxed">
          {lang === 'ru'
            ? 'Если вы ищете замену Google Timeline — TripTrack делает то же самое, но лучше: записывает поездки автоматически, показывает маршрут по цветам скорости, и все данные остаются только на вашем телефоне.'
            : 'If you\'re looking for a Google Timeline replacement, TripTrack does the same thing but better: records trips automatically, shows speed-colored routes, and all data stays on your phone.'}
        </p>
      </div>

      {/* Comparison */}
      <div className="bg-white border border-black/5 rounded-2xl shadow-sm mb-8 overflow-hidden">
        <h2 className="text-xl font-bold p-8 pb-4 text-[#1e1e23]">
          {lang === 'ru' ? 'TripTrack vs Google Timeline' : 'TripTrack vs Google Timeline'}
        </h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-black/5">
              <th className="py-3 px-6 text-left text-[#1e1e23]/35 font-medium text-xs uppercase tracking-wider">{lang === 'ru' ? 'Функция' : 'Feature'}</th>
              <th className="py-3 px-4 text-center font-bold text-[#1e1e23]">TripTrack</th>
              <th className="py-3 px-4 text-center text-[#1e1e23]/40">Google Timeline</th>
            </tr>
          </thead>
          <tbody>
            {[
              { feature: lang === 'ru' ? 'Работает в 2026' : 'Works in 2026', tt: true, gt: false },
              { feature: lang === 'ru' ? 'Автозапись поездок' : 'Auto-records trips', tt: true, gt: true },
              { feature: lang === 'ru' ? 'Маршрут по скорости' : 'Speed-colored routes', tt: true, gt: false },
              { feature: lang === 'ru' ? 'Фото на маршруте' : 'Photos on route', tt: true, gt: false },
              { feature: lang === 'ru' ? 'Статистика поездок' : 'Trip statistics', tt: true, gt: false },
              { feature: lang === 'ru' ? '100% офлайн' : '100% offline', tt: true, gt: false },
              { feature: lang === 'ru' ? 'Без аккаунта' : 'No account needed', tt: true, gt: false },
              { feature: lang === 'ru' ? 'Данные на устройстве' : 'Data on device', tt: true, gt: false },
              { feature: 'Fog of War', tt: true, gt: false },
              { feature: lang === 'ru' ? 'Бейджи и уровни' : 'Badges & levels', tt: true, gt: false },
            ].map((row, i) => (
              <tr key={i} className="border-b border-black/5 last:border-b-0">
                <td className="py-3 px-6 text-[#1e1e23]/70">{row.feature}</td>
                <td className="py-3 px-4 text-center"><CheckCircle2 className="w-5 h-5 text-[#2EAE50] mx-auto" /></td>
                <td className="py-3 px-4 text-center">{row.gt ? <CheckCircle2 className="w-5 h-5 text-[#1e1e23]/15 mx-auto" /> : <XCircle className="w-5 h-5 text-red-400/40 mx-auto" />}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Key features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
        <div className="bg-white border border-black/5 rounded-2xl p-6 shadow-sm text-center">
          <Map className="w-8 h-8 text-[#EB571E] mx-auto mb-3" />
          <h3 className="font-bold text-[#1e1e23] mb-1">{lang === 'ru' ? 'Маршруты по скорости' : 'Speed-colored routes'}</h3>
          <p className="text-[13px] text-[#1e1e23]/45">{lang === 'ru' ? 'Видно где ехали быстро, где стояли в пробке' : 'See where you drove fast and where you sat in traffic'}</p>
        </div>
        <div className="bg-white border border-black/5 rounded-2xl p-6 shadow-sm text-center">
          <Shield className="w-8 h-8 text-[#2EAE50] mx-auto mb-3" />
          <h3 className="font-bold text-[#1e1e23] mb-1">{lang === 'ru' ? '100% приватно' : '100% private'}</h3>
          <p className="text-[13px] text-[#1e1e23]/45">{lang === 'ru' ? 'Google видел все ваши данные. TripTrack — нет' : 'Google saw all your data. TripTrack doesn\'t'}</p>
        </div>
        <div className="bg-white border border-black/5 rounded-2xl p-6 shadow-sm text-center">
          <Smartphone className="w-8 h-8 text-[#3884E0] mx-auto mb-3" />
          <h3 className="font-bold text-[#1e1e23] mb-1">{lang === 'ru' ? 'Бесплатно навсегда' : 'Free forever'}</h3>
          <p className="text-[13px] text-[#1e1e23]/45">{lang === 'ru' ? 'Без подписок, без рекламы, без скрытых платежей' : 'No subscriptions, no ads, no hidden fees'}</p>
        </div>
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
          {lang === 'ru' ? 'Скачайте замену Google Timeline' : 'Get your Google Timeline replacement'}
        </h2>
        <p className="text-[#1e1e23]/40 mb-8">
          {lang === 'ru' ? 'iPhone · iOS 17+ · Бесплатно · Без регистрации' : 'iPhone · iOS 17+ · Free · No sign-up'}
        </p>
        <AppStoreBadge className="h-[56px]" />
      </div>
    </div>
  );
}
