@echo off
echo Checking database tables...
cd backend

echo.
echo Running migration to add month column to rebates table...
php artisan migrate

echo.
echo Checking rebates table structure...
php artisan tinker --execute="dd(Schema::getColumnListing('rebates'));"

echo.
echo Done!
pause
