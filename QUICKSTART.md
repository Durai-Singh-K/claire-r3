# Quick Start Guide

Get WholeSale Connect up and running in 5 minutes!

## Prerequisites Checklist

- [ ] Node.js v16+ installed
- [ ] MongoDB installed and running
- [ ] Git installed
- [ ] Code editor (VS Code recommended)

## 🚀 Fast Setup

### 1. Clone & Install (2 minutes)

```bash
# Clone the repository
git clone <repository-url>
cd b2b-platform

# Install all dependencies
npm run install-all
```

### 2. Configure Environment (1 minute)

```bash
# Backend configuration
cd backend
cp .env.example .env

# Edit .env and set:
# - MONGODB_URI (if different from default)
# - JWT_SECRET (generate a random string)

# Frontend configuration
cd ..
cp .env.example .env

# Edit .env and set:
# - VITE_API_URL (default: http://localhost:5000/api)
```

### 3. Start MongoDB (30 seconds)

```bash
# Option 1: Using system service
sudo systemctl start mongod

# Option 2: Using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Option 3: Using homebrew (Mac)
brew services start mongodb-community
```

### 4. Run the Application (30 seconds)

```bash
# From the root directory
npm run dev
```

That's it! 🎉

- Frontend: http://localhost:5173
- Backend: http://localhost:5000

## 📱 First Steps

### Create Your First Account

1. Navigate to http://localhost:5173
2. Click "Sign up for free"
3. Fill in your details:
   - Display Name: Your Name
   - Email: your@email.com
   - Phone: +91 9876543210
   - Business Name: Your Business
   - Password: SecurePass123
4. Click "Create Account"

### Complete Onboarding

1. Select your business type (e.g., Manufacturer)
2. Add business description
3. Set your location
4. Choose your categories
5. Click "Complete Setup"

### Explore the Platform

- **Home Feed**: View and create posts
- **Discover**: Find businesses and products
- **Communities**: Join industry communities
- **Products**: Add your product catalog
- **Messages**: Chat with other businesses
- **Network**: Build your connections

## 🔧 Development Tips

### Hot Reload

Both frontend and backend support hot reload:
- Frontend changes refresh automatically
- Backend restarts on file changes

### Testing Features

**Default Test User** (if you seed the database):
```
Email: test@example.com
Password: Test123456
```

### Useful Commands

```bash
# Run only backend
npm run server

# Run only frontend
npm run client

# Build for production
npm run build

# Start production server
npm start
```

### Port Configuration

If ports 5000 or 5173 are in use:

**Frontend (Vite)**:
```javascript
// vite.config.js
export default defineConfig({
  server: {
    port: 3000  // Change to any available port
  }
})
```

**Backend (Express)**:
```env
# backend/.env
PORT=4000  # Change to any available port
```

## 🐛 Troubleshooting

### MongoDB Connection Error

```bash
# Check if MongoDB is running
sudo systemctl status mongod

# Or check Docker container
docker ps | grep mongodb
```

### Port Already in Use

```bash
# Find process using the port
lsof -i :5000

# Kill the process
kill -9 <PID>
```

### Node Modules Issues

```bash
# Clean install
rm -rf node_modules package-lock.json
rm -rf backend/node_modules backend/package-lock.json
npm run install-all
```

### Environment Variables Not Loading

- Make sure `.env` files are in the correct directories
- Restart the development server
- Check for typos in variable names

## 📚 Next Steps

- [ ] Read the full [README](README.md)
- [ ] Check out [CONTRIBUTING](CONTRIBUTING.md) guide
- [ ] Explore the [API Documentation](backend/README.md)
- [ ] Join our community Discord
- [ ] Review the codebase structure

## 🎯 Key Features to Try

1. **Create a Post**
   - Go to Home → Click "Create Post"
   - Add text and images
   - Publish to feed

2. **Add a Product**
   - Go to Products → Click "Add Product"
   - Fill in product details
   - Upload product images

3. **Join a Community**
   - Go to Communities → Browse communities
   - Click "Join" on interesting communities
   - Engage with community posts

4. **Send a Message**
   - Go to Network → Find a connection
   - Click "Message"
   - Start chatting

5. **View Analytics**
   - Go to Analytics
   - Check your profile views
   - Monitor engagement metrics

## 🆘 Getting Help

- **Issues**: [GitHub Issues](https://github.com/yourusername/b2b-platform/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/b2b-platform/discussions)
- **Email**: support@wholesaleconnect.com
- **Discord**: [Join our Discord](https://discord.gg/wholesaleconnect)

## 🎉 You're All Set!

Happy coding! If you build something cool, don't forget to share it with the community.

---

**Pro Tip**: Keep this guide handy for quick reference during development.
