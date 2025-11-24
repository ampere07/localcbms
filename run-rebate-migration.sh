#!/bin/bash

# Navigate to backend directory
cd "$(dirname "$0")/backend"

echo "Checking if rebates_usage table exists..."

# Run migration
echo "Running migrations..."
php artisan migrate

echo "Migration complete!"

# Check table structure
echo "Checking rebates_usage table structure..."
php artisan tinker --execute="echo 'Columns: '; print_r(Schema::getColumnListing('rebates_usage'));"

echo "Done!"
