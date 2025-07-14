#!/usr/bin/env node

import pkg from 'pg';
const { Client } = pkg;
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ Missing DATABASE_URL in .env file');
  process.exit(1);
}

async function pushSchema() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database');

    // Read schema files
    const schemaPath = join(__dirname, 'supabase', 'schema-fixed.sql');
    const rlsPoliciesPath = join(__dirname, 'supabase', 'rls-policies-fixed.sql');
    const notificationsPath = join(__dirname, 'supabase', 'notifications.sql');
    
    console.log('📄 Reading schema files...');
    const schema = readFileSync(schemaPath, 'utf8');
    const rlsPolicies = readFileSync(rlsPoliciesPath, 'utf8');
    const notifications = readFileSync(notificationsPath, 'utf8');
    
    // Execute main schema
    console.log('🔧 Applying main schema...');
    await client.query(schema);
    console.log('✅ Main schema applied');
    
    // Execute RLS policies
    console.log('🔒 Applying RLS policies...');
    await client.query(rlsPolicies);
    console.log('✅ RLS policies applied');
    
    // Execute notifications
    console.log('🔔 Applying notifications...');
    await client.query(notifications);
    console.log('✅ Notifications applied');
    
    console.log('🎉 Schema deployment completed successfully!');
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    if (error.detail) {
      console.error('Details:', error.detail);
    }
    if (error.hint) {
      console.error('Hint:', error.hint);
    }
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

pushSchema();
