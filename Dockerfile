FROM node:20.11.1-alpine3.19 AS build
WORKDIR /usr/src/app
COPY ./ ./
COPY package*.json ./
RUN npm ci

FROM node:20.11.1-alpine3.19 AS run
RUN apk update && apk add --no-cache fontconfig \
    ttf-dejavu \
    ttf-freefont \
    ttf-liberation && \
    rm -rf /var/cache/apk/*
WORKDIR /usr/src/app
COPY --from=build /usr/src/app/package*.json ./
COPY --from=build /usr/src/app/node_modules ./
COPY --from=build /usr/src/app/src ./
# COPY --from=build /usr/src/app/scripts ./

CMD ["npm", "start"]
