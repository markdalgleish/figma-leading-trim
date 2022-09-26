## Development guide

### Pre-requisites

- [Node.js](https://nodejs.org)
- [pnpm](https://pnpm.io/)
- [Figma desktop app](https://figma.com/downloads/)

### Build the plugin

To watch for code changes and rebuild the plugin automatically during development:

```bash
$ pnpm watch
```

To build the plugin for publishing:

```bash
$ pnpm build
```

This will generate a [`manifest.json`](https://figma.com/plugin-docs/manifest/) file and a `build` directory containing the JavaScript bundles for the plugin.

### Install the plugin locally

1. In the Figma desktop app, open a Figma document.
2. Open Quick Actions (`Cmd + P`) and run `Import plugin from manifest…`
3. Select the generated `manifest.json` file.

### Debugging

To open the developer console, search for and run `Open Console` via the Quick Actions search bar. Just like in a browser, you can use `console.log` statements to inspect values in your code.

## See also

- [Create Figma Plugin docs](https://yuanqing.github.io/create-figma-plugin/)
- [`yuanqing/figma-plugins`](https://github.com/yuanqing/figma-plugins#readme)

Official docs and code samples from Figma:

- [Plugin API docs](https://figma.com/plugin-docs/)
- [`figma/plugin-samples`](https://github.com/figma/plugin-samples#readme)
