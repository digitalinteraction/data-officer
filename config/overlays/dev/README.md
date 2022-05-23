# config

**setup dev database**

```sh
# ssh openlab@dig-wing
# cd /srv/apps/openlab/postgres
# docker-compose exec postgres ash

createdb -U openlab data_diaries_dev
createuser -U openlab -P data_diaries_dev

psql -U openlab
> GRANT ALL PRIVILEGES ON DATABASE data_diaries_dev TO data_diaries_dev;
```
