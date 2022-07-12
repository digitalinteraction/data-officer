# Changelog

This file lists notable changes to the project.

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
