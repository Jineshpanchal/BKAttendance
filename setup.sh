#!/bin/bash

# Install server dependencies
echo "Installing server dependencies..."
npm install

# Install client dependencies
echo "Installing client dependencies..."
cd app/client
npm install
cd ../..

# Initialize the database
echo "Initializing database..."
npm run init-db

echo "Setup complete! Run 'npm run dev' to start the application." 