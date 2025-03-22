import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@shared/schema';

// Create a PostgreSQL connection pool
const queryClient = postgres(process.env.DATABASE_URL!);

// Create Drizzle instance using the connection
export const db = drizzle(queryClient, { schema });