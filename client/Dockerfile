# Start with a node 10 image with package info
# Installs *all* npm packages and runs build script
FROM node:16-alpine as builder
WORKDIR /app
ENV NODE_ENV development
COPY ["package*.json", "/app/"]
RUN npm ci
COPY [ ".", "/app/" ]
RUN npm run build

FROM nginx:1-alpine as dist
COPY --from=builder ["/app/dist", "/usr/share/nginx/html"]
