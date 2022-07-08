# Changelog

This file lists notable changes to the project.

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
