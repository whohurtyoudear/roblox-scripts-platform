import { db } from './db';
import { users, categories, tags } from '@shared/schema';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

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
    console.log('Creating admin user...');
    const hashedPassword = await hashPassword('admin123');
    
    try {
      await db.insert(users).values({
        username: 'admin',
        password: hashedPassword,
        email: 'admin@example.com',
        bio: 'System Administrator',
        role: 'admin'
      });
      console.log('Admin user created successfully.');
    } catch (error: any) {
      // If error is due to duplicate username, it's okay
      console.log('Admin user might already exist:', error.message);
    }
    
    // Create default categories
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
      try {
        await db.insert(categories).values(category);
      } catch (error: any) {
        // If error is due to duplicate, it's okay
        console.log(`Category ${category.name} might already exist:`, error.message);
      }
    }
    
    console.log('Default categories created successfully.');
    
    // Create default tags
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
      try {
        await db.insert(tags).values(tag);
      } catch (error: any) {
        // If error is due to duplicate, it's okay
        console.log(`Tag ${tag.name} might already exist:`, error.message);
      }
    }
    
    console.log('Default tags created successfully.');
    console.log('Database seeding completed.');
  } catch (error: any) {
    console.error('Error seeding database:', error);
  }
}

// Run the seeding function
seedDatabase();