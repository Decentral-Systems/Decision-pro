# Quick Test Guide - Decision PRO Admin

## Quick Start Test

### 1. Verify Services Are Running
cd /home/AIS && ./ais status

### 2. Test Dashboard Access
curl http://localhost:4009/api/health

### 3. Open in Browser
Navigate to: http://196.188.249.48:4009 or http://localhost:4009

### 4. Test Login
- Go to login page
- Enter credentials (admin/admin)
- Should redirect to dashboard

### 5. Test Credit Scoring
- Navigate to Credit Scoring page
- Fill form with sample data
- Submit and verify results

## Health Checks

curl http://localhost:4000/health  # API Gateway
curl http://localhost:4001/health  # Credit Scoring
curl http://localhost:4002/health  # Default Prediction
curl http://localhost:4003/health  # Explainability
curl http://localhost:4009/api/health  # Dashboard

## Restart Dashboard
cd /home/AIS/decision-pro-admin
pkill -f "next dev"
npm run dev &

## Restart All Services
cd /home/AIS && ./ais restart

---
System is ready for testing!
