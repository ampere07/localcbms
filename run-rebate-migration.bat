@echo off
echo Running Rebate Usage Migration...
cd backend
php artisan migrate
echo.
echo Migration complete!
echo.
pause
