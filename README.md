# WholeSale Connect - B2B Textile Platform

A comprehensive B2B social commerce platform designed specifically for the textile industry, enabling wholesalers, manufacturers, and retailers to connect, collaborate, and conduct business seamlessly.

## 🌟 Features

### Core Features
- **Social Feed**: Share updates, products, and industry insights
- **Product Showcase**: Display and promote textile products with detailed specifications
- **Direct Messaging**: Real-time communication with voice and video call support
- **Community Forums**: Join industry-specific communities and engage with peers
- **Business Profiles**: Comprehensive business profiles with verification badges
- **Global Marketplace**: Discover and source products from verified suppliers worldwide
- **Analytics Dashboard**: Track performance metrics and business insights
- **Multi-language Support**: Built-in support for regional languages (Hindi, Tamil, Telugu, etc.)

### Advanced Features
- **Real-time Notifications**: Stay updated with instant notifications
- **Smart Search**: Advanced search with filters for products, businesses, and communities
- **Network Building**: Connect with other businesses and grow your professional network
- **Post Engagement**: Like, comment, and share posts within the community
- **Product Inquiries**: Direct inquiry system for B2B transactions
- **Location-based Discovery**: Find businesses and products near you
- **Trust & Verification**: Verified business badges and ratings system

## 🚀 Tech Stack

### Frontend
- **React 18** - Modern UI library
- **React Router DOM** - Client-side routing
- **Zustand** - State management
- **Tailwind CSS** - Utility-first CSS framework
- **Recharts** - Data visualization
- **Axios** - HTTP client
- **Socket.io Client** - Real-time communication
- **React Helmet Async** - SEO management
- **React Hot Toast** - Notifications
- **Lucide React** - Icon library

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **Socket.io** - WebSocket server
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **Multer** - File uploads
- **Nodemailer** - Email service

### Development Tools
- **Vite** - Build tool
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Concurrently** - Run multiple commands

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (v5 or higher)
- npm or yarn package manager

## 🛠️ Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd b2b-platform
```

2. **Install dependencies**
```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..

# Install backend dependencies
cd backend
npm install
cd ..
```

3. **Environment Setup**

Create `.env` file in the backend directory:
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/wholesale-connect

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads

# Client URL
CLIENT_URL=http://localhost:5173

# Socket.io
SOCKET_PORT=5001
```

Create `.env` file in the frontend directory:
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5001
VITE_APP_NAME=WholeSale Connect
```

4. **Start MongoDB**
```bash
# Using MongoDB service
sudo systemctl start mongod

# Or using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

5. **Run the application**

```bash
# Development mode (runs both frontend and backend)
npm run dev

# Or run separately:

# Backend only
npm run server

# Frontend only
npm run client
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend: http://localhost:5000

## 📁 Project Structure

```
b2b-platform/
├── backend/
│   ├── config/
│   │   └── database.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── postsController.js
│   │   ├── productsController.js
│   │   └── ...
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── validation.js
│   │   └── errorHandler.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Post.js
│   │   ├── Product.js
│   │   └── ...
│   ├── routes/
│   │   ├── auth.js
│   │   ├── posts.js
│   │   ├── products.js
│   │   └── ...
│   ├── services/
│   │   ├── emailService.js
│   │   ├── uploadService.js
│   │   └── socketService.js
│   ├── utils/
│   │   ├── validators.js
│   │   └── helpers.js
│   ├── server.js
│   └── package.json
│
├── src/
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Modal.jsx
│   │   │   └── ...
│   │   └── layout/
│   │       └── Layout.jsx
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   └── OnboardingPage.jsx
│   │   ├── HomePage.jsx
│   │   ├── DiscoverPage.jsx
│   │   ├── MessagesPage.jsx
│   │   └── ...
│   ├── services/
│   │   ├── api.js
│   │   └── socket.js
│   ├── store/
│   │   ├── authStore.js
│   │   ├── postsStore.js
│   │   └── ...
│   ├── hooks/
│   │   ├── useAuth.js
│   │   └── useDebounce.js
│   ├── utils/
│   │   ├── formatters.js
│   │   └── validators.js
│   ├── config/
│   │   └── constants.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
│
├── package.json
└── README.md
```

## 🔑 Key Functionalities

### Authentication
- User registration with business details
- Email/password login
- Google OAuth integration
- JWT-based authentication
- Password reset functionality

### User Profiles
- Business profile management
- Profile verification system
- Business categories and specializations
- Location-based services
- Profile analytics

### Social Features
- Create and share posts
- Product showcase posts
- Image uploads (multiple)
- Like, comment, and share
- Real-time feed updates
- Community-based posts

### Messaging
- One-on-one messaging
- Real-time message delivery
- Online status indicators
- Message read receipts
- Voice and video call integration (coming soon)

### Marketplace
- Product listing and discovery
- Advanced search and filters
- Category-based browsing
- Price and location filters
- Supplier verification
- Direct inquiry system

### Analytics
- Profile view tracking
- Engagement metrics
- Product performance
- Audience demographics
- Growth insights

## 🎨 UI Components

The platform includes a comprehensive set of reusable UI components:

- **Button**: Multiple variants (primary, secondary, outline, ghost)
- **Input**: Text, email, password, search with validation
- **Modal**: Customizable modal dialogs
- **Avatar**: User/business avatars with online status
- **Badge**: Status, category, and notification badges
- **Loading**: Skeleton loaders and spinners
- **Toast**: Success/error notifications

## 🔒 Security Features

- Password hashing with bcrypt
- JWT token authentication
- XSS protection
- CORS configuration
- Rate limiting
- Input validation and sanitization
- File upload restrictions

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile

### Posts
- `GET /api/posts/feed` - Get user feed
- `POST /api/posts` - Create post
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post
- `POST /api/posts/:id/like` - Like post

### Products
- `GET /api/products` - Get products
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Communities
- `GET /api/communities` - Get communities
- `POST /api/communities` - Create community
- `POST /api/communities/:id/join` - Join community

## 🚧 Upcoming Features

- [ ] Advanced voice and video calling
- [ ] Payment integration
- [ ] Order management system
- [ ] Invoice generation
- [ ] Advanced analytics dashboard
- [ ] Mobile applications (iOS & Android)
- [ ] Advertisement platform
- [ ] AI-powered product recommendations
- [ ] Multi-currency support
- [ ] Logistics integration

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Authors

- Your Name - Initial work

## 🙏 Acknowledgments

- Icons by Lucide
- UI inspiration from modern B2B platforms
- Community feedback and testing

## 📞 Support

For support, email support@wholesaleconnect.com or join our community forum.

## 🔗 Links

- [Documentation](https://docs.wholesaleconnect.com)
- [API Reference](https://api.wholesaleconnect.com/docs)
- [Community Forum](https://community.wholesaleconnect.com)

---

Made with ❤️ for the textile industry
