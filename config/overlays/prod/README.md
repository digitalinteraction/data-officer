# config

**setup dev database**

```sh
# ssh openlab@dig-wing
# cd /srv/apps/openlab/postgres
# docker-compose exec postgres ash

createdb -U openlab data_diaries_prod
createuser -U openlab -P data_diaries_prod

psql -U openlab
> GRANT ALL PRIVILEGES ON DATABASE data_diaries_prod TO data_diaries_prod;
```
