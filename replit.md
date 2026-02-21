# Overview

TurboEntrega is a delivery management platform (Brazilian market) where merchants can create delivery orders, manage a credit-based wallet, and track deliveries. The app is built as a full-stack TypeScript monorepo with a React frontend and Express backend, using PostgreSQL for data storage. The UI is in Portuguese (pt-BR) and features a dark theme with vibrant orange accents.

Key features:
- **Authentication**: Register/login with CPF-based credentials, session-based auth via Passport.js
- **Order Management**: Merchants create delivery orders (collection → delivery), which deduct credits from their balance
- **Wallet/Credits System**: Merchants deposit money via PIX (Brazilian payment method) to receive credits; includes a simulated webhook for demo payment confirmation
- **Dashboard**: View and manage orders with status tracking (pending, accepted, picked_up, delivered)

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight client-side router)
- **State/Data Fetching**: TanStack React Query for server state management
- **UI Components**: shadcn/ui (new-york style) built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming, dark mode by default
- **Forms**: react-hook-form with Zod validation via @hookform/resolvers
- **Build Tool**: Vite with HMR support
- **Path Aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`

## Backend
- **Framework**: Express 5 on Node.js
- **Language**: TypeScript, executed via tsx
- **Authentication**: Passport.js with local strategy (username/password), express-session with MemoryStore
- **API Design**: REST endpoints under `/api/` prefix, with shared route definitions in `shared/routes.ts`
- **Development**: Vite dev server middleware integrated with Express for HMR
- **Production**: esbuild bundles the server; Vite builds the client to `dist/public`

## Shared Layer (`shared/`)
- **Schema**: Drizzle ORM schema definitions in `shared/schema.ts` — defines `users`, `orders`, and `deposits` tables
- **Routes**: API route contracts with Zod schemas in `shared/routes.ts` for type-safe API definitions
- **Validation**: Zod schemas generated from Drizzle schemas via `drizzle-zod`

## Database
- **Database**: PostgreSQL (required, via `DATABASE_URL` environment variable)
- **ORM**: Drizzle ORM with `drizzle-orm/node-postgres` driver
- **Migrations**: Managed via `drizzle-kit push` (`npm run db:push`)
- **Connection**: `pg.Pool` in `server/db.ts`
- **Tables**:
  - `users`: id, username (CPF), password, credits, cnpjOrCpf, phone, storeName, storeAddress
  - `orders`: id, merchantId, collectionAddress, deliveryAddress, packageDetails, status, price, driverPrice, distanceKm, createdAt
  - `deposits`: id, merchantId, amount (cents), credits, status, pixQrCode, pixPayload, createdAt

## Storage Pattern
- `IStorage` interface in `server/storage.ts` abstracts all data operations
- `DatabaseStorage` class implements the interface using Drizzle ORM queries
- This allows swapping storage implementations if needed

## Authentication Flow
- Passwords are stored in plain text (demo/prototype — needs hashing for production)
- Sessions stored in MemoryStore (not suitable for production multi-instance deployments)
- Protected routes check `req.isAuthenticated()` via Passport middleware
- Frontend uses a `ProtectedRoute` wrapper component that checks `/api/auth/me`

## Build Process
- `npm run dev`: Runs the Express server with Vite middleware for development
- `npm run build`: Builds client with Vite, bundles server with esbuild to `dist/index.cjs`
- `npm run start`: Runs the production bundle from `dist/`
- `npm run db:push`: Pushes Drizzle schema to PostgreSQL

# External Dependencies

- **PostgreSQL**: Primary database, connected via `DATABASE_URL` environment variable. Must be provisioned before the app can start.
- **PIX Payment Simulation**: No real payment gateway integrated. Deposits generate mock PIX QR codes/payloads. A webhook endpoint (`/api/webhooks/asaas`) simulates payment confirmation for demo purposes.
- **Session Secret**: Uses `SESSION_SECRET` environment variable (falls back to hardcoded default for development).
- **Google Fonts**: Outfit, Plus Jakarta Sans, DM Sans, Fira Code, Geist Mono loaded via CDN in `index.html` and `index.css`.
- **Replit Plugins**: Optional Vite plugins for Replit environment (`@replit/vite-plugin-runtime-error-modal`, `@replit/vite-plugin-cartographer`, `@replit/vite-plugin-dev-banner`).