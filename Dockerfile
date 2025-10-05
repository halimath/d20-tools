FROM node:24-alpine AS frontendbuild

WORKDIR /workdir

COPY frontend .

RUN npm i

ARG version
ARG date
ARG vcs_ref
ARG build_number

RUN node -e "const p = require('./package.json'); p.version = '${version}'; p.versionLabel = '${version} (${build_number}; ${vcs_ref})'; console.log(JSON.stringify(p));" > package.json.mod
RUN mv package.json.mod package.json

RUN npm run dist

RUN for f in $(ls dist/*.css); do mv $f "dist/$(basename $f ".css").${build_number}.css"; done
RUN for f in $(ls dist/*.js | grep -v serviceworker); do mv $f "dist/$(basename $f ".js").${build_number}.js"; done

RUN for f in $(find dist -name "*.html"); do mv $f $f~; cat $f~ | sed -Ee "s/\"\/([^/.]+)\\.(css|js)\"/\"\/\1.${build_number}.\2\"/" > $f; done
RUN mv dist/serviceworker.js dist/serviceworker.js~; cat dist/serviceworker.js~ | sed -Ee "s/^const CacheVersion =.*$/const CacheVersion = ${build_number};/" > dist/serviceworker.js
RUN rm -rf dist/*~

FROM golang:1.25-alpine AS backendbuild

WORKDIR /workdir

COPY backend .
COPY --from=frontendbuild /workdir/dist .

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

COPY --from=backendbuild /workdir/d20-tools /d20-tools

ENTRYPOINT [ "/d20-tools" ]
