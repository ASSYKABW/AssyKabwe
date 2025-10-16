# CareerBoost - AI-Powered Job Success Platform

A comprehensive platform that combines AI-driven CV rewriting, interview simulation, LinkedIn optimization, and personalized job matching for job seekers and recruiters.

## Features

### For Job Seekers
- **AI CV Rewriting**: Upload your CV and get it optimized for specific roles with ATS-friendly formatting
- **Interview Simulation**: Practice with AI-generated questions tailored to your target role
- **LinkedIn Optimization**: Improve your LinkedIn profile for better recruiter visibility
- **Job Matching**: AI-powered job recommendations based on your skills and preferences
- **Outreach Services**: Premium outreach to recruiters and hiring managers

### For Recruiters
- **Smart Candidate Sourcing**: AI-assisted candidate shortlists with relevance scores
- **Interview Kits**: Automated question generation and scoring systems
- **Bulk Hiring Workflows**: Streamlined processes for high-volume recruitment
- **API Integration**: Connect with existing ATS and HRIS systems

## Tech Stack

### Backend
- **Node.js** with Express.js
- **SQLite** (development) / **PostgreSQL** (production)
- **Knex.js** for database management
- **OpenAI GPT-4** for AI services
- **JWT** for authentication
- **Stripe** & **PayFast** for payments

### Frontend
- **Vanilla JavaScript** (easily convertible to React/Vue)
- **Modern CSS** with CSS Grid and Flexbox
- **Responsive design** for all devices

## Quick Start

### Prerequisites
- Node.js 16+ installed
- OpenAI API key (for AI features)
- Stripe account (for international payments)
- PayFast account (for South African payments)

### Installation

1. **Clone and install dependencies:**
```bash
git clone <repository-url>
cd careerboost
npm install
```

2. **Set up environment variables:**
```bash
cp .env.example .env
# Edit .env with your actual API keys and configuration
```

3. **Set up the database:**
```bash
npm run migrate
npm run seed  # Optional: adds sample data
```

4. **Start the development server:**
```bash
npm run dev
```

5. **Open your browser:**
Navigate to `http://localhost:3000`

## Environment Variables

### Required for AI Features
```env
OPENAI_API_KEY=your-openai-api-key
```

### Required for Payments
```env
# Stripe (International)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# PayFast (South Africa)
PAYFAST_MERCHANT_ID=your_merchant_id
PAYFAST_MERCHANT_KEY=your_merchant_key
PAYFAST_PASSPHRASE=your_passphrase
PAYFAST_SANDBOX=true
```

### Database Configuration
```env
# Development (SQLite)
DATABASE_URL=sqlite:./database.sqlite

# Production (PostgreSQL)
DATABASE_URL=postgresql://username:password@localhost:5432/careerboost
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile

### CV Management
- `GET /api/cv` - Get user's CVs
- `POST /api/cv/upload` - Upload new CV
- `POST /api/cv/:id/rewrite` - AI rewrite CV
- `DELETE /api/cv/:id` - Delete CV

### Interview Simulation
- `GET /api/interview` - Get user's interviews
- `POST /api/interview` - Create new interview session
- `POST /api/interview/:id/start` - Start interview
- `POST /api/interview/:id/answer` - Submit answer
- `POST /api/interview/:id/complete` - Complete interview

### LinkedIn Optimization
- `GET /api/linkedin` - Get optimizations
- `POST /api/linkedin/optimize` - Optimize profile

### Job Management
- `GET /api/jobs` - Search jobs
- `GET /api/jobs/:id` - Get job details
- `POST /api/jobs/:id/apply` - Apply to job
- `POST /api/jobs/:id/match` - Get match analysis

### Payments
- `POST /api/payments/stripe/create-checkout` - Create Stripe session
- `POST /api/payments/payfast/create-payment` - Create PayFast payment
- `GET /api/payments/history` - Get payment history

## Subscription Tiers

### Basic (Free)
- 1 CV rewrite per month
- 3 interview questions
- Basic LinkedIn tips

### Pro (R129/month)
- Unlimited CV rewrites
- Full interview simulator
- LinkedIn optimization
- Job matching alerts

### Executive (R549/month)
- Everything in Pro
- Priority outreach
- 1:1 coaching session
- Recruiter warm intros

### Corporate (Custom)
- Team seats
- API access
- Dedicated support
- Bulk outreach credits

## Deployment

### Production Setup

1. **Set up PostgreSQL database:**
```bash
# Update DATABASE_URL in .env
DATABASE_URL=postgresql://username:password@localhost:5432/careerboost
```

2. **Run migrations:**
```bash
NODE_ENV=production npm run migrate
```

3. **Set production environment variables:**
```bash
NODE_ENV=production
JWT_SECRET=your-super-secure-production-secret
OPENAI_API_KEY=your-production-openai-key
# ... other production keys
```

4. **Start production server:**
```bash
npm start
```

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## Security Features

- **JWT Authentication** with secure token handling
- **Rate Limiting** to prevent abuse
- **Input Validation** and sanitization
- **CORS Protection** with configurable origins
- **Helmet.js** for security headers
- **Password Hashing** with bcrypt
- **SQL Injection Protection** via parameterized queries

## Monitoring & Logging

- **Winston** for structured logging
- **Health Check** endpoint at `/health`
- **Error Tracking** with detailed error logs
- **Performance Monitoring** ready for APM integration

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@careerboost.com or join our Slack channel.

## Roadmap

- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Integration with major job boards
- [ ] AI-powered salary negotiation
- [ ] Video interview practice
- [ ] Multi-language support
- [ ] Advanced recruiter CRM features

---

**Built with ❤️ for job seekers and recruiters worldwide**