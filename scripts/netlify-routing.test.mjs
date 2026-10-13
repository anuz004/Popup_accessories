import test from 'node:test';
import assert from 'node:assert/strict';
import { netlifyRouting } from './netlify-routing.mjs';

test('API proxy precedes the frontend fallback and preserves API paths', () => {
  assert.equal(netlifyRouting('https://backend.example.com/'), '/api/* https://backend.example.com/api/:splat 200!\n/* /index.html 200\n');
});

test('missing or unsafe backend settings fail deployment instead of publishing a broken API', () => {
  for (const value of [undefined, '', 'not-a-url', 'http://localhost:3001', 'https://user:secret@example.com', 'https://example.com/api', 'https://example.com/?secret=x', 'https://example.com/#x']) {
    assert.throws(() => netlifyRouting(value));
  }
});
