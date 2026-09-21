import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Сторож на заголовки безопасности. Проверять их «глазами на проде» нельзя:
 * промах не видно ничем, пока не случится то, от чего они защищают.
 *
 * Два правила здесь важнее прочих.
 *
 * ПЕРВОЕ: `add_header` внутри `location` в nginx ЗАМЕНЯЕТ унаследованный
 * набор, а не дополняет его. До 20 сентября 2026 семь локаций объявляли свой
 * `Cache-Control` и тем самым оставались без `nosniff`, `Referrer-Policy` и
 * CSP разом — и ни один инструмент об этом не сообщает.
 *
 * ВТОРОЕ: CSP обязана перечислять РОВНО те внешние хосты, к которым код
 * действительно ходит. Прежняя политика не знала `api.trip-track.app` и
 * `appleid.cdn-apple.com`, то есть браузер заблокировал бы и вход, и весь
 * список поездок; обратная ошибка (хост в политике остался, из кода ушёл) —
 * это лишняя дверь, открытая навсегда.
 */

// Файл лежит в `scripts/`, а не в `src/`, нарочно: он читает `nginx.conf` и
// `Dockerfile` через `node:fs`, а `tsconfig.app.json` (по которому
// проверяется `src`) типов Node не знает и знать не должен — браузерному
// коду они ни к чему. Здесь его проверяет `tsconfig.node.json`.
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const nginx = readFileSync(join(ROOT, 'nginx.conf'), 'utf8');
const headers = readFileSync(join(ROOT, 'nginx-headers.conf'), 'utf8');
const csp = readFileSync(join(ROOT, 'nginx-csp.conf'), 'utf8');
const dockerfile = readFileSync(join(ROOT, 'Dockerfile'), 'utf8');
const indexHtml = readFileSync(join(ROOT, 'index.html'), 'utf8');

/** Блоки `location … { … }` верхнего уровня, вместе с телом БЕЗ
 *  комментариев: у `/404.html` слово `add_header` стоит ровно в
 *  комментарии, объясняющем, почему его там нет. */
function locations(conf: string): { head: string; body: string }[] {
  const out: { head: string; body: string }[] = [];
  const re = /^\s{4}(location[^{]*)\{\n([\s\S]*?)^\s{4}\}/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(conf))) {
    const body = m[2]
      .split('\n')
      .filter((line) => !line.trim().startsWith('#'))
      .join('\n');
    out.push({ head: m[1].trim(), body });
  }
  return out;
}

describe('nginx security headers', () => {
  it('ships both snippets into the image', () => {
    expect(dockerfile).toContain('COPY nginx-headers.conf /etc/nginx/snippets/headers.conf');
    expect(dockerfile).toContain('COPY nginx-csp.conf /etc/nginx/snippets/csp.conf');
  });

  it('keeps the snippets OUT of conf.d, which the base image auto-includes', () => {
    expect(dockerfile).not.toMatch(/COPY nginx-(headers|csp)\.conf \/etc\/nginx\/conf\.d\//);
  });

  it('declares the whole set once, at server level', () => {
    expect(nginx).toContain('include /etc/nginx/snippets/headers.conf;');
    expect(nginx).toContain('include /etc/nginx/snippets/csp.conf;');
    for (const header of [
      'X-Content-Type-Options',
      'Referrer-Policy',
      'X-Frame-Options',
      'Permissions-Policy',
      'Strict-Transport-Security',
    ]) {
      expect(headers).toContain(header);
    }
  });

  it('re-includes the set in every location that declares an add_header of its own', () => {
    const offenders = locations(nginx)
      .filter((l) => /add_header/.test(l.body))
      .filter((l) => !/include \/etc\/nginx\/snippets\/headers\.conf;/.test(l.body))
      .map((l) => l.head);
    expect(offenders).toEqual([]);
  });

  it('does not double-declare a CSP on the locations proxied to the backend', () => {
    // `/s/`, `/u/`, `/j/` рисует бэкенд и ставит на них свою, более строгую
    // политику. Вторая CSP здесь только пересекалась бы с ней.
    for (const l of locations(nginx).filter((x) => /location \/[suj]\//.test(x.head))) {
      expect(l.body).not.toContain('snippets/csp.conf');
      expect(l.body).toContain('snippets/headers.conf');
    }
  });
});

describe('content security policy', () => {
  // Только сама строка политики: в шапке файла те же слова стоят в
  // комментариях, и разбор «по всему файлу» читал бы объяснение вместо
  // директивы.
  const policy = /add_header Content-Security-Policy "([^"]+)"/.exec(csp)?.[1] ?? '';
  const directive = (name: string): string => {
    const found = policy.split(';').map((s) => s.trim()).find((s) => s === name || s.startsWith(`${name} `));
    return found ? found.slice(name.length).trim() : '';
  };

  it('is a single add_header line', () => {
    expect(policy).not.toBe('');
  });

  it('allows exactly the third-party hosts the code talks to', () => {
    // Хосты, которые действительно встречаются в исходниках и в шаблоне.
    const sources = [indexHtml];
    const walk = (dir: string): void => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (/\.(ts|tsx|html)$/.test(entry.name)) sources.push(readFileSync(full, 'utf8'));
      }
    };
    walk(join(ROOT, 'src'));
    const used = new Set<string>();
    for (const text of sources) {
      for (const host of ['analytics.trip-track.app', 'api.trip-track.app', 'tiles.openfreemap.org', 'appleid.cdn-apple.com']) {
        if (text.includes(`https://${host}`)) used.add(host);
      }
    }
    expect([...used].sort()).toEqual([
      'analytics.trip-track.app',
      'api.trip-track.app',
      'appleid.cdn-apple.com',
      'tiles.openfreemap.org',
    ]);
    expect(directive('script-src')).toContain('https://appleid.cdn-apple.com');
    expect(directive('script-src')).toContain('https://analytics.trip-track.app');
    // Без этого источника раздел «Мои поездки» не работает ВООБЩЕ.
    expect(directive('connect-src')).toContain('https://api.trip-track.app');
    expect(directive('connect-src')).toContain('https://tiles.openfreemap.org');
    expect(directive('img-src')).toContain('https://tiles.openfreemap.org');
    expect(directive('frame-src')).toContain('https://appleid.apple.com');
  });

  it('closes the directives an omission turns into a hole', () => {
    expect(directive('default-src').trim()).toBe("'self'");
    expect(directive('object-src').trim()).toBe("'none'");
    expect(directive('base-uri').trim()).toBe("'self'");
    expect(directive('frame-ancestors').trim()).toBe("'none'");
    expect(directive('form-action').trim()).toBe("'self'");
  });

  it('never allows inline or eval scripts — the tokens live in localStorage', () => {
    expect(directive('script-src')).not.toContain("'unsafe-inline'");
    expect(directive('script-src')).not.toContain("'unsafe-eval'");
    expect(policy).not.toContain('script-src-elem');
  });
});

describe('analytics tag', () => {
  it('does not auto-track: the path of a trip page is an identifier', () => {
    expect(indexHtml).toContain('data-auto-track="false"');
  });
});
