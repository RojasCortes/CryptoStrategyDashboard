#!/bin/bash

# Script to apply simulation database migration
# This script applies the simulation schema to the database

echo "Applying simulation database migration..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "ERROR: DATABASE_URL environment variable is not set"
    echo "Please set DATABASE_URL in your .env file"
    exit 1
fi

# Apply the migration using psql
psql "$DATABASE_URL" < supabase-simulation-schema.sql

if [ $? -eq 0 ]; then
    echo "✅ Migration applied successfully!"
    echo ""
    echo "The following tables were created:"
    echo "  - simulation_sessions"
    echo "  - simulation_trades"
    echo "  - simulation_portfolio"
    echo "  - simulation_balance_history"
    echo ""
    echo "You can now use the simulation features in your application."
else
    echo "❌ Migration failed!"
    echo "Please check the error messages above and try again."
    exit 1
fi
