SELECT `id`, `time`, `host`, `method`, `url`, `headers`, `params`, `query`, `address`, `user`
  FROM requests WHERE @field=:value