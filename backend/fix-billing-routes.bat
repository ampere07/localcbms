@echo off
echo ========================================
echo FIXING BILLING GENERATION ROUTES
echo ========================================
echo.

cd C:\Users\AMPERE\Documents\GitHub\localcbms\backend

echo Step 1: Stopping any running Laravel server...
taskkill /F /IM php.exe 2>nul
timeout /t 2 >nul

echo Step 2: Clearing Laravel caches...
php artisan route:clear
php artisan config:clear
php artisan cache:clear
php artisan optimize:clear

echo.
echo Step 3: Testing if routes work now...
echo Starting Laravel server in background...
start /B php artisan serve

timeout /t 3 >nul

echo.
echo Testing billing generation test endpoint...
curl -s http://localhost:8000/api/billing-generation/test

echo.
echo.
echo ========================================
echo NEXT STEPS:
echo ========================================
echo.
echo 1. Check if you see success message above
echo 2. If YES - routes are working!
echo 3. If NO - you need to manually edit api.php:
echo.
echo    a) Comment out LocationFixedEndpointsController lines
echo    b) Add: use App\Http\Controllers\BillingGenerationController;
echo    c) Add billing routes at end of file
echo.
echo See QUICK_FIX_BILLING_ROUTES.md for details
echo.
echo 4. Check logs: tail -f storage\logs\laravel.log
echo.
pause
