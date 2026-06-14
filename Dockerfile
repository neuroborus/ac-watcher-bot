FROM node:20-alpine AS build
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --omit=dev

FROM node:20-alpine AS run
RUN apk add --no-cache fontconfig ttf-dejavu && rm -rf /var/cache/apk/*
WORKDIR /usr/src/app
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=96"
COPY --from=build /usr/src/app/node_modules ./node_modules
COPY src ./src
COPY .env ./.env

CMD ["node", "./src/index.js"]
