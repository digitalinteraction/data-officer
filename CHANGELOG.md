# Changelog

This file lists notable changes to the project.

## 1.0.2

- The `sync_repos` command properly exits with `1` if it failed

## 1.0.1

- Fix git commits tweet incorrect "deletions"

## 1.0.0

- First stable version
- Add `daily_commits` tweet that tweets additions/removals
- Add `auth.yml` file for static revokable tokens to be used instead of
  non-expiring JWTs
- Add `repos/coffee-club/members/:member` endpoint to retrieve a member's
  coffee-consumption

## 0.9.1

- Fix coffee tweets, the use the new collection data from redis now
- Add coffee-club repo for the current day's consumption

## 0.9.0

- Major restructure to make the app stateless w/ redis
  - repos/collections should run seperately and puts collection data into redis.
    Which has a new command to run it.
  - twitter credentials and a semaphore-type lock are in redis too
  - twitter oauth2's state is in redis too
- `--dryRun`-ing a tweet outputs the time the tweet was run first
- New required `REDIS_URL` environment variable
- Document `UPTIME_ROBOT_SECRET` in [.env.example](/.env.example)
- `data` is no-longer git-ignored
- Twitter re-auth is run in isolation and tries to wait if another process is
  already trying to refresh the tokens.
- Health endpoint now fails if the redis connection has gone
- Tweek coffee tweet messages

internal changes

- Add automated tests
- Run lint & check pre-commit
- Refactor commands to a data-driven architecture
- Add [docker-compose.yml](/docker-compose.yml) to run a development redis db
- Simplify env loading with new `setupEnv` method and centralise loading clients
  from the env
- Explore parsing cron expressions
- Add `HttpResponse` to return well-known http responses
- Use deno `log` module for logging and configure with `LOG_LEVEL` env var

## 0.8.0

- Add `repo:{repo}` intermediate scope to access an entire repo
- Add cli command to run the scheduled tweets

## 0.7.5

- Fix broken build

## 0.7.4

- Add missing `git` and `ssh` binaries to container

## 0.7.3

- Fix bug refreshing twitter credentials

## 0.7.2

- Revert `/tweet/uptimerobot` back to use JSON body auth

## 0.7.1

- Fix broken build
- Fix tweet health endpoint to `/twitter/oauth2/health`
- Add tests behind the scenes

## 0.7.0

- Git remotes are now synchronised in the background. Enable with `--syncRepos`
  and optional `--verboseSync`.
- Add `--help` option to serve command to output usage info.

## 0.6.0

- Add `/health/twitter` endpoint to check credential health
- Log internal server errors

## 0.5.0

- Add admin endpoint to generate tokens based on the request body
- Fix auth not working

## 0.4.0

Deno re-write.

- Refactored ping endpoints and added authentication via jwts
- Add endpoints to get data from openlab.ncl.ac.uk and beancounter-data repos
- Add endpoint to tweet for uptimerobot
- Add endpoints to do a twitter oauth2 for the bot
- Add script to update local repos
- Add script to generate a JWT to access the specific endpoints
- Add script to get a twitter authentication token using a temporary http server
- Add script to reauthenticate a twitter token with a refresh_token

## Pre data-officer

This app was called `systems-pinger` and just provided the ping endpoints.
