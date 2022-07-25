# Data officer

This repo is a hub for Open Lab information and service status, written in Deno.
The service provides API access to Open Lab information and tweets out fun status messages to [@ol_status](https://twitter.com/ol_status).

## Development

### Setup

To develop on this repo you will need to have Docker and Deno (1.23+) installed
on your dev machine and have an understanding of them. This guide assumes you
have the repo checked out and are on macOS.

```sh
# Create an .env then fill in the values
cp .env.example .env

# Setup local auth (optional)
cp auth.example.yml auth.yml

# Setup git hooks
# -> Reset with 'git config --unset core.hooksPath'
git config --replace-all core.hooksPath .git_hooks
```

### Regular use

These are the commands you'll regularly run to develop the API, in no particular
order.

```sh
# cd to/this/folder

# Run the automated tests
# -> Use this rather than `deno test` to ensure deno permissions are set
./scripts/test.sh

# Run the docker stack
# -> starts a redis container on localhost:6379
# -> Make sure to stop after development with 'docker-compose stop'
docker-compose up -d

# Run the server locally
# -> Set --port if you like (default: 3000)
# -> Reads in environment variables from .env
./cli.ts serve

# Generate an authentication token for API development
# Args:
#   --scope gives specific permissions (use `admin` for all)
#   --subject is the name of the token (wip not used)
#   --expire tells the token to expire in a timeframe, e.g. `60m` (encouraged)
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

> Most of the scripts in [scripts](/scripts) accept a `--help` option.

### Code formatting

This repo is formatted with Deno, your IDE should do this for you automatically.
You can run `deno fmt` if you like instead.

> You can ignore a line with `// deno-fmt-ignore` or a file with
> `// deno-fmt-ignore-file`.

## Release

This repo uses GitHub actions to build a container when you push a git tag like
`v1.2.3`.

1. Make sure all code is committed on `main`
2. Make sure `example/config` is up-to-date
3. Update the [CHANGELOG.md](/CHANGELOG.md) to describe new features and bug
   fixes
4. Run `./script/version X.Y.Z` with the newly documented version
5. Push to main

## Deployment

Information for deploying Data Officer, there is an example Kustomize deployment
in [examples/config](/examples/config).

### Environment variables

These are all the environment variables that might need to be set, different
commands require different ones. If a variable is missing the process will exit
with a status code of 1.

- `GITHUB_TOKEN` — A GitHub personal acccess token to pull commits for
  `digitalinteraction`
- `JWT_SECRET` — The secret used to sign and verify JWTs (**required**)
- `MAIN_MYSQL_URL` — A mysql uri for the main mysql database, i.e. `:3307`
  (optional)
- `REDIS_URL` — The URL to connect to Redis
- `SELF_URL` — The URL where the server is publicly accessible, e.g. for
  generating Twitter `redirect_uri`s.
- `SHARED_MYSQL_URL` — A mysql uri for the shared mysql database, e.g. `:3306`
  (optional)
- `TWITTER_CLIENT_ID` — A Twitter OAuth2 client id
- `TWITTER_CLIENT_SECRET` — A Twitter OAuth2 client secret
- `UPTIME_ROBOT_SECRET` — Pre-shared secret for uptimerobot to tweet

### Scopes

These scopes are available for tokens

- `admin` — Can perform all endpoints and generate new tokens
- `ping` — Can ping all services
- `ping:{service}` — Can ping a specific service, where `{service}` is the URL
  slug of the service
- `repos` — Can access all repos
- `repos:{repo}` — Can access all endpoints for a repo, where `{repo}` is the
  URL slug of the repository
- `repos:{repo}:{collection}` — Can access a collection on a repo, where
  `{collection}` is the slug of the repo's collection
- `twitter:oauth2` — Can trigger an Twitter OAuth2 flow to authenticate the
  twitter bot.
- `repos:coffee-club:members:{member}` — Access consumption for a specific
  coffee-club member.
