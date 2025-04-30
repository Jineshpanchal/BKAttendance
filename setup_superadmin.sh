#!/bin/bash

echo "=== Setting up Super Admin ==="
echo "This script will create the super_admins table and a default super admin account"
echo "if they don't already exist."
echo ""

# Navigate to project root
cd "$(dirname "$0")"

# Run the setup script
echo "Running the setup script..."
node app/server/scripts/createSuperAdmin.js

echo ""
echo "=== Setup Complete ==="
echo "You can now log in at /superadmin/login with:"
echo "Username: superadmin"
echo "Password: meditation123"
echo ""
echo "IMPORTANT: Change your password after first login!" 