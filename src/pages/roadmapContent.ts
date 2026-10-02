// Public availability, not a catalogue of code in the repository.
// Sources: website docs/STATE.md; iOS docs/releases/0.8.4/checklist.md.
// Recheck the review status and the web editor gate when releasing either.
import type { Lang } from '../lib/site';

interface RoadmapCopy {
  eyebrow: string;
  updated: string;
  date: string;
  title: string;
  lead: string;
  navigation: string;
  sections: { id: string; label: string; summary: string }[];
  availableLead: string;
  web: AvailableItem;
  phone: AvailableItem;
  releaseHistory: string;
  progressLead: string;
  inProgress: {
    platform: string; status: string; title: string;
    description: string; features: string[]; note: string;
  }[];
  laterLead: string;
  ideaStatus: string;
  later: { title: string; description: string }[];
  feedbackTitle: string;
  feedbackDescription: string;
  feedbackAction: string;
}

interface AvailableItem {
  platform: string;
  status: string;
  title: string;
  description: string;
  features: string[];
  action: string;
}

export const roadmapContent: Record<Lang, RoadmapCopy> = {
  en: {
    eyebrow: 'TripTrack roadmap',
    updated: 'Updated',
    date: '2 October 2026',
    title: 'The road ahead.',
    lead: 'What you can use today, what we’re preparing, and the ideas we’re exploring next.',
    navigation: 'Roadmap sections',
    sections: [
      { id: 'available', label: 'Available now', summary: 'On iPhone and the web' },
      { id: 'in-progress', label: 'In progress', summary: 'Being prepared for release' },
      { id: 'later', label: 'Looking ahead', summary: 'Ideas without a release date' },
    ],
    availableLead: 'Ready to use, with your own trips.',
    web: {
      platform: 'Web',
      status: 'Live',
      title: 'Your trips, on a bigger map.',
      description: 'Open your road history on a computer. Sign in with the same Apple Account you use in the iPhone app.',
      features: [
        'Your synced trips together on an interactive map.',
        'Search by name or region and filter by date.',
        'Open a trip to explore its route and saved stops.',
      ],
      action: 'Open my trips',
    },
    phone: {
      platform: 'iPhone',
      status: 'Available',
      title: 'A diary of the roads you take.',
      description: 'Record a drive, keep its moments, and watch your personal map grow.',
      features: [
        'GPS routes, trip statistics, photos and notes.',
        'An exploration atlas, achievements and a garage for your cars.',
        'Optional cloud sync, public profiles and trips you choose to share.',
      ],
      action: 'Explore the features',
    },
    releaseHistory: 'Release history on the App Store',
    progressLead: 'These updates are being prepared. They are not publicly available yet.',
    inProgress: [
      {
        platform: 'iPhone · 0.8.4',
        status: 'Awaiting Apple review',
        title: 'TripTrack PRO',
        description: 'Optional extras for making your road diary feel more like you.',
        features: [
          'Profile backgrounds, avatar frames, car card styles and route colours.',
          'Manually add a drive you didn’t record.',
          'Keep your chosen PRO appearance so it can return when you renew.',
        ],
        note: 'Version 0.8.4 has been submitted to Apple. The public release will follow approval; there is no confirmed date yet.',
      },
      {
        platform: 'Web · PRO',
        status: 'In preparation',
        title: 'Add a missing trip from your computer.',
        description: 'A map editor for the roads you remember but didn’t record.',
        features: [
          'Build a route with stops and adjust it on the map.',
          'Add a date, duration and car before saving.',
          'Find the trip in the same library on your iPhone.',
        ],
        note: 'The editor is being tested and is not open yet. It will become available after the matching iPhone sync update is released.',
      },
    ],
    laterLead: 'Directions we’re considering. The scope and order can change; no release dates are promised.',
    ideaStatus: 'Exploring',
    later: [
      { title: 'Android', description: 'Bring the road diary to more phones. An Android app is not available yet, and there is no announced release date.' },
      { title: 'Clubs', description: 'A place for groups of drivers and their shared stories. The iPhone app currently has a preview and a waiting list.' },
      { title: 'Apple Watch & CarPlay', description: 'More convenient trip controls on the wrist and in the car. A dedicated watch app and CarPlay support are not part of the current release.' },
    ],
    feedbackTitle: 'Where should we go next?',
    feedbackDescription: 'Tell us what would make TripTrack more useful on your everyday drives. Follow development and share your ideas in Telegram.',
    feedbackAction: 'Join the conversation',
  },
  ru: {
    eyebrow: 'Планы TripTrack',
    updated: 'Обновлено',
    date: '2 октября 2026',
    title: 'Куда едем дальше.',
    lead: 'Что уже работает, какие обновления готовим и что хотим попробовать в будущем.',
    navigation: 'Разделы плана развития',
    sections: [
      { id: 'available', label: 'Уже доступно', summary: 'На iPhone и в браузере' },
      { id: 'in-progress', label: 'В работе', summary: 'Готовим к выпуску' },
      { id: 'later', label: 'Дальше', summary: 'Идеи без срока выпуска' },
    ],
    availableLead: 'Можно открыть и пользоваться со своими поездками.',
    web: {
      platform: 'Сайт',
      status: 'Работает',
      title: 'Твои поездки на большой карте.',
      description: 'Открой историю дорог на компьютере. Войди с тем же аккаунтом Apple, что и в приложении на iPhone.',
      features: [
        'Синхронизированные поездки вместе на интерактивной карте.',
        'Поиск по названию и региону, фильтр по датам.',
        'Маршрут и сохранённые отметки выбранной поездки.',
      ],
      action: 'Открыть мои поездки',
    },
    phone: {
      platform: 'iPhone',
      status: 'Доступно',
      title: 'Дневник твоих дорог.',
      description: 'Записывай поездки, сохраняй моменты и наблюдай, как растёт твоя карта.',
      features: [
        'GPS-маршруты, статистика поездок, фотографии и заметки.',
        'Атлас открытых дорог, достижения и гараж для твоих машин.',
        'Облачная синхронизация по желанию, профили и публикация выбранных поездок.',
      ],
      action: 'Посмотреть возможности',
    },
    releaseHistory: 'История версий в App Store',
    progressLead: 'Готовим эти обновления к выпуску. Для всех пользователей они пока недоступны.',
    inProgress: [
      {
        platform: 'iPhone · 0.8.4',
        status: 'Ожидает проверки Apple',
        title: 'TripTrack PRO',
        description: 'Дополнительные возможности, чтобы сделать дневник дорог своим.',
        features: [
          'Фоны профиля, рамки аватара, стили карточки машины и цвета маршрута.',
          'Добавление вручную поездки, которую не записал.',
          'Сохранение выбранного PRO-оформления для возвращения после продления.',
        ],
        note: 'Версия 0.8.4 отправлена в Apple. Публичный выпуск будет после одобрения; точной даты пока нет.',
      },
      {
        platform: 'Сайт · PRO',
        status: 'Готовим',
        title: 'Добавить пропущенную поездку с компьютера.',
        description: 'Редактор карты для дорог, которые помнишь, но не записал.',
        features: [
          'Построение маршрута с остановками и правка точек на карте.',
          'Выбор даты, длительности и машины перед сохранением.',
          'Поездка в общей библиотеке с iPhone.',
        ],
        note: 'Редактор проходит проверку и пока закрыт. Откроем его после выпуска обновления синхронизации на iPhone.',
      },
    ],
    laterLead: 'Направления, которые рассматриваем. Состав и порядок могут измениться, сроков пока не обещаем.',
    ideaStatus: 'Рассматриваем',
    later: [
      { title: 'Android', description: 'Дневник дорог для большего числа телефонов. Приложения для Android пока нет, дата выпуска не объявлена.' },
      { title: 'Клубы', description: 'Место для компаний водителей и общих историй. Сейчас в приложении есть превью и список ожидания.' },
      { title: 'Apple Watch и CarPlay', description: 'Удобное управление поездкой с часов и экрана автомобиля. Отдельное приложение для часов и поддержка CarPlay пока не входят в публичный выпуск.' },
    ],
    feedbackTitle: 'Куда повернуть дальше?',
    feedbackDescription: 'Расскажи, чего тебе не хватает в ежедневных поездках. В Telegram делимся ходом разработки и обсуждаем идеи.',
    feedbackAction: 'Обсудить в Telegram',
  },
};
