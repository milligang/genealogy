# Family Tree App

An interactive family tree application built with React, ReactFlow, and Supabase.

## Features

- **Authentication** - Secure sign up/sign in with Supabase Auth
- **Family Members** - Add people with photos, dates, notes, and relationships
- **Themes** - Switch between Vintage and Dark modes
- **Responsive** - Works on desktop and mobile
- **Cloud Sync** - Data automatically saved to Supabase
- **Auto-Layout** - Automatically organize your family tree

## Tech Stack

- **React** - UI framework
- **ReactFlow** - Interactive node-based UI
- **Material-UI** - Component library
- **Supabase** - Authentication and database
- **Vite** - Build tool
- **React Router** - Routing

## Setup

### 1. Clone the repository

```bash
git clone 
cd family-tree-app
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up Supabase

1. Create a [Supabase account](https://supabase.com)
2. Create a new project
3. Run this SQL in the SQL Editor:

```sql
CREATE TABLE family_trees (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  nodes jsonb NOT NULL,
  edges jsonb NOT NULL,
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE family_trees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own family tree"
  ON family_trees FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own family tree"
  ON family_trees FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own family tree"
  ON family_trees FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own family tree"
  ON family_trees FOR DELETE
  USING (auth.uid() = user_id);
```

### 4. Configure environment variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

   Find these in: Supabase Dashboard → Project Settings → API

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Project Structure

```
src/
├── components/       # React components
├── context/         # React contexts (Auth)
├── theme/           # Theme configurations
├── utils/           # Helper functions
├── data/            # Data management
└── App.jsx          # Main app component
```

## Usage

1. **Sign Up** - Create an account with email/password
2. **Add People** - Click "Add Person" to add family members
3. **Add Connections** - Define relationships (Parent, Child, Spouse)
4. **Auto Layout** - Click "Auto Layout" to organize the tree
5. **Edit** - Click any person to edit their details
6. **Switch Themes** - Toggle between Vintage and Dark themes

## License

MIT

## Contributing

Open an issue for bugs or feature requests.
