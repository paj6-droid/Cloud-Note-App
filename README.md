# CloudNote - Cloud-Based Note-Taking Application

CloudNote is a secure, cloud-based platform where users can create, edit, and organize their notes anytime, from any device. All notes are automatically stored and synced in the cloud.

## Features

### Core Features
- User registration and login (authentication system)
- Create, edit, delete, and search notes
- Cloud synchronization - notes are automatically saved and synced across devices
- Organized view with tags, categories, or colors
- Responsive web design (works on desktop and mobile)

### Additional Features
- Dark/Light mode toggle for better user experience
- AI-powered note summarization
- Note pinning and archiving for better organization

## Technology Stack

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Node.js with Express
- **Database:** SQLite
- **Authentication:** JWT (JSON Web Tokens)
- **Deployment:** Vercel

## Project Structure

```
Cloud Note App/
├── frontend/          # Frontend files (HTML, CSS, JS)
├── backend/           # Backend API and server
├── package.json       # Node.js dependencies
└── README.md          # This file
```

## Setup Instructions

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory:
```
JWT_SECRET=your-secret-key-here
OPENAI_API_KEY=your-openai-api-key-here
PORT=3000
```

3. Start the development server:
```bash
npm start
```

4. Open your browser and navigate to `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user

### Notes
- `GET /api/notes` - Get all notes for authenticated user
- `GET /api/notes/:id` - Get a specific note
- `POST /api/notes` - Create a new note
- `PUT /api/notes/:id` - Update a note
- `DELETE /api/notes/:id` - Delete a note
- `GET /api/notes/search?q=query` - Search notes
- `POST /api/notes/:id/summarize` - Generate AI summary for a note

## Development

The application uses:
- Express.js for the backend API
- SQLite for database storage
- JWT for authentication
- OpenAI API for note summarization

## Deployment to Vercel

### Prerequisites
1. A Vercel account
2. GitHub repository (optional, but recommended)

### Steps

1. **Install Vercel CLI** (optional):
```bash
npm i -g vercel
```

2. **Deploy to Vercel**:
```bash
vercel
```

Or connect your GitHub repository to Vercel for automatic deployments.

3. **Set Environment Variables** in Vercel Dashboard:
   - Go to your project settings
   - Navigate to "Environment Variables"
   - Add the following:
     - `JWT_SECRET` - A secure random string (required)
     - `OPENAI_API_KEY` - Your OpenAI API key (optional, for AI summarization)
     - `NODE_ENV` - Set to `production`

4. **Important Notes for Vercel Deployment**:
   - SQLite files don't persist in serverless environments
   - For production, consider using:
     - Vercel Postgres (recommended)
     - Vercel KV
     - Or another cloud database service
   - The current SQLite setup works for development but may need modification for production

### Environment Variables

Create a `.env` file for local development:
```
JWT_SECRET=your-secret-key-change-in-production
OPENAI_API_KEY=your-openai-api-key-here
PORT=3000
DB_PATH=./database.db
```

**Important:** Never commit your `.env` file to version control. The `.gitignore` file already excludes it.

## License

ISC

