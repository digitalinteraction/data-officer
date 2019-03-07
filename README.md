# Open Lab service pinger

This repo is a node.js app to provide external endpoints which ping internal services.

## Development

### Setup

To develop on this repo you will need to have Docker and node.js installed on your dev machine and have an understanding of them. This guide assumes you have the repo checked out and are on macOS, but equivalent commands are available.

You'll only need to follow this setup once for your dev machine.

```bash
# Install dependancies
npm install
```

### Regular use

These are the commands you'll regularly run to develop the API, in no particular order.

```bash
# Run the app in development mode
# -> Runs the server with NODE_ENV=development
# -> Listens for file changes and restarts
npm run dev

# Run the server in production
# -> Runs with NODE_ENV=production
npm run start
```

### Irregular use

These are commands you might need to run but probably won't, also in no particular order.

```bash
# Manually lint code with eslint
npm run lint

# Manually format code
# -> This repo is setup to automatically format code on git-push
npm run prettier
```

### Code formatting

This repo uses [Prettier](https://prettier.io/) to automatically format code to a consistent standard.
It works using the [husky](https://www.npmjs.com/package/husky)
and [lint-staged](https://www.npmjs.com/package/lint-staged) packages to
automatically format code whenever code is commited.
This means that code that is pushed to the repo is always formatted to a consistent standard.

You can manually run the formatter with `npm run prettier` if you want.

Prettier is slightly configured in [.prettierrc.yml](/.prettierrc.yml)
and also ignores files using [.prettierignore](/.prettierignore).

## Deployment

### Building the image

This repo uses a [GitLab CI](https://about.gitlab.com/product/continuous-integration/)
to build a Docker image when you push a git tag.
This is designed to be used with the `npm version`
command so all docker images are [semantically versioned](https://semver.org/).
The `:latest` docker tag is not used.

This job runs using the [.gitlab-ci.yml](/.gitlab-ci.yml) file which
runs a docker build using the [Dockerfile](/Dockerfile)
and **only** runs when you push a [tag](https://git-scm.com/book/en/v2/Git-Basics-Tagging).

It pushes these docker images to the GitLab registry of the repo.
A slight nuance is that it will replace a preceding `v` in tag names,
formatting `v1.0.0` to `1.0.0`.

```bash
# Deploy a new version of the CLI
npm version # major | minor | patch
git push --tags
```

### Environment variables

There are some optional environment variables that can be set that turn on features.

- `MYSQL_MAIN` – A mysql uri for the main mysql database, `:3307`
- `MYSQL_SHARED` – A mysql uri for the shared mysql database, `:3306`
