FROM node:12

WORKDIR /server

ADD ./ .

RUN yarn install && yarn tsc
RUN cd apps/server && npm install && yarn tsc 
RUN cp -r /server/apps/server/migrations /server/migrations

EXPOSE 3000

CMD [ "node", "/server/apps/server/lib/index.js" ]
 