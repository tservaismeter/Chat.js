/**
 * Upload retailer logos to Supabase Storage
 *
 * Usage: SUPABASE_SERVICE_ROLE_KEY=your_key npx tsx scripts/upload-logos.mts
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync } from 'fs';
import { join, extname } from 'path';

const SUPABASE_URL = 'https://amlbrptgggmwdwdxltlj.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  console.error('Get it from: Supabase Dashboard → Settings → API → service_role key');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const LOGOS_DIR = join(import.meta.dirname, '../../assets/logos');
const BUCKET = 'logos';

const mimeTypes: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

async function uploadLogos() {
  const files = readdirSync(LOGOS_DIR);

  console.log(`Found ${files.length} logo files to upload\n`);

  for (const file of files) {
    const filePath = join(LOGOS_DIR, file);
    const ext = extname(file);
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    const fileBuffer = readFileSync(filePath);

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .upload(file, fileBuffer, {
        contentType,
        upsert: true,
      });

    if (error) {
      console.error(`❌ Failed to upload ${file}:`, error.message);
    } else {
      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${file}`;
      console.log(`✅ ${file}`);
      console.log(`   ${publicUrl}\n`);
    }
  }

  console.log('\nDone! Now update the database with these URLs.');
}

uploadLogos().catch(console.error);
