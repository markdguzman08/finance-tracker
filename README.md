# Finance Tracker

A small personal finance tracker that runs as an installable web app on your
phone and keeps every transaction in a Google Sheet.

It's a single HTML file. No build step, no framework, no server of its own — the
page is served as a static file from GitHub Pages, and a Google Apps Script web
app acts as the bridge to the spreadsheet.

## What it does

- Log income, expenses and transfers between accounts
- Group accounts into banks & wallets, credit cards and savings
- Browse and edit past records, with the sheet as the single source of truth
- See per-account balances pulled from the spreadsheet's own dashboard
- Works offline for reading; installs to the home screen like a native app

Transfers are recorded as a matched pair of rows — one out, one in — so both
accounts stay correct.

## Files

| File | Purpose |
|---|---|
| `finance-app.html` | The entire app — markup, styles and logic in one file |
| `sw.js` | Service worker: installability and offline access |
| `manifest.json` | Web app manifest (name, icons, theme) |
| `icon-192.png`, `icon-512.png` | Home screen icons |

The Apps Script backend lives in the Apps Script project rather than in this
repository, since it is deployed to Google rather than served from here.

## How it fits together

```
phone (installed web app)
   │   static files
   ├──────────────────────►  GitHub Pages
   │
   │   JSON over HTTPS
   └──────────────────────►  Google Apps Script  ──►  Google Sheet
```

The app holds no data of its own. Every read and write goes to the spreadsheet,
so editing a row in the sheet directly and refreshing in the app shows the same
result.

## Running your own copy

1. Fork this repository and enable **Settings → Pages → Deploy from branch → main**.
2. Create a Google Sheet with a transactions tab, and a matching Apps Script
   web app that reads and writes it. Deploy it as **Execute as: me**, and keep
   the resulting `/exec` URL private — it is what grants access to your data.
3. Open `finance-app.html` from your Pages URL and paste that `/exec` URL into
   the setup screen. It's stored on the device only.
4. Add it to your home screen: Safari → Share → Add to Home Screen, or
   Chrome → menu → Add to Home screen.

Note that the list of accounts the app offers is defined in the Apps Script, not
read from the sheet, so adding an account means editing the script and deploying
a new version.

## Notes

The service worker is network-first for the app's own files, so a new version is
picked up on the next launch without clearing any caches. Requests to Apps Script
are never cached — the app always reads live data from the sheet.
