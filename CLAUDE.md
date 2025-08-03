# CLAUDE.md

This file provides guidance to AI agents working with code in this repository.

## 🤖 MULTI-AGENT DEVELOPMENT COORDINATION

**CRITICAL**: This project is collaboratively developed by multiple AI agents:
- **Claude Code (Anthropic)** - Primary development agent
- **Gemini CLI (Google)** - Secondary development agent

### Agent Coordination Protocol:
1. **ALWAYS** read CHATLOG.md, CLAUDE.md, and TASKS.md before starting work
2. **ALWAYS** update these files after completing significant work
3. **Follow existing code patterns** and architectural decisions documented here
4. **Use established terminology** and maintain consistent documentation style
5. **Test builds** (`npm run build` && `npm run lint`) before marking tasks complete
6. **Reference exact file paths** for easy navigation between agents
7. **Document environment variable requirements** clearly
8. **Mark task status** using: ✅ (complete), 🔄 (in progress), ⏳ (pending)
9. **CRITICAL**: Make all features **easily verifiable by a human** - include clear instructions for testing functionality

## Project Overview

**AI-Powered Business Intelligence for SMEs** - A web application enabling Small and Medium Enterprises (SMEs) to connect various data sources (sales, accounting, social media) and receive automated business insights and recommendations through natural language interface. Goal: "Turn business data into actions in 5 minutes."

### Target Market
- Small businesses in Paraguay (retail stores, pharmacies, restaurants, cafes)
- Service businesses (beauty salons, auto repair shops)
- E-commerce sellers (Instagram, Facebook, WhatsApp)

## Technical Architecture

### Tech Stack ✅ IMPLEMENTED
- **Frontend**: Next.js 15.4.5 with React 19.1.0 + TypeScript
- **Backend**: Next.js API Routes (Node.js runtime)
- **Database**: Supabase (PostgreSQL) with Row-Level Security + Pinecone (Vector DB for RAG)
- **Authentication**: Clerk - Fully configured with middleware protection
- **AI/LLM**: Google Gemini 1.5 Flash - Integrated with business context prompts
- **Styling**: Tailwind CSS + Heroicons for UI components
- **Validation**: Zod for request/response validation
- **Build System**: Next.js with TypeScript strict mode

### Planned Future Integrations ⏳
- **Workflow Orchestration**: n8n.io for data integrations (Phase 2)
- **Charts/Visualizations**: Recharts for data visualization (Next Phase)
- **Queues**: Redis for background jobs (Phase 2)
- **File Storage**: AWS S3 for file uploads (Next Phase)

### Core Architecture Principles ✅ IMPLEMENTED
- **Multi-tenant**: Strict data isolation using Supabase RLS policies
- **Type Safety**: Full TypeScript implementation with strict mode
- **Security First**: Input validation, sanitization, and authentication middleware
- **Component Architecture**: Modular React components with custom hooks
- **API Design**: RESTful endpoints with proper error handling and validation

### Planned Architecture Features ⏳
- **Microservices**: n8n workflow orchestration (Phase 2)
- **RAG (Retrieval Augmented Generation)**: Pinecone integration for enhanced AI responses
- **Background Processing**: Redis queue system for data sync and report generation
- **Real-time Updates**: WebSocket connections for live dashboard updates

## Development Commands ✅ CURRENT SETUP

### Setup and Installation
```bash
# Navigate to web application directory
cd web-app

# Install dependencies
npm install

# Set up environment variables (CRITICAL)
cp .env.example .env.local
# MUST configure: SUPABASE_URL, SUPABASE_ANON_KEY, CLERK keys, GOOGLE_API_KEY, PINECONE keys

# Apply database schema to Supabase (manual step)
# Copy content from database/schema.sql to Supabase SQL Editor and execute

# Start development server
npm run dev
# Application available at: http://localhost:3000
```

### Testing and Quality ✅ AVAILABLE
```bash
# Type checking & Linting (CRITICAL - run before marking tasks complete)
npm run lint

# Production build test (CRITICAL - must pass)
npm run build

# Development server
npm run dev

# Production server (after build)
npm run start

# Note: Automated tests not yet implemented - manual testing only
# TODO: Add Jest/React Testing Library setup in future phase
```

