FROM node:20.11.1-alpine3.19
WORKDIR /usr/src/app

COPY fonts ./
RUN mkdir -p /usr/share/fonts/truetype
RUN install -m644 ./*.ttf /usr/share/fonts/truetype/
RUN rm ./*.ttf

# WORKDIR /usr/src/app
COPY . .
COPY package*.json ./

RUN npm ci

CMD npm start
