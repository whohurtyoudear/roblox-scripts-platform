import { db } from './db';
import { users, categories, tags } from '@shared/schema';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';
import { eq } from 'drizzle-orm/expressions';

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString('hex')}.${salt}`;
}

async function seedDatabase() {
  try {
    console.log('Seeding database...');
    
    // Create admin user if it doesn't exist
    const existingAdmin = await db.select().from(users).where(eq(users.username, 'adminuser')).limit(1);
    
    if (existingAdmin.length === 0) {
      console.log('Creating admin user...');
      const hashedPassword = await hashPassword('Admin123!');
      
      await db.insert(users).values({
        username: 'adminuser',
        password: hashedPassword,
        email: 'admin@example.com',
        bio: 'System Administrator',
        role: 'admin'
      });
      
      console.log('Admin user created successfully.');
    } else {
      console.log('Admin user already exists.');
    }
    
    // Create default categories if they don't exist
    const existingCategories = await db.select().from(categories);
    
    if (existingCategories.length === 0) {
      console.log('Creating default categories...');
      
      const defaultCategories = [
        { name: 'Combat Scripts', slug: 'combat-scripts', description: 'Scripts for combat mechanics and fighting systems', imageUrl: '/images/categories/combat.png', order: 1 },
        { name: 'UI/GUI Scripts', slug: 'ui-gui-scripts', description: 'User interface components and GUI frameworks', imageUrl: '/images/categories/ui.png', order: 2 },
        { name: 'Camera Scripts', slug: 'camera-scripts', description: 'Scripts for camera control and effects', imageUrl: '/images/categories/camera.png', order: 3 },
        { name: 'Movement Scripts', slug: 'movement-scripts', description: 'Character movement, physics, and controls', imageUrl: '/images/categories/movement.png', order: 4 },
        { name: 'Effects Scripts', slug: 'effects-scripts', description: 'Visual and sound effects for games', imageUrl: '/images/categories/effects.png', order: 5 },
        { name: 'Game Systems', slug: 'game-systems', description: 'Core game mechanics and systems', imageUrl: '/images/categories/systems.png', order: 6 },
      ];
      
      for (const category of defaultCategories) {
        await db.insert(categories).values(category);
      }
      
      console.log('Default categories created successfully.');
    } else {
      console.log('Categories already exist.');
    }
    
    // Create default tags if they don't exist
    const existingTags = await db.select().from(tags);
    
    if (existingTags.length === 0) {
      console.log('Creating default tags...');
      
      const defaultTags = [
        { name: 'Beginner Friendly', slug: 'beginner-friendly', description: 'Easy to understand and implement', color: '#4CAF50' },
        { name: 'Advanced', slug: 'advanced', description: 'Complex scripts for experienced developers', color: '#F44336' },
        { name: 'Optimized', slug: 'optimized', description: 'Highly optimized for performance', color: '#2196F3' },
        { name: 'Open Source', slug: 'open-source', description: 'Free to use, modify and distribute', color: '#009688' },
        { name: 'Premium', slug: 'premium', description: 'High-quality scripts with advanced features', color: '#9C27B0' },
        { name: 'Recommended', slug: 'recommended', description: 'Highly rated by the community', color: '#FFC107' },
      ];
      
      for (const tag of defaultTags) {
        await db.insert(tags).values(tag);
      }
      
      console.log('Default tags created successfully.');
    } else {
      console.log('Tags already exist.');
    }
    
    console.log('Database seeding completed.');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

// Run the seeding function
seedDatabase();