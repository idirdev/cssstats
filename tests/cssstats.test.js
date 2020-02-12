'use strict';

/**
 * @fileoverview Tests for cssstats.
 * @author idirdev
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  analyzeCss,
  extractColors,
  extractFonts,
  analyzeSpecificity,
  formatReport,
  summary,
} = require('../src/index');

// ── Basic rule / selector / declaration counts ────────────────────────────────

describe('analyzeCss — rules', () => {
  it('counts rules correctly', () => {
    const r = analyzeCss('body { color: red; } .a { font-size: 14px; }');
    assert.equal(r.rules, 2);
  });

  it('returns zero rules on empty string', () => {
    assert.equal(analyzeCss('').rules, 0);
  });
});

describe('analyzeCss — declarations', () => {
  it('counts declarations in a single block', () => {
    const r = analyzeCss('body { color: red; font-size: 16px; }');
    assert.equal(r.declarations, 2);
  });

  it('counts duplicate properties across blocks', () => {
    const r = analyzeCss('a { color: red; } b { color: blue; }');
    assert.equal(r.properties.color, 2);
  });
});

describe('analyzeCss — colors', () => {
  it('finds hex and rgba colors', () => {
    const r = analyzeCss('a { color: #ff0000; background: rgba(0,0,0,0.5); }');
    assert.equal(r.colorCount, 2);
  });

  it('normalizes colors to lowercase', () => {
    const r = analyzeCss('a { color: #FF0000; }');
    assert.ok(r.uniqueColors.includes('#ff0000'));
  });

  it('de-duplicates identical colors', () => {
    const r = analyzeCss('a { color: #fff; } b { color: #fff; }');
    assert.equal(r.colorCount, 1);
  });
});

describe('analyzeCss — media queries & keyframes', () => {
  it('detects @media blocks', () => {
    const r = analyzeCss('@media (max-width: 768px) { .a { color: red; } }');
    assert.equal(r.mediaQueries.length, 1);
  });

  it('detects @keyframes', () => {
    const r = analyzeCss('@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }');
    assert.ok(r.keyframes.length >= 1);
  });
});

describe('extractColors', () => {
  it('returns array of color strings', () => {
    const colors = extractColors('a { color: #123; background: hsl(120,50%,50%); }');
    assert.ok(Array.isArray(colors));
    assert.ok(colors.length >= 1);
  });
});

describe('extractFonts', () => {
  it('extracts font-family names', () => {
    const fonts = extractFonts('body { font-family: "Arial", sans-serif; }');
    assert.ok(fonts.includes('Arial'));
    assert.ok(fonts.includes('sans-serif'));
  });
});

describe('analyzeSpecificity', () => {
  it('returns null for empty CSS', () => {
    assert.equal(analyzeSpecificity(''), null);
  });

  it('returns highest ID specificity selector', () => {
    const result = analyzeSpecificity('#hero .nav a { color: red; } .link { color: blue; }');
    assert.ok(result !== null);
    assert.ok(result.specificity[0] >= 1); // at least 1 id
  });
});

describe('formatReport', () => {
  it('includes rule count in report', () => {
    const r = analyzeCss('a { color: red; }');
    const report = formatReport(r);
    assert.ok(report.includes('Rules'));
  });
});

describe('summary', () => {
  it('returns a non-empty string', () => {
    const r = analyzeCss('a { color: red; }');
    const s = summary(r);
    assert.equal(typeof s, 'string');
    assert.ok(s.length > 0);
    assert.ok(s.includes('rules:'));
  });
});
