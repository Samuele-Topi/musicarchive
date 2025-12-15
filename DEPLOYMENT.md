# DigitalOcean Droplet Deployment Guide

This guide outlines the steps to deploy your `musicarchive` application to a DigitalOcean Droplet. This method ensures persistent storage for your SQLite database and uploaded files.

## Phase 1: Prepare your Code (Commit & Push to GitHub)

Before starting, ensure all your latest changes, including the `Dockerfile`, `next.config.ts` modifications, and `.dockerignore` file, are pushed to your GitHub repository.

1.  **Stage all changes:**
    ```bash
    git add .
    ```
2.  **Commit your changes:**
    ```bash
    git commit -m "Chore: Add Docker configuration and deployment instructions"
    ```
3.  **Push to GitHub:**
    ```bash
    git push -u origin main
    ```

## Phase 2: Create the DigitalOcean Droplet

1.  **Log in** to your DigitalOcean account.
2.  Click **"Create"** in the top right, then select **"Droplets"**.
3.  **Choose a Region**: Select the data center geographically closest to you.
4.  **Choose an Image**:
    *   Go to the **"Marketplace"** tab.
    *   Search for **"Docker"** and select **"Docker on Ubuntu"**. This pre-installs Docker for you.
5.  **Choose a Size**:
    *   Select a **"Basic"** plan. The **$6/month (Regular Intel)** or **$7/month (Premium AMD)** Droplet is sufficient for this application.
6.  **Authentication**:
    *   **SSH Key (Recommended)**: If you have an SSH key, upload it. This is more secure.
    *   **Password**: If you don't use SSH keys, choose a very strong password.
7.  **Hostname**: Give your Droplet a memorable name, e.g., `music-archive-server`.
8.  Click **"Create Droplet"**.

## Phase 3: Connect to Droplet and Deploy Your Application

Once your Droplet is created and running (you'll see a green dot next to its name), copy its **IP Address**.

Open your local terminal (Git Bash on Windows, Terminal on macOS/Linux) and connect via SSH:

```bash
ssh root@YOUR_DROPLET_IP_ADDRESS
```
*(Replace `YOUR_DROPLET_IP_ADDRESS` with the actual IP of your Droplet. If you used a password for authentication, you will be prompted to enter it.)*

**Once you are logged into the Droplet's terminal, execute these commands:**

1.  **Clone your GitHub repository:**
    ```bash
    git clone https://github.com/Samuele-Topi/musicarchive.git
    cd musicarchive
    ```
    *(This pulls your project code, including the `Dockerfile` and `DEPLOYMENT.md` itself, onto the Droplet.)*

2.  **Create your `.env.local` file on the Droplet:**
    This file will contain your sensitive environment variables (GitHub OAuth credentials).
    ```bash
    nano .env.local
    ```
    *   Paste the following content into the `nano` editor:
        ```env
        AUTH_SECRET="your_strong_random_secret_here" # Run `npx auth secret` locally to generate one
        AUTH_GITHUB_ID="YOUR_GITHUB_OAUTH_CLIENT_ID"
        AUTH_GITHUB_SECRET="YOUR_GITHUB_OAUTH_CLIENT_SECRET"
        DATABASE_URL="file:/app/prisma/dev.db"
        ```
    *   To save and exit `nano`: Press `Ctrl+X`, then `Y`, then `Enter`.

3.  **Build your Docker image:**
    This step uses the `Dockerfile` to create a deployable image of your application.
    ```bash
    docker build -t musicapp .
    ```

4.  **Run your application in a Docker container:**
    This command starts your application, maps necessary ports, and ensures persistent storage for your database and uploads.
    ```bash
    docker run -d -p 80:3000 --restart always \
      --name music-archive-container \
      -v $(pwd)/prisma:/app/prisma \
      -v $(pwd)/public/uploads:/app/public/uploads \
      --env-file .env.local musicapp
    ```
    *   `-d`: Runs the container in detached mode (in the background).
    *   `-p 80:3000`: Maps port 80 on the Droplet (standard HTTP) to port 3000 inside the Docker container (where your Next.js app listens).
    *   `--restart always`: Ensures the container automatically restarts if it crashes or the Droplet reboots.
    *   `--name music-archive-container`: Assigns a readable name to your container.
    *   `-v $(pwd)/prisma:/app/prisma`: This is **crucial**. It creates a persistent volume for your `prisma` directory on the Droplet, ensuring your `dev.db` file (and thus your music library data) is saved even if the container is removed or updated.
    *   `-v $(pwd)/public/uploads:/app/public/uploads`: **Equally crucial**. This creates a persistent volume for your `public/uploads` directory, so your uploaded music files and cover art are saved permanently.
    *   `--env-file .env.local`: Tells Docker to load environment variables from the `.env.local` file you created.
    *   `musicapp`: The name of the Docker image you built.

### Accessing Your Application

Your Music Archive will be accessible via your Droplet's IP address in your web browser:
`http://YOUR_DROPLET_IP_ADDRESS`

## Option 2: Local Hosting with Cloudflare Tunnel

If you prefer to host the application on your local machine and expose it securely to the internet, you can use Cloudflare Tunnel.

1.  **Install Cloudflared**:
    Download the `cloudflared` executable for your OS.

2.  **Start the Tunnel**:
    Run the following command to expose your local Next.js app (running on port 3000):
    ```powershell
    cloudflared tunnel --url http://localhost:3000
    ```
    *Note: For a permanent setup, consider creating a named tunnel and running it as a service.*

3.  **Access the Site**:
    Cloudflare will provide a temporary URL (e.g., `https://random-name.trycloudflare.com`). If you have configured a custom domain (like `samuele-musicarchive.me`), use that instead.

4.  **Run as Service (Windows)**:
    To keep the site online even after closing the terminal:
    ```powershell
    # Install PM2 for the Next.js app
    npm install -g pm2 pm2-windows-startup
    pm2-startup install
    pm2 start npm --name "musicarchive" -- start
    pm2 save

    # Install Cloudflared as a service
    cloudflared service install
    ```

---
**Remember to generate your `AUTH_SECRET` locally using `npx auth secret` and set up your GitHub OAuth App for the `AUTH_GITHUB_ID` and `AUTH_GITHUB_SECRET` values!**
