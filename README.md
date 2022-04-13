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

---

> This project was set up by [puggle](https://npm.im/puggle)
