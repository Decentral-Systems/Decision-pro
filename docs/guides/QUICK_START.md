# Decision PRO - Quick Start Guide

## 🚀 Start Testing in 3 Steps

### Step 1: Install Dependencies
```bash
cd /home/AIS/decision-pro-admin
npm install
```

### Step 2: Setup Environment
```bash
# Create .env.local file
cat > .env.local << 'EOF'
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=$(openssl rand -base64 32)
NEXT_PUBLIC_API_GATEWAY_URL=http://196.188.249.48:4000
NEXT_PUBLIC_CREDIT_SCORING_API_URL=http://196.188.249.48:4001
NODE_ENV=development
EOF

# Generate secret key (run this command and copy the output)
openssl rand -base64 32
# Then edit .env.local and replace $(openssl rand -base64 32) with the generated key
```

Or manually create `.env.local`:
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-generated-secret-key-here
NEXT_PUBLIC_API_GATEWAY_URL=http://196.188.249.48:4000
NEXT_PUBLIC_CREDIT_SCORING_API_URL=http://196.188.249.48:4001
NODE_ENV=development
```

### Step 3: Start Development Server
```bash
npm run dev
```

## 🌐 Access the Application

Open your browser and navigate to:
**http://localhost:3000**

## 🔐 Test Login

Use these credentials (verify they exist in your API Gateway):
- **Username**: `admin`
- **Password**: `admin123`

Or use any valid credentials from your API Gateway user database.

## 📋 Quick Test Checklist

- [ ] Application loads at http://localhost:3000
- [ ] Redirects to login page when not authenticated
- [ ] Can login with valid credentials
- [ ] Dashboard page loads after login
- [ ] Sidebar navigation works
- [ ] Credit Scoring page accessible
- [ ] Customer 360 page accessible (try `/customers/CUST_001`)

## 🐛 Troubleshooting

### Port already in use?
```bash
PORT=3001 npm run dev
```

### Build errors?
```bash
rm -rf .next node_modules
npm install
npm run dev
```

### API connection issues?
```bash
# Test API Gateway
curl http://196.188.249.48:4000/health

# Test Credit Scoring Service
curl http://196.188.249.48:4001/health
```

For detailed testing guide, see [TESTING_GUIDE.md](./TESTING_GUIDE.md)

