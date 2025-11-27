# Quick Fix for Blank Page

## Step 1: Check Browser Console

1. In Chrome DevTools, click the **Console** tab (not Elements)
2. Look for **red error messages**
3. Share the error message with me

Common errors you might see:
- `Cannot find module` - Missing dependency
- `Failed to resolve` - Import path issue
- `Uncaught ReferenceError` - JavaScript error
- `Cannot read property` - Null/undefined error

## Step 2: Check Terminal

Look at the terminal where `npm run dev` is running. Do you see:
- ✅ `ready in xxx ms` - Server is running
- ❌ Red error messages - There's a problem

## Step 3: Quick Test

Try opening: http://localhost:8080/src/main.tsx

If you see the file content, the server is working. If you see an error, there's a build issue.

## Step 4: Common Fixes

### Fix 1: Restart Dev Server
```bash
# Press Ctrl+C to stop
# Then restart:
npm run dev
```

### Fix 2: Clear Cache and Reinstall
```bash
# Stop server (Ctrl+C)
rm -rf node_modules
npm install
npm run dev
```

### Fix 3: Check for Missing Files
Make sure these files exist:
- ✅ `index.html` in root
- ✅ `src/main.tsx`
- ✅ `src/App.tsx`
- ✅ `src/index.css`

## What to Share

Please share:
1. **Console errors** (F12 → Console tab)
2. **Terminal output** from `npm run dev`
3. **What you see** when you open localhost:8080

