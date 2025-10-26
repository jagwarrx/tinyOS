# Lexical Notes App

A simple, elegant notes application built with React, Lexical editor, Tailwind CSS, and Supabase.

## Features

- ✏️ Rich text editing with **bold**, _underline_, and highlight formatting
- 📝 Create, edit, and delete notes
- 💾 Auto-save to Supabase
- 🎨 Clean, minimal UI with Tailwind CSS
- ⚡ Fast and lightweight

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. In your Supabase project dashboard, go to the SQL Editor
3. Run this SQL to create the notes table:

```sql
create table notes (
  id uuid default gen_random_uuid() primary key,
  title text not null default 'Untitled',
  content jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table notes enable row level security;

-- Create policy to allow all operations (for demo purposes)
-- In production, you should implement proper authentication
create policy "Enable all access for all users" on notes
  for all
  using (true)
  with check (true);
```

### 3. Configure Environment Variables

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Fill in your Supabase credentials in `.env`:
   - Go to your Supabase project settings
   - Find your project URL and anon key under "API"
   - Add them to `.env`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Run the App

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Project Structure

```
src/
├── components/
│   ├── Editor.jsx          # Lexical rich text editor
│   ├── NotesList.jsx       # Sidebar with list of notes
│   └── NoteEditor.jsx      # Main note editing view
├── App.jsx                 # Main app component
├── main.jsx               # React entry point
├── index.css              # Tailwind styles
└── supabaseClient.js      # Supabase configuration
```

## Usage

1. **Create a Note**: Click the + button in the sidebar
2. **Edit a Note**: Click on a note in the list to open it
3. **Format Text**: Use the toolbar buttons or keyboard shortcuts:
   - Bold: Ctrl/Cmd + B
   - Underline: Ctrl/Cmd + U
   - Highlight: Click the highlighter button
4. **Save**: Click the Save button (notes auto-sync to Supabase)
5. **Delete**: Click the trash icon to delete a note

## Customization

### Adding More Formatting Options

Edit `src/components/Editor.jsx` and add more buttons to the `ToolbarPlugin`:

```jsx
<button onClick={() => formatText('italic')}>
  <Italic size={18} />
</button>
```

### Styling

All styles use Tailwind CSS. Modify classes in the component files to customize the look.

### Editor Themes

Lexical supports custom themes. Edit the `theme` object in `Editor.jsx` to change text styles.

## Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Technologies Used

- **React 18** - UI framework
- **Lexical** - Rich text editor from Meta
- **Tailwind CSS** - Utility-first CSS
- **Supabase** - Backend and database
- **Vite** - Build tool
- **Lucide React** - Icons

## License

MIT
