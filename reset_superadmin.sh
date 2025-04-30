#!/bin/bash

echo "=== Resetting Super Admin Password ==="
echo "This script will reset the super admin password to the default value."
echo ""

# Navigate to project root
cd "$(dirname "$0")"

# Run the reset script
echo "Running the password reset script..."
node app/server/scripts/resetSuperAdminPassword.js

echo ""
echo "=== Reset Complete ==="
echo "You can now log in at /superadmin/login with:"
echo "Username: superadmin"
echo "Password: meditation123"
echo ""
echo "IMPORTANT: Change your password after login!" 