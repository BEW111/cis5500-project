FROM --platform=linux/amd64 node:19.6.0

WORKDIR /

COPY ./package.json /package.json
RUN npm install

COPY ./public /public
COPY ./src /src

EXPOSE 3000
CMD ["npm","start"]