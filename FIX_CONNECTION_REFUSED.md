# STEP-BY-STEP: Add Billing Generation Routes

## Problem
The error `net::ERR_CONNECTION_REFUSED` occurs because the billing generation routes are NOT registered in `api.php`.

## Solution
Add the missing routes to enable the generate sample data functionality.

## Steps

### Step 1: Check if Laravel backend is running
```bash
cd C:\Users\AMPERE\Documents\GitHub\localcbms\backend
php artisan serve
```

Expected output:
```
Laravel development server started: http://localhost:8000
```

### Step 2: Add these routes at the END of `backend/routes/api.php`

Open the file and scroll to the very bottom, then add:

```php
use App\Http\Controllers\BillingGenerationController;

// ===================================================================
// BILLING GENERATION ROUTES - Added for Sample Data Generation
// ===================================================================

Route::prefix('billing-generation')->group(function () {
    // Generate sample data with notifications for single account
    Route::post('/generate-sample', [BillingGenerationController::class, 'generateSampleData']);
    
    // Force generate all accounts (with optional notifications)
    Route::post('/force-generate-all', [BillingGenerationController::class, 'forceGenerateAll']);
    
    // Generate for specific billing day
    Route::post('/generate-for-day', [BillingGenerationController::class, 'generateBillingsForDay']);
    
    // Generate today's billings
    Route::post('/generate-today', [BillingGenerationController::class, 'generateTodaysBillings']);
    
    // Generate enhanced statements
    Route::post('/generate-statements', [BillingGenerationController::class, 'generateEnhancedStatements']);
    
    // Generate enhanced invoices
    Route::post('/generate-invoices', [BillingGenerationController::class, 'generateEnhancedInvoices']);
    
    // Get invoices
    Route::get('/invoices', [BillingGenerationController::class, 'getInvoices']);
    
    // Get statements
    Route::get('/statements', [BillingGenerationController::class, 'getStatements']);
});

// Test route to verify routes are working
Route::get('/billing-generation/test', function() {
    \Illuminate\Support\Facades\Log::info('Billing generation test route accessed');
    return response()->json([
        'success' => true,
        'message' => 'Billing generation routes are working!',
        'timestamp' => now()->toISOString(),
        'server_time' => now()->format('Y-m-d H:i:s')
    ]);
});
```

### Step 3: Clear Laravel caches
```bash
php artisan route:clear
php artisan config:clear
php artisan cache:clear
```

### Step 4: Verify routes are registered
```bash
php artisan route:list | findstr billing-generation
```

Expected output should show routes like:
```
POST   | api/billing-generation/generate-sample
POST   | api/billing-generation/force-generate-all
GET    | api/billing-generation/test
...
```

### Step 5: Test the routes

**Test 1: Check if route exists**
Open browser or use curl:
```bash
curl http://localhost:8000/api/billing-generation/test
```

Expected response:
```json
{
  "success": true,
  "message": "Billing generation routes are working!",
  "timestamp": "2025-12-05T12:00:00.000000Z",
  "server_time": "2025-12-05 12:00:00"
}
```

**Test 2: Try generate sample (replace ACCT001 with real account_no)**
```bash
curl -X POST http://localhost:8000/api/billing-generation/generate-sample \
  -H "Content-Type: application/json" \
  -d "{\"account_no\":\"ACCT001\",\"send_notifications\":false}"
```

### Step 6: Monitor logs

Open a new terminal and watch the logs:
```bash
cd C:\Users\AMPERE\Documents\GitHub\localcbms\backend
tail -f storage\logs\laravel.log
```

You should see logs like:
```
[2025-12-05 12:00:00] local.INFO: Generating sample data {"account_no":"ACCT001"...}
[2025-12-05 12:00:01] local.INFO: SOA generated successfully {"account_no":"ACCT001"...}
```

## Troubleshooting

### If you still get ERR_CONNECTION_REFUSED:

1. **Verify backend is running:**
   ```bash
   curl http://localhost:8000/api/cors-test
   ```
   
2. **Check if port 8000 is in use:**
   ```bash
   netstat -ano | findstr :8000
   ```

3. **Try different port:**
   ```bash
   php artisan serve --port=8001
   ```
   Then update frontend to use `http://localhost:8001`

### If you get 404 Not Found:

1. **Make sure you added `use` statement at top:**
   ```php
   use App\Http\Controllers\BillingGenerationController;
   ```

2. **Clear routes again:**
   ```bash
   php artisan route:clear
   php artisan optimize:clear
   ```

3. **Check if controller exists:**
   ```bash
   dir backend\app\Http\Controllers\BillingGenerationController.php
   ```

### If you get 500 Internal Server Error:

Check the logs:
```bash
tail -f backend\storage\logs\laravel.log
```

Common issues:
- Missing Google Drive credentials
- Invalid account_no
- Database connection issues

## Quick Test Script

Save this as `test-billing-generation.bat`:

```batch
@echo off
echo Testing Billing Generation Routes...
echo.

echo 1. Testing if backend is running...
curl -s http://localhost:8000/api/cors-test
echo.
echo.

echo 2. Testing billing generation routes...
curl -s http://localhost:8000/api/billing-generation/test
echo.
echo.

echo 3. Listing registered routes...
php artisan route:list | findstr billing-generation
echo.

pause
```

Run it:
```bash
cd C:\Users\AMPERE\Documents\GitHub\localcbms\backend
test-billing-generation.bat
```

## After Adding Routes Successfully

Your frontend call to:
```
POST http://localhost:8000/api/billing-generation/force-generate-all
```

Should now work without `ERR_CONNECTION_REFUSED`.

The logs in `storage/logs/laravel.log` will show detailed information about:
- Which accounts are being processed
- SOA and Invoice generation progress
- PDF upload to Google Drive
- Email and SMS notification status
- Any errors that occur

## Summary

The issue was simply that the routes were not registered. After adding the routes to `api.php` and clearing the cache, the endpoints will be accessible and you'll see comprehensive logging in `laravel.log`.
