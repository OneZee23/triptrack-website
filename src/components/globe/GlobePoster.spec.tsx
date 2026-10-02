// @vitest-environment jsdom
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { GlobePoster } from './GlobePoster';

describe('GlobePoster', () => {
  it('includes continent geometry in the initial HTML before trip data arrives', () => {
    const html = renderToStaticMarkup(<GlobePoster trips={[]} />);
    const document = new DOMParser().parseFromString(html, 'text/html');
    const land = document.querySelector('[data-globe-land]');
    expect(land?.getAttribute('d')).toMatch(/^M.+Z$/);
    expect(land?.getAttribute('d')).not.toMatch(/NaN|Infinity/);
    // Geography must not depend on map tiles, an image download or WebGL.
    expect(document.querySelector('canvas, image, img')).toBeNull();
  });

  it('keeps gradients and clipping local when two posters overlap during a transition', () => {
    const html = renderToStaticMarkup(<><GlobePoster trips={[]} /><GlobePoster trips={[]} /></>);
    const document = new DOMParser().parseFromString(html, 'text/html');
    const ids = [...document.querySelectorAll('[id]')].map((element) => element.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
