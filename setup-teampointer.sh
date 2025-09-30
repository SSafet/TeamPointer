#!/bin/bash
#
# Automated setup script for the TeamPointer application in a fresh Ubuntu/Debian LXC container.
# This script performs the following actions:
# 1. Updates the system and installs necessary dependencies.
# 2. Purges any outdated Node.js versions.
# 3. Adds the NodeSource repository to install a modern version of Node.js.
# 4. Clones the TeamPointer application from GitHub.
# 5. Installs application dependencies with npm.
# 6. Installs PM2, starts the application, and sets it to run on boot.
# 7. Configures the UFW firewall to allow necessary traffic.
#

# --- Stop on any error ---
set -e

# --- Initial System Update and Prerequisite Installation ---
echo "--- Updating package lists and installing prerequisites... ---"
apt-get update
apt-get install -y ca-certificates curl gnupg git ufw

# --- Node.js v20 Installation ---
echo "--- Removing old Node.js versions (if any) and installing Node.js v20... ---"
# Purge to avoid conflicts
apt-get purge -y nodejs libnode-dev npm
apt-get autoremove -y

# Add NodeSource repository
mkdir -p /etc/apt/keyrings
curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
NODE_MAJOR=20
echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_$NODE_MAJOR.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list

# Install Node.js from the new source
apt-get update
apt-get install -y nodejs

echo "--- Node.js version `node -v` installed successfully. ---"


# --- Application Setup ---
APP_DIR="/opt/teampointer"
GIT_REPO="https://github.com/SSafet/TeamPointer.git"

echo "--- Cloning application from ${GIT_REPO} to ${APP_DIR}... ---"
git clone ${GIT_REPO} ${APP_DIR}
cd ${APP_DIR}

echo "--- Installing Node.js dependencies... ---"
npm install


# --- PM2 Process Manager Setup ---
echo "--- Installing and configuring PM2... ---"
npm install -g pm2

echo "--- Starting application with PM2... ---"
pm2 start server.js --name teampointer

echo "--- Setting up PM2 to start on boot... ---"
# The 'pm2 startup' command generates and runs 'systemctl enable pm2-root'
pm2 startup

echo "--- Saving current process list... ---"
pm2 save


# --- Firewall Configuration ---
echo "--- Configuring UFW firewall... ---"
ufw allow ssh
ufw allow 3000/tcp
ufw --force enable

echo "--- Firewall enabled and configured. ---"
echo ""
echo "==========================================================="
echo "                  SETUP COMPLETE!"
echo "==========================================================="
echo "The TeamPointer application is now running under PM2."
echo "You can check its status with 'pm2 status'."
echo "The firewall is configured to allow traffic on port 3000."
echo "You should be able to access the app at http://<container-ip>:3000"
echo "===========================================================" 