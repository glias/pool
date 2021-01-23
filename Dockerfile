FROM node:12

WORKDIR /server

ADD ./ .

RUN yarn install 
RUN yarn build:lib && yarn build:types
RUN cd apps/server && yarn tsc 
RUN cp -r /server/apps/server/migrations /server/migrations

EXPOSE 3000

CMD [ "node", "/server/apps/server/lib/index.js" ]