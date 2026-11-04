# 🍀 The Lucky Clovers' Stage

An Incredibox-style band for the world of **Rhine**: Ollie, Quickare, Captain Triton, Big Green and Binko each play their own instruments, and anything you stack fits together.

**Play it:** open the GitHub Pages link for this repo (Settings → Pages shows it), click **Start the band**, then click sounds to give them to each character.

- 169 sounds across five characters, recorded instruments (grand piano, orchestra, band, folk) plus synths and DJ effects
- Style, Speed and Feel change the whole band at once; ⚙️ Fine-tune has happy/sad (major/minor), exact tempo and key
- Combo bonuses, spotlight solos, setlists, saved mixes and recording a take (it downloads as a .webm)
- Your mix is remembered in your browser

This is the single-player web version. The shared, everyone-hears-it version lives in the Rhine Foundry module.

**Adding Ollie's and Triton's pictures:** upload a square image as `heads/ollie.png` or `heads/triton.png`, then add the file name to the list on the `window.HEADS` line in `index.html` (for example `{"ollie.png": true, ...}`).

## Files

- `index.html` – the page
- `band.js` – the band engine, the cast and the stage window
- `shim.js` – stands in for the Foundry pieces the stage expects
- `boot.js` – starts it
- `samples/` – instrument recordings, one file per instrument, loaded only when used
- `heads/` – character token art

See [CREDITS.md](CREDITS.md) for the recordings and art.
