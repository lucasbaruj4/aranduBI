# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**AI-Powered Business Intelligence for SMEs** - A web application enabling Small and Medium Enterprises (SMEs) to connect various data sources (sales, accounting, social media) and receive automated business insights and recommendations through natural language interface. Goal: "Turn business data into actions in 5 minutes."

### Target Market
- Small businesses in Paraguay (retail stores, pharmacies, restaurants, cafes)
- Service businesses (beauty salons, auto repair shops)
- E-commerce sellers (Instagram, Facebook, WhatsApp)

## Technical Architecture

### Tech Stack
- **Frontend**: Next.js with React
- **Backend**: Node.js or Python
- **Database**: PostgreSQL (Supabase for structured data) + Vector DB (Pinecone for RAG)
- **Workflow Orchestration**: n8n.io for data integrations
- **Charts/Visualizations**: Charts.js or Recharts
- **Authentication**: Clerk or Auth0
- **Queues**: Redis for background jobs
- **AI/LLM**: Model provider decision isn't clear yet

### Core Architecture Principles
- **Multi-tenant**: Strict data isolation between organizations
- **Microservices**: Modular approach using n8n for API integrations
- **RAG (Retrieval Augmented Generation)**: Vector DB for contextual AI responses
- **Background Processing**: Queue system for data sync and report generation

## Development Commands

### Setup and Installation
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Run database migrations
npm run db:migrate

# Start development server
npm run dev

# Start n8n workflow orchestration
npm run n8n:dev
```

### Testing and Quality
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run integration tests
npm run test:integration

# Type checking
npm run type-check

# Linting
npm run lint

# Format code
npm run format
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

## File Structure & Conventions

```
├── components/          # Reusable UI components
├── pages/              # Next.js pages
├── lib/                # Utility functions and configurations
├── hooks/              # Custom React hooks
├── types/              # TypeScript type definitions
├── services/           # API and external service integrations
├── utils/              # Helper functions
├── middleware/         # Express/Next.js middleware
├── database/           # Database schemas, migrations, seeds
└── workflows/          # n8n workflow definitions
```

## Environment Variables

### Required Environment Variables
```env
# Database
SUPABASE_URL=supabase...
SUPABASE_KEY=spaxsa....
REDIS_URL=redis://...

# Authentication
CLERK_SECRET_KEY=...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...

# AI/LLM
OPENAI_API_KEY=...
PINECONE_API_KEY=...

# Third-party APIs
SHOPIFY_API_KEY=...
QUICKBOOKS_CLIENT_ID=...
TWILIO_AUTH_TOKEN=...

# File Storage
AWS_S3_BUCKET=...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
```

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