### 🔍 HUMAN VERIFICATION REQUIREMENTS

**CRITICAL FOR ALL AGENTS**: When implementing new features, ALWAYS include:

1. **Clear Testing Instructions** - Provide step-by-step instructions for human verification
2. **Expected Behavior** - Describe exactly what should happen when testing
3. **Sample Data** - Include example data or files for testing (especially for CSV uploads)
4. **Visual Confirmation** - Describe what the user should see on screen
5. **Error Testing** - Include steps to test error handling (invalid inputs, etc.)

#### Example Testing Documentation Format:
```markdown
## How to Test [Feature Name]

### Prerequisites:
- Application running on http://localhost:3000
- User logged in to dashboard

### Test Steps:
1. Navigate to [specific page/section]
2. Click [specific button/element]
3. [Perform specific action]

### Expected Results:
- ✅ Should see [specific visual feedback]
- ✅ Should display [specific data/message]
- ✅ Should save [specific information] to database

### Test with Sample Data:
[Provide actual sample files or data to use]

### Error Testing:
- Try [invalid input] → Should show [specific error message]
- Test [edge case] → Should handle gracefully
```

### Build and Deployment
```bash
# Build for production
npm run build

# Start production server
npm run start

# Generate production build with analysis
npm run build:analyze
```

## Security Requirements & Guidelines

### Data Protection
- **Encryption**: All sensitive data MUST be encrypted in transit (TLS) and at rest
- **Multi-tenant Isolation**: Implement strict database-level isolation using row-level security (RLS)
- **API Keys**: Store third-party API keys securely using encrypted environment variables
- **Data Validation**: All user inputs MUST be sanitized and validated server-side

### Input Sanitization & Validation
```typescript
// REQUIRED: Sanitize all user inputs
import { z } from 'zod';
import DOMPurify from 'dompurify';

// Example schema validation
const userQuerySchema = z.object({
  query: z.string().min(1).max(500).trim(),
  filters: z.object({}).optional()
});

// Sanitize HTML content
const sanitizedInput = DOMPurify.sanitize(userInput);
```

### Authentication & Authorization
- Use Clerk/Auth0 for secure authentication
- Implement role-based access control (RBAC)
- Session management with secure cookies
- Rate limiting on all API endpoints

### Database Security
```sql
-- Example: Row Level Security for multi-tenant isolation
CREATE POLICY tenant_isolation ON business_data
  USING (organization_id = current_setting('app.current_organization_id')::uuid);
```

### API Security
- Input validation on all endpoints
- SQL injection prevention using parameterized queries
- XSS protection through content sanitization
- CSRF protection
- Request rate limiting
- API versioning and deprecation handling

## Core Features Implementation

### Phase 1 (MVP)
1. **User Authentication**: Secure login/registration
2. **Basic Dashboard**: KPI widgets with manual CSV upload
3. **Data Connectors**: Shopify, QuickBooks, Google Sheets via n8n
4. **AI Query Interface**: Natural language business questions
5. **Basic Reports**: PDF generation

### Data Flow Architecture
```
User Input → Validation → Sanitization → Business Logic → Database
                ↓
AI Query → Context Retrieval (Vector DB) → LLM API → Response Validation
```

## Integration Guidelines

### Third-party API Integration (via n8n)
- All API credentials stored securely in n8n credential management
- Implement retry logic and error handling
- Monitor API rate limits and usage
- Data transformation and validation pipelines

### LLM Integration Security
```typescript
// REQUIRED: Validate and sanitize AI responses
const validateAIResponse = (response: string) => {
  // Remove any potential code injection
  const sanitized = DOMPurify.sanitize(response);
  
  // Validate response structure
  const schema = z.object({
    insight: z.string(),
    confidence: z.number().min(0).max(1),
    data_sources: z.array(z.string())
  });
  
  return schema.parse(JSON.parse(sanitized));
};
```

## File Structure & Conventions ✅ IMPLEMENTED

