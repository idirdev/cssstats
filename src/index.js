'use strict';

/**
 * @fileoverview CSS file analyzer — rules, selectors, declarations, colors, fonts, specificity.
 * @module cssstats
 * @author idirdev
 */

const fs = require('fs');
const path = require('path');

/**
 * Analyze a CSS string and extract statistics.
 *
 * @param {string} cssString - Raw CSS text.
 * @returns {{ rules: number, selectors: number, declarations: number,
 *             properties: Object.<string,number>, mediaQueries: string[],
 *             keyframes: string[], imports: string[], uniqueColors: string[],
 *             colorCount: number, size: number }} Parsed statistics.
 */
function analyzeCss(cssString) {
  if (typeof cssString !== 'string') throw new TypeError('cssString must be a string');

  // Strip comments before processing
  const stripped = cssString.replace(/\/\*[\s\S]*?\*\//g, '');

  // Rules: blocks with { ... }
  const rules = (stripped.match(/[^{}]+\{[^}]*\}/g) || []).length;

  // Selectors: everything before a { that isn't an at-rule block opener
  const selectorMatches = stripped.match(/([^{}@][^{}]*?)(?=\s*\{)/g) || [];
  const selectors = selectorMatches
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('@'));

  // Declarations: property: value; pairs inside blocks
  const declarationMatches = stripped.match(/[\w-]+\s*:[^;{}]+;/g) || [];
  const properties = {};
  for (const decl of declarationMatches) {
    const prop = decl.split(':')[0].trim().toLowerCase();
    properties[prop] = (properties[prop] || 0) + 1;
  }

  // Media queries
  const mediaQueries = (stripped.match(/@media[^{]+/g) || []).map(m => m.trim());

  // Keyframes
  const keyframes = (stripped.match(/@keyframes\s+[\w-]+/g) || []).map(k => k.trim());

  // Imports
  const imports = (cssString.match(/@import[^;]+;/g) || []).map(i => i.trim());

  // Colors
  const colorSet = new Set();
  const colorRe = /#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\)/g;
  let cm;
  while ((cm = colorRe.exec(stripped)) !== null) {
    colorSet.add(cm[0].toLowerCase());
  }

  return {
    rules,
    selectors: selectors.length,
    declarations: declarationMatches.length,
    properties,
    mediaQueries,
    keyframes,
    imports,
    uniqueColors: [...colorSet],
    colorCount: colorSet.size,
    size: cssString.length,
  };
}

/**
 * Extract all color values found in a CSS string.
 *
 * @param {string} css - Raw CSS text.
 * @returns {string[]} Array of unique color strings (lowercase).
 */
function extractColors(css) {
  if (typeof css !== 'string') throw new TypeError('css must be a string');
  return analyzeCss(css).uniqueColors;
}

/**
 * Extract font-family values from a CSS string.
 *
 * @param {string} css - Raw CSS text.
 * @returns {string[]} Array of unique font-family values.
 */
function extractFonts(css) {
  if (typeof css !== 'string') throw new TypeError('css must be a string');
  const fonts = new Set();
  const re = /font-family\s*:\s*([^;}{]+)/gi;
  let m;
  while ((m = re.exec(css)) !== null) {
    const raw = m[1].trim().replace(/['"]/g, '');
    for (const f of raw.split(',')) {
      const name = f.trim();
      if (name) fonts.add(name);
    }
  }
  return [...fonts];
}

/**
 * Analyze specificity of selectors and return the highest-specificity selector.
 *
 * Specificity is approximated as [id count, class/attr/pseudo count, element count].
 *
 * @param {string} css - Raw CSS text.
 * @returns {{ selector: string, specificity: number[] }|null} Highest specificity entry, or null.
 */
function analyzeSpecificity(css) {
  if (typeof css !== 'string') throw new TypeError('css must be a string');
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const selectorMatches = stripped.match(/([^{}@][^{}]*?)(?=\s*\{)/g) || [];
  const candidates = selectorMatches
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('@'));

  if (candidates.length === 0) return null;

  let best = null;
  let bestScore = [-1, -1, -1];

  for (const selector of candidates) {
    const ids = (selector.match(/#[\w-]+/g) || []).length;
    const classes = (selector.match(/\.[\w-]+|\[[^\]]+\]|:[:\w-]+/g) || []).length;
    const elements = (selector.match(/(?:^|[\s+>~])([a-zA-Z][\w-]*)/g) || []).length;
    const score = [ids, classes, elements];
    if (
      score[0] > bestScore[0] ||
      (score[0] === bestScore[0] && score[1] > bestScore[1]) ||
      (score[0] === bestScore[0] && score[1] === bestScore[1] && score[2] > bestScore[2])
    ) {
      best = { selector, specificity: score };
      bestScore = score;
    }
  }

  return best;
}

/**
 * Analyze a CSS file and return statistics.
 *
 * @param {string} filePath - Absolute or relative path to a .css file.
 * @returns {object} Statistics object from {@link analyzeCss} plus file path.
 */
function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  return { file: filePath, ...analyzeCss(content) };
}

/**
 * Recursively analyze all CSS files in a directory.
 *
 * @param {string} dir - Directory to walk.
 * @param {RegExp} [pattern=/\.css$/] - File name pattern to match.
 * @returns {object[]} Array of per-file statistics objects.
 */
function analyzeDir(dir, pattern) {
  const re = pattern instanceof RegExp ? pattern : /\.css$/;
  const results = [];

  function walk(d) {
    let entries;
    try { entries = fs.readdirSync(d); } catch { return; }
    for (const entry of entries) {
      if (entry === 'node_modules' || entry === '.git') continue;
      const fp = path.join(d, entry);
      let st;
      try { st = fs.statSync(fp); } catch { continue; }
      if (st.isDirectory()) {
        walk(fp);
      } else if (re.test(entry)) {
        try { results.push(analyzeFile(fp)); } catch { /* skip unreadable */ }
      }
    }
  }

  walk(dir);
  return results;
}

/**
 * Format a statistics report as a human-readable string.
 *
 * @param {object} stats - Object returned by {@link analyzeCss} or {@link analyzeFile}.
 * @returns {string} Formatted report.
 */
function formatReport(stats) {
  const lines = [
    `CSS Analysis Report`,
    `===================`,
    `File size      : ${stats.size} bytes`,
    `Rules          : ${stats.rules}`,
    `Selectors      : ${stats.selectors}`,
    `Declarations   : ${stats.declarations}`,
    `Media queries  : ${stats.mediaQueries.length}`,
    `Keyframes      : ${stats.keyframes.length}`,
    `Unique colors  : ${stats.colorCount}`,
    `Imports        : ${stats.imports.length}`,
  ];
  if (stats.uniqueColors.length > 0) {
    lines.push(`Colors         : ${stats.uniqueColors.join(', ')}`);
  }
  return lines.join('\n');
}

/**
 * Produce a one-line summary for a statistics object.
 *
 * @param {object} stats - Statistics object.
 * @returns {string} Single-line summary.
 */
function summary(stats) {
  return (
    `rules:${stats.rules} selectors:${stats.selectors} " +
    "declarations:${stats.declarations} colors:${stats.colorCount} " +
    "media:${stats.mediaQueries.length}`
  );
}

module.exports = {
  analyzeCss,
  extractColors,
  extractFonts,
  analyzeSpecificity,
  analyzeFile,
  analyzeDir,
  formatReport,
  summary,
};
