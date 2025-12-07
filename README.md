# AI Steam Banner (Tampermonkey)

This userscript detects likely AI‑generated element of games in Steam descriptions and add prominent red banner above the game when detected based on the project made by [Urist](https://github.com/Pierre-Demessence/SteamAIGamesIndicator)

## Installation

1. Install TamperMonkey browser extension: [Chrome](https://chromewebstore.google.com/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo?hl=en)|[Firefox](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/)
2. [Open this link](https://github.com/VincentLorenzi/AI-Banner-for-Steam/raw/refs/heads/main/steamAIBanner.js)
3. Press install
4. Allow user scripts
   i. Chrome: Settings>Extensions>Manage Extensions>Tampermonkey>Details>Allow User Scripts
   ii. Firefox: Settings>Extensions and Themes>Tampermonkey>Allow User Scripts

## Usage

- The script runs automatically on Steam pages.
- If the description contains an AI keyword or phrase, a red banner reading `AI generated` will appear above the game.
  
## Privacy

All detection runs locally in the browser. No description text or metadata is sent to external servers.

## License

GNU GPL V3. See `LICENSE` if present.
