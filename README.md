# Roblox Scripts Discovery Platform

A comprehensive platform for game developers and script enthusiasts, providing a complete ecosystem for script sharing, exploration, and collaboration.

## Features

- **Script Discovery**: Browse, search, and filter through a vast collection of Roblox scripts
- **User Authentication**: Secure login/registration system with role-based access control
- **Script Management**: Upload, edit, and manage your scripts
- **Rating System**: Rate scripts with a 5-star rating system
- **Favorites System**: Save your favorite scripts for later use
- **Community Features**: Follow creators, vote on scripts, and earn achievements
- **Admin Dashboard**: Comprehensive tools for content moderation and user management
- **Affiliate System**: Track affiliate links with detailed statistics
- **Monetization Options**: Ad banners, Work.ink popup integration, and popunder scripts

## Tech Stack

- **Frontend**: React with TypeScript, Tailwind CSS, and Shadcn/UI components
- **Backend**: Express.js with RESTful API architecture
- **Database**: Memory-based storage with object persistence (can be upgraded to PostgreSQL)
- **Authentication**: Session-based authentication with Passport.js

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Clone the repository
2. Install the dependencies: `npm install`
3. Start the development server: `npm run dev`
4. Access the application at: `http://localhost:5000`

### Default Admin Account

- Username: admin
- Password: admin123

## Extending the Application

### Adding Custom Game Types

Modify the script schema in `shared/schema.ts` to include new game types.

### Adding New Features

The modular architecture makes it easy to add new features by extending the API endpoints in `server/routes.ts` and adding corresponding UI components.

## License

This project is licensed under the MIT License.