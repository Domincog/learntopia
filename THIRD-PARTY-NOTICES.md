# Third-party notices

Learntopia ships with the following open-source components. Each remains under its own license.

| Component | Used for | License | Location |
|-----------|----------|---------|----------|
| [KaTeX](https://katex.org) 0.19.1 | Math typesetting | MIT | `vendor/katex/` ([license](vendor/katex/LICENSE)) |
| [Lucide](https://lucide.dev) icons | Interface icons (path data in `src/ui/icons.js`) | ISC | [license](vendor/lucide/LICENSE) |
| [Fraunces](https://github.com/undercasetype/Fraunces) | Headings | SIL Open Font License 1.1 | `assets/fonts/` ([license](assets/fonts/licenses/Fraunces-OFL.txt)) |
| [Atkinson Hyperlegible Next](https://github.com/googlefonts/atkinson-hyperlegible-next) | Body text | SIL Open Font License 1.1 | `assets/fonts/` ([license](assets/fonts/licenses/AtkinsonHyperlegibleNext-OFL.txt)) |
| [JetBrains Mono](https://github.com/JetBrains/JetBrainsMono) | Code | SIL Open Font License 1.1 | `assets/fonts/` ([license](assets/fonts/licenses/JetBrainsMono-OFL.txt)) |

Font files were obtained from the [Fontsource](https://fontsource.org) packages.

## Map data

The maps drawn by the `world-map` widget use data from [Natural Earth](https://www.naturalearthdata.com), which is in the
public domain (no permission or credit is required; we credit it gladly). The country polygons were taken from the
[world-atlas](https://github.com/topojson/world-atlas) package by Mike Bostock (ISC license), a redistribution of
Natural Earth 4.1 as TopoJSON; country attributes, cities, lakes and rivers come from the Natural Earth files at
<https://github.com/nvkelso/natural-earth-vector>. The data is repacked by `tools/build-map-data.mjs` into
`assets/geo/`. No code from either project is shipped: the decoder and the map projections in
`src/widgets/world-map.js` are our own (the Equal Earth and Natural Earth projections use the published formulas of
Bojan Šavrič, Tom Patterson and Bernhard Jenny).

## Photographs and artworks

Lessons include photographs, micrographs, medical scans, scientific illustrations and reproductions
of artworks from [Wikimedia Commons](https://commons.wikimedia.org), stored under `content/media/`. They are not
part of Learntopia's own licences: **each picture remains under the licence its author chose**
(public domain, CC0, CC BY 2.0–4.0 or CC BY-SA 2.0–4.0; nothing else is accepted). Author,
licence and source link of every picture are listed in
[content/media/CREDITS.md](content/media/CREDITS.md), generated from the `manifest.json` of each
course, and shown under the picture in the app. Pictures enter the project only through
`tools/fetch-image.mjs`, which reads the licence from the Commons API and refuses everything
that is not on that list; see [docs/IMAGES.md](docs/IMAGES.md).

The review scheduler in `src/core/srs.js` is an independent implementation of the publicly
documented FSRS algorithm by Jarrett Ye and contributors
(<https://github.com/open-spaced-repetition>); no FSRS source code is included.
