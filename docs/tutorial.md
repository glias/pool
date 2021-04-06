# Tutorial

In this tutorial, we will learn how to run Gliaswap at local with docker.

## Requirement

Before we lunch the front-end or back-end, we need to prepare the following software

- yarn 1.x
- node.js 12+
- docker

### Preparing Requirement

```
docker run -d --name dex-ckb-node -p 8115:8115 -p 8114:8114 nervos/ckb:0.39
docker run -d --name dex-redis -p 6379:6379 redis redis-server --requirepass 123456
docker run --name=dex-mysql -p 6379:6379 mysql/mysql-server:5.7
```

### Clone The Repo

```
git clone https://github.com/glias/pool.git
cd pool

# install dependencies recursively
yarn install

# build the commons packages
yarn build:lib

# build the commons packages typescript defination
yarn build:types
```

## Start

Edit the file at `apps/server/.env` and `apps/ui/.env` then run

```
# start the server
yarn start:server

# start the user interface
yarn start:ui
```
