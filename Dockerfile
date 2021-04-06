FROM node:14-alpine

RUN mkdir /workdir
WORKDIR /workdir

COPY package*.json ./
RUN npm i

COPY tsconfig.json .
COPY webpack.config.js .
COPY public ./public
COPY src ./src

RUN npm run dist

FROM nginx:alpine

COPY *.conf /etc/nginx/conf.d

COPY --from=0 /workdir/dist/* /usr/share/nginx/html/
