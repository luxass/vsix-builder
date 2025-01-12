# vsix-builder

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![jsr version][jsr-version-src]][jsr-version-href]

A programmatic way to create VSIX files for Visual Studio Code extensions.

> [!IMPORTANT]
> This package is still in development and may not work as expected.
> Please report any issues you encounter.

## 📦 Installation

```bash
npm install vsix-builder
```

## 🚀 Usage

```ts
import { createVsix } from "vsix-builder";

const vsix = await createVsix({
  write: true,
  forceWrite: true,
  cwd: "./",
  packageManager: "pnpm",
});

if (vsix.errors.length > 0) {
  console.error("some errors occurred while creating the vsix package");

  for (const error of vsix.errors) {
    console.error(` - ${error.type}${"message" in error ? `: ${error.message}` : ""}`);
  }

  return;
}

if (!vsix.written) {
  console.warn("no vsix package was created, as you are in dry-run mode");
  return;
}
```

## 📄 License

Published under [MIT License](./LICENSE).

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/vsix-builder?style=flat&colorA=18181B&colorB=4169E1
[npm-version-href]: https://npmjs.com/package/vsix-builder
[npm-downloads-src]: https://img.shields.io/npm/dm/vsix-builder?style=flat&colorA=18181B&colorB=4169E1
[npm-downloads-href]: https://npmjs.com/package/vsix-builder
[jsr-version-src]: https://jsr.io/badges/@luxass/vsix-builder?style=flat&labelColor=18181B&logoColor=4169E1
[jsr-version-href]: https://jsr.io/@luxass/vsix-builder
