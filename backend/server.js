const app = require('./src/app');
const env = require('./src/config/env');
const logger = require('./src/utils/logger');
const prisma = require('./src/config/database');

const server = app.listen(env.PORT, async () => {
  logger.info(`🚀 Servidor ejecutándose en http://localhost:${env.PORT}`);
  logger.info(`🏫 Corporación San Bonifacio de las Lanzas - Sistema de Préstamo de Chromebooks`);
  logger.info(`🌍 Ambiente: ${env.NODE_ENV}`);

  try {
    await prisma.$connect();
    logger.info('✅ Conexión a la base de datos establecida correctamente');
  } catch (error) {
    logger.warn('⚠️ No se pudo conectar a la base de datos PostgreSQL aún. Por favor asegúrate de configurar DATABASE_URL en backend/.env');
  }
});

// Graceful shutdown
const shutdown = async () => {
  logger.info('Cerrando servidor...');
  server.close(async () => {
    await prisma.$disconnect();
    logger.info('Servidor y base de datos desconectados');
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
