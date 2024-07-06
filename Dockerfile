FROM node:20.15-alpine
WORKDIR /usr/src/app
COPY . .
COPY package*.json ./

RUN npm ci

CMD npm start
