# Pi-hole Remote

A cross-browser extension (Chrome MV3 + Firefox MV2) to control Pi-hole v6 instances from your browser.

## Features

- **Multi Pi-hole support** — manage up to 2 Pi-holes simultaneously
- **Enable/Disable toggle** — with optional timer (auto-reenable after N seconds)
- **Domain control** — add domains to allowlist or blocklist
- **Statistics** — total queries, blocked queries, and block percentage
- **Cross-browser** — builds for Chrome (MV3) and Firefox (MV2)
- **Pi-hole v6 API** — uses the modern v6 API

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- A Pi-hole v6 instance with API access

### Install

```bash
pnpm install
```

### Development

```bash
# Chrome (default)
pnpm run dev

# Firefox
pnpm run dev:firefox
```

This starts a dev server with HMR. The extension will auto-load in a new browser window.

### Build

```bash
# Chrome (MV3)
pnpm run build

# Firefox (MV2)
pnpm run build:firefox
```

Output is in `.output/chrome-mv3/` or `.output/firefox-mv2/`.

### Load in Browser

**Chrome:**
1. Go to `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `.output/chrome-mv3/`

**Firefox:**
1. Go to `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on"
3. Select `.output/firefox-mv2/`

### Zip for Distribution

```bash
pnpm run zip          # Chrome
pnpm run zip:firefox  # Firefox
```

## Configuration

1. Click the extension icon → gear button (or right-click → Options)
2. Enter your Pi-hole's address (e.g. `http://192.168.1.2`)
3. Enter your Pi-hole app password
4. Click **Test Connection** to verify
5. Click **Save Settings**
