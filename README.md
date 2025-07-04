# Gmail Clone - Enterprise Email Solution

![Next.js](https://img.shields.io/badge/Next.js-15.3.4-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19.0.0-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38B2AC?style=flat-square&logo=tailwind-css)
![Gmail API](https://img.shields.io/badge/Gmail_API-v1-EA4335?style=flat-square&logo=gmail)

A modern, feature-rich Gmail clone built with Next.js 15, React 19, and the Gmail API. This application provides a complete email management experience with authentication, email composition, organization, and real-time synchronization with your Gmail account.

## ✨ Features

### 📧 Core Email Functionality
- **Email Management**: View, read, compose, and send emails
- **Real-time Sync**: Direct integration with Gmail API for live data
- **Inbox Organization**: Inbox, Sent, Spam, and Trash folders
- **Email Composition**: Rich text editor with attachment support
- **Batch Operations**: Select multiple emails for bulk actions

### 🔐 Authentication & Security
- **Google OAuth 2.0**: Secure authentication with Gmail permissions
- **NextAuth.js**: Robust session management
- **API Security**: Protected routes with authentication middleware

### 🎨 User Experience
- **Modern UI**: Clean, responsive design with Tailwind CSS
- **Component Library**: Radix UI components for accessibility
- **Dark/Light Theme**: Theme switching support
- **Mobile Responsive**: Optimized for all device sizes
- **Real-time Notifications**: Toast notifications for user actions

### ⚡ Performance
- **Server Components**: Next.js 15 App Router for optimal performance
- **Parallel Data Fetching**: Efficient email loading with concurrent requests
- **Pagination**: Handle large email volumes efficiently
- **Turbopack**: Fast development builds

## 🛠 Technology Stack

### Frontend
- **Framework**: Next.js 15.3.4 with App Router
- **UI Library**: React 19.0.0
- **Language**: TypeScript 5.0
- **Styling**: Tailwind CSS 4.0
- **Components**: Radix UI primitives
- **Icons**: Lucide React
- **Data Tables**: TanStack React Table

### Backend & API
- **API Routes**: Next.js API handlers
- **Authentication**: NextAuth.js with Google Provider
- **External API**: Gmail API v1
- **Session Management**: JWT-based sessions

### Development Tools
- **Build Tool**: Turbopack (Next.js 15)
- **Package Manager**: npm
- **Code Quality**: TypeScript strict mode
- **Styling**: PostCSS with Tailwind

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js**: Version 18.0 or higher
- **npm**: Version 8.0 or higher
- **Google Cloud Account**: For Gmail API access
- **Git**: For version control

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/gmail-clone.git
cd gmail-clone
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Google Cloud Console Setup

#### Create a New Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Gmail API for your project

#### Configure OAuth 2.0
1. Navigate to "Credentials" in the API & Services section
2. Click "Create Credentials" → "OAuth 2.0 Client ID"
3. Set application type to "Web application"
4. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://yourdomain.com/api/auth/callback/google` (production)

### 4. Environment Configuration

Create a `.env.local` file in the root directory:

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key-here

# Google OAuth Credentials
AUTH_GOOGLE_ID=your-google-client-id.apps.googleusercontent.com
AUTH_GOOGLE_SECRET=your-google-client-secret

# Environment
NODE_ENV=development
```

### 5. Generate NextAuth Secret
```bash
openssl rand -base64 32
```
Add the generated secret to your `.env.local` file.

### 6. Start Development Server
```bash
npm run dev
```

Your application will be available at `http://localhost:3000`

## 📁 Project Structure

```
gmail/
├── app/                          # Next.js App Router
│   ├── api/                     # API Routes
│   │   ├── auth/               # Authentication endpoints
│   │   ├── labels/             # Gmail labels API
│   │   └── mails/              # Email management APIs
│   ├── dashboard/              # Main application pages
│   │   ├── mail/              # Email pages
│   │   └── layout.tsx         # Dashboard layout
│   └── globals.css            # Global styles
├── components/                 # React Components
│   ├── MailList/              # Email list components
│   ├── Providers/             # Context providers
│   └── ui/                    # UI component library
├── hooks/                     # Custom React hooks
├── lib/                       # Utility functions
│   ├── auth.ts               # NextAuth configuration
│   └── utils.ts              # Helper functions
└── public/                   # Static assets
```

## 🔌 API Endpoints

### Authentication
- `GET /api/auth/[...nextauth]` - NextAuth.js authentication routes

### Email Management
- `GET /api/mails/inbox` - Fetch inbox emails
- `GET /api/mails/outbox` - Fetch sent emails  
- `GET /api/mails/spam` - Fetch spam emails
- `GET /api/mails/trash` - Fetch trash emails
- `GET /api/mails/[messageID]` - Get specific email
- `POST /api/mails/send` - Send new email
- `POST /api/mails/trash` - Move emails to trash
- `POST /api/mails/batchDelete` - Permanently delete emails

### Attachments
- `GET /api/mails/[messageID]/attachments/[attachmentId]` - Download attachment

### Labels
- `GET /api/labels` - Fetch Gmail labels

## 🎯 Usage

### Accessing the Application
1. Navigate to `http://localhost:3000`
2. Click "Sign in with Google"
3. Grant Gmail permissions
4. Access your email dashboard

### Email Management
- **View Emails**: Click on folder navigation (Inbox, Sent, Spam, Trash)
- **Read Email**: Click on any email in the list
- **Compose Email**: Click "New Mail" button
- **Delete Emails**: Select emails and use delete actions
- **Search**: Use search functionality to find specific emails

### Navigation
- **Sidebar**: Navigate between different email folders
- **Email List**: View and manage emails with sorting and filtering
- **Email Viewer**: Read full email content with attachment support

## 📸 Screenshots

*Screenshots will be added here to showcase the application interface*

### Dashboard Overview
![Dashboard](screenshots/dashboard.png)

### Email Composition
![Compose](screenshots/compose.png)

### Email Reading
![Email View](screenshots/email-view.png)

## 🚀 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to [Vercel](https://vercel.com)
3. Configure environment variables in Vercel dashboard
4. Deploy automatically on push

### Manual Deployment
```bash
npm run build
npm start
```

### Environment Variables for Production
Ensure all environment variables are properly configured in your deployment environment.

## 📝 Development

### Available Scripts
```bash
npm run dev          # Start development server with Turbopack
npm run build        # Build for production
npm start           # Start production server
npm run lint        # Run ESLint
```

### Development Guidelines
- Follow TypeScript strict mode
- Use Tailwind CSS for styling
- Implement proper error handling
- Write descriptive commit messages
- Test API endpoints thoroughly

## 🔧 Configuration

### Gmail API Scopes
The application requests the following Gmail API scopes:
- `https://mail.google.com/` - Full Gmail access for reading, sending, and managing emails

### Session Configuration
- **Strategy**: JWT-based sessions
- **Max Age**: 30 days
- **Security**: Secure token handling with NextAuth.js

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit your changes: `git commit -m 'Add new feature'`
4. Push to the branch: `git push origin feature/new-feature`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🐛 Troubleshooting

### Common Issues

**OAuth Error**: Ensure redirect URIs are correctly configured in Google Cloud Console

**Gmail API Quota**: Check your API usage in Google Cloud Console

**Build Errors**: Ensure all environment variables are properly set

**Authentication Issues**: Verify NextAuth configuration and secrets

### Support
For support and questions, please open an issue in the GitHub repository.

## 🔗 Links

- [Gmail API Documentation](https://developers.google.com/gmail/api)
- [Next.js Documentation](https://nextjs.org/docs)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

---

Built with ❤️ by [GrknDev](https://github.com/grkndev)
