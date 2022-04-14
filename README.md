# app

misc commands

```sh
docker-compose exec postgres pg_dump \
  --username=user \
  --schema-only \
  --dbname=user \
  --use-set-session-authorization \
    > hack.sql
```

Turn off `isolatedModules` in `client/tsconfig.json` to fix the build,
[vuejs/core#1228](https://github.com/vuejs/core/issues/1228)

---

> This project was set up by [puggle](https://npm.im/puggle)
