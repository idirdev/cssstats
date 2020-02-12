# cssstats

> **[EN]** Analyze CSS files and directories to extract statistics: rule counts, selectors, declarations, unique colors, media queries, and specificity metrics.
> **[FR]** Analysez des fichiers et répertoires CSS pour extraire des statistiques : nombre de règles, sélecteurs, déclarations, couleurs uniques, media queries et métriques de spécificité.

---

## Features / Fonctionnalités

**[EN]**
- Counts CSS rules, selectors, and property declarations in any stylesheet
- Extracts all unique color values (hex, rgb, rgba, hsl, hsla)
- Lists all `@media` query blocks found in the stylesheet
- Lists all `@import` statements
- Calculates maximum selector specificity (by selector depth)
- Aggregates top used CSS properties with occurrence counts
- Accepts a single `.css` file or an entire directory (recursive)
- Outputs human-readable summary or full JSON with `--json`

**[FR]**
- Compte les règles CSS, sélecteurs et déclarations de propriétés dans toute feuille de style
- Extrait toutes les valeurs de couleurs uniques (hex, rgb, rgba, hsl, hsla)
- Liste tous les blocs `@media` trouvés dans la feuille de style
- Liste toutes les instructions `@import`
- Calcule la spécificité maximale des sélecteurs (par profondeur)
- Agrège les propriétés CSS les plus utilisées avec leur nombre d'occurrences
- Accepte un fichier `.css` seul ou tout un répertoire (récursif)
- Sortie lisible ou JSON complet avec `--json`

---

## Installation

```bash
npm install -g @idirdev/cssstats
```

---

## CLI Usage / Utilisation CLI

```bash
# Analyze a single CSS file (analyser un fichier CSS unique)
cssstats styles/main.css

# Analyze all CSS files in a directory (analyser tous les CSS d'un répertoire)
cssstats ./src/styles

# Output full JSON report (sortie JSON complète)
cssstats ./src --json

# Show help (afficher l'aide)
cssstats --help
```

### Example Output / Exemple de sortie

```
# Single file / Fichier unique:
Rules: 142
Selectors: 189
Declarations: 437
Colors: 18
Media queries: 5

# Directory scan / Scan de répertoire:
src/styles/main.css:
  Rules: 142, Selectors: 189, Colors: 18
src/styles/components.css:
  Rules: 63, Selectors: 81, Colors: 7
src/styles/reset.css:
  Rules: 12, Selectors: 14, Colors: 0
```

---

## API (Programmatic) / API (Programmation)

```js
const { analyzeCss, analyzeFile, analyzeDir } = require('@idirdev/cssstats');

// Analyze a raw CSS string (analyser une chaîne CSS brute)
const stats = analyzeCss(`
  body { margin: 0; color: #333; }
  .btn { background: rgba(0,0,0,0.5); padding: 8px 16px; }
  @media (max-width: 768px) { .btn { width: 100%; } }
`);
console.log(stats.rules);        // 3
console.log(stats.colorCount);   // 2
console.log(stats.mediaQueries); // ['@media (max-width: 768px)']
console.log(stats.properties);   // { margin: 1, color: 1, background: 1, padding: 1, width: 1 }

// Analyze a CSS file from disk (analyser un fichier CSS depuis le disque)
const fileStats = analyzeFile('./dist/bundle.css');
console.log(fileStats.uniqueColors); // ['#333', 'rgba(0,0,0,0.5)']

// Analyze all CSS files in a directory tree (analyser tous les CSS d'un arbre de répertoires)
const results = analyzeDir('./src');
results.forEach(r => {
  console.log(`${r.file}: ${r.rules} rules, ${r.colorCount} colors`);
});
```

---

## License

MIT © idirdev
