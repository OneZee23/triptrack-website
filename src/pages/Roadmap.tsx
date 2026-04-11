import { MessageCircle } from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation';
import { usePageMeta } from '../components/PageMeta';

type Status = 'done' | 'current' | 'planned' | 'future';

interface Milestone {
  version: string;
  name?: string;
  date: { en: string; ru: string };
  status: Status;
  features: { en: string; ru: string }[];
  note?: { en: string; ru: string };
}

interface Quarter {
  label: { en: string; ru: string };
  status: Status;
  milestones: Milestone[];
}

const ROADMAP: Quarter[] = [
  {
    label: { en: 'Q1 2026 — Launch', ru: 'Q1 2026 — Запуск' },
    status: 'done',
    milestones: [
      {
        version: 'v0.1.0', name: 'First Mile',
        date: { en: 'Mar 24', ru: '24 мар' },
        status: 'done',
        features: [
          { en: 'GPS tracking with speed-colored routes', ru: 'GPS-трекинг с маршрутом по цветам скорости' },
          { en: 'Trip feed with monthly grouping', ru: 'Лента поездок с группировкой по месяцам' },
          { en: 'Live Activity on Lock Screen', ru: 'Live Activity на экране блокировки' },
          { en: '30+ badges & driver levels', ru: '30+ бейджей и уровни водителя' },
          { en: 'Vehicle garage with avatars', ru: 'Гараж с аватарами машин' },
          { en: 'Fog of War exploration map', ru: 'Карта тумана войны' },
        ],
      },
      {
        version: 'v0.1.1',
        date: { en: 'Apr 7', ru: '7 апр' },
        status: 'done',
        features: [
          { en: 'GPS anomaly filtering', ru: 'Фильтрация GPS-аномалий' },
          { en: 'Fuel tracking fixes', ru: 'Исправления учёта топлива' },
          { en: 'City detection improvements', ru: 'Улучшение определения городов' },
        ],
      },
    ],
  },
  {
    label: { en: 'Q2 2026 — Polish & Export', ru: 'Q2 2026 — Полировка и экспорт' },
    status: 'current',
    milestones: [
      {
        version: 'v0.2.0', name: 'Fog Cleared',
        date: { en: 'Apr 10', ru: '10 апр' },
        status: 'done',
        features: [
          { en: 'Fog of War 2.0 — soft gradients & reveal animations', ru: 'Туман войны 2.0 — мягкие градиенты и анимация открытия' },
          { en: 'Vehicle detail screen with progress', ru: 'Экран деталей машины с прогрессом' },
          { en: 'Temporal fog (state at trip completion)', ru: 'Темпоральный туман (состояние на момент поездки)' },
        ],
      },
      {
        version: 'v0.3.0',
        date: { en: 'May — Jun', ru: 'Май — Июн' },
        status: 'current',
        features: [
          { en: 'Auto-start recording (motion detection)', ru: 'Автостарт записи (детекция движения)' },
          { en: 'GPX / CSV export', ru: 'Экспорт GPX / CSV' },
          { en: 'Push notifications (streaks, forgotten recording)', ru: 'Пуш-уведомления (стрики, забытая запись)' },
        ],
      },
    ],
  },
  {
    label: { en: 'Q3 2026 — Widgets & Watch', ru: 'Q3 2026 — Виджеты и часы' },
    status: 'planned',
    milestones: [
      {
        version: 'v0.4.0',
        date: { en: 'Jul — Aug', ru: 'Июл — Авг' },
        status: 'planned',
        features: [
          { en: 'Home Screen widgets (last trip, weekly stats)', ru: 'Виджеты на Home Screen (последняя поездка, статы за неделю)' },
          { en: 'Siri Shortcuts integration', ru: 'Интеграция с Siri Shortcuts' },
        ],
      },
      {
        version: 'v0.5.0',
        date: { en: 'Sep', ru: 'Сен' },
        status: 'planned',
        features: [
          { en: 'Apple Watch companion app', ru: 'Приложение для Apple Watch' },
          { en: 'Quick start/stop from wrist', ru: 'Быстрый старт/стоп с запястья' },
        ],
      },
    ],
  },
  {
    label: { en: 'Q4 2026 — Sync & Social', ru: 'Q4 2026 — Синхронизация и шеринг' },
    status: 'planned',
    milestones: [
      {
        version: 'v0.6.0',
        date: { en: 'Oct — Nov', ru: 'Окт — Ноя' },
        status: 'planned',
        features: [
          { en: 'iCloud sync between devices', ru: 'iCloud-синхронизация между устройствами' },
        ],
      },
      {
        version: 'v0.7.0',
        date: { en: 'Dec', ru: 'Дек' },
        status: 'planned',
        features: [
          { en: 'Route sharing & social cards 2.0', ru: 'Шеринг маршрутов и социальные карточки 2.0' },
        ],
      },
    ],
  },
  {
    label: { en: '2027 — Open Highway', ru: '2027 — Открытая дорога' },
    status: 'future',
    milestones: [
      {
        version: 'vNext',
        date: { en: '2027', ru: '2027' },
        status: 'future',
        features: [
          { en: 'Community features & shared routes', ru: 'Сообщество и общие маршруты' },
          { en: 'CarPlay integration', ru: 'Интеграция с CarPlay' },
          { en: 'Android?', ru: 'Android?' },
        ],
      },
    ],
  },
];

