export default {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'dev',
  databaseUrl: process.env.DATABASE_URL,
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379/0',
  elasticSearchUrl: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
};
