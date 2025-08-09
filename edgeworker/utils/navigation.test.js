import { describe, it, expect } from 'vitest';
import { isMainDocumentNavigation } from './navigation.js';

const makeReq = (headers = {}, method = 'GET') => {
  const lower = Object.fromEntries(
    Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v])
  );
  return {
    method,
    getHeader: (name) =>
      lower[name.toLowerCase()] ? [lower[name.toLowerCase()]] : [],
  };
};

describe('isMainDocumentNavigation', () => {
  describe('with Sec-Fetch-* (strict path)', () => {
    it.each([
      [
        'true for main navigation (navigate + document + ?1)',
        { 'sec-fetch-mode': 'navigate', 'sec-fetch-dest': 'document', 'sec-fetch-user': '?1' },
        'GET',
        true,
      ],
      [
        'true when sec-fetch-user is missing',
        { 'sec-fetch-mode': 'navigate', 'sec-fetch-dest': 'document' },
        'GET',
        true,
      ],
      [
        'false when sec-fetch-mode is not navigate',
        { 'sec-fetch-mode': 'cors', 'sec-fetch-dest': 'document' },
        'GET',
        false,
      ],
      [
        'false when sec-fetch-dest is not document',
        { 'sec-fetch-mode': 'navigate', 'sec-fetch-dest': 'image' },
        'GET',
        false,
      ],
      [
        'false when sec-fetch-user is present but not "?1"',
        { 'sec-fetch-mode': 'navigate', 'sec-fetch-dest': 'document', 'sec-fetch-user': 'other' },
        'GET',
        false,
      ],
    ])('%s', (_name, headers, method, expected) => {
      const req = makeReq(headers, method);
      expect(isMainDocumentNavigation(req)).toBe(expected);
    });
  });

  describe('fallback (no Sec-Fetch-*)', () => {
    it.each([
      ['true for Accept: text/html + GET', { accept: 'text/html' }, 'GET', true],
      ['false for Accept: text/html + OPTIONS', { accept: 'text/html' }, 'OPTIONS', false],
      ['false for API-ish Accept: application/json', { accept: 'application/json' }, 'GET', false],
      ['false when headers are empty', {}, 'GET', false],
    ])('%s', (_name, headers, method, expected) => {
      const req = makeReq(headers, method);
      expect(isMainDocumentNavigation(req)).toBe(expected);
    });
  });
});
