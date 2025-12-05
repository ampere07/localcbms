# Add Billing Generation Routes to api.php

## Location
File: `backend/routes/api.php`

## Routes to Add

Add these routes at the end of the file (before the final closing tag):

```php
// Billing Generation Routes
Route::prefix('billing-generation')->group(function () {
    // Sample data generation with notifications
    Route::post('/generate-sample', [\App\Http\Controllers\BillingGenerationController::class, 'generateSampleData']);
    
    // Force generate all accounts
    Route::post('/force-generate-all', [\App\Http\Controllers\BillingGenerationController::class, 'forceGenerateAll']);
    
    // Generate for specific billing day
    Route::post('/generate-for-day', [\App\Http\Controllers\BillingGenerationController::class, 'generateBillingsForDay']);
    
    // Generate today's billings
    Route::post('/generate-todays-billings', [\App\Http\Controllers\BillingGenerationController::class, 'generateTodaysBillings']);
    
    // Generate enhanced statements
    Route::post('/generate-statements', [\App\Http\Controllers\BillingGenerationController::class, 'generateEnhancedStatements']);
    
    // Generate enhanced invoices
    Route::post('/generate-invoices', [\App\Http\Controllers\BillingGenerationController::class, 'generateEnhancedInvoices']);
    
    // Get invoices
    Route::get('/invoices', [\App\Http\Controllers\BillingGenerationController::class, 'getInvoices']);
    
    // Get statements
    Route::get('/statements', [\App\Http\Controllers\BillingGenerationController::class, 'getStatements']);
});

// Test route to verify billing generation is working
Route::get('/billing-generation/test', function() {
    return response()->json([
        'success' => true,
        'message' => 'Billing generation routes are registered',
        'timestamp' => now()->toISOString(),
        'available_routes' => [
            'POST /billing-generation/generate-sample',
            'POST /billing-generation/force-generate-all',
            'POST /billing-generation/generate-for-day',
            'POST /billing-generation/generate-todays-billings',
            'POST /billing-generation/generate-statements',
            'POST /billing-generation/generate-invoices',
            'GET /billing-generation/invoices',
            'GET /billing-generation/statements'
        ]
    ]);
});
```

## Complete Code Block

Copy and paste this entire block at the end of your `api.php` file:

```php
use App\Http\Controllers\BillingGenerationController;

// Billing Generation Routes
Route::prefix('billing-generation')->group(function () {
    Route::post('/generate-sample', [BillingGenerationController::class, 'generateSampleData']);
    Route::post('/force-generate-all', [BillingGenerationController::class, 'forceGenerateAll']);
    Route::post('/generate-for-day', [BillingGenerationController::class, 'generateBillingsForDay']);
    Route::post('/generate-todays-billings', [BillingGenerationController::class, 'generateTodaysBillings']);
    Route::post('/generate-statements', [BillingGenerationController::class, 'generateEnhancedStatements']);
    Route::post('/generate-invoices', [BillingGenerationController::class, 'generateEnhancedInvoices']);
    Route::get('/invoices', [BillingGenerationController::class, 'getInvoices']);
    Route::get('/statements', [BillingGenerationController::class, 'getStatements']);
});

Route::get('/billing-generation/test', function() {
    \Illuminate\Support\Facades\Log::info('Billing generation test route accessed');
    return response()->json([
        'success' => true,
        'message' => 'Billing generation routes are registered',
        'timestamp' => now()->toISOString()
    ]);
});
```

## After Adding Routes

1. **Clear Laravel cache:**
```bash
cd backend
php artisan route:clear
php artisan config:clear
php artisan cache:clear
```

2. **Verify routes are registered:**
```bash
php artisan route:list | grep billing-generation
```

3. **Test the routes:**
```bash
# Test endpoint
curl http://localhost:8000/api/billing-generation/test

# Test sample generation (replace ACCT001 with valid account_no)
curl -X POST http://localhost:8000/api/billing-generation/generate-sample \
  -H "Content-Type: application/json" \
  -d '{"account_no":"ACCT001","send_notifications":true}'
```

## Troubleshooting

### If you get 404 error:

1. Make sure Laravel server is running:
```bash
cd backend
php artisan serve
```

2. Check if routes are loaded:
```bash
php artisan route:list
```

3. Clear all caches:
```bash
php artisan optimize:clear
```

### If you get connection refused:

1. Verify backend is running on port 8000
2. Check if firewall is blocking port 8000
3. Try accessing: `http://localhost:8000/api/cors-test`

## Log Locations

All logs will be written to:
- `backend/storage/logs/laravel.log`

Monitor logs in real-time:
```bash
tail -f backend/storage/logs/laravel.log
```

## Expected Log Output

When you call the endpoint, you should see logs like:

```
[2025-12-05 12:00:00] local.INFO: Generating sample data {"account_no":"ACCT001","customer_name":"John Doe","send_notifications":true}
[2025-12-05 12:00:01] local.INFO: SOA generated successfully {"account_no":"ACCT001","soa_id":12345}
[2025-12-05 12:00:02] local.INFO: SOA notification sent {"account_no":"ACCT001","email_queued":true,"sms_sent":true,"pdf_generated":true}
```
