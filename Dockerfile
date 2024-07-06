FROM node:20.11.1-alpine3.19
RUN apt-get update && apt-get install -y fontconfig
ENV FONTCONFIG_PATH=/etc/fonts
RUN mkdir -p /usr/share/fonts
COPY --chown=node /etc/fonts /usr/share/fonts

WORKDIR /usr/src/app
COPY . .
COPY package*.json ./

RUN npm ci

CMD npm start
