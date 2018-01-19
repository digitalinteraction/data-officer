FROM node:9-alpine

WORKDIR /app

EXPOSE 3000

COPY package.json /app

RUN npm install -s --production

COPY docs /app/docs
COPY web /app/web

CMD [ "npm", "start" ]
