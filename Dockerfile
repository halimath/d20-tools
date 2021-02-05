FROM nginx:alpine

COPY *.conf /etc/nginx/conf.d

COPY dist/* /usr/share/nginx/html/
