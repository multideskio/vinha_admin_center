/**
* @fileoverview Configuração do Drizzle Kit para geração de migrações.
* @version 1.1
* @date 2024-08-07
* @author PH
*/
import { defineConfig } from "drizzle-kit";
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set in the environment variables");
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  verbose: true,
  strict: true,
});
