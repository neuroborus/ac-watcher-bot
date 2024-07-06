FROM node:20.11.1-alpine3.19
WORKDIR /usr/src/app
COPY . .
COPY package*.json ./

RUN npm ci

CMD npm start
