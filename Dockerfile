FROM node:20.11.1-alpine3.19

# Установка необходимых пакетов с использованием apk
RUN apk update && apk add --no-cache fontconfig

# Создание необходимой директории и копирование шрифтов
RUN mkdir -p /usr/share/fonts
COPY --chown=node static/fonts /usr/share/fonts

# Установка рабочей директории
WORKDIR /usr/src/app

# Копирование файлов package.json и package-lock.json (или yarn.lock)
COPY package*.json ./

# Установка зависимостей
RUN npm ci

# Копирование всех остальных файлов проекта
COPY . .

# (Необязательно) Сборка проекта, если требуется
# RUN npm run build

# Запуск приложения
CMD ["npm", "start"]
