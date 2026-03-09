# PMS React Application

A modern, enterprise-ready React application built with TypeScript, Vite, Tailwind CSS, and TanStack Query.

## Features

- ✅ **Authentication System** - Protected routes with login/logout functionality
- ✅ **React Router v7** - Client-side routing with protected routes
- ✅ **TanStack Query v5** - Server state management with caching
- ✅ **Tailwind CSS v3** - Utility-first CSS framework
- ✅ **TypeScript 5.7** - Type-safe development
- ✅ **Vite 6** - Lightning-fast build tool
- ✅ **Vitest** - Unit testing framework
- ✅ **Prettier** - Code formatting
- ✅ **ESLint** - Code linting
- ✅ **Error Boundary** - Graceful error handling
- ✅ **Mobile-Friendly Sidebar** - Responsive navigation
- ✅ **Enterprise Structure** - Organized folder structure with path aliases

## Project Structure

```
react/
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── auth/         # Authentication components
│   │   ├── common/       # Common components (ErrorBoundary)
│   │   └── layout/       # Layout components (Header, Sidebar, Footer)
│   ├── contexts/         # React Context providers
│   ├── hooks/            # Custom React hooks
│   ├── pages/            # Page components
│   │   ├── Home/
│   │   ├── Login/
│   │   └── Dashboard/
│   ├── services/         # API service layer
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Utility functions and constants
│   ├── config/           # App configuration
│   ├── test/             # Test setup
│   ├── App.tsx           # Main App component
│   ├── main.tsx          # Application entry point
│   └── index.css         # Global styles
├── public/               # Static assets
├── index.html           # HTML template
├── package.json         # Dependencies and scripts
├── tsconfig.json        # TypeScript configuration
├── vite.config.ts       # Vite configuration
├── vitest.config.ts     # Vitest configuration
├── tailwind.config.js   # Tailwind CSS configuration
├── .prettierrc          # Prettier configuration
└── .eslintrc.cjs        # ESLint configuration
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm

### Installation

1. Navigate to the react folder:
```bash
cd react
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env` and set your API base URL:
```
VITE_API_BASE_URL=http://localhost:5000/api
```

### Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:7200`

### Building for Production

Build the application:
```bash
npm run build
```

Preview the production build:
```bashlint:fix` - Fix ESLint errors
- `npm run format` - Format code with Prettier
- `npm run type-check` - Run TypeScript type checking
- `npm run test` - Run tests with Vitest
- `npm run test:ui` - Run tests with UI
npm run preview
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## Authentication

The application uses a context-based authentication system:

- **Login** - Navigate to `/login` to authenticate
- **Protected Routes** - Home and Dashboard pages are protected
- **Automatic Redirect** - Unauthenticated users are redirected to login
- **Token Storage** - Auth tokens stored in localStorage

## TanStack Query

Server state is managed using TanStack Query (React Query):

- Automatic caching and background refetching
- Request deduplication
- Optimistic updates support
- DevTools included for debugging

Example usage in Dashboard page:
```typescript
const { data, isLoading, error } = useItems(page, 10);
```

## Path Aliases

The project uses path aliases for cleaner imports:

- `@/*` - src/
- `@components/*` - src/components/
- `@pages/*` - src/pages/
- `@hooks/*` - src/hooks/
- `@contexts/*` - src/contexts/
- `@services/*` - src/services/
- `@types/*` - src/types/
- `@config/*` - src/config/

## Styling

Tailwind CSS is configured with custom theme extensions:

- Custom primary color palette
- Responsive utilities
- Component-specific styles

## API Integration

The application includes a service layer for API communication:

- **api.service.ts** - Axios instance with interceptors
- **auth.service.ts** - Authentication endpoints
- **data.service.ts** - Data CRUD operations

## Contributing

1. Follow the existing code structure
2. Use TypeScript for type safety
3. Write meaningful commit messages
4. Test your changes before committing

## License

This project is part of the PMS application suite.
