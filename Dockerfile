FROM node:20.11.1-alpine3.19

WORKDIR /usr/src/app
COPY . .
COPY package*.json ./

RUN apt-get update && apt-get install -y fontconfig
RUN npm ci

CMD npm start
