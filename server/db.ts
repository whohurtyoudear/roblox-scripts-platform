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
  
  // Set connection options with improved SSL handling
  const options = {
    ssl: { rejectUnauthorized: false }, // Always use SSL with rejectUnauthorized:false for Neon database
    max: 10, // Maximum number of connections
    idle_timeout: 30, // Idle connection timeout in seconds
  };
  
  // Add 'sslmode=require' explicitly to the connection URL if needed
  let connectionUrl = process.env.DATABASE_URL || '';
  if (connectionUrl && !connectionUrl.includes('sslmode=')) {
    connectionUrl += connectionUrl.includes('?') 
      ? '&sslmode=require' 
      : '?sslmode=require';
  }
  
  const queryClient = postgres(connectionUrl, options);
  
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
    // For local development, we don't need SSL
    const fallbackOptions = { 
      ssl: false,
      max: 10,
      idle_timeout: 30
    };
    
    const queryClient = postgres(fallbackUrl, fallbackOptions);
    db = drizzle(queryClient, { schema });
    console.log('Using fallback database connection');
  } catch (fallbackError) {
    console.error('Failed to connect to fallback database:', fallbackError);
    throw new Error('All database connection attempts failed');
  }
}

export { db };