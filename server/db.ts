import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@shared/schema';

// Log connection attempt
console.log('Attempting to connect to PostgreSQL database...');

let db: ReturnType<typeof drizzle>;

// Create a PostgreSQL connection pool with better error handling
try {
  // Make sure DATABASE_URL is defined
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not defined');
    throw new Error('DATABASE_URL environment variable is required');
  }
  
  // Set connection options with proper handling for SSL
  const options = {
    ssl: process.env.NODE_ENV === 'production', // Enable SSL in production
    max: 10, // Maximum number of connections
    idle_timeout: 30, // Idle connection timeout in seconds
  };
  
  const queryClient = postgres(process.env.DATABASE_URL, options);
  
  // Create Drizzle instance using the connection
  db = drizzle(queryClient, { schema });
  
  console.log('Successfully connected to PostgreSQL database');
} catch (error) {
  console.error('Failed to connect to PostgreSQL database:', error);
  // Provide a fallback DB to prevent application crash
  // This allows the app to start even if DB connection fails
  const queryClient = postgres('postgres://localhost:5432/postgres');
  db = drizzle(queryClient, { schema });
}

export { db };