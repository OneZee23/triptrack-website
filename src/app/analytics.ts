// Keeping trip ids out of analytics — ВТОРОЙ замок, а не первый.
//
// Первый стоит в `index.html`: у тега Umami выключен автотрек
// (`data-auto-track="false"`), и просмотры страниц шлёт теперь только
// `src/lib/analytics.ts`, которая молчит на всём, что под `/app`. Пока
// автотрек был включён, `/app/trips/<uuid>` уезжал на сервер аналитики
// путём страницы, и флаг ниже этого не закрывал: тег отложенный, но он
// исполняется РАНЬШЕ любого нашего кода, поэтому самый первый заход прямо
// по ссылке на поездку успевал отправиться.
//
// Флаг оставлен сознательно. Он — документированный per-visitor opt-out
// Umami, который трекер перечитывает на каждой отправке, и он продолжает
// работать, даже если тег когда-нибудь вернут к автотреку или добавят в
// него второй счётчик: здесь нужен замок, который не зависит от того, как
// настроен чужой скрипт. Ставится на входе в раздел и, пока есть сессия, НЕ
// снимается; посетитель, который не вошёл, получает аналитику обратно на
// выходе из раздела, и выход из аккаунта её тоже возвращает.

const UMAMI_DISABLED = 'umami.disabled';

export function suppressAnalytics(): void {
  try {
    window.localStorage.setItem(UMAMI_DISABLED, '1');
  } catch {
    /* storage blocked: nothing to suppress, nothing to report */
  }
}

export function resumeAnalytics(): void {
  try {
    window.localStorage.removeItem(UMAMI_DISABLED);
  } catch {
    /* as above */
  }
}
