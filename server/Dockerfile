FROM --platform=linux/amd64 node:20.0.0

WORKDIR /

COPY ./package.json ./package.json
RUN npm install 

COPY . .

EXPOSE 8080
CMD ["node", "server.js", "--max-old-space-size=4096"]