# WholeSale Connect - B2B Textile Platform

A comprehensive B2B social commerce platform designed specifically for the textile industry, enabling wholesalers, manufacturers, and retailers to connect, collaborate, and conduct business seamlessly.

## 🌟 Features

### Core Features Implemented ✅
- **Social Feed**: Share updates, products, and industry insights with an intuitive feed
- **User Profiles**: Comprehensive user profiles with business information and statistics
- **Product Showcase**: Display and promote textile products (without price in social feeds)
- **Direct Messaging**: Real-time communication with automatic product inquiry messages
- **Communities**: Join industry-specific communities and engage with peers
- **Business Discovery**: Search and discover businesses, products, and communities
- **Product Inquiries**: One-click inquiry system that opens chat with product context
- **Post Creation**: Create text, image, and product posts with base64 image support
- **Network Building**: Follow users and build your professional network
- **Real-time Notifications**: Stay updated with instant notifications via Socket.io

### Advanced Features
- **Smart Navigation**: Clickable profile avatars throughout the platform
- **Advanced Search**: Search with filters for products, businesses, and communities
- **Post Engagement**: Like, comment, and share posts within the community
- **Location-based Discovery**: Find businesses and products by location
- **Trust & Verification**: Verified business badges system
- **Responsive Design**: Modern, mobile-friendly UI with Tailwind CSS
- **Multi-language Support**: Framework ready for regional languages

## 🚀 Tech Stack

### Frontend
- **React 18** - Modern UI library with hooks
- **React Router DOM v6** - Client-side routing
- **Zustand** - Lightweight state management
- **Tailwind CSS** - Utility-first CSS framework
- **Axios** - HTTP client for API calls
- **Socket.io Client** - Real-time communication
- **React Helmet Async** - SEO and meta tag management
- **React Hot Toast** - Beautiful toast notifications
- **Lucide React** - Modern icon library
- **Vite** - Lightning-fast build tool

### Backend
- **Node.js (v20+)** - Runtime environment
- **Express.js** - Web framework with middleware
- **MongoDB** - NoSQL database
- **Mongoose** - Elegant MongoDB ODM
- **Socket.io** - WebSocket server for real-time features
- **JWT** - Secure authentication tokens
- **Bcrypt** - Password hashing
- **Express Validator** - Input validation
- **Nodemailer** - Email service integration
- **Multer** - File upload handling

### Development Tools
- **Vite** - Frontend build tool
- **Nodemon** - Auto-restart for backend
- **Concurrently** - Run multiple npm scripts
- **ESLint** - Code linting (ready to configure)

## 📋 Prerequisites

- **Node.js** v16 or higher (v20 recommended)
- **MongoDB** v5 or higher
- **npm** or **yarn** package manager
- **Git** for version control

## 🛠️ Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd b2b-platform
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### 3. Environment Setup

**Backend `.env` file** (in `/backend` directory):
```env
# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Database
MONGODB_URI=mongodb://localhost:27017/wholesale-connect

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-chars
JWT_EXPIRES_IN=7d

# Email Configuration (Optional - uses Ethereal for testing)
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=your-ethereal-user
SMTP_PASS=your-ethereal-pass
EMAIL_FROM=noreply@wholesaleconnect.com

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads

# Client URL
CLIENT_URL=http://localhost:5173

# Socket.io (uses same port as backend)
CORS_ORIGIN=http://localhost:5173
```

**Frontend `.env` file** (in root directory):
```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=WholeSale Connect
```

### 4. Start MongoDB

```bash
# Using MongoDB service (Linux/Mac)
sudo systemctl start mongod

# Windows
net start MongoDB

# Or using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 5. Run the Application

```bash
# Development mode (runs both frontend and backend)
npm run dev

# Or run separately:

# Backend only (from /backend directory)
cd backend
npm run dev

# Frontend only (from root directory)
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000/api
- **Socket.io**: http://localhost:5000 (integrated with backend)

## 📁 Project Structure

