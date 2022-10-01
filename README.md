# svelte-telekram

A Telegram client for KaiOS using Svelte and TypeScript.

### Development and testing

`npm run dev` builds the app in watch mode and serves the site. Great for testing your app in a desktop browser.

### Deploying to a device

[**Read this before continue**](https://github.com/arma7x/svelte-telekram/issues/2)
1. Connect your device to your computer and make sure it appears in WebIDE.
2. `npm run build`
3. In WebIDE, load the `/public` folder as a packaged app.
4. Or, `npm run dev` then visit `localhost:port/index.html`
