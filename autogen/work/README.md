# Firebase Studio Project

This is a Next.js starter project created in Firebase Studio.

To get started, take a look at `src/app/page.tsx`.

---

## ⚙️ Environment Variables Setup

For the application to work correctly, you need to set up environment variables. These are secret keys that should not be stored in your code.

### 1. Local Development (`.env` file)

I have created a file named `.env` in the root of your project. You need to open it and fill in the placeholder values.

```
# .env

# Paystack API Keys (use your TEST keys)
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY="YOUR_PAYSTACK_TEST_PUBLIC_KEY_HERE"
PAYSTACK_SECRET_KEY="YOUR_PAYSTACK_TEST_SECRET_KEY_HERE"

# Firebase Admin SDK
# Go to Firebase > Project Settings > Service accounts > Generate new private key
# Paste the entire content of your service account JSON file here
FIREBASE_SERVICE_ACCOUNT='{"type": "service_account", ...}'

# Admin Dashboard Email
NEXT_PUBLIC_ADMIN_EMAIL="admin@runway.com"
```

**IMPORTANT:** After creating or changing the `.env` file, you **must restart your development server** (`npm run dev`) for the changes to take effect.

### 2. Live Deployment (Netlify)

For your live website, you must add these same variables to your Netlify project settings:

1. Go to your **Netlify Dashboard** > Site configuration > **Build & deploy** > **Environment**.
2. Add each of the following variables one by one:
    * `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` (Use your **LIVE** public key)
    * `PAYSTACK_SECRET_KEY` (Use your **LIVE** secret key)
    * `FIREBASE_SERVICE_ACCOUNT` (Paste the service account JSON content)
    * `NEXT_PUBLIC_ADMIN_EMAIL`
3. Trigger a new deploy in Netlify to apply the changes.

---

## How to Push Your Code to GitHub

Follow these commands precisely in your terminal to push your project to your GitHub repository.

**Target Repository:** `https://github.com/mikomikE254254/finally111.git`

### Terminal Commands: Step-by-Step Guide

**1. Navigate to your project root directory**

Make sure you are in the correct folder in your terminal.

**2. Initialize Git**
This only needs to be run once for the project.
```sh
git init
```

**3. Add all files to staging**
```sh
git add .
```

**4. Create your first commit**
This saves a snapshot of your project.
```sh
git commit -m "Initial commit from Firebase Studio"
```

**5. Set your GitHub repository as the remote**
This command links your local project to the one on GitHub. It will fix any previous incorrect URLs.
```sh
git remote set-url origin https://github.com/mikomikE254254/finally111.git
```

**6. Set your main branch name**
This ensures your default branch is called `main`.
```sh
git branch -M main
```

**7. Push your code to GitHub**
This is the final command to upload your files. This is when you will be asked to log in.
```sh
git push -u origin main
```

### Authentication: How to Log In

When you run `git push`, the terminal will ask for your **Username** and **Password**.

-   **Username:**
    Enter your GitHub username exactly:
    `mikomikE254254`

-   **Password:**
    **DO NOT USE YOUR GITHUB PASSWORD.** You must use a **Personal Access Token (PAT)**.
    1.  **Create a New Token Here:** [**github.com/settings/tokens/new**](https://github.com/settings/tokens/new)
    2.  Give it a name (e.g., "Firebase Studio CLI").
    3.  Under **"Repository access"**, select the **`repo`** scope. This is the most important step.
    4.  Click **"Generate token"** and copy the token (it starts with `ghp_...`).
    5.  Paste this token into the terminal when it asks for your password.

---

### Troubleshooting

- **`fatal: repository not found`**: This almost always means your Personal Access Token is missing the **`repo`** scope. Go back and create a new token, making sure the `repo` box is checked.

- **`Invalid username or token`**: This means you either pasted the token incorrectly or you are using your account password by mistake. Try again with a newly generated token.

- **Fails WITHOUT asking for a password**: This means your computer has saved the wrong credentials. Run the command below to force it to ask you for a password again. When it does, paste your **Personal Access Token**.
  ```sh
  git push https://mikomikE254254@github.com/mikomikE254254/finally111.git main
  ```
# finally111
# finally111
