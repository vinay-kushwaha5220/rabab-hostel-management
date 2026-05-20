# 📱 Quick Mobile Testing Guide

## Automatic Setup (Recommended)

### Windows:
```bash
setup-mobile.bat
```

### Mac/Linux:
```bash
chmod +x setup-mobile.sh
./setup-mobile.sh
```

This will automatically:
- ✅ Detect your local IP
- ✅ Create `.env` file with correct configuration
- ✅ Show you the mobile URL

## Manual Setup

1. **Get your IP:**
   ```bash
   cd frontend
   npm run network-ip
   ```

2. **Configure:**
   ```bash
   cp frontend/.env.network frontend/.env
   # Edit .env and replace <YOUR_IP> with your actual IP
   ```

3. **Start servers:**
   ```bash
   # Terminal 1
   cd backend && npm run dev
   
   # Terminal 2
   cd frontend && npm run dev:mobile
   ```

4. **Access from phone:**
   - Open browser on phone
   - Go to: `http://<YOUR_IP>:5173`

## Troubleshooting

### Can't connect from mobile?
1. Check both devices are on same Wi-Fi
2. Check Windows Firewall allows Node.js
3. Verify IP hasn't changed: `npm run network-ip`

### CORS errors?
1. Restart both servers
2. Clear mobile browser cache
3. Check `.env` has correct IP

## Full Documentation

See [MOBILE_TESTING_SETUP.md](./MOBILE_TESTING_SETUP.md) for complete guide.

## Deployment

This configuration is deployment-safe:
- ✅ No hardcoded IPs
- ✅ Works with Vercel/Render
- ✅ Environment-based configuration
- ✅ Production-ready CORS

Set `VITE_API_BASE_URL` in your deployment platform for production.