### Current Project Structure
```
AI-Powered Business Intelligence for SMEs/
├── CHATLOG.md              # Multi-agent development log
├── CLAUDE.md              # This file - agent guidance
├── TASKS.md               # Task management and status
├── SETUP_GUIDE.md         # Complete setup instructions
└── web-app/               # Main Next.js application
    ├── src/
    │   ├── app/
    │   │   ├── api/ai/         # AI API endpoints (query, insights)
    │   │   ├── dashboard/      # Main dashboard page
    │   │   ├── sign-in/        # Authentication pages
    │   │   ├── sign-up/
    │   │   ├── layout.tsx      # Root layout with Clerk provider
    │   │   └── page.tsx        # Landing page
    │   ├── components/
    │   │   ├── ai/             # AI-related components (AIAssistant)
    │   │   └── layout/         # Layout components (DashboardLayout)
    │   ├── lib/
    │   │   ├── ai/             # AI service utilities (gemini.ts)
    │   │   ├── constants.ts    # Application constants
    │   │   └── supabase.ts     # Database configuration
    │   ├── hooks/              # Custom React hooks (useAI)
    │   ├── types/              # TypeScript type definitions
    │   └── middleware.ts       # Clerk authentication middleware
    ├── database/
    │   └── schema.sql          # Multi-tenant database schema
    ├── .env.example           # Environment variables template
    ├── package.json           # Dependencies and scripts
    └── tsconfig.json          # TypeScript configuration
```

### Code Organization Patterns
- **API Routes**: RESTful design with proper validation (`/api/ai/*`)
- **Components**: Atomic design with reusable UI components
- **Hooks**: Custom hooks for state management and API interactions
- **Types**: Comprehensive TypeScript definitions for type safety
- **Services**: External API integrations and business logic

## Environment Variables

### Current Required Environment Variables ✅ CONFIGURED
```env
# Core Application
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Database (Supabase) - ACTIVE
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJ...your-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJ...your-service-role-key

# Authentication (Clerk) - ACTIVE  
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

# AI Provider (Google Gemini) - ACTIVE
GOOGLE_API_KEY=your-google-api-key

# Vector Database (Pinecone) - CONFIGURED
PINECONE_API_KEY=your-pinecone-api-key
PINECONE_ENVIRONMENT=us-east-1-aws
PINECONE_INDEX_NAME=sme-bi-knowledge
```

### Future Environment Variables ⏳ (Phase 2)
```env
# Background Jobs
REDIS_URL=redis://localhost:6379

# Third-party Integrations
SHOPIFY_API_KEY=...
QUICKBOOKS_CLIENT_ID=...
GOOGLE_SHEETS_CLIENT_ID=...

# File Storage
AWS_S3_BUCKET=...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...

# Email Service
SMTP_HOST=...
SMTP_USER=...
SMTP_PASSWORD=...
```

## 🎯 CURRENT PROJECT STATUS (Updated: 2025-08-03)

### ✅ COMPLETED FEATURES (MVP Foundation)
1. **Authentication System**
   - Clerk integration with middleware protection
   - Sign-in/sign-up pages with proper routing
   - Protected dashboard routes

2. **Database Architecture** 
   - Supabase PostgreSQL with Row-Level Security (RLS)
   - Multi-tenant data isolation
   - Comprehensive schema: users, organizations, metrics, AI queries
   - Schema file: `database/schema.sql`

3. **AI Integration (Google Gemini)**
   - Gemini 1.5 Flash model integration
   - Business-specific prompt templates for SME context
   - API endpoints: `/api/ai/query`, `/api/ai/insights`
   - Security: Input validation and sanitization

4. **UI Components & Layout**
   - Responsive dashboard with navigation
   - Landing page with feature showcase
   - AI Assistant chat interface
   - Metric cards and dashboard widgets

5. **Development Infrastructure**
   - TypeScript with strict mode
   - ESLint configuration and validation
   - Production build system (passes `npm run build`)
   - Environment variable management

### 🔄 CURRENT DEVELOPMENT SESSION (2025-08-03)
**Active Agent**: Claude Code (Sonnet 4)
**Session Focus**: Data Features Implementation - CSV Upload & Visualization

**COMPLETED TODAY:**
1. **CSV Upload & Processing** ✅ - File upload with validation and parsing
2. **Data Visualization** ✅ - Charts and graphs using Recharts

