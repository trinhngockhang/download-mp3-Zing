export default {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'dev',
  databaseUrl: 'mysql://root:123456@localhost:3306/mp3Online?charset=utf8mb4_unicode_ci&connectionLimit=30&flags=-FOUND_ROWS',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379/0',
  elasticSearchUrl: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
};
