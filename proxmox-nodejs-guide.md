# Guide: Deploying a Node.js Application on Proxmox with an LXC Container

This guide provides a comprehensive, step-by-step process for deploying a Node.js application from a Git repository into a new LXC container on Proxmox. It includes common troubleshooting steps derived from real-world deployment issues.

## Part 1: Proxmox Host Preparation

Before creating a container, you need a template for it to use.

1.  **Select Storage:** In the Proxmox UI, select your node (e.g., `lion`), then select a storage location, typically `local`.
2.  **Go to CT Templates:** Click on the "CT Templates" tab.
3.  **Download a Template:** Click the "Templates" button, find a suitable OS (e.g., `ubuntu-22.04-standard`), and click "Download".

## Part 2: Creating the LXC Container

1.  **Click "Create CT"** to open the wizard.
2.  **General Tab:**
    *   **Hostname:** A descriptive name (e.g., `teampointer-app`).
    *   **Password:** A strong password for the `root` user.
    *   **Unprivileged container:** Check this box for security.
    .   **Nesting**: Check this box.
3.  **Template Tab:** Select the Ubuntu 22.04 template you downloaded.
4.  **Disks Tab:** Set disk size to at least `8` GB.
5.  **CPU Tab:** Assign `1` core.
6.  **Memory Tab:** Assign `512` MB of Memory and `512` MB of Swap.
7.  **Network Tab:** Set to `DHCP` on your primary bridge (e.g., `vmbr0`).
8.  **Confirm:** Review and finish the creation. Start the container after it's created.

## Part 3: In-Container Setup (Manual Method)

This manual method is the most reliable way to configure the container, as it doesn't depend on Cloud-Init.

1.  **Open the Console:** Select the container in the Proxmox UI and open the `>_ Console`. Log in as `root` with the password you set.

2.  **Run the Setup Script:** For a fully automated setup, you can use the `setup-teampointer.sh` script provided separately. Upload it to the container or copy-paste its contents into a new file (`nano setup-teampointer.sh`), make it executable (`chmod +x setup-teampointer.sh`), and run it (`./setup-teampointer.sh`).

3.  **Or, Perform Steps Manually:**
    *   **Upgrade Node.js:** The default Node.js is too old. Install a modern version.
      ```bash
      # Install prerequisites
      apt-get update
      apt-get install -y ca-certificates curl gnupg

      # Purge any old node versions to prevent conflicts
      apt-get purge -y nodejs libnode-dev npm
      apt-get autoremove -y

      # Add the NodeSource repository for Node.js v20
      mkdir -p /etc/apt/keyrings
      curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
      NODE_MAJOR=20
      echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_$NODE_MAJOR.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list
      
      # Install the new Node.js version
      apt-get update
      apt-get install -y nodejs git
      ```

    *   **Clone Application & Install Dependencies:**
      ```bash
      # Clone the project from GitHub
      git clone https://github.com/SSafet/TeamPointer.git /opt/teampointer

      # Go into the directory and install dependencies
      cd /opt/teampointer
      npm install
      ```

    *   **Install and Configure PM2:**
      ```bash
      # Install PM2 process manager globally
      npm install -g pm2

      # Start the app with PM2
      pm2 start server.js --name teampointer

      # Create a startup script so PM2 runs on boot
      pm2 startup

      # Save the current process list to be respawned on reboot
      pm2 save
      ```
    
    *   **Configure Firewall (UFW):**
      ```bash
      # Install UFW if it's not present
      apt-get install -y ufw

      # Allow SSH and the application port (3000)
      ufw allow ssh
      ufw allow 3000/tcp

      # Enable the firewall, forcing it to start
      ufw --force enable
      ```

## Part 4: Troubleshooting

If you can't connect to `http://<container-ip>:3000`:

1.  **Is the App Running?**
    *   In the container console, run `pm2 status`. The status for `teampointer` should be `online`.
    *   If it's `errored` or `stopped`, check the logs with `pm2 logs teampointer`.

2.  **Is the Port Open?**
    *   In the container console, run `netstat -tuln | grep 3000`. You should see a line showing the server is `LISTEN`ing. If not, the app isn't running correctly.

3.  **Is the Container Firewall Correct?**
    *   Run `ufw status verbose`. Ensure the rule to `ALLOW IN` on port `3000/tcp` is present and that the firewall is `active`.

4.  **Can You Find the IP?**
    *   Run `ip addr show`. The IP address is on the `inet` line under the `eth0` interface.

5.  **Is the Proxmox Firewall Blocking It?**
    *   Check the firewall status on the Datacenter, Node, and Container levels in the Proxmox UI. Disable them temporarily to test.

6.  **Are You on the Same Network?**
    *   Check your computer's IP address. If it's on a different subnet (e.g., `192.168.1.x`) than the container (e.g., `10.10.10.x`), you may have a routing issue at your network level. 