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
  
  // Set connection options with improved SSL handling for various deployment environments
  // Always use the non-strict SSL config for our Replit environment for now
  const options = {
    // Always use SSL with rejectUnauthorized:false for better compatibility
    ssl: { rejectUnauthorized: false },
    max: 10, // Maximum number of connections
    idle_timeout: 30, // Idle connection timeout in seconds
    connect_timeout: 10, // Connection timeout in seconds
    keepalive: true, // Keep connections alive
    cache: {
      rows: 100, // Cache up to 100 rows per query
      size: 5 * 1024 * 1024, // Cache up to 5 MB
    },
  };
  
  // Get DATABASE_URL from environment
  let connectionUrl = process.env.DATABASE_URL || '';
  
  // Some PostgreSQL providers require sslmode=require to be specified
  // Add it if it's not already in the URL
  if (process.env.NODE_ENV === 'production' && connectionUrl && !connectionUrl.includes('sslmode=')) {
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
  
  // Better error handling and diagnostic information for production environments
  if (process.env.NODE_ENV === 'production') {
    console.error('====== DATABASE CONNECTION FAILURE ======');
    console.error('Production environment detected. No fallback database available.');
    console.error('Please ensure the following:');
    console.error('1. DATABASE_URL environment variable is correctly set in deployment settings');
    console.error('2. PostgreSQL server is running and accessible from the deployment environment');
    console.error('3. SSL requirements are met (if applicable)');
    console.error('4. Database credentials are correct');
    console.error('5. Network/firewall settings allow the connection');
    console.error('=======================================');
    
    // For deployments, provide more diagnostic details without exposing credentials
    if (process.env.DATABASE_URL) {
      const maskedUrl = process.env.DATABASE_URL.replace(/\/\/[^:]+:[^@]+@/, '//****:****@');
      console.error(`Attempted to connect to: ${maskedUrl}`);
    }
    
    throw new Error('Database connection failed in production environment. Check logs for details.');
  }
  
  // For development, provide a fallback connection with robust retry mechanism
  try {
    console.log('Attempting to connect to fallback database...');
    
    // Check if we have all the PostgreSQL environment variables needed for a direct connection
    const hasPgEnvVars = process.env.PGHOST && process.env.PGUSER && process.env.PGPASSWORD && 
                         process.env.PGDATABASE && process.env.PGPORT;
    
    // Build connection string from individual environment variables if available
    let fallbackUrl = '';
    if (hasPgEnvVars) {
      fallbackUrl = `postgres://${process.env.PGUSER}:${process.env.PGPASSWORD}@${process.env.PGHOST}:${process.env.PGPORT}/${process.env.PGDATABASE}`;
      console.log('Using connection string from individual PostgreSQL environment variables');
    } else {
      // Use specified fallback or default to localhost
      fallbackUrl = process.env.FALLBACK_DATABASE_URL || 'postgres://localhost:5432/postgres';
      console.log('Using fallback connection string');
    }
    
    // Enhanced options for development environment
    const fallbackOptions = { 
      ssl: fallbackUrl.includes('neon.tech') ? { rejectUnauthorized: false } : false,
      max: 10,
      idle_timeout: 30,
      connect_timeout: 10,
      keepalive: true,
    };
    
    const queryClient = postgres(fallbackUrl, fallbackOptions);
    db = drizzle(queryClient, { schema });
    console.log('Using fallback database connection successfully');
  } catch (fallbackError) {
    console.error('Failed to connect to fallback database:', fallbackError);
    console.error('====== DEVELOPMENT DATABASE CONNECTION FAILURE ======');
    console.error('Please check the following:');
    console.error('1. Is PostgreSQL running on your local machine or accessible remotely?');
    console.error('2. Are the database credentials correct?');
    console.error('3. Consider setting PGHOST, PGUSER, PGPASSWORD, PGDATABASE, and PGPORT environment variables');
    console.error('4. Or set DATABASE_URL with a complete connection string');
    console.error('=====================================================');
    throw new Error('All database connection attempts failed. See logs for troubleshooting.');
  }
}

export { db };