SELECT `id`, `time`, `host`, `method`, `url`, `headers`, `params`, `query`, `address`, `user`
  FROM requests ORDER BY @sortBy !sortDirection LIMIT :limit OFFSET :offset