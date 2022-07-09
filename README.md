# Data officer

This repo is a central hub for Open Lab information and service status, written
in Deno.

## Development

### Setup

To develop on this repo you will need to have Docker and Deno installed on your
dev machine and have an understanding of them. This guide assumes you have the
repo checked out and are on macOS.

```sh
# Create an .env then fill in the values
cp .env.example .env
```

### Regular use

These are the commands you'll regularly run to develop the API, in no particular
order.

```sh
# Run the server locally
# -> Set --port if you like (default: 3000)
# -> Reads in environment variables from .env
./scripts/serve.ts

# Generate an authentication token for the API
# Args:
#   --scope gives specific permissions (use `admin` for all)
#   --subject is the name of the token (wip not used)
#   --expire tells the token to expire in a timeframe, e.g. `60m`
./scripts/get_jwt.ts

# Bump the app's version, must be run with a semantic version
# -> commits as X.Y.Z
# -> tags as vX.Y.Z
./scripts/version.ts X.Y.Z

# Request a token from the endpoint
TOKEN=...
http :8080/admin/token \
  "Authorization:Bearer $TOKEN"
  subject=geoff \
  scope="a b c" \
  expiresIn=5m
```

### Code formatting

This repo is formatted with Deno, your IDE should do this for you automatically.
You can run `deno fmt` if you like instead.

> You can ignore a line with `// deno-fmt-ignore` or a file with
> `// deno-fmt-ignore-file`.

## Release

This repo uses GitHub actions to build a container when you push a git tag like
`v1.2.3`.

1. Make sure all code is committed on `main`
2. Update the [CHANGELOG.md](/CHANGELOG.md)
3. Run `./script/version X.Y.Z`
4. Push to main

## Environment variables

There are some optional environment variables that can be set that turn on
features.

- `JWT_SECRET` — The secret used to sign and verify JWTs (**required**)
- `MAIN_MYSQL_URL` — A mysql uri for the main mysql database, i.e. `:3307`
- `SHARED_MYSQL_URL` — A mysql uri for the shared mysql database, e.g. `:3306`
