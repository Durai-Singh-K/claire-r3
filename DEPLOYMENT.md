# Deployment Guide

This guide covers deploying WholeSale Connect to production environments.

## 📋 Pre-Deployment Checklist

- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Database backed up
- [ ] SSL certificates ready
- [ ] Domain name configured
- [ ] CDN setup (optional)
- [ ] Monitoring tools configured

## 🌐 Deployment Options

### Option 1: Traditional VPS (DigitalOcean, Linode, etc.)

#### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Install Nginx
sudo apt install nginx -y

# Install PM2
sudo npm install -g pm2
```

#### 2. Deploy Application

```bash
# Clone repository
cd /var/www
sudo git clone <your-repo-url> wholesale-connect
cd wholesale-connect

# Install dependencies
npm run install-all

# Build frontend
npm run build

# Set up environment variables
sudo nano backend/.env
# Add production environment variables

# Start backend with PM2
cd backend
pm2 start server.js --name "wholesale-backend"
pm2 startup
pm2 save
```

#### 3. Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/wholesale-connect
```

```nginx
# Frontend
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    root /var/www/wholesale-connect/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

# Backend API
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/wholesale-connect /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 4. Setup SSL with Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com
```

### Option 2: Docker Deployment

#### 1. Create Dockerfile (Backend)

```dockerfile
# backend/Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 5000

CMD ["node", "server.js"]
```

#### 2. Create Dockerfile (Frontend)

```dockerfile
# Dockerfile
FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

#### 3. Create docker-compose.yml

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:6.0
    container_name: wholesale-mongodb
    restart: always
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_PASSWORD}
    volumes:
      - mongo-data:/data/db
    ports:
      - "27017:27017"

  backend:
    build: ./backend
    container_name: wholesale-backend
    restart: always
    environment:
      NODE_ENV: production
      MONGODB_URI: mongodb://admin:${MONGO_PASSWORD}@mongodb:27017/wholesale-connect?authSource=admin
      JWT_SECRET: ${JWT_SECRET}
      PORT: 5000
    ports:
      - "5000:5000"
    depends_on:
      - mongodb

  frontend:
    build: .
    container_name: wholesale-frontend
    restart: always
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  mongo-data:
```

#### 4. Deploy with Docker

```bash
# Create .env file
echo "MONGO_PASSWORD=your_secure_password" > .env
echo "JWT_SECRET=your_jwt_secret" >> .env

# Build and start containers
docker-compose up -d

# View logs
docker-compose logs -f

# Stop containers
docker-compose down
```

### Option 3: Cloud Platforms

#### Heroku

```bash
# Install Heroku CLI
curl https://cli-assets.heroku.com/install.sh | sh

# Login
heroku login

# Create app
heroku create wholesale-connect-api

# Add MongoDB addon
heroku addons:create mongolab

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your_secret_key

# Deploy
git push heroku main

# View logs
heroku logs --tail
```

#### AWS (EC2 + RDS)

1. Launch EC2 instance (Ubuntu 22.04)
2. Setup MongoDB Atlas or RDS
3. Configure Security Groups
4. Follow VPS deployment steps
5. Use AWS Load Balancer
6. Setup Auto Scaling (optional)

#### Vercel (Frontend Only)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Configure environment variables in Vercel dashboard
```

#### Railway

1. Connect GitHub repository
2. Select project
3. Add environment variables
4. Deploy automatically

## 🔒 Security Checklist

### Production Environment Variables

```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname
JWT_SECRET=use-a-strong-random-secret-min-32-chars
CLIENT_URL=https://yourdomain.com
CORS_ORIGIN=https://yourdomain.com

# Use strong passwords
# Enable MongoDB authentication
# Use HTTPS only
# Set secure cookie flags
```

### Security Headers

Add to Nginx configuration:

```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
```

### Firewall Configuration

```bash
# Allow SSH
sudo ufw allow ssh

# Allow HTTP/HTTPS
sudo ufw allow 80
sudo ufw allow 443

# Enable firewall
sudo ufw enable
```

## 📊 Monitoring

### Setup PM2 Monitoring

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7

# Monitor
pm2 monit
```

### Application Monitoring

```bash
# Install monitoring tools
npm install --save-dev newrelic
npm install --save-dev @sentry/node

# Configure in server.js
```

### Database Monitoring

```bash
# Enable MongoDB monitoring
mongod --profile 1 --slowms 100

# View slow queries
db.system.profile.find().limit(10).sort({ts:-1})
```

## 🔄 CI/CD Pipeline

### GitHub Actions Example

```yaml
name: Deploy

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: npm run install-all
    
    - name: Run tests
      run: npm test
    
    - name: Build
      run: npm run build
    
    - name: Deploy to production
      run: |
        # Add your deployment commands here
        # e.g., rsync, scp, or deployment service CLI
```

## 📈 Performance Optimization

### Enable Gzip Compression

```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;
```

### Setup CDN

1. Sign up for CloudFlare or similar CDN
2. Add your domain
3. Update DNS records
4. Enable caching rules

### Database Indexing

```javascript
// Add indexes in MongoDB
db.users.createIndex({ email: 1 }, { unique: true })
db.posts.createIndex({ createdAt: -1 })
db.products.createIndex({ category: 1, price: 1 })
```

## 🔙 Backup Strategy

### Automated MongoDB Backups

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/mongodb"

mongodump --uri="mongodb://localhost:27017/wholesale-connect" --out="$BACKUP_DIR/backup_$DATE"

# Keep only last 7 days
find $BACKUP_DIR -type d -mtime +7 -exec rm -rf {} \;
```

```bash
# Add to crontab
crontab -e

# Run daily at 2 AM
0 2 * * * /path/to/backup.sh
```

## 🆘 Troubleshooting

### Check Application Status

```bash
pm2 status
pm2 logs
pm2 restart all
```

### Check Nginx

```bash
sudo nginx -t
sudo systemctl status nginx
sudo tail -f /var/log/nginx/error.log
```

### Check MongoDB

```bash
sudo systemctl status mongod
mongo
> use wholesale-connect
> db.stats()
```

## 📞 Support

For deployment issues:
- Check logs first
- Review environment variables
- Verify network connectivity
- Contact support if needed

---

**Remember**: Always test in staging before deploying to production!
