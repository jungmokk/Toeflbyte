import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL?.replace(/^["']|["']$/g, '');
const supabaseKey = process.env.SUPABASE_ANON_KEY?.replace(/^["']|["']$/g, ''); 

console.log(`[DB] Supabase URL: ${supabaseUrl ? (supabaseUrl.substring(0, 10) + '...') : 'NULL'}`);

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_ANON_KEY in environment variables.");
}

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
