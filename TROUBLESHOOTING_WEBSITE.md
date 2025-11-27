# Website Not Opening - Troubleshooting Guide

## Quick Fixes

### 1. Check if Dev Server is Running

Open a terminal in your project folder and run:

```bash
npm run dev
```

You should see output like:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:8080/
  ➜  Network: use --host to expose
```

### 2. Check the URL

The website should be available at:
- **Local**: http://localhost:8080/
- **Network**: Check the terminal output for the exact URL

### 3. Port Already in Use?

If port 8080 is already in use, you'll see an error. Try:

**Option A: Kill the process using port 8080**
```bash
# Windows PowerShell
netstat -ano | findstr :8080
# Note the PID, then:
taskkill /PID <PID> /F

# Or use a different port
```

**Option B: Change the port in vite.config.ts**
```typescript
server: {
  port: 3000, // or any other port
}
```

### 4. Browser Issues

- **Clear browser cache**: Ctrl+Shift+Delete (Windows) or Cmd+Shift+Delete (Mac)
- **Try a different browser**: Chrome, Firefox, Edge
- **Try incognito/private mode**
- **Check browser console**: Press F12 → Console tab for errors

### 5. Missing Dependencies

If you see module errors, reinstall dependencies:

```bash
npm install
```

### 6. Check for Errors

Look at the terminal where `npm run dev` is running. Any red error messages?

Common errors:
- **"Cannot find module"** → Run `npm install`
- **"Port already in use"** → Change port or kill the process
- **"EADDRINUSE"** → Port conflict
- **TypeScript errors** → Check the error message

### 7. Firewall/Antivirus

Sometimes firewalls block localhost. Try:
- Temporarily disable firewall
- Add exception for port 8080
- Check antivirus settings

### 8. Environment Variables

Make sure you have a `.env` file (if needed) with:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_key
```

## Step-by-Step Debugging

1. **Stop any running servers** (Ctrl+C in terminal)

2. **Clean install**:
   ```bash
   rm -rf node_modules
   npm install
   ```

3. **Start fresh**:
   ```bash
   npm run dev
   ```

4. **Check terminal output** - Look for:
   - ✅ "ready in xxx ms" = Server started successfully
   - ❌ Red error messages = Problem to fix

5. **Open browser** to http://localhost:8080

6. **Check browser console** (F12) for JavaScript errors

## Still Not Working?

Share:
1. The exact error message from terminal
2. Any errors from browser console (F12)
3. What happens when you try to open localhost:8080