```
b2b-platform/
├── backend/
│   ├── config/
│   │   └── database.js          # MongoDB connection
│   ├── middleware/
│   │   ├── auth.js              # JWT authentication
│   │   ├── errorHandler.js      # Error handling
│   │   └── validation.js        # Request validation
│   ├── models/
│   │   ├── User.js              # User/Business model
│   │   ├── Post.js              # Post model (text, image, product)
│   │   ├── Community.js         # Community model
│   │   ├── Message.js           # Chat message model
│   │   └── Conversation.js      # Chat conversation model
│   ├── routes/
│   │   ├── auth.js              # Authentication routes
│   │   ├── posts.js             # Post CRUD routes
│   │   ├── communities.js       # Community routes
│   │   ├── chat.js              # Messaging routes
│   │   ├── users.js             # User profile routes
│   │   └── search.js            # Search routes
│   ├── services/
│   │   ├── emailService.js      # Email notifications
│   │   └── socketService.js     # Socket.io events
│   ├── utils/
│   │   └── validators.js        # Custom validators
│   ├── server.js                # Express server setup
│   └── package.json
│
├── src/
│   ├── components/
│   │   ├── ui/                  # Reusable UI components
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Avatar.jsx
│   │   │   ├── Badge.jsx
│   │   │   └── Loading.jsx
│   │   ├── layout/
│   │   │   └── Layout.jsx       # Main app layout with sidebar
│   │   └── ErrorBoundary.jsx    # Error boundary component
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   └── OnboardingPage.jsx
│   │   ├── HomePage.jsx         # Main social feed
│   │   ├── ProfilePage.jsx      # User profile page (NEW!)
│   │   ├── DiscoverPage.jsx     # Search & discovery
│   │   ├── MessagesPage.jsx     # Real-time chat
│   │   ├── CommunitiesPage.jsx  # Communities listing
│   │   ├── CreatePostPage.jsx   # Post creation
│   │   ├── MarketplacePage.jsx  # Product marketplace
│   │   ├── BusinessPage.jsx     # Own business profile
│   │   └── ...
│   ├── services/
│   │   ├── api.js               # Axios API service with interceptors
│   │   └── socket.js            # Socket.io client service
│   ├── store/
│   │   ├── authStore.js         # Auth state (Zustand)
│   │   ├── postsStore.js        # Posts state
│   │   ├── appStore.js          # App-wide state
│   │   └── messagesStore.js     # Messages state
│   ├── hooks/
│   │   └── useDebounce.js       # Debounce hook
│   ├── utils/
│   │   ├── formatters.js        # Date, number formatters
│   │   └── validators.js        # Form validation
│   ├── config/
│   │   └── constants.js         # App constants
│   ├── App.jsx                  # Main app component
│   ├── main.jsx                 # React entry point
│   └── index.css                # Global styles
│
├── public/                      # Static assets
├── package.json                 # Frontend dependencies
└── README.md                    # This file
```

## 🔑 Key Functionalities

### Authentication & Onboarding
- ✅ User registration with business details
- ✅ Email/password login with validation
- ✅ JWT-based authentication
- ✅ Multi-step onboarding process
- ✅ Business type selection (Manufacturer, Wholesaler, Retailer, Distributor)
- ✅ Category selection for products
- ✅ Location setup

### User Profiles
- ✅ View own profile at `/profile`
- ✅ View other user profiles at `/profile/:userId`
- ✅ Profile statistics (posts, followers, following)
- ✅ Business information display
- ✅ Contact information (phone, email, website)
- ✅ Follow/Unfollow functionality
- ✅ Direct message from profile
- ✅ Tabbed interface (Posts, Products, About)

### Social Features
- ✅ Create text, image, and product posts
- ✅ Base64 image support for posts
- ✅ Like, comment, and share functionality
- ✅ Real-time feed updates via Socket.io
- ✅ Post visibility (public, connections, private)
- ✅ Hashtag support
- ✅ Location tagging
- ✅ Clickable user avatars for navigation

### Messaging System
- ✅ One-on-one real-time messaging
- ✅ Online status indicators
- ✅ Auto-generated product inquiry messages
- ✅ Message read receipts
- ✅ Conversation list with unread counts
- ✅ User search in messages
- ✅ Socket.io real-time delivery

### Communities
- ✅ Create public and private communities
- ✅ Join/Leave communities
- ✅ Community discovery with filters
- ✅ Category-based communities
- ✅ Location-targeted communities
- ✅ Community member management
- ✅ Invite code system for private communities

### Product Features
- ✅ Product showcase posts
- ✅ Product inquiries via chat
- ✅ Category badges
- ✅ Price hidden in social feeds (shown only in marketplace)
- ✅ Product images support
- ✅ Product descriptions and specifications

### Search & Discovery
- ✅ Global search for users, products, communities
- ✅ Advanced filters (category, location, type)
- ✅ Trending searches
- ✅ Popular searches tracking
- ✅ Search suggestions

## 🎨 UI Components

Comprehensive reusable component library:

### Buttons
- Variants: `primary`, `secondary`, `outline`, `ghost`, `danger`
- Sizes: `xs`, `sm`, `md`, `lg`
- Icon support with Lucide React
- Loading states

