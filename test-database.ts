#!/usr/bin/env tsx

import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { sql } from 'drizzle-orm';
import ws from "ws";
import * as schema from "./shared/schema";
import { storage } from "./server/storage";

neonConfig.webSocketConstructor = ws;

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  details?: any;
}

class DatabaseTester {
  private pool: Pool;
  private db: any;
  private results: TestResult[] = [];

  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable not set');
    }
    this.pool = new Pool({ connectionString: process.env.DATABASE_URL });
    this.db = drizzle({ client: this.pool, schema });
  }

  private addResult(name: string, passed: boolean, error?: string, details?: any) {
    this.results.push({ name, passed, error, details });
    console.log(`${passed ? '✅' : '❌'} ${name}${error ? `: ${error}` : ''}`);
    if (details) {
      console.log(`   Details: ${JSON.stringify(details, null, 2)}`);
    }
  }

  async testDatabaseConnection() {
    try {
      await this.db.execute(sql`SELECT 1`);
      this.addResult('Database Connection', true);
    } catch (error: any) {
      this.addResult('Database Connection', false, error.message);
    }
  }

  async testTableExistence() {
    try {
      const tables = await this.db.execute(sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
      `);
      
      const tableNames = tables.rows.map((row: any) => row.table_name);
      const expectedTables = ['users', 'generated_images', 'image_ratings', 'api_usage', 'api_subscriptions'];
      
      const missingTables = expectedTables.filter(table => !tableNames.includes(table));
      
      if (missingTables.length === 0) {
        this.addResult('Table Existence Check', true, undefined, { tables: tableNames });
      } else {
        this.addResult('Table Existence Check', false, `Missing tables: ${missingTables.join(', ')}`, { 
          found: tableNames, 
          missing: missingTables 
        });
      }
    } catch (error: any) {
      this.addResult('Table Existence Check', false, error.message);
    }
  }

  async testTableSchemas() {
    try {
      const schemas = await this.db.execute(sql`
        SELECT table_name, column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        ORDER BY table_name, ordinal_position
      `);
      
      this.addResult('Table Schema Check', true, undefined, { 
        columnCount: schemas.rows.length,
        tables: schemas.rows.reduce((acc: any, row: any) => {
          if (!acc[row.table_name]) acc[row.table_name] = [];
          acc[row.table_name].push({
            column: row.column_name,
            type: row.data_type,
            nullable: row.is_nullable,
            default: row.column_default
          });
          return acc;
        }, {})
      });
    } catch (error: any) {
      this.addResult('Table Schema Check', false, error.message);
    }
  }

  async testStorageInterfaceUsers() {
    try {
      // Test user creation
      const testUser = {
        username: `test_user_${Date.now()}`,
        password: 'test_password'
      };
      
      const createdUser = await storage.createUser(testUser);
      this.addResult('Storage - Create User', true, undefined, { userId: createdUser.id });

      // Test user retrieval by ID
      const foundUserById = await storage.getUser(createdUser.id);
      this.addResult('Storage - Get User by ID', !!foundUserById, undefined, { found: !!foundUserById });

      // Test user retrieval by username
      const foundUserByUsername = await storage.getUserByUsername(testUser.username);
      this.addResult('Storage - Get User by Username', !!foundUserByUsername, undefined, { found: !!foundUserByUsername });

    } catch (error: any) {
      this.addResult('Storage - User Operations', false, error.message);
    }
  }

  async testStorageInterfaceImages() {
    try {
      // Test image creation
      const testImage = {
        prompt: 'A test image prompt',
        imageUrl: 'https://example.com/test-image.jpg',
        model: 'flux',
        width: 1024,
        height: 1024,
        seed: 12345,
        parameters: { test: true },
        isPrivate: false,
        userId: null
      };
      
      const createdImage = await storage.createGeneratedImage(testImage);
      this.addResult('Storage - Create Generated Image', true, undefined, { imageId: createdImage.id });

      // Test image retrieval by ID
      const foundImage = await storage.getGeneratedImageById(createdImage.id);
      this.addResult('Storage - Get Generated Image by ID', !!foundImage, undefined, { found: !!foundImage });

      // Test images listing
      const images = await storage.getGeneratedImages({ limit: 10 });
      this.addResult('Storage - Get Generated Images List', Array.isArray(images), undefined, { count: images.length });

      // Test image rating update
      await storage.updateImageRating(createdImage.id, 5, 2);
      const updatedImage = await storage.getGeneratedImageById(createdImage.id);
      this.addResult('Storage - Update Image Rating', updatedImage?.likes === 5 && updatedImage?.dislikes === 2);

    } catch (error: any) {
      this.addResult('Storage - Image Operations', false, error.message);
    }
  }

  async testStorageInterfaceRatings() {
    try {
      // First create an image to rate
      const testImage = {
        prompt: 'A test image for rating',
        imageUrl: 'https://example.com/rating-test.jpg',
        model: 'flux',
        width: 512,
        height: 512,
        seed: null,
        parameters: null,
        isPrivate: false,
        userId: null
      };
      
      const createdImage = await storage.createGeneratedImage(testImage);

      // Test rating creation
      const testRating = {
        imageId: createdImage.id,
        userId: null,
        ipAddress: '192.168.1.1',
        rating: 1 // Like
      };
      
      const createdRating = await storage.createImageRating(testRating);
      this.addResult('Storage - Create Image Rating', true, undefined, { ratingId: createdRating.id });

      // Test rating retrieval
      const foundRating = await storage.getUserRatingForImage(createdImage.id, '192.168.1.1');
      this.addResult('Storage - Get User Rating for Image', !!foundRating, undefined, { found: !!foundRating });

      // Test rating deletion
      await storage.deleteImageRating(createdImage.id, '192.168.1.1');
      const deletedRating = await storage.getUserRatingForImage(createdImage.id, '192.168.1.1');
      this.addResult('Storage - Delete Image Rating', !deletedRating, undefined, { deleted: !deletedRating });

    } catch (error: any) {
      this.addResult('Storage - Rating Operations', false, error.message);
    }
  }

  async testStorageInterfaceApiUsage() {
    try {
      const testUsage = {
        ipAddress: '192.168.1.100',
        endpoint: '/api/test'
      };
      
      // Test usage creation
      const createdUsage = await storage.incrementApiUsage(testUsage);
      this.addResult('Storage - Increment API Usage', true, undefined, { usageId: createdUsage.id });

      // Test usage retrieval
      const foundUsage = await storage.getApiUsage(testUsage.ipAddress, testUsage.endpoint);
      this.addResult('Storage - Get API Usage', !!foundUsage, undefined, { 
        found: !!foundUsage, 
        count: foundUsage?.requestCount 
      });

      // Test usage increment
      await storage.updateApiUsage(testUsage.ipAddress, testUsage.endpoint);
      const updatedUsage = await storage.getApiUsage(testUsage.ipAddress, testUsage.endpoint);
      this.addResult('Storage - Update API Usage', updatedUsage?.requestCount === 2);

    } catch (error: any) {
      this.addResult('Storage - API Usage Operations', false, error.message);
    }
  }

  async testStorageInterfaceApiSubscriptions() {
    try {
      const testSubscription = {
        ipAddress: '192.168.1.200',
        apiKey: null,
        userEmail: null
      };
      
      // Test subscription creation
      const createdSubscription = await storage.createApiSubscription(testSubscription);
      this.addResult('Storage - Create API Subscription', true, undefined, { subscriptionId: createdSubscription.id });

      // Test subscription retrieval
      const foundSubscription = await storage.getApiSubscription(testSubscription.ipAddress);
      this.addResult('Storage - Get API Subscription', !!foundSubscription, undefined, { found: !!foundSubscription });

      // Test usage update
      const updatedSubscription = await storage.updateApiSubscriptionUsage(testSubscription.ipAddress, 1);
      this.addResult('Storage - Update API Subscription Usage', updatedSubscription.totalImagesGenerated === 1);

      // Test free usage limit check
      const usageCheck = await storage.checkFreeUsageLimit(testSubscription.ipAddress);
      this.addResult('Storage - Check Free Usage Limit', usageCheck.allowed && usageCheck.remaining > 0, undefined, usageCheck);

    } catch (error: any) {
      this.addResult('Storage - API Subscription Operations', false, error.message);
    }
  }

  async testExistingData() {
    try {
      // Check for existing data in each table
      const userCount = await this.db.execute(sql`SELECT COUNT(*) FROM users`);
      const imageCount = await this.db.execute(sql`SELECT COUNT(*) FROM generated_images`);
      const ratingCount = await this.db.execute(sql`SELECT COUNT(*) FROM image_ratings`);
      const usageCount = await this.db.execute(sql`SELECT COUNT(*) FROM api_usage`);
      const subscriptionCount = await this.db.execute(sql`SELECT COUNT(*) FROM api_subscriptions`);

      const counts = {
        users: parseInt(userCount.rows[0].count),
        generated_images: parseInt(imageCount.rows[0].count),
        image_ratings: parseInt(ratingCount.rows[0].count),
        api_usage: parseInt(usageCount.rows[0].count),
        api_subscriptions: parseInt(subscriptionCount.rows[0].count)
      };

      this.addResult('Existing Data Check', true, undefined, counts);
    } catch (error: any) {
      this.addResult('Existing Data Check', false, error.message);
    }
  }

  async runAllTests() {
    console.log('🔍 Starting database connectivity and schema verification tests...\n');

    await this.testDatabaseConnection();
    await this.testTableExistence();
    await this.testTableSchemas();
    await this.testExistingData();
    
    console.log('\n🔧 Testing storage interface methods...\n');
    
    await this.testStorageInterfaceUsers();
    await this.testStorageInterfaceImages();
    await this.testStorageInterfaceRatings();
    await this.testStorageInterfaceApiUsage();
    await this.testStorageInterfaceApiSubscriptions();

    await this.cleanup();
    this.printSummary();
  }

  private async cleanup() {
    try {
      await this.pool.end();
    } catch (error) {
      console.log('Warning: Could not close database connection');
    }
  }

  private printSummary() {
    console.log('\n📊 Test Summary:');
    console.log('================');
    
    const passed = this.results.filter(r => r.passed).length;
    const total = this.results.length;
    
    console.log(`Total tests: ${total}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${total - passed}`);
    
    if (total - passed > 0) {
      console.log('\n❌ Failed tests:');
      this.results.filter(r => !r.passed).forEach(result => {
        console.log(`  - ${result.name}: ${result.error}`);
      });
    }
    
    console.log(`\n${passed === total ? '🎉' : '⚠️ '} Database testing ${passed === total ? 'completed successfully!' : 'completed with issues!'}`);
    
    return { passed, total, results: this.results };
  }
}

// Run the tests
async function main() {
  const tester = new DatabaseTester();
  await tester.runAllTests();
}

// Auto-run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { DatabaseTester };