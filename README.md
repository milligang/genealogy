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
3. Run `supabase/migrations/001_relational_family.sql` in SQL Editor.

Notes:

- The app uses Row Level Security (RLS) so authenticated users can only access rows tied to their own `user_id`.
- Junction table inserts are also constrained to the current user’s own people/unions.
- Keep only the anon key in the frontend; never expose the service role key.

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
├── data/            # Supabase sync (`familyData.js`)
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