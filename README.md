# StudyFlow 📚

**AI-Powered Learning Platform** - Transform your study habits with intelligent document analysis, adaptive flashcards, and personalized learning paths.

![StudyFlow Hero](https://img.shields.io/badge/Next.js-16.2.6-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-blue?logo=typescript)
![MongoDB](https://img.shields.io/badge/MongoDB-green?logo=mongodb)
![License](https://img.shields.io/badge/License-MIT-yellow)

## 🌟 Features

### 📖 Smart Document Analysis
- Upload PDFs and lecture notes
- AI-powered automatic concept extraction
- Generate comprehensive study summaries
- Identify key topics and themes

### 🎯 Intelligent Flashcards
- Auto-generated flashcards from your documents
- Spaced repetition algorithm for optimal retention
- Interactive card management
- Progress tracking

### 📝 Quiz Generation
- AI-created quizzes from study materials
- Multiple question formats
- Performance analytics
- Adaptive difficulty levels

### ⏱️ Focus Sessions
- Integrated Pomodoro timer
- Session analytics and statistics
- Study streak tracking
- Productivity insights

### 📊 Analytics Dashboard
- Study time tracking
- Performance metrics
- Learning progress visualization
- Personalized recommendations

### 👥 Community Features
- Share study materials
- Collaborative learning
- Study group forums
- Knowledge exchange

### ⚙️ Personalization
- Customizable learning paths
- Study preferences
- Dark/light theme support
- User settings and profile management

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- MongoDB connection string

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Dia-26/StudyFlow.git
cd StudyFlow
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
Create a `.env.local` file in the root directory:
```env
MONGODB_URI=your_mongodb_connection_string
NEXTAUTH_SECRET=your_secret_key
NEXTAUTH_URL=http://localhost:3000
```

4. **Run the development server**
```bash
npm run dev
```

5. **Open in browser**
Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
StudyFlow/
├── src/
│   ├── app/
│   │   ├── api/              # API routes
│   │   │   ├── auth/         # Authentication endpoints
│   │   │   ├── chat/         # AI chat functionality
│   │   │   ├── flashcards/   # Flashcard management
│   │   │   ├── quiz/         # Quiz generation
│   │   │   └── upload/       # File upload handling
│   │   ├── dashboard/        # Dashboard pages
│   │   ├── auth/             # Authentication pages
│   │   └── layout.tsx        # Root layout
│   ├── components/           # React components
│   │   ├── ui/              # UI components
│   │   ├── dashboard-*.tsx   # Dashboard components
│   │   └── theme-provider.tsx # Theme management
│   ├── lib/
│   │   ├── mongodb.ts        # Database connection
│   │   ├── server-auth.ts    # Authentication utilities
│   │   └── study-analytics.ts # Analytics helpers
│   ├── store/
│   │   └── useStudyStore.ts  # Zustand store
│   └── types/                # TypeScript types
├── prisma/
│   └── schema.prisma         # Database schema
├── public/                   # Static assets
├── package.json              # Dependencies
├── next.config.ts            # Next.js configuration
└── tsconfig.json             # TypeScript configuration
```

## 🛠️ Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Zustand** - State management
- **Shadcn/ui** - Accessible UI components

### Backend
- **Node.js/Next.js API Routes** - Backend logic
- **MongoDB** - NoSQL database
- **Prisma** - ORM for database operations

### AI & Features
- **PDF Processing** - Document parsing and analysis
- **AI Integration** - LLM-powered content generation
- **Authentication** - Secure user sessions

## 📖 Usage

### Uploading Study Materials
1. Navigate to Dashboard
2. Click "Upload Document"
3. Select PDF or text file
4. AI automatically processes and extracts content

### Creating Flashcards
1. Go to Flashcards section
2. AI-generated cards appear automatically
3. Edit or create custom cards
4. Practice with spaced repetition

### Taking Quizzes
1. Select a study topic
2. Start quiz
3. Answer questions
4. View detailed results and analytics

### Using Pomodoro Timer
1. Go to Focus Sessions
2. Set session duration
3. Start timer and study
4. Track your productivity

## 🔐 Authentication

StudyFlow uses secure authentication with:
- Email/password registration
- Session management
- Protected routes
- User data encryption

## 🚀 Deployment

### Deploy to Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

### Deploy to Other Platforms
See [Next.js Deployment Documentation](https://nextjs.org/docs/deployment)

## 🤝 Contributing

We welcome contributions! Here's how:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 Development Guide

### Running Tests
```bash
npm test
```

### Building for Production
```bash
npm run build
npm run start
```

### Code Quality
```bash
npm run lint
```

## 🐛 Known Issues

- Turbopack bundler compatibility on Windows (using webpack as fallback)
- Large PDF processing may take time
- Real-time collaboration features in beta

## 🗺️ Roadmap

- [ ] Real-time collaborative studying
- [ ] Mobile app (React Native)
- [ ] Advanced AI tutoring
- [ ] Integration with popular learning platforms
- [ ] Offline mode support
- [ ] Voice notes and transcription
- [ ] Study group matching algorithm

## 📞 Support

For support, issues, or questions:
- Open an [Issue](https://github.com/Dia-26/StudyFlow/issues)
- Check existing discussions
- Review documentation

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Dia**
- GitHub: [@Dia-26](https://github.com/Dia-26)

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Shadcn/ui for beautiful components
- MongoDB for reliable database
- All contributors and users

---

⭐ If you find StudyFlow helpful, please consider giving it a star on GitHub!

**Happy Learning! 🎓**
