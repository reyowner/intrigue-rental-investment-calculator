# Chart.js third-party notices

`chart.umd.min.js` is the unmodified official Chart.js 4.6.1 UMD bundle, including its original copyright/license headers. Chart.js is released under the MIT License; see `LICENSE.md`.

The bundle embeds @kurkle/color v0.3.2 (as identified in its retained header), copyright (c) 2023 Jukka Kurkela, released under the MIT License; see `color-LICENSE.md` extracted from that exact dependency release.

`provenance.json` records registry tarballs, verified SHA-512 package integrity, a SHA-256 digest of the exact unmodified bundle, and extraction whitelist. Only the UMD bundle and license were extracted from Chart.js; only the license was extracted from @kurkle/color. No package manager, install script, framework, build step, external CDN, or separate runtime dependency is required. The bundle retains its upstream source-map reference; the optional development source map is not vendored.
