# https://stackoverflow.com/a/71611002

FROM --platform=linux/amd64 denoland/deno:alpine-1.22.0 as builder
EXPOSE 8080
WORKDIR /app
COPY ["deps.ts", "app.json", "/app/"]
RUN deno cache deps.ts
COPY . .
RUN deno compile --allow-env --allow-net --allow-read serve.ts --port=8080

# 
# Try to straight-copy the binary in
# 
# FROM --platform=linux/amd64 alpine:3.16
# RUN addgroup -g 1000 deno \
#   && adduser -u 1000 -G deno -s /bin/sh -D deno
# USER deno
# WORKDIR /app
# COPY --from=builder ["/app/serve", "/app/"]
# ENTRYPOINT ["/app/serve"]

FROM denoland/deno:alpine-1.22.0
USER deno
WORKDIR /app
COPY --from=builder ["/app/serve", "/app/"]
ENTRYPOINT ["/app/serve"]
