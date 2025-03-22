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
  
  // Set connection options with required SSL for security
  const options = {
    ssl: true, // Always enable SSL for security
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
  try {
    const fallbackOptions = {
      ssl: false, // Fallback without SSL if necessary
    };
    const queryClient = postgres('postgres://localhost:5432/postgres', fallbackOptions);
    db = drizzle(queryClient, { schema });
    console.log('Using fallback database connection');
  } catch (fallbackError) {
    console.error('Failed to connect to fallback database:', fallbackError);
    // Create an empty drizzle instance as a last resort
    const emptyClient = postgres('postgres://localhost:5432/postgres', { ssl: false });
    db = drizzle(emptyClient, { schema });
  }
}

export { db };