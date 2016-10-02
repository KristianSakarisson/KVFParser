var cfg = {}

cfg.dbHost = process.env.DATABASE_URL
cfg.dbName = process.env.DATABASE_NAME
cfg.tableName = process.env.DATABASE_TABLE_NAME
cfg.dbLogin = process.env.DATABASE_LOGIN
cfg.dbPassword = process.env.DATABASE_PASSWORD
cfg.appLogin = process.env.APP_USER_LOGIN
cfg.appPassword = process.env.APP_USER_PASSWORD

module.exports = cfg