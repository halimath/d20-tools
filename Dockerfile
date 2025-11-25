FROM node:24-alpine AS frontendbuild

WORKDIR /workdir

COPY frontend .

RUN npm i

RUN npm run dist

FROM golang:1.25-alpine AS backendbuild

RUN apk add --no-cache ca-certificates

WORKDIR /workdir

COPY backend .
COPY --from=frontendbuild /workdir/dist ./dist

ARG version
ARG date 
ARG vcs_ref
ARG build_number

ENV CGO_ENABLED=0
RUN go build -ldflags "-X main.Version=${version} -X main.BuildDate=${date} -X main.VCSRef=${vcs_ref} -X main.BuildDate=${build_number}" .

FROM scratch

ARG version
ARG date 
ARG vcs_ref
ARG build_number

LABEL org.label-schema.build-date="${date}"
LABEL org.label-schema.name="d20-tools"
LABEL org.label-schema.description="d20-tools"
LABEL org.label-schema.url="https://d20-tools.wilanthaou.de"
LABEL org.label-schema.vcs-url="https://github.com/halimath/d20-tools"
LABEL org.label-schema.vcs-ref="${vcs_ref}"
LABEL org.label-schema.vendor="Alexander Metzner"
LABEL org.label-schema.version="${version}" 
LABEL org.label-schema.schema-version="1.0"

COPY --from=backendbuild /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/ca-certificates.crt
COPY --from=backendbuild /workdir/d20-tools /d20-tools

VOLUME [ "/data" ]
ENV GRID_DB_PATH=/data/grid.db

ENTRYPOINT [ "/d20-tools" ]
