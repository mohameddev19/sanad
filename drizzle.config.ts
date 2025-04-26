import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' }); // Load environment variables from .env.local

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set or empty');
}

export default defineConfig({
  schema: './src/lib/db/schema.ts', // Path to your schema file
  out: './drizzle', // Directory for migrations
  dialect: 'postgresql', // Specify the dialect
  dbCredentials: {
    url: connectionString,
  },
  verbose: true, // Optional: Enable verbose logging
  strict: true, // Optional: Enable strict mode
}); 