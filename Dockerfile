# https://stackoverflow.com/a/71611002

# --platform=linux/amd64

FROM denoland/deno:alpine-1.22.0 as builder
EXPOSE 8080
WORKDIR /app
COPY ["deps.ts", "app.json", "/app/"]
RUN deno cache deps.ts
COPY . .
RUN deno compile --output data-officer --allow-net --allow-env --allow-read --allow-write=data cli.ts

# 
# Try to straight-copy the binary in
# based on https://github.com/denoland/deno_docker/blob/main/alpine.dockerfile
# 
FROM frolvlad/alpine-glibc:alpine-3.13
RUN addgroup --gid 1000 deno \
  && adduser --uid 1000 --disabled-password deno --ingroup deno
USER deno
WORKDIR /app
RUN mkdir /app/data
COPY --from=builder ["/app/data-officer", "/app/"]
ENTRYPOINT ["/app/data-officer"]
CMD ["serve", "--port=8080"]

# FROM denoland/deno:alpine-1.22.0
# USER deno
# WORKDIR /app
# RUN mkdir /app/data
# COPY --from=builder ["/app/data-officer", "/app/"]
# ENTRYPOINT ["/app/data-officer"]
# CMD ["serve", "--port=8080"]
