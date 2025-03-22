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
  
  // Set connection options
  const options = {
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 10, // Maximum number of connections
    idle_timeout: 30, // Idle connection timeout in seconds
  };
  
  const queryClient = postgres(process.env.DATABASE_URL, options);
  
  // Create Drizzle instance using the connection
  db = drizzle(queryClient, { schema });
  
  console.log('Successfully connected to PostgreSQL database');
} catch (error) {
  console.error('Failed to connect to PostgreSQL database:', error);
  // In production, we don't want to use a fallback connection
  // as it would lead to unexpected behavior
  if (process.env.NODE_ENV === 'production') {
    console.error('No fallback database available in production. Please check your DATABASE_URL environment variable.');
    throw new Error('Database connection failed in production environment');
  }
  
  // For development, provide a fallback connection
  try {
    console.log('Attempting to connect to fallback database...');
    // Use environment variables if available, otherwise use defaults
    const fallbackUrl = process.env.FALLBACK_DATABASE_URL || 'postgres://localhost:5432/postgres';
    const fallbackOptions = { ssl: false };
    
    const queryClient = postgres(fallbackUrl, fallbackOptions);
    db = drizzle(queryClient, { schema });
    console.log('Using fallback database connection');
  } catch (fallbackError) {
    console.error('Failed to connect to fallback database:', fallbackError);
    throw new Error('All database connection attempts failed');
  }
}

export { db };