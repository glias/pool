# GLIAS POOL

## Requirement

- yarn 1.x
- node.js 12+

## Quick Start

1. clone the repo
2. run `yarn install`
3. run `yarn start:ui` or `yarn start:server`

```
## Structure
├── apps
│   ├── server
│   └── ui
│   └── ...
└── packages
    └── constants
    └── ...
```

- apps: The applications
- packages: Commons libraries, such as `constants`, etc.

## Contribution

Before committing the code, you can use the following command to see if there are any errors

```
yarn lint
yarn test
```
