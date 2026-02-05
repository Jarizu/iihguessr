# IIHGuessr

Train your Magic: The Gathering draft skills by comparing card IIH (Improvement In Hand) values.

## What is IIH?

IIH (Improvement In Hand) measures how much a card improves your win rate when you draw it. Data comes from [17lands.com](https://www.17lands.com), aggregated from thousands of real BO1 Premier Draft games on MTG Arena.

## Features

- **Card Comparison Game**: Test your knowledge by guessing which card has higher IIH
- **Multiple Sets**: Practice with 30+ Magic sets from 2018-2025
- **Stats Tracking**: Track your accuracy, streaks, and performance per set
- **Analytics Dashboard**: Visualizations showing IIH limitations and biases
- **Educational Content**: Learn about IIH methodology and its limitations
- **Responsive Design**: Works seamlessly on desktop and mobile

## Tech Stack

- **Framework**: Next.js 15 with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with Google OAuth
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (Neon, Supabase, etc.)
- Google OAuth credentials

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/iihguessr.git
cd iihguessr
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables in `.env.local`:
```env
DATABASE_URL="postgresql://..."
NEXTAUTH_URL="http://localhost:3001"
NEXTAUTH_SECRET="your-secret-here"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

4. Run database migrations:
```bash
npx prisma migrate dev
npx prisma generate
```

5. Seed the database with card data (optional):
```bash
npm run sync
```

6. Start the development server:
```bash
npm run dev
```

Visit [http://localhost:3001](http://localhost:3001) to see the application.

## Database Schema

The application uses the following main models:
- `Card`: MTG card data with IIH values from 17lands
- `Guess`: User guess history
- `UserStats`: Aggregated user statistics
- `SetMetadata`: Information about MTG sets

## Data Sources

- **Card Data**: [17lands.com](https://www.17lands.com) - Community-driven MTG Arena draft data
- **Card Images**: [Scryfall](https://scryfall.com) - Comprehensive MTG card database

## License

MIT

## Acknowledgments

- Data provided by [17lands.com](https://www.17lands.com)
- Card images from [Scryfall](https://scryfall.com)
- Built with [Next.js](https://nextjs.org/)
