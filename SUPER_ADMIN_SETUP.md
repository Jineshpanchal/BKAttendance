# Super Admin Setup Guide

This guide will help you set up and use the Super Admin functionality for monitoring all meditation centers registered in the system.

## Initial Setup

The system should automatically create a super admin account during database initialization. However, if you're experiencing login issues, you can manually create the super admin account by running:

```
./setup_superadmin.sh
```

This script will:
1. Create the `super_admins` table if it doesn't exist
2. Check if a default super admin account exists
3. If no account exists, create one with the default credentials

## Default Credentials

- **Username:** superadmin
- **Password:** meditation123

**IMPORTANT:** For security reasons, change this password immediately after your first login.

## Accessing the Super Admin Dashboard

1. Navigate to `/superadmin/login` in your browser
2. Enter the default credentials (or your updated credentials)
3. After successful login, you'll be redirected to the Super Admin Dashboard

## Super Admin Dashboard Features

The dashboard provides:

- A list of all registered meditation centers
- Statistics for each center, including:
  - Number of students
  - Number of attendance days
  - Student type distribution
  - Last activity date

## Troubleshooting Login Issues

If you're experiencing login issues:

1. Make sure the database server is running
2. Verify that the `super_admins` table exists in your database
3. Try running the manual setup script mentioned above
4. Check the server logs for any authentication errors

## Security Notes

- The Super Admin account has access to view data from all meditation centers
- Always use a strong password for this account
- Consider implementing additional security measures like IP restrictions or two-factor authentication for production environments 