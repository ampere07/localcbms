@echo off
echo Clearing Laravel caches...
cd /d C:\Users\melvi\Documents\GitHub\AmpereCloudBusinessManagementSystem\backend

echo.
echo [1/3] Clearing route cache...
php artisan route:clear

echo.
echo [2/3] Clearing config cache...
php artisan config:clear

echo.
echo [3/3] Clearing application cache...
php artisan cache:clear

echo.
echo All caches cleared successfully!
echo.
pause
