import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read .env manually
const envPath = path.join(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const val = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
    env[key] = val;
  }
});

const supabaseUrl = env.VITE_SUPABASE_URL || 'https://uehubomarlibqehlehhs.supabase.co';
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

console.log('Using Supabase URL:', supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
  console.log('--- JOBS TABLE ---');
  const { data: jobs, error: je } = await supabase.from('jobs').select('*').limit(1);
  if (je) console.error('Jobs error:', je);
  else console.log('Jobs columns:', Object.keys(jobs[0] || {}));

  console.log('--- APPLICATIONS TABLE ---');
  const { data: apps, error: ae } = await supabase.from('applications').select('*').limit(1);
  if (ae) console.error('Applications error:', ae);
  else console.log('Applications columns:', Object.keys(apps[0] || {}));

  console.log('--- PROFILES TABLE ---');
  const { data: profiles, error: pe } = await supabase.from('profiles').select('*').limit(1);
  if (pe) console.error('Profiles error:', pe);
  else console.log('Profiles columns:', Object.keys(profiles[0] || {}));
}

inspect();
