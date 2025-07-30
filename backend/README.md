# AI DropBox Backend

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env` file in `backend/` with:
   ```env
   MONGODB_URI=mongodb://localhost:27017/ai-dropbox
   JWT_SECRET=your_jwt_secret_here
   PORT=3002
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```

## Folder Structure

- `src/config/` - DB and app config
- `src/controllers/` - Route logic
- `src/middleware/` - Auth, error handling
- `src/models/` - Mongoose schemas
- `src/routes/` - Express routers
- `src/utils/` - Helpers
- `src/app.ts` - Express app setup
- `src/server.ts` - Entry point 