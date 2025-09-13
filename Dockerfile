FROM node:24-alpine

WORKDIR /workdir

COPY package*.json ./
RUN npm i

ARG version
ARG date
ARG vcs_ref
ARG build_number

RUN node -e "const p = require('./package.json'); p.version = '${version}'; p.versionLabel = '${version} (${build_number}; ${vcs_ref})'; console.log(JSON.stringify(p));" > package.json.mod
RUN mv package.json.mod package.json

COPY tsconfig.json .
COPY webpack.config.js .
COPY public ./public
COPY src ./src

RUN npm run dist

RUN for f in $(ls dist/*.css); do mv $f "dist/$(basename $f ".css").${build_number}.css"; done
RUN for f in $(ls dist/*.js | grep -v serviceworker); do mv $f "dist/$(basename $f ".js").${build_number}.js"; done

RUN for f in $(find dist -name "*.html"); do mv $f $f~; cat $f~ | sed -Ee "s/\"\/([^/.]+)\\.(css|js)\"/\"\/\1.${build_number}.\2\"/" > $f; done
RUN mv dist/serviceworker.js dist/serviceworker.js~; cat dist/serviceworker.js~ | sed -Ee "s/^const CacheVersion =.*$/const CacheVersion = ${build_number};/" > dist/serviceworker.js
RUN rm -rf dist/*~

FROM nginx:alpine

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

COPY *.conf /etc/nginx/conf.d

COPY --from=0 /workdir/dist/ /usr/share/nginx/html/
