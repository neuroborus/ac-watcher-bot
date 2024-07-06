FROM node:20.11.1-alpine3.19

RUN apk update && apk add --no-cache fontconfig ttf-dejavu ttf-freefont ttf-liberation

WORKDIR /usr/src/app
COPY . .
COPY package*.json ./

RUN npm ci

CMD npm start
