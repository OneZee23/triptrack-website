// @vitest-environment jsdom
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { GlobePoster } from './GlobePoster';
import { tripSegments, type GlobeTrip } from './types';

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

  it('draws each visible run as its own path and marks the outer trip endpoints', () => {
    const trip: GlobeTrip = {
      id: 'split', region: null, coords: [[1, 1], [2, 2]],
      routeSegments: [[[10, 10], [11, 11]], [[40, 40], [41, 41]]],
    };
    const html = renderToStaticMarkup(<GlobePoster trips={[trip]} />);
    const document = new DOMParser().parseFromString(html, 'text/html');
    const routePaths = [...document.querySelectorAll('g[stroke-width="3.4"] path')];
    expect(routePaths).toHaveLength(2);
    expect(routePaths.every((path) => path.getAttribute('d')?.startsWith('M'))).toBe(true);
    expect(document.querySelectorAll('g[clip-path] circle[r="4"]')).toHaveLength(2);
  });

  it('uses coords for older responses without routeSegments', () => {
    expect(tripSegments({ id: 'old', region: null, coords: [[1, 2], [3, 4]] })).toEqual([[[1, 2], [3, 4]]]);
  });
});
