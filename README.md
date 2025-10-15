# Orlixis Audit Platform

A professional, aesthetic, and unique codebase auditing and security analysis platform built with modern web technologies and Orlixis branding.

![Orlixis Audit Platform](./public/orlixis_wordmark.png)

## 🚀 Features

### Core Functionality
- **📊 Dashboard Analytics** - Comprehensive overview of project health and security metrics
- **📤 Multi-Format Upload** - Support for files, folders, Git repositories, and direct URLs
- **🔒 Security Analysis** - Advanced vulnerability scanning with CVSS scoring
- **📋 Report Generation** - Professional audit reports with detailed findings
- **📈 Real-time Monitoring** - Live project status and scanning progress
- **🎯 Risk Assessment** - Automated categorization and prioritization of issues

### Technical Capabilities
- **Language Support** - JavaScript, TypeScript, Python, Java, PHP, Ruby, Go, Rust, C++, C#
- **Framework Detection** - React, Vue, Angular, Next.js, Django, Flask, Spring Boot
- **Security Scanning** - SQL injection, XSS, CSRF, authentication flaws, crypto issues
- **Code Quality** - Code smells, complexity analysis, best practices validation
- **Dependency Audit** - Vulnerable package detection and update recommendations

## 🎨 Design & Branding

### Orlixis Brand Colors
- **Primary Teal**: `#007b8c` - Main brand color
- **Teal Light**: `#008da0` - Hover states and accents
- **Teal Dark**: `#006978` - Active states and shadows
- **Gray Palette**: Sophisticated gray tones for text and backgrounds

### Visual Elements
- **Professional Icons** - Lucide React icon library for consistency
- **Modern Typography** - Inter font family for readability
- **Gradient Backgrounds** - Subtle Orlixis-branded gradients
- **Shadow System** - Custom shadow utilities with brand colors
- **Animation Library** - Smooth transitions and micro-interactions

## 🛠 Technology Stack

### Frontend Framework
- **Next.js 15.5.4** - React framework with App Router
- **React 19.1.0** - Latest React with concurrent features
- **TypeScript 5+** - Type-safe development experience

### Styling & UI
- **Tailwind CSS 4+** - Utility-first CSS framework with latest features
- **Shadcn/UI Components** - Professional component library
- **Lucide React** - Beautiful, customizable icons
- **Custom Design System** - Orlixis-branded components and utilities

### Development Tools
- **Deno** - Modern JavaScript/TypeScript runtime
- **ESLint 9** - Code linting and formatting
- **Turbopack** - Fast bundler for development

### Key Dependencies
```json
{
  "@radix-ui/react-progress": "^1.1.7",
  "@radix-ui/react-slot": "^1.2.3",
  "class-variance-authority": "^0.7.1",
  "clsx": "^2.1.1",
  "tailwind-merge": "^3.3.1"
}
```

## 🚀 Getting Started

### Prerequisites
- **Deno 1.40+** - Modern JavaScript/TypeScript runtime
- **Node.js 18+** - For package management compatibility
- **Git** - Version control

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/orlixis/orlixis-audit-platform.git
   cd orlixis-audit-platform
   ```

2. **Install dependencies using Deno**
   ```bash
   deno add npm:@radix-ui/react-slot npm:@radix-ui/react-progress npm:class-variance-authority npm:clsx npm:tailwind-merge
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   ```
   http://localhost:3000
   ```

### Development Commands

```bash
# Start development server with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run ESLint
npm run lint
```

## 📁 Project Structure

```
orlixis_audit_platform/
├── app/                    # Next.js App Router pages
│   ├── globals.css        # Global styles with Orlixis branding
│   ├── layout.tsx         # Root layout with metadata
│   ├── page.tsx           # Dashboard homepage
│   ├── upload/            # Project upload page
│   ├── reports/           # Report management
│   └── security/          # Security analysis
├── components/            # Reusable components
│   ├── ui/               # Base UI components
│   │   ├── button.tsx    # Button with Orlixis variants
│   │   ├── card.tsx      # Card components
│   │   ├── badge.tsx     # Status and severity badges
│   │   └── progress.tsx  # Progress indicators
│   └── layout/           # Layout components
│       ├── header.tsx    # Navigation header
│       └── sidebar.tsx   # Sidebar navigation
├── lib/                  # Utility functions
│   └── utils.ts          # Helper functions and constants
├── public/               # Static assets
│   ├── orlixis_wordmark.png
│   └── orlixis_logomark.png
└── package.json          # Project dependencies
```

