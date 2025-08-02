# Overview

This is a Binance Trading Dashboard - a full-stack web application that provides cryptocurrency trading analysis, portfolio management, and automated trading strategies. The application connects to the Binance API to fetch real-time market data, manage user portfolios, and execute trading strategies. It features a modern React frontend with comprehensive dashboard views and a Node.js/Express backend with PostgreSQL database integration.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **React 18** with TypeScript for the user interface
- **Vite** as the build tool and development server
- **TailwindCSS** with custom theme configuration for styling
- **Radix UI** components for accessible UI primitives
- **Wouter** for client-side routing instead of React Router
- **TanStack Query** for server state management and API caching
- **React Hook Form** with Zod validation for form handling
- **Chart.js** and **Lightweight Charts** for data visualization

## Backend Architecture
- **Express.js** server with TypeScript
- **Passport.js** with local strategy for authentication
- **Session-based authentication** with configurable storage (memory or PostgreSQL)
- **RESTful API** design with `/api` prefix
- **Modular service architecture** with separate files for different concerns
- **Error handling middleware** with structured error responses

## Database Design
- **PostgreSQL** as the primary database via Neon serverless
- **Drizzle ORM** for database operations and schema management
- **Schema includes**: users, strategies, trades tables
- **Connection pooling** using @neondatabase/serverless
- **Migration system** via Drizzle Kit

## Authentication & Security
- **Scrypt-based password hashing** with salt for security
- **Session management** with configurable store (memory/PostgreSQL)
- **API key storage** for Binance integration (encrypted at rest)
- **CORS and security headers** configured appropriately
- **Input validation** using Zod schemas on both client and server

## External API Integration
- **Binance API** integration for market data and trading operations
- **Real-time market data** fetching with caching strategies
- **Trading pair management** with configurable symbols
- **Account balance** and trading history retrieval
- **Mock data fallbacks** for development without API keys

## State Management
- **Server state**: TanStack Query for API data caching and synchronization
- **Client state**: React hooks and context for UI state
- **Form state**: React Hook Form for complex form management
- **Global state**: Auth context for user session management

## Email Services
- **Pluggable email architecture** supporting multiple providers
- **SendGrid integration** for transactional emails
- **Nodemailer support** for SMTP-based email sending
- **Email templates** for trading notifications and alerts

## Storage Architecture
- **Abstracted storage interface** allowing multiple implementations
- **Database storage** using Drizzle ORM for production
- **Memory storage** for development and testing
- **Session storage** integrated with authentication system

# External Dependencies

## Core Framework Dependencies
- **@neondatabase/serverless**: PostgreSQL database connection
- **drizzle-orm**: Database ORM and query builder
- **express**: Web server framework
- **passport**: Authentication middleware
- **@tanstack/react-query**: Server state management
- **react-hook-form**: Form management
- **zod**: Schema validation

## UI and Styling
- **@radix-ui/***: Accessible UI component primitives
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Icon library
- **chart.js**: Chart rendering library
- **lightweight-charts**: Trading chart visualization

## API and External Services
- **Binance API**: Cryptocurrency market data and trading
- **@sendgrid/mail**: Email service integration
- **nodemailer**: Alternative email service

## Development and Build Tools
- **vite**: Frontend build tool and dev server
- **typescript**: Type safety and development experience
- **drizzle-kit**: Database migration and schema management
- **esbuild**: Server-side code bundling for production

## Session and Storage
- **express-session**: Session management
- **connect-pg-simple**: PostgreSQL session store
- **memorystore**: In-memory session store for development

The application is designed to be deployed on Replit with environment variables for database connection, API keys, and session secrets. The architecture supports both development (with mock data) and production (with real Binance API integration) scenarios.