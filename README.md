Route Rating Hub – Bus Route Reviews & Ratings
A user-friendly platform module allowing travelers to rate bus routes, write reviews, and read feedback from others.
Enhances transparency and helps users make informed decisions by showing average ratings and recent reviews.
________________________________________
Features
=> Route Ratings
• 1–5 star rating system
• Average route rating displayed on route pages
• Smooth and interactive rating animation
=> User Reviews
• Write detailed reviews after a journey
• Read reviews from other travelers
• Includes reviewer name, date & rating
=> Community Insight
• Browse real experiences from users
• Understand route quality, comfort & safety
=> Tech Stack
Layer	Technology
Frontend	React 18 + TypeScript + Vite
Styling	TailwindCSS
Backend	Supabase or Node.js + Express
Database	Supabase PostgreSQL or MongoDB
State Management	React Hooks
Deployment	Vercel / Netlify
________________________________________
Project Structure
RouteRating_Hub_Task-6/
│── public/
│── src/
│   ├── pages/            # Route details, review pages
│   ├── components/       # RatingStars, ReviewCard
│   ├── hooks/            # useReviews, useAverageRating
│   ├── integrations/     # Supabase / API integration
│   ├── assets/           # icons, images
│   ├── App.tsx
│   └── main.tsx
│── supabase/             # Backend configuration (if used)
│── index.html
│── tailwind.config.ts
│── package.json
________________________________________
Setup Instructions
1. Clone the Repository
git clone <repo_url>
cd RouteRating_Hub_Task-6
2. Install Dependencies
npm install
3. Setup Environment Variables
Create .env if using Supabase:
VITE_SUPABASE_URL=your_url
VITE_SUPABASE_ANON_KEY=your_key
4. Start Development
npm run dev
5. Build Production Version
npm run build
________________________________________
Core Modules Explained
1. Ratings Component
• Displays clickable star rating
• Allows users to choose 1–5 stars
2. Review Form
• Enter review text
• Submit rating + feedback
• Saves to backend
3. Review Display Section
• Shows latest reviews
• Each review includes rating, text & date
4. Average Rating Panel
• Computes the average rating
• Visible at top of route details page
________________________________________
Contributing
Contributions are welcome.
Open an issue to discuss proposed changes.
________________________________________
License
MIT License
________________________________________
Author
Padma Sindhoora Ayyagari
