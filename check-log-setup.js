const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Read .env
const env = fs.readFileSync('.env', 'utf8');
const SUPABASE_URL = env.match(/VITE_SUPABASE_URL=(.+)/)[1].trim();
const SUPABASE_ANON_KEY = env.match(/VITE_SUPABASE_ANON_KEY=(.+)/)[1].trim();

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

(async () => {
  console.log('\n🔍 Checking Log Page Setup Status...\n');
  console.log(`📍 Project: ${SUPABASE_URL}\n`);

  // Check activity_log table
  const { data: logData, error: logError } = await supabase
    .from('activity_log')
    .select('id')
    .limit(1);

  const tableExists = !logError;

  if (tableExists) {
    console.log('✅ activity_log table: EXISTS');
  } else {
    console.log('❌ activity_log table: NOT FOUND');
    console.log('   → Open Supabase SQL Editor');
    console.log('   → Run: add_activity_log_table.sql\n');
  }

  // Check Log note
  const { data: noteData, error: noteError } = await supabase
    .from('notes')
    .select('id, title, note_type')
    .eq('note_type', 'log_list')
    .eq('title', 'Log')
    .maybeSingle();

  const noteExists = !!noteData;

  if (noteExists) {
    console.log('✅ Log note: EXISTS');
  } else {
    console.log('❌ Log note: NOT FOUND');
    console.log('   → Open Supabase SQL Editor');
    console.log('   → Run: add_log_note.sql\n');
  }

  if (tableExists && noteExists) {
    console.log('\n✨ Setup complete! You can now use the Log page:');
    console.log('   • Terminal: goto log');
    console.log('   • Sidebar: Click the ScrollText (📜) icon\n');
  } else {
    console.log('\n📚 Next steps:');
    console.log(`   1. Open: ${SUPABASE_URL.replace('.supabase.co', '.supabase.co/project/_/sql')}`);
    console.log('   2. Run the missing SQL files shown above');
    console.log('   3. Refresh your app and try "goto log"\n');
  }

  process.exit(0);
})();