**READY FOR USE:**
- Full CSV upload pipeline with validation
- Chart components library (LineChart, BarChart, PieChart)
- Data transformation utilities
- Dashboard integration

### ⏳ NEXT PHASE PRIORITIES (High Impact)
3. **Business Metrics Engine** - Automated calculation and insights
4. **Advanced Dashboard Widgets** - Customizable dashboard components
5. **Report Generation** - PDF export functionality

### 📁 KEY FILES FOR AGENTS
- **AI Services**: `src/lib/ai/gemini.ts` - All AI prompt templates and functions
- **Database Config**: `src/lib/supabase.ts` - Database client and RLS helpers
- **Types**: `src/types/index.ts` - Comprehensive TypeScript definitions
- **API Routes**: `src/app/api/ai/` - RESTful AI endpoints
- **Components**: `src/components/` - Reusable UI components
- **Database Schema**: `database/schema.sql` - Complete multi-tenant schema

### 🔧 AGENT DEVELOPMENT NOTES
- **Build Status**: ✅ Passing (`npm run build` succeeds)
- **Lint Status**: ✅ Clean (`npm run lint` passes)  
- **Type Safety**: ✅ Strict TypeScript mode enabled
- **Security**: ✅ Input validation, RLS policies, auth middleware
- **Performance**: ⚡ Optimized with lazy loading and proper error handling
- **Testing**: 🔍 ALL features must be easily verifiable by human testing

## Performance & Monitoring

### Performance Targets
- Dashboard load time: < 2 seconds
- AI query response: < 5 seconds
- Data sync: Background processing without UI impact

### Monitoring Requirements
- API response times
- Database query performance
- Third-party API health
- User session analytics
- Error tracking and alerting

## Data Validation Patterns

### CSV Upload Validation
```typescript
const validateCSVData = (data: any[]) => {
  const schema = z.array(z.object({
    date: z.string().datetime(),
    amount: z.number().positive(),
    customer_id: z.string().optional(),
    product_id: z.string().optional()
  }));
  
  return schema.parse(data);
};
```

### Business Logic Validation
- Validate date ranges for reports
- Ensure numeric values are within expected ranges
- Verify user permissions before data access
- Sanitize all user-generated content before storage

## Deployment & Infrastructure

### Production Checklist
- [ ] All environment variables configured
- [ ] Database migrations applied
- [ ] SSL certificates configured
- [ ] Rate limiting enabled
- [ ] Monitoring and logging setup
- [ ] Backup strategy implemented
- [ ] Security headers configured

### Scalability Considerations
- Horizontal scaling for API servers
- Database read replicas for analytics queries
- CDN for static assets
- Background job scaling with Redis clusters

## Development Best Practices

### Code Quality
- Use TypeScript strict mode
- Implement comprehensive error handling
- Write unit tests for all business logic
- Use ESLint and Prettier for code consistency

### Security Best Practices
- Never log sensitive information
- Implement proper error messages (don't expose internal details)
- Use HTTPS everywhere
- Regular security dependency updates
- Implement proper session timeout
- Use prepared statements for database queries

### AI/LLM Best Practices
- Implement prompt injection protection
- Validate all AI responses before displaying
- Set appropriate context limits
- Monitor AI API usage and costs
- Implement fallback for AI service failures

## Troubleshooting

### Common Issues
- **AI responses too slow**: Check Vector DB indexing and query optimization
- **Data sync failures**: Verify third-party API credentials and rate limits
- **Multi-tenant data leaks**: Review row-level security policies
- **Performance issues**: Monitor database query plans and API response times

### Debugging Commands
```bash
# Check database connections
npm run db:health

# Test AI API connectivity
npm run test:ai-api

# Validate n8n workflows
npm run n8n:validate

# Check security configurations
npm run security:audit
```
## IMPORTANT:
- Always make sure to save all user prompts and actions taken in a file named "CHATLOG.md" at the project's root (create if not found) to facilitate different Coding Agents quick context understanding.
- Always plan your tasks first before executing anything, manage task's status, task's dependencies on other tasks and task descriptions in a filed named "TASKS.md" at the project's root (create if not found).