# Installing Supabase CLI on Windows

## Method 1: Using Scoop (Recommended for Windows)

### Step 1: Install Scoop (if you don't have it)

Open PowerShell as Administrator and run:

```powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
irm get.scoop.sh | iex
```

### Step 2: Add Supabase bucket

```powershell
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
```

### Step 3: Install Supabase CLI

```powershell
scoop install supabase
```

### Step 4: Verify installation

```powershell
supabase --version
```

## Method 2: Using Standalone Binary (No package manager needed)

1. Go to: https://github.com/supabase/cli/releases
2. Download the latest `supabase_windows_amd64.zip` (or `supabase_windows_arm64.zip` for ARM)
3. Extract the zip file
4. Add the extracted folder to your PATH, or move `supabase.exe` to a folder already in your PATH

## Method 3: Using Chocolatey (if you have it)

```powershell
choco install supabase
```

## After Installation

Once installed, you can deploy your functions:

```bash
# Login
supabase login

# Link project
supabase link --project-ref qibdjoitzmqxyqmcsrbi

# Deploy functions
supabase functions deploy ai-chat
supabase functions deploy mood-checkin-ai
```