## 🎯 Key Features Implementation

### Dashboard Analytics
- **Real-time Metrics** - Live project statistics and security scores
- **Visual Charts** - Progress bars and trend indicators
- **Quick Actions** - Fast access to common operations
- **Recent Activity** - Latest projects and security alerts

### Upload System
- **Drag & Drop** - Intuitive file and folder upload
- **Git Integration** - Direct repository cloning with branch selection
- **URL Import** - Archive download from web URLs
- **Format Support** - ZIP, TAR, RAR archives with validation

### Security Analysis
- **CVSS Scoring** - Industry-standard vulnerability assessment
- **Category Mapping** - OWASP Top 10 and CWE classification
- **Real-time Scanning** - Live progress with detailed reporting
- **Remediation Guidance** - Actionable recommendations

### Report Management
- **Professional Templates** - Branded PDF and HTML reports
- **Filtering & Search** - Advanced report discovery
- **Bulk Operations** - Mass download and sharing
- **Status Tracking** - Report generation progress

## 🎨 Custom Components

### Button Variants
```tsx
// Orlixis-branded button with gradient
<Button variant="orlixis" size="lg">
  Generate Report
</Button>

// Outline button with brand colors
<Button variant="outline">
  Configure Settings
</Button>
```

### Badge System
```tsx
// Severity badges with color coding
<Badge variant="critical">Critical</Badge>
<Badge variant="high">High</Badge>
<Badge variant="medium">Medium</Badge>
<Badge variant="low">Low</Badge>

// Orlixis-branded badges
<Badge variant="orlixis">Orlixis</Badge>
<Badge variant="orlixis-outline">Premium</Badge>
```

### Progress Indicators
```tsx
// Orlixis-branded progress bar
<Progress value={78} variant="orlixis" showValue />

// Status-specific progress
<Progress value={45} variant="success" />
<Progress value={90} variant="warning" />
```

## 🔧 Configuration

### Environment Variables
```env
NEXT_PUBLIC_APP_URL=https://audit.orlixis.com
NEXT_PUBLIC_API_URL=https://api.orlixis.com
DATABASE_URL=postgresql://...
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
```

### Tailwind Configuration
The project uses Tailwind CSS 4+ with custom Orlixis theme configuration:

```css
:root {
  --orlixis-teal: #007b8c;
  --orlixis-teal-light: #008da0;
  --orlixis-teal-dark: #006978;
}
```

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Configure environment variables
3. Deploy with automatic builds

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Manual Deployment
```bash
# Build the application
npm run build

# Start production server
npm start
```

## 🧪 Testing

### Unit Tests
```bash
# Run Jest tests
npm test

# Run with coverage
npm test -- --coverage
```

### E2E Tests
```bash
# Run Playwright tests
npm run test:e2e
```

### Security Testing
```bash
# Run security audit
npm audit

# Check for vulnerabilities
npm run security:check
```

## 🤝 Contributing

### Development Guidelines
1. **Code Style** - Follow ESLint configuration
2. **Commits** - Use conventional commit messages
3. **Testing** - Add tests for new features
4. **Documentation** - Update README for changes

### Pull Request Process
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests and documentation
5. Submit a pull request

### Issue Reporting
Please use the GitHub issue tracker for:
- Bug reports
- Feature requests
- Security vulnerabilities (use security advisory)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

**Orlixis LTD** - Professional software auditing and consulting
- Website: [https://orlixis.com](https://orlixis.com)
- Email: audit@orlixis.com
- Support: support@orlixis.com

## 🙏 Acknowledgments

- **Tailwind CSS** - Utility-first CSS framework
- **Next.js** - React framework for production
- **Radix UI** - Low-level UI primitives
- **Lucide** - Beautiful icon library
- **Vercel** - Deployment platform

## 📈 Roadmap

### Phase 1 (Current)
- ✅ Core dashboard and navigation
- ✅ Project upload system
- ✅ Security analysis interface
- ✅ Report management

### Phase 2 (Upcoming)
- 🔄 Real-time scanning engine
- 🔄 Advanced filtering and search
- 🔄 Team collaboration features
- 🔄 API integration

### Phase 3 (Future)
- 📋 Custom rule creation
- 📋 Integration marketplace
- 📋 Advanced analytics
- 📋 Enterprise features

---

**Built with ❤️ by Orlixis LTD** | Professional codebase auditing platform
