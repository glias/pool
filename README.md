# Gliaswap

This project contains front-end, back-end and some general libs related
to [Gliaswap](https://zoe-zhouzhou.github.io/gliaswap-docs/docs/), a DEX(Decentralized Exchange) based on the Nervos
ecosystem, which shows how to create a DEX application directly on top of Nervos Layer 1.

## Documentation

- [About Gliaswap](https://zoe-zhouzhou.github.io/gliaswap-docs/docs/)
- [Tutorial](docs/tutorial.md)

## Contribution

### Project Structure

```
├── apps
│   ├── server
│   └── ui
│   └── ...
└── packages
    └── commons
    └── constants
    └── ...
```

- apps: The applications, includes front and back-end code
- packages: Common libs, such as `constants`, etc.

Before committing the code, you can use the following command to see if there are any errors

```
yarn lint
yarn test
```
