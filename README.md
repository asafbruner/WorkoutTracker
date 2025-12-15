# Workout Tracker

A personal workout tracking application for managing strength training, CrossFit, and running workouts.

## Features

- 📅 Weekly workout calendar view
- 💪 Track strength training exercises with weights, reps, and sets
- 🏃 Log running workouts (sprints and long runs)
- 🏋️ Record CrossFit WOD sessions
- 📊 Weekly statistics and progress tracking
- 📝 Workout history with detailed logs
- ✏️ Editable workout program
- 🔒 Password-protected access
- 💾 Automatic data persistence in browser localStorage

## Tech Stack

- React 18
- Vite
- Tailwind CSS
- Lucide React Icons
- LocalStorage API

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd workouttracker
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## Building for Production

To create a production build:

```bash
npm run build
```

The built files will be in the `dist` directory.

To preview the production build:

```bash
npm run preview
```

## Deploying to GitHub Pages

1. Update the `base` property in `vite.config.js` to match your repository name:
```javascript
base: '/your-repo-name/',
```

2. Build and deploy:
```bash
npm run deploy
```

This will build the app and push it to the `gh-pages` branch of your repository.

3. Configure GitHub Pages:
   - Go to your repository settings
   - Navigate to "Pages" section
   - Set source to "Deploy from a branch"
   - Select `gh-pages` branch
   - Save

Your app will be available at: `https://yourusername.github.io/your-repo-name/`

## Alternative Deployment Options

### Netlify

1. Build your app:
```bash
npm run build
```

2. Deploy the `dist` folder to Netlify:
   - Drag and drop the `dist` folder to Netlify
   - Or connect your repository and set build command to `npm run build` and publish directory to `dist`

### Vercel

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel
```

Follow the prompts to deploy your application.

## Configuration

### Changing the Password

Edit the password in `src/WorkoutTracker.jsx`:

```javascript
const PASSWORD_HASH = 'your-new-password';
```

**Important:** For production use, implement proper authentication with password hashing.

### Customizing Workouts

The default workout program is defined in `src/WorkoutTracker.jsx` in the `defaultWorkouts` object. Modify this to customize your weekly routine.

## Data Storage

All workout data is stored in the browser's localStorage. This means:
- Data persists across browser sessions
- Data is stored locally on your device
- Clearing browser data will delete all workout logs
- Data is not synced across devices

## Usage

1. **Login**: Enter the password to access the app
2. **View Weekly Schedule**: See your workout plan for the current week
3. **Log Workouts**: Click "Log Workout" on any day to record your session
4. **Track Progress**: View your workout history and weekly statistics
5. **Edit Program**: Click "Edit" to modify your workout program
6. **Navigate Weeks**: Use the arrow buttons to view past or future weeks

## License

This project is private and for personal use.

## Support

For issues or questions, please open an issue in the repository.
