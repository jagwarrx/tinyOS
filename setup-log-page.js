/**
 * Setup Log Page - Run database migrations
 * This script creates the activity_log table and Log special note
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Read environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase credentials in .env file')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function runMigration(sqlFile, description) {
  console.log(`\n📝 Running: ${description}`)
  console.log(`   File: ${sqlFile}`)

  try {
    const sql = readFileSync(join(__dirname, sqlFile), 'utf8')

    // Note: The Supabase JS client doesn't support raw SQL execution
    // This needs to be run via the SQL Editor in Supabase Dashboard
    console.log(`\n⚠️  Please run this SQL in your Supabase SQL Editor:`)
    console.log(`\n${sql}\n`)
    console.log(`   Dashboard: ${SUPABASE_URL.replace('.supabase.co', '.supabase.co/project/_/sql')}`)

    return true
  } catch (error) {
    console.error(`❌ Error reading ${sqlFile}:`, error.message)
    return false
  }
}

async function checkLogNoteExists() {
  console.log('\n🔍 Checking if Log note exists...')
  const { data, error } = await supabase
    .from('notes')
    .select('id, title, note_type')
    .eq('note_type', 'log_list')
    .eq('title', 'Log')
    .maybeSingle()

  if (error) {
    console.error('❌ Error checking Log note:', error.message)
    return false
  }

  if (data) {
    console.log('✅ Log note already exists!')
    return true
  }

  console.log('❌ Log note does not exist yet')
  return false
}

async function checkActivityLogTable() {
  console.log('\n🔍 Checking if activity_log table exists...')

  // Try to query the table
  const { data, error } = await supabase
    .from('activity_log')
    .select('id')
    .limit(1)

  if (error) {
    if (error.message.includes('does not exist') || error.code === '42P01') {
      console.log('❌ activity_log table does not exist yet')
      return false
    }
    console.error('❌ Error checking activity_log table:', error.message)
    return false
  }

  console.log('✅ activity_log table exists!')
  return true
}

async function main() {
  console.log('🚀 Log Page Setup Script')
  console.log('========================\n')
  console.log(`📍 Supabase Project: ${SUPABASE_URL}`)

  // Check current state
  const tableExists = await checkActivityLogTable()
  const noteExists = await checkLogNoteExists()

  if (tableExists && noteExists) {
    console.log('\n✨ Everything is already set up! You can use the Log page now.')
    console.log('\n   Navigate via:')
    console.log('   • Terminal: goto log')
    console.log('   • Sidebar: Click the ScrollText (📜) icon\n')
    return
  }

  console.log('\n⚠️  Manual setup required:\n')
  console.log('Please open your Supabase SQL Editor and run these migrations:\n')

  if (!tableExists) {
    await runMigration('add_activity_log_table.sql', 'Create activity_log table')
  }

  if (!noteExists) {
    await runMigration('add_log_note.sql', 'Create Log special note')
  }

  console.log('\n📚 After running the SQL migrations, you can:')
  console.log('   1. Refresh your app')
  console.log('   2. Navigate to Log via terminal: goto log')
  console.log('   3. Or click the ScrollText icon in the sidebar\n')
}

main().catch(console.error)
