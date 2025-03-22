# Roblox Scripts Platform

A comprehensive platform for Roblox script discovery, sharing, and collaboration designed for game developers and script enthusiasts.

## Features

- **Script Management**: Browse, search, upload, and manage Roblox scripts
- **User Authentication**: Register, login, and manage your profile
- **Categories & Tags**: Organize scripts by categories and tags for easy discovery
- **Rating System**: Rate scripts with a 5-star rating system
- **Admin Dashboard**: Manage users, scripts, and site content
- **API Integration**: External API endpoints for integration with Roblox executors
- **Responsive Design**: Mobile-friendly interface

## Technology Stack

- **Frontend**: React with TypeScript and Tailwind CSS
- **Backend**: Express.js API
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Passport.js with session-based auth
- **Styling**: Shadcn UI components

## API Documentation

The platform includes a public API for integration with Roblox executors and other external services:

- `GET /api/v1/scripts` - List all scripts with pagination
- `GET /api/v1/scripts/:id` - Get details for a specific script
- `GET /api/v1/categories` - List all script categories
- `GET /api/v1/tags` - List all available tags

Detailed API documentation is available at `/api-docs` within the application.

## Getting Started

### Prerequisites

- Node.js 16+
- PostgreSQL database

### Installation

1. Clone this repository
2. Install dependencies with `npm install`
3. Set up environment variables (see `.env.example`)
4. Run database migrations with `npm run db:push`
5. Start the development server with `npm run dev`

### Default Admin Account

- Username: admin
- Password: admin123 (change this in production)

## License

[MIT License](LICENSE)