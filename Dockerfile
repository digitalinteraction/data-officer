# https://stackoverflow.com/a/71611002

# First stage:
# - Use deno to compile a binary of the app
FROM denoland/deno:alpine-1.22.0 as builder
EXPOSE 8080
WORKDIR /app
COPY ["deps.ts", "app.json", "/app/"]
RUN deno cache deps.ts
COPY . .
RUN deno compile --output data-officer --allow-net --allow-env --allow-read --allow-run=scripts/clone_repos.sh cli.ts

# Second stage:
# - Copy in the new binary into an alpine container
# - Make sure to use the same base from the deno container
#   https://github.com/denoland/deno_docker/blob/main/alpine.dockerfile
# - Setup a non-root user
# - Add the production scripts in too
FROM frolvlad/alpine-glibc:alpine-3.13
RUN addgroup --gid 1000 deno \
  && adduser --uid 1000 --disabled-password deno --ingroup deno \
  && apk add --no-cache git openssh-client
USER deno
WORKDIR /app
RUN mkdir /app/repos
COPY --from=builder ["/app/data-officer", "/app/"]
COPY ["scripts/clone_repos.sh", "/app/scripts/"]
ENTRYPOINT ["/app/data-officer"]
CMD ["serve", "--port=8080"]
