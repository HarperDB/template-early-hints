import { describe, it, expect } from 'vitest';
import { toRelativeIfSameOrigin, guessAsType, getCrossoriginAttr } from './urlHelpers.js';

describe('toRelativeIfSameOrigin', () => {
  const page = 'https://example.com/product/123?color=red';

  it('returns relative path+query for same-origin absolute URLs', () => {
    const input = 'https://example.com/assets/img.png?v=1';
    const out = toRelativeIfSameOrigin(input, page);
    expect(out).toBe('/assets/img.png?v=1');
  });

  it('passes through already-relative URLs (still same-origin)', () => {
    const input = '/assets/img.png?v=1';
    const out = toRelativeIfSameOrigin(input, page);
    expect(out).toBe('/assets/img.png?v=1');
  });

  it('keeps cross-origin URLs absolute', () => {
    const input = 'https://cdn.example.net/img.png';
    const out = toRelativeIfSameOrigin(input, page);
    expect(out).toBe('https://cdn.example.net/img.png');
  });

  it('preserves query strings and ignores fragments in path building', () => {
    const input = 'https://example.com/assets/hero.webp?size=2x#section';
    const out = toRelativeIfSameOrigin(input, page);
    expect(out).toBe('/assets/hero.webp?size=2x');
  });

  it('returns original string for malformed inputs (safe fallback)', () => {
    expect(toRelativeIfSameOrigin('://oops', page)).toBe('://oops');
    expect(toRelativeIfSameOrigin('not a url', page)).toBe('not a url');
  });
});

function expectAll<T>(samples: T[], fn: (s: T) => any, expected: any) {
  for (const s of samples) expect(fn(s)).toBe(expected);
}

describe('guessAsType', () => {
  describe('images', () => {
    it('maps common image extensions to "image"', () => {
      expectAll(
        [
          'file.jpg',
          'file.jpeg',
          'file.png',
          'file.gif',
          'file.webp',
          'file.avif',
          'http://example.com/image.JPG',
          '/assets/promo/banner.JpEg?x=1#y',
        ],
        guessAsType,
        'image'
      );
    });
  });

  describe('styles', () => {
    it('maps .css to "style"', () => {
      expectAll(
        ['styles.css', 'http://example.com/styles.CSS', '/css/app.css?v=3'],
        guessAsType,
        'style'
      );
    });
  });

  describe('scripts', () => {
    it('maps .js to "script"', () => {
      expectAll(
        ['app.js', 'http://example.com/app.JS', '/js/app.js#main'],
        guessAsType,
        'script'
      );
    });
  });

  describe('fonts', () => {
    it('maps common font extensions to "font"', () => {
      expectAll(
        [
          'font.woff',
          'font.woff2',
          'font.ttf',
          'font.otf',
          'http://example.com/font.WOFF',
          '/fonts/brand.WoFf2?foo=bar#baz',
        ],
        guessAsType,
        'font'
      );
    });
  });

  describe('unknowns', () => {
    it('defaults to "fetch" for unrecognized/extensionless URLs', () => {
      expectAll(
        ['file.txt', 'file.json', 'file', 'http://example.com/', '/noext/'],
        guessAsType,
        'fetch'
      );
    });
  });
});

describe('getCrossoriginAttr', () => {
  it('returns crossorigin attribute for cross-origin requests', () => {
    const assetUrl = 'https://cdn.example.net/image.jpg';
    const pageUrl = 'https://example.com/page';
    const asType = 'image';
    const result = getCrossoriginAttr(assetUrl, pageUrl, asType);
    expect(result).toBe('crossorigin="anonymous"');
  });

  it('returns empty string for same-origin requests', () => {
    const assetUrl = 'https://example.com/image.jpg';
    const pageUrl = 'https://example.com/page';
    const asType = 'image';
    const result = getCrossoriginAttr(assetUrl, pageUrl, asType);
    expect(result).toBe('');
  });

  it('returns empty string for unsupported types', () => {
    const assetUrl = 'https://cdn.example.net/image.jpg';
    const pageUrl = 'https://example.com/page';
    const asType = 'fetch';
    const result = getCrossoriginAttr(assetUrl, pageUrl, asType);
    expect(result).toBe('');
  });
});
