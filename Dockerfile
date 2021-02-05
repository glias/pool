FROM node:12

WORKDIR /server

ADD ./ .

RUN yarn install 
RUN yarn build:lib && yarn build:types

EXPOSE 3000

CMD [ "yarn", "dev:server" ]