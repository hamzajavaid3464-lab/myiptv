# CupertinoTV — Live Global IPTV Player

An Apple-inspired live television streaming player and directory powered by the open-source [iptv-org](https://github.com/iptv-org/iptv) global broadcast directory. Features HLS video playback, Quad Multi-View (4-channel simultaneous streaming), Web Audio API loudness normalization, country and language multi-selection filtering, and offline PWA installability.

---

## Features

- **Country & Language Personalization**:
  - Interactive multi-selection prompt on first launch or page refresh.
  - Automatically filters the global broadcast guide to your selected countries and broadcast languages.
  - Dynamic Regional Presets (English-speaking, European, South Asian, Middle Eastern, Latin American, Worldwide).
  - Quick-edit filter chips to add, remove, or clear regional filters instantly.
- **HLS Live Playback**:
  - Adaptive bitrate streaming via `hls.js`.
  - Quality selector (4K, 1080p, 720p, SD).
  - Theater / Cinema mode and Picture-in-Picture mini-player.
- **Quad Multi-View Grid**:
  - Watch up to 4 live broadcasts simultaneously with one-click audio switching.
- **Web Audio Loudness Normalizer**:
  - Dynamic range compression with presets (`Off`, `Dialogue Clarity`, `Night Mode`, `Broadcast Leveler`).
- **PWA & Offline Ergonomics**:
  - Installable Progressive Web App with service worker caching for metadata and playlists.
  - Dark / Light appearance toggle.
  - Responsive design across desktop, tablet, and mobile viewport orientations.

---

## Quick Start

### Prerequisites

- Node.js 18+ or Bun
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/username/cupertinotv.git
cd cupertinotv

# Install dependencies
npm install

# Start local development server
npm run dev
```

Visit `http://localhost:3000` in your browser.

### Production Build

```bash
# Compile and build for production
npm run build

# Preview production build locally
npm run preview
```

---

## Keyboard Shortcuts

| Key | Action |
| --- | --- |
| `Space` / `K` | Play or Pause live broadcast |
| `M` | Mute or Unmute audio |
| `L` | Cycle Audio Loudness Normalizer preset |
| `F` | Toggle Fullscreen |
| `↓` / `N` | Switch to Next Live Channel |
| `↑` / `P` | Switch to Previous Live Channel |
| `I` | Toggle Floating Picture-in-Picture Mini-Player |
| `T` | Toggle Cinema Mode |
| `R` | Open Country & Language Preferences |
| `?` | Show Keyboard Shortcuts Modal |

---

## Attribution & Data Sources

- Channel streams and M3U playlists provided by the community-driven [iptv-org](https://github.com/iptv-org/iptv) project under the Unlicense.
- Icons by [Lucide](https://lucide.dev/).
- Fonts: [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans) & [JetBrains Mono](https://www.jetbrains.com/lp/mono/).

---

## License

MIT License. Open source and free for personal and community use.
