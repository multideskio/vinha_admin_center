const { Client } = require('pg');
require('dotenv').config();

async function migrate() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Conectado ao banco de dados');

    await client.query('ALTER TABLE "other_settings" ADD COLUMN IF NOT EXISTS "s3_cloudfront_url" text;');
    console.log('Migração executada com sucesso: Campo s3_cloudfront_url adicionado');

  } catch (error) {
    console.error('Erro na migração:', error);
  } finally {
    await client.end();
  }
}

migrate();