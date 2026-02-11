# AgentHub - Complete Folder Structure

```
agenthub/
│
├── .next/                          # Next.js build output (auto-generated)
├── node_modules/                   # Dependencies (auto-generated)
├── drizzle/                        # Drizzle migrations (auto-generated)
│
├── app/                            # Next.js 15 App Router
│   ├── api/                        # API Routes
│   │   ├── claude/
│   │   │   └── route.ts           # Claude AI API integration
│   │   └── webhooks/
│   │       └── clerk/
│   │           └── route.ts       # Clerk webhook handler
│   │
│   ├── dashboard/                  # Dashboard pages (protected)
│   │   ├── agents/                # Agents management
│   │   │   └── page.tsx
│   │   ├── integrations/          # Integrations page
│   │   │   └── page.tsx
│   │   ├── knowledge/             # Knowledge base
│   │   │   └── page.tsx
│   │   ├── messages/              # Messages/Chat
│   │   │   └── page.tsx
│   │   ├── settings/              # Settings page
│   │   │   └── page.tsx
│   │   ├── teams/                 # Teams management
│   │   │   ├── [teamId]/         # Individual team page
│   │   │   │   └── page.tsx
│   │   │   └── page.tsx
│   │   ├── layout.tsx             # Dashboard layout
│   │   └── page.tsx               # Dashboard home
│   │
│   ├── sign-in/                    # Authentication
│   │   └── [[...sign-in]]/
│   │       └── page.tsx
│   │
│   ├── sign-up/
│   │   └── [[...sign-up]]/
│   │       └── page.tsx
│   │
│   ├── layout.tsx                  # Root layout
│   ├── page.tsx                    # Home page (redirects)
│   └── globals.css                 # Global styles
│
├── components/                     # React components
│   ├── dashboard/                  # Dashboard components
│   │   ├── header.tsx             # Dashboard header
│   │   └── sidebar.tsx            # Dashboard sidebar
│   │
│   ├── ui/                         # shadcn/ui components (to be added)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── select.tsx
│   │   ├── separator.tsx
│   │   ├── tabs.tsx
│   │   ├── textarea.tsx
│   │   └── toast.tsx
│   │
│   └── theme-provider.tsx          # Theme provider component
│
├── lib/                            # Utility libraries
│   ├── db/                         # Database
│   │   ├── schema.ts              # Drizzle ORM schema
│   │   └── index.ts               # Database client
│   │
│   ├── actions/                    # Server actions (to be added)
│   │   ├── agents.ts
│   │   ├── teams.ts
│   │   ├── messages.ts
│   │   ├── knowledge.ts
│   │   └── integrations.ts
│   │
│   └── utils.ts                    # Utility functions
│
├── hooks/                          # Custom React hooks (to be added)
│   ├── use-toast.ts
│   └── use-theme.ts
│
├── types/                          # TypeScript type definitions (to be added)
│   ├── agent.ts
│   ├── team.ts
│   └── message.ts
│
├── public/                         # Static assets
│   ├── favicon.ico
│   └── images/
│
├── .env.local.example              # Environment variables template
├── .env.local                      # Local environment variables (gitignored)
├── .eslintrc.json                  # ESLint configuration
├── .gitignore                      # Git ignore file
├── components.json                 # shadcn/ui configuration
├── drizzle.config.ts              # Drizzle ORM configuration
├── middleware.ts                   # Clerk authentication middleware
├── next.config.ts                  # Next.js configuration
├── package.json                    # Project dependencies
├── postcss.config.mjs             # PostCSS configuration
├── README.md                       # Project documentation
├── supabase-schema.sql            # Supabase SQL schema
├── tailwind.config.ts             # Tailwind CSS configuration
└── tsconfig.json                  # TypeScript configuration
```

## Directory Descriptions

### `/app`
Next.js 15 App Router directory containing all pages, layouts, and API routes.

### `/app/api`
API routes for backend functionality:
- **claude**: Integration with Claude 3.5 Sonnet API
- **webhooks/clerk**: Webhook handler for Clerk user events

### `/app/dashboard`
Protected dashboard pages requiring authentication:
- **agents**: Create and manage AI agents
- **teams**: Organize agents into teams
- **messages**: Chat interface with agents
- **knowledge**: Manage knowledge bases
- **integrations**: Connect third-party services
- **settings**: User and team settings

### `/components`
Reusable React components:
- **dashboard**: Dashboard-specific components (header, sidebar)
- **ui**: shadcn/ui component library (to be installed)

### `/lib`
Utility functions and configurations:
- **db**: Database schema and client using Drizzle ORM
- **actions**: Server actions for data mutations (to be added)
- **utils.ts**: Helper functions

### `/hooks`
Custom React hooks for common functionality (to be added)

### `/types`
TypeScript type definitions for better type safety (to be added)

### `/public`
Static assets like images, fonts, and favicon

## Configuration Files

- **next.config.ts**: Next.js configuration with image optimization
- **tailwind.config.ts**: Tailwind CSS with shadcn/ui design tokens
- **drizzle.config.ts**: Drizzle ORM configuration for PostgreSQL
- **components.json**: shadcn/ui component configuration
- **middleware.ts**: Clerk authentication middleware
- **tsconfig.json**: TypeScript compiler options
- **.eslintrc.json**: ESLint rules for code quality

## Database Schema Files

- **lib/db/schema.ts**: Drizzle ORM schema definitions
- **supabase-schema.sql**: Raw SQL schema for Supabase setup

## Next Steps

1. Install dependencies: `npm install`
2. Set up environment variables in `.env.local`
3. Run database migrations: `npm run db:push`
4. Install shadcn/ui components as needed
5. Start development server: `npm run dev`
