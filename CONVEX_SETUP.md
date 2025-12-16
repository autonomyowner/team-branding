# Convex Setup Guide

This project is configured to use Convex for real-time collaboration. Follow these steps to complete the setup.

## Prerequisites

- Node.js 18+
- Convex account (free at convex.dev)

## Setup Steps

### 1. Login to Convex

```bash
npx convex login
```

This will open a browser window to authenticate with Convex.

### 2. Push the Schema

```bash
npx convex dev
```

This will:
- Push the schema to your Convex deployment
- Generate proper TypeScript types in `convex/_generated/`
- Start watching for changes

### 3. Environment Variables

The `.env.local` file should already contain your Convex URL:

```
NEXT_PUBLIC_CONVEX_URL=https://accomplished-hyena-208.convex.cloud
```

### 4. Run the Development Server

In a separate terminal:

```bash
npm run dev
```

## Architecture

### Backend (Convex)

Located in `/convex/`:

- `schema.ts` - Database schema with tables for users, workspaces, projects, and canvas data
- `auth/users.ts` - User authentication and profile queries/mutations
- `workspaces/` - Workspace management
- `projects/` - Project management
- `canvas/` - Real-time canvas data sync

### Frontend (Next.js)

- `src/convex/ConvexClientProvider.tsx` - Convex React provider
- `src/hooks/useCanvasData.ts` - Canvas data hook (uses localStorage, upgradeable to Convex)
- `src/hooks/useCanvasSync.ts` - Real-time sync hook (placeholder until Convex is configured)

## Current State

The app currently uses **localStorage** for canvas data persistence. This works for:
- Guest users
- Development without Convex

Once you run `npx convex dev`, the app will use Convex for:
- Real-time sync between users
- Persistent storage
- Authentication

## Features

- Sign up / Login with email and password
- Create and manage projects within workspaces
- Real-time collaborative canvas
- Drag, resize, pan, and zoom
- Node types: Task, Note, Milestone
- Container groups with colors

## Upgrading to Full Convex Integration

After running `npx convex dev`, update the hooks to use Convex:

1. Remove `@ts-nocheck` from all files in `/convex/`
2. Update `useCanvasData.ts` to use Convex mutations
3. Update `AuthContext.tsx` to use Convex Auth

The schema and mutations are already written and ready to use.
