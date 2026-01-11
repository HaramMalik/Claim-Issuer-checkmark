# How to Import into Vercel

Vercel does not allow you to upload a single "import file". Instead, it connects to your **GitHub** account to deploy the project.

Here is the exact process to see "Nomis as Claim Issuer" live:

## Step 1: Create a GitHub Repository
1.  Go to [GitHub.com](https://github.com/new) and create a new repository (e.g., named `nomis-issuer`).
2.  Do NOT add a README or .gitignore (we already have them).

## Step 2: Push Your Code
Open your terminal (Command Prompt or PowerShell) in the project folder:
`c:\Users\USER\.gemini\antigravity\playground\astral-voyager`

Run these commands:
```powershell
git init
git add .
git commit -m "Initial commit of Nomis Issuer"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/nomis-issuer.git
git push -u origin main
```
*(Replace `YOUR_USERNAME/nomis-issuer.git` with the URL of the repo you just created).*

## Step 3: Import in Vercel
1.  Go to your [Vercel Dashboard](https://vercel.com/dashboard).
2.  Click **"Add New..."** -> **"Project"**.
3.  You should see your new `nomis-issuer` repository in the list.
4.  Click **"Import"**.
5.  **Project Name**: Leave as is (e.g., `nomis-issuer`).
6.  **Framework Preset**: It should automatically detect **Next.js**.
7.  **Environment Variables**: You don't need to add any for the demo (it uses the fallback key).
8.  Click **"Deploy"**.

## Step 4: Open Your App
Once deployment finishes (about 1 minute), Vercel will give you a domain (e.g., `nomis-issuer.vercel.app`).
Click it to use your Nomis Claim Issuer app!