### Inputs
- Types: text, email, password, search, textarea
- Built-in validation
- Error messaging
- Icon support

### Avatars
- Online status indicator
- Fallback initials
- Multiple sizes
- Image optimization

### Badges
- Category badges with icons
- Verification badges
- Price badges
- Status badges
- Removable badges

### Modals
- Customizable dialogs
- Animation support
- Focus trap
- Backdrop click handling

### Loading States
- Skeleton loaders
- Spinner components
- Full-page loading
- Inline loading

## 🔒 Security Features

- ✅ Password hashing with bcrypt (salt rounds: 10)
- ✅ JWT token authentication
- ✅ HTTP-only cookies for token storage
- ✅ CORS configuration
- ✅ Rate limiting on API endpoints
- ✅ Input validation and sanitization
- ✅ File upload size restrictions
- ✅ XSS protection
- ✅ MongoDB injection prevention
- ✅ Error handling without information leakage

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Reset password

### Users
- `GET /api/users/:id` - Get user profile
- `GET /api/users/search` - Search users
- `POST /api/users/:id/follow` - Follow user
- `DELETE /api/users/:id/follow` - Unfollow user
- `GET /api/users/:id/friends` - Get user connections

### Posts
- `GET /api/posts/feed` - Get personalized feed
- `POST /api/posts` - Create post (with base64 images)
- `GET /api/posts/:id` - Get single post
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post
- `PUT /api/posts/:id/like` - Like/Unlike post
- `POST /api/posts/:id/comments` - Add comment
- `GET /api/posts/stats` - Get feed statistics

### Communities
- `GET /api/communities` - List communities
- `POST /api/communities` - Create community
- `GET /api/communities/my` - Get user's communities
- `GET /api/communities/:id` - Get community details
- `POST /api/communities/:id/join` - Join community
- `POST /api/communities/:id/leave` - Leave community
- `GET /api/communities/:id/posts` - Get community posts

### Chat/Messages
- `GET /api/chat/conversations` - Get conversations
- `POST /api/chat/conversations` - Create conversation
- `GET /api/chat/conversations/:id/messages` - Get messages
- `POST /api/chat/conversations/:id/messages` - Send message
- `PUT /api/chat/messages/:id/react` - React to message
- `PUT /api/chat/conversations/:id/typing` - Set typing status

### Search
- `GET /api/search/global` - Global search
- `GET /api/search/trending` - Trending hashtags
- `GET /api/search/popular` - Popular searches

## ✨ Recent Updates

### Latest Features (Current Session)
1. **Profile Page** - Complete user profile page with tabs
2. **Navigation Fixes** - Removed redundant feed filters
3. **Inquire Button** - Functional inquiry system with chat integration
4. **Price Display** - Removed prices from social feeds
5. **Communities Backend** - Complete community management system
6. **Base64 Images** - Support for base64 image encoding in posts

### Bug Fixes
- ✅ Fixed create post functionality
- ✅ Fixed profile navigation
- ✅ Fixed post schema validation
- ✅ Fixed inquiry message template
- ✅ Removed redundant markdown files

## 🚧 Known Issues & Limitations

- Voice and video calling not yet implemented
- Payment integration pending
- Mobile apps not yet developed
- Some analytics features are placeholders
- Email service uses Ethereal (testing) in development

## 📚 Documentation

For detailed documentation, see:
- **[QUICKSTART.md](QUICKSTART.md)** - Quick setup guide
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Production deployment guide
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - Contribution guidelines

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## 🐛 Bug Reports

Found a bug? Please open an issue with:
- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable
- Environment details (OS, browser, Node version)

## 📝 License

This project is licensed under the MIT License.

## 👥 Team

- **Developer** - Full-stack development
- **Designer** - UI/UX design
- **Project Manager** - Project coordination

## 🙏 Acknowledgments

- **Lucide React** - Beautiful icon library
- **Tailwind CSS** - Utility-first CSS framework
- **MongoDB** - Flexible NoSQL database
- **Socket.io** - Real-time communication
- **React Community** - Ecosystem and support

## 📞 Support

- **Email**: support@wholesaleconnect.com
- **Issues**: GitHub Issues page
- **Community**: Join our communities within the platform

## 🔗 Resources

- [React Documentation](https://react.dev)
- [Express.js Guide](https://expressjs.com)
- [MongoDB Manual](https://docs.mongodb.com)
- [Socket.io Documentation](https://socket.io/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

---

**Made with ❤️ for the textile industry**

*Empowering businesses to connect, collaborate, and grow together*
