# Roblox Scripts Platform

A comprehensive platform for Roblox script discovery, sharing, and collaboration designed for game developers and script enthusiasts.

## Features

### Core Functionality
- **Script Management**: Browse, search, upload, and manage Roblox scripts
- **User Authentication**: Register, login, and manage your profile
- **Categories & Tags**: Organize scripts by categories and tags for easy discovery
- **Rating System**: Star ratings and upvote/downvote functionality for scripts
- **Comments**: Leave feedback and interact with script authors
- **Script Copying**: One-click copy function for easy script usage
- **Game Integration**: Direct links to associated Roblox games with name extraction

### Community Features
- **User Profiles**: Customizable profiles with bio and avatar
- **Favorites System**: Save and organize your favorite scripts
- **User Following**: Follow your favorite script creators
- **Achievement System**: Earn badges for platform contributions
- **Trending Scripts**: Discover popular scripts based on user activity
- **Activity Tracking**: Monitor your interactions with the platform

### Admin Features
- **Enhanced User Management**: Admin and moderator roles with permission controls
- **Content Moderation**: Review and approve comments and scripts
- **Admin Dashboard**: Comprehensive statistics and platform management
- **Banner Management**: Control ad banners and promotional content

### Monetization
- **Ad System**: Customizable ad banners (720x90) for top of pages
- **Work.ink Integration**: Popup monetization (max 3 displays per session)
- **Popunder Script**: Monetization via popunder (max 1 display per session)
- **Affiliate System**: Custom affiliate links with tracking and statistics

### API & Integration
- **External API**: RESTful endpoints for third-party Roblox executor integration
- **API Testing Page**: Interactive endpoint testing functionality
- **Documentation**: Comprehensive API documentation page

## Technology Stack

- **Frontend**: React with TypeScript, Tailwind CSS, and Shadcn UI components
- **Backend**: Express.js API
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Passport.js with session-based auth
- **State Management**: TanStack React Query
- **Form Handling**: React Hook Form with Zod validation
- **Routing**: Wouter for lightweight client-side routing

## API Documentation

The platform includes a public API for integration with Roblox executors and other external services:

- `GET /api/v1/scripts` - List all scripts with pagination and filtering options
- `GET /api/v1/scripts/:id` - Get details for a specific script including tags
- `GET /api/v1/categories` - List all script categories
- `GET /api/v1/tags` - List all available tags

Detailed API documentation is available at `/api-docs` within the application, and interactive testing at `/api-tester`.

## Database Schema

The PostgreSQL database includes tables for:
- Users (with authentication and role information)
- Scripts (with categories, tags, and metadata)
- Categories and Tags (for organization)
- User interactions (favorites, comments, ratings, follows)
- Achievement system (achievements and user achievements)
- Monetization (ad campaigns, banners, affiliate tracking)

## Getting Started

### Prerequisites

- Node.js 16+
- PostgreSQL database

### Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/whohurtyoudear/roblox-scripts-platform.git
   cd roblox-scripts-platform
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Update with your PostgreSQL credentials and session secret

4. Run database migrations:
   ```bash
   npm run db:push
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

### Default Admin Account

- Username: admin
- Password: admin123 (change this in production)

## Deployment

### Replit Deployment
1. Create a new Replit from the GitHub repository
2. Set up the required environment secrets:
   - DATABASE_URL
   - SESSION_SECRET
3. Run the `npm run db:push` command to set up the database
4. Use the "Run" button or set up a custom run command: `npm run dev`

### Custom Domain Setup
1. In your Replit project, navigate to the "Domains" tab
2. Follow the instructions to connect your custom domain
3. Update your DNS settings as specified by Replit

## Security Considerations

- GDPR-compliant with cookie consent popup
- Session-based authentication with secure password hashing
- Input validation on all forms and API endpoints
- Role-based access control for admin functionality

## License

[MIT License](LICENSE)