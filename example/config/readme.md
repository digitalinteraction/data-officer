# Example Data Officer kustomize config

## Overview

Data Officer is a Deno app made up of several components that all work together.

- A http server for UptimeRobot to ping internal services, serve repository
  data, allow UptimeRobot to tweet and facilitate the twitter oauth2 flow.
- A commands to periodically tweet to `@ol_status`, ran through `CronJobs`.
- A command to sync repositories and cache data to be later server over http,
  ran through a `CronJob` too. The repos are backed by a `PersistentVolumeClaim`
  to optimise subsequent runs.
- A redis database that is backed by a `PersistentVolumeClaim` to keep data over
  restarts.

## Setup

Start with a copy of this directroy, then follow these instructions:

**1. Setup secrets & config**

```sh
# cd to/this/folder

# Get the known_hosts for your repository host
ssh-keygen -F github.com > config/known_hosts

# Generate an SSH key for the bot to pull from the repo
# -> Make sure to add as a deploy_key to the repo(s) or a bot user with access
# -> If you want to use a different type, make sure to update 
#    app-deployment.yml's "volumeMounts"
ssh-keygen \
  -t ed25519 \
  -b 4096 \
  -f secret/bot_id \
  -N ""
```

Fill in your environment variables into
[secret/data-officer.env](./secret/data-officer.env).

(optional) Fill in [secret/auth.yml](./secret/auth.yml) if you want to use
static auth tokens, see [auth.example.yml](/auth.example.yml) for the structure.

**2. Setup kustomization.yml**

- Pick the version you want to use, see the
  [GitHub tags](https://github.com/digitalinteraction/data-officer/tags) for
  available versions.
- (optional) configure the `namespace`, `namePrefix` or `commonLabels`.
- (optional) choose a different version of redis.

> If you change `namePrefix` make sure to also update `REDIS_URL` in
> `data-officer.env`.

**6. Configure specific resources**

- [app-ingress.yml](./app-ingress.yml) — You'll probably want to set the host,
  configure for your SSL certs or set the `ingressClassName`.
- [coffee-am-cronjob.yml](./coffee-am-cronjob.yml)
- [coffee-pm-cronjob.yml](./coffee-pm-cronjob.yml)
- [commits-cronjob.yml](./commits-cronjob.yml)
- [redis-pvc.yml](./redis-pvc.yml) + [repos-pvc.yml](./repos-pvc.yml) — You'll
  probably want to set a `storageClassName`.

**Alternatives**

- You might want to use a secret automation like
  [vault csi](https://learn.hashicorp.com/tutorials/vault/kubernetes-secret-store-driver),
  [external-secrets](https://github.com/external-secrets/external-secrets) or
  [1password](https://1password.com/products/secrets/).

**🎉 Finally**

Apply your kubernetes configuration:

```sh
# cd to/this/folder

kubectl apply -k .
```