const DOT_COLOR: Record<Status, string> = {
  done: '#2EAE50',
  current: '#EB571E',
  planned: 'rgba(30,30,35,0.15)',
  future: 'rgba(30,30,35,0.08)',
};

const BADGE_CLASS: Record<Status, string> = {
  done: 'bg-[#2EAE50]/10 text-[#2EAE50]',
  current: 'bg-[#EB571E]/10 text-[#EB571E]',
  planned: 'bg-[#1e1e23]/5 text-[#1e1e23]/40',
  future: 'bg-[#1e1e23]/5 text-[#1e1e23]/30',
};

const CARD_CLASS: Record<Status, string> = {
  done: 'bg-white border-black/5',
  current: 'bg-white border-[#EB571E]/20 shadow-[0_0_20px_rgba(235,87,30,0.06)]',
  planned: 'bg-white border-black/5',
  future: 'bg-[#f8f6f2] border-black/5',
};

function lineColor(status: Status): string {
  if (status === 'done') return '#2EAE50';
  if (status === 'current') return '#EB571E';
  return 'rgba(30,30,35,0.1)';
}

export default function Roadmap() {
  const { lang } = useTranslation();
  const l = (obj: { en: string; ru: string }) => lang === 'ru' ? obj.ru : obj.en;
  usePageMeta(
    lang === 'ru' ? 'Роудмап TripTrack — План развития приложения' : 'TripTrack Roadmap — Development Plan',
    lang === 'ru' ? 'План развития TripTrack по кварталам 2026: автостарт, виджеты, Apple Watch, iCloud синхронизация.' : 'TripTrack development plan by quarter: auto-start, widgets, Apple Watch, iCloud sync, route sharing.',
  );

  return (
    <div className="flex-1 w-full max-w-2xl mx-auto px-6 py-32">
      <div className="text-center mb-20">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-4 text-[#1e1e23]">
          {lang === 'ru' ? 'Дорога впереди' : 'The Road Ahead'}
        </h1>
        <p className="text-[#1e1e23]/40 text-lg">
          {lang === 'ru' ? 'Мы трекаем каждый километр разработки' : 'We track every kilometer of development too'}
        </p>
      </div>

      {/* Timeline — single consistent grid: 20px dot column | 3px line | content */}
      <div className="flex flex-col gap-0">
        {ROADMAP.map((quarter, qi) => (
          <div key={qi}>
            {/* Quarter header row */}
            <div className="flex items-center gap-5 mb-6">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: DOT_COLOR[quarter.status] }} />
              <h2 className="text-[13px] font-bold uppercase tracking-widest text-[#1e1e23]/35">
                {l(quarter.label)}
              </h2>
            </div>

            {/* Milestones with line */}
            {quarter.milestones.map((ms, mi) => {
              const isLast = qi === ROADMAP.length - 1 && mi === quarter.milestones.length - 1;
              return (
                <div key={mi} className="flex gap-5">
                  {/* Line + dot column — fixed 12px wide, centered */}
                  <div className="flex flex-col items-center w-3 flex-shrink-0">
                    {/* Dot */}
                    <div
                      className="w-4 h-4 rounded-full border-[2.5px] bg-white flex-shrink-0"
                      style={{ borderColor: DOT_COLOR[ms.status] }}
                    />
                    {/* Line segment */}
                    {!isLast && (
                      <div
                        className="w-[3px] flex-1 min-h-[24px] rounded-full"
                        style={{
                          backgroundColor: quarter.status === 'future' ? 'transparent' : lineColor(quarter.status),
                          borderLeft: quarter.status === 'future' ? '2px dashed rgba(30,30,35,0.1)' : 'none',
                        }}
                      />
                    )}
                  </div>

                  {/* Card */}
                  <div className={`${CARD_CLASS[ms.status]} border rounded-2xl p-5 shadow-sm mb-4 flex-1`}>
                    <div className="flex items-center gap-2.5 mb-2 flex-wrap">
                      <span className={`${BADGE_CLASS[ms.status]} text-[11px] font-bold px-2.5 py-0.5 rounded-full`}>
                        {ms.version}
                      </span>
                      {ms.name && <span className="text-sm font-semibold text-[#1e1e23]">{ms.name}</span>}
                      <span className="text-[11px] text-[#1e1e23]/25 ml-auto">{l(ms.date)}</span>
                    </div>

                    {ms.note && (
                      <div className="mb-2 text-[11px] font-medium text-[#EB571E] flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#EB571E] animate-pulse" />
                        {l(ms.note)}
                      </div>
                    )}

                    <ul className="space-y-1.5">
                      {ms.features.map((f, fi) => (
                        <li key={fi} className="flex items-start gap-2 text-[13px] text-[#1e1e23]/55 leading-relaxed">
                          <span className="mt-[7px] w-1 h-1 rounded-full flex-shrink-0" style={{ backgroundColor: DOT_COLOR[ms.status] }} />
                          {l(f)}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        {/* End */}
        <div className="flex items-center gap-5">
          <div className="w-3 flex-shrink-0 flex justify-center">
            <div className="w-2 h-2 rounded-full bg-[#1e1e23]/10" />
          </div>
          <span className="text-[13px] text-[#1e1e23]/25 italic">
            {lang === 'ru' ? 'Продолжение следует...' : 'To be continued...'}
          </span>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-20 text-center bg-white border border-black/5 rounded-3xl p-10 shadow-sm">
        <h3 className="text-2xl font-bold mb-3 text-[#1e1e23]">
          {lang === 'ru' ? 'Помоги спланировать маршрут' : 'Help plan the next stop'}
        </h3>
        <p className="text-[#1e1e23]/40 mb-8 max-w-md mx-auto text-sm">
          {lang === 'ru'
            ? 'Весь процесс разработки открыт в Telegram-канале. Предлагай фичи, голосуй, следи за обновлениями.'
            : 'The entire development process is open in our Telegram channel. Suggest features, vote, follow updates.'}
        </p>
        <a
          href="https://t.me/triptrack_app"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2.5 bg-[#EB571E] hover:bg-[#d14e1a] text-white rounded-full px-8 py-4 font-bold transition-all hover:scale-105 active:scale-95 shadow-[0_2px_20px_rgba(235,87,30,0.3)]"
        >
          <MessageCircle className="w-5 h-5" />
          {lang === 'ru' ? 'Telegram-канал' : 'Join Telegram'}
        </a>
      </div>
    </div>
  );
}
