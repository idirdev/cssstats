#!/usr/bin/env node
'use strict';

/**
 * @fileoverview CLI for cssstats — analyze CSS files.
 * @author idirdev
 * @usage cssstats <file|dir> [--colors] [--fonts] [--specificity] [--json]
 */

const fs = require('fs');
const m = require('../src/index');

const args = process.argv.slice(2);

if (args.includes('--help') || args.length === 0) {
  console.log([
    'Usage: cssstats <file|dir> [options]',
    '',
    'Options:',
    '  --colors       Show extracted colors',
    '  --fonts        Show extracted font families',
    '  --specificity  Show highest-specificity selector',
    '  --json         Output as JSON',
    '  --help         Show this help message',
  ].join('\n'));
  process.exit(0);
}

const target = args.find(a => !a.startsWith('-')) || '.';
const showJson = args.includes('--json');
const showColors = args.includes('--colors');
const showFonts = args.includes('--fonts');
const showSpec = args.includes('--specificity');

let stat;
try { stat = fs.statSync(target); } catch {
  console.error('Error: cannot access ' + target);
  process.exit(1);
}

if (stat.isDirectory()) {
  const results = m.analyzeDir(target);
  if (showJson) {
    console.log(JSON.stringify(results, null, 2));
  } else {
    results.forEach(r => {
      console.log(r.file + ':');
      console.log('  ' + m.summary(r));
    });
    console.log('\n' + results.length + ' file(s) analyzed.');
  }
} else {
  const r = m.analyzeFile(target);
  if (showJson) {
    console.log(JSON.stringify(r, null, 2));
  } else {
    console.log(m.formatReport(r));
    if (showColors) console.log('\nColors:\n  ' + (r.uniqueColors.join('\n  ') || 'none'));
    if (showFonts)  console.log('\nFonts:\n  ' + (m.extractFonts(require('fs').readFileSync(target,'utf8')).join('\n  ') || 'none'));
    if (showSpec) {
      const spec = m.analyzeSpecificity(require('fs').readFileSync(target, 'utf8'));
      if (spec) console.log('\nHighest specificity: ' + spec.selector + ' [' + spec.specificity.join(',') + ']');
    }
  }
}
