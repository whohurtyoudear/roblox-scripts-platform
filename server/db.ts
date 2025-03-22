import { drizzle } from 'drizzle-orm/neon-serverless';
import { neon, neonConfig } from '@neondatabase/serverless';
import * as schema from '@shared/schema';

// Don't use HTTP connection pooling in production - can cause issues with Neon
neonConfig.fetchConnectionCache = false;

// Create a connection using the DATABASE_URL environment variable
const sql = neon(process.env.DATABASE_URL!);

// Create Drizzle instance using the connection
export const db = drizzle(sql, { schema });