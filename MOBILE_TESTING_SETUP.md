# 📱 Mobile Testing Setup Guide

This guide explains how to test the Rabab Stay application on mobile devices over local Wi-Fi.

## 🎯 Quick Setup

### Step 1: Get Your Local IP Address

Run this command to find your local network IP:

```bash
cd frontend
npm run network-ip
```

This will display your local IP address (e.g., `10.173.255.154` or `192.168.1.100`)

### Step 2: Configure Frontend for Network Access

1. Copy the network environment template:
   ```bash
   cp frontend/.env.network frontend/.env
   ```

2. Edit `frontend/.env` and replace `<YOUR_IP>` with your actual IP:
   ```env
   VITE_API_BASE_URL=http://10.173.255.154:5000/api
   ```

### Step 3: Start Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev:mobile
```

The frontend will show network URLs like:
```
➜  Local:   http://localhost:5173/
➜  Network: http://10.173.255.154:5173/
```

### Step 4: Access from Mobile

1. Make sure your phone is on the **same Wi-Fi network** as your laptop
2. Open your phone's browser
3. Navigate to: `http://<YOUR_IP>:5173`
   - Example: `http://10.173.255.154:5173`

## 🔧 Configuration Details

### Environment Files

- **`.env`** - Default (localhost for development)
- **`.env.local`** - Local overrides (gitignored)
- **`.env.network`** - Template for mobile testing (gitignored)
- **`.env.production`** - Production deployment

### Backend Configuration

The backend automatically:
- ✅ Listens on `0.0.0.0` (all network interfaces)
- ✅ Accepts CORS from local network IPs (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
- ✅ Works with localhost for development
- ✅ Supports production deployment without code changes

### Frontend Configuration

The frontend uses `VITE_API_BASE_URL` environment variable:
- **Development (localhost):** `http://localhost:5000/api`
- **Mobile testing:** `http://<YOUR_IP>:5000/api`
- **Production:** Set via deployment platform

## 🚀 Deployment Safety

### This configuration is deployment-safe:

1. **No hardcoded IPs** - Everything uses environment variables
2. **Production ready** - Works with Vercel, Render, etc. without changes
3. **Flexible CORS** - Automatically handles development and production
4. **Environment-based** - Different configs for different environments

### For Production Deployment:

**Frontend (Vercel/Netlify):**
Set environment variable:
```
VITE_API_BASE_URL=https://your-backend-api.com/api
```

**Backend (Render/Railway):**
Set environment variables:
```
NODE_ENV=production
ALLOWED_ORIGINS=https://your-frontend.vercel.app,https://your-frontend.com
PORT=5000
```

## 🐛 Troubleshooting

### Mobile can't connect to backend

1. **Check firewall:** Make sure Windows Firewall allows Node.js
   - Windows: Settings → Firewall → Allow an app
   - Add Node.js to allowed apps

2. **Verify same Wi-Fi:** Both devices must be on the same network

3. **Check IP address:** Your IP might change if you reconnect to Wi-Fi
   - Run `npm run network-ip` again to get current IP

4. **Test backend directly:** Open `http://<YOUR_IP>:5000` in mobile browser
   - Should show: "Rabab Stay Backend Running 🏨"

### CORS errors on mobile

1. Make sure you updated `.env` with correct IP
2. Restart both frontend and backend servers
3. Clear browser cache on mobile

### "Network: use --host to expose" not showing

1. Make sure you're using `npm run dev:mobile` (not `npm run dev`)
2. Check `vite.config.ts` has `server: { host: true }`

## 📝 Switching Between Modes

### Back to localhost (normal development):
```bash
# Use default .env or remove custom .env
rm frontend/.env
# OR edit .env to use localhost
VITE_API_BASE_URL=http://localhost:5000/api
```

### Enable mobile testing:
```bash
# Copy network template and update IP
cp frontend/.env.network frontend/.env
# Edit .env with your IP
```

## 🔒 Security Notes

- `.env.local` and `.env.network` are gitignored (won't be committed)
- Never commit files with your local IP address
- Production uses separate environment variables
- CORS is strict in production mode

## ✅ Verification Checklist

- [ ] Backend shows "Network: http://\<your-ip\>:5000"
- [ ] Frontend shows "Network: http://\<your-ip\>:5173"
- [ ] Mobile browser can access frontend URL
- [ ] Can login and navigate on mobile
- [ ] API calls work (check Network tab in mobile browser)
- [ ] No CORS errors in console

## 📱 Mobile Testing Tips

1. **Use Chrome DevTools for mobile:**
   - Connect phone via USB
   - Enable USB debugging
   - Use `chrome://inspect` to debug

2. **Test responsive design:**
   - Portrait and landscape modes
   - Different screen sizes
   - Touch interactions

3. **Check performance:**
   - Network speed on Wi-Fi
   - Image loading
   - API response times

4. **Test offline behavior:**
   - Turn off Wi-Fi
   - Check error handling

## 🎉 Success!

If you can see the Rabab Stay homepage on your mobile browser and login successfully, you're all set! 🚀
