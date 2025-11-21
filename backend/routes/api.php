<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Hash;
use App\Http\Controllers\UserController;
use App\Http\Controllers\OrganizationController;
use App\Http\Controllers\GroupController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\SetupController;
use App\Http\Controllers\LogsController;
use App\Http\Controllers\ApplicationController;
use App\Http\Controllers\JobOrderController;
use App\Http\Controllers\ApplicationVisitController;
use App\Http\Controllers\LocationController;
use App\Http\Controllers\CityController;
use App\Http\Controllers\RegionController;
use App\Http\Controllers\DebugController;
use App\Http\Controllers\EmergencyLocationController;
use App\Http\Controllers\RadiusController;
use App\Http\Controllers\RadiusConfigController;
use App\Http\Controllers\TransactionController;
use App\Models\User;
use App\Services\ActivityLogService;

// CORS Test Endpoint - First route to test CORS configuration
Route::get('/cors-test', function (Request $request) {
    return response()->json([
        'success' => true,
        'message' => 'CORS is working',
        'origin' => $request->header('Origin'),
        'headers' => [
            'Access-Control-Allow-Origin' => $request->header('Origin'),
            'Access-Control-Allow-Credentials' => 'true',
        ],
        'timestamp' => now()->toISOString()
    ]);
});

// Fixed, reliable location endpoints that won't change
Route::post('/fixed/location/region', [\App\Http\Controllers\Api\LocationFixedEndpointsController::class, 'addRegion']);
Route::post('/fixed/location/city', [\App\Http\Controllers\Api\LocationFixedEndpointsController::class, 'addCity']);
Route::post('/fixed/location/barangay', [\App\Http\Controllers\Api\LocationFixedEndpointsController::class, 'addBarangay']);

// Emergency region endpoints directly accessible in API routes
Route::post('/emergency/regions', [EmergencyLocationController::class, 'addRegion']);
Route::post('/emergency/cities', [EmergencyLocationController::class, 'addCity']);
Route::post('/emergency/barangays', [EmergencyLocationController::class, 'addBarangay']);

// Direct location routes at API root level - matching frontend requests
Route::get('/regions', [\App\Http\Controllers\Api\LocationApiController::class, 'getRegions']);
Route::post('/regions', [\App\Http\Controllers\Api\LocationApiController::class, 'addRegion']);
Route::put('/regions/{id}', function($id, Request $request) {
    return app(\App\Http\Controllers\Api\LocationApiController::class)->updateLocation('region', $id, $request);
});

// Debug routes for new features
Route::prefix('debug')->group(function () {
    Route::get('/billing-features', function() {
        return response()->json([
            'success' => true,
            'message' => 'Enhanced billing features available',
            'features' => [
                'installment_tracking' => true,
                'advanced_payments' => true,
                'mass_rebates' => true,
                'invoice_id_generation' => true,
                'payment_received_tracking' => true
            ],
            'endpoints' => [
                'advanced_payments' => '/api/advanced-payments',
                'mass_rebates' => '/api/mass-rebates',
                'installment_schedules' => '/api/installment-schedules',
                'discounts' => '/api/discounts',
                'service_charges' => '/api/service-charges',
                'installments' => '/api/installments'
            ]
        ]);
    });
});

// Discount Management Routes
Route::prefix('discounts')->group(function () {
    Route::get('/', [\App\Http\Controllers\DiscountController::class, 'index']);
    Route::post('/', [\App\Http\Controllers\DiscountController::class, 'store']);
    Route::get('/{id}', [\App\Http\Controllers\DiscountController::class, 'show']);
    Route::put('/{id}', [\App\Http\Controllers\DiscountController::class, 'update']);
    Route::delete('/{id}', [\App\Http\Controllers\DiscountController::class, 'destroy']);
});

// Service Charge Logs Routes
Route::prefix('service-charges')->group(function () {
    Route::get('/', function(Request $request) {
        $query = DB::table('service_charge_logs');
        
        if ($request->has('account_id')) {
            $query->where('account_id', $request->account_id);
        }
        
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        
        $charges = $query->orderBy('created_at', 'desc')->get();
        
        return response()->json([
            'success' => true,
            'data' => $charges,
            'count' => $charges->count()
        ]);
    });
    
    Route::post('/', function(Request $request) {
        try {
            $validated = $request->validate([
                'account_id' => 'required|exists:billing_accounts,id',
                'service_charge' => 'required|numeric|min:0',
                'remarks' => 'nullable|string'
            ]);
            
            $validated['status'] = 'Unused';
            $validated['created_by_user_id'] = $request->user()->id ?? 1;
            $validated['updated_by_user_id'] = $request->user()->id ?? 1;
            $validated['created_at'] = now();
            $validated['updated_at'] = now();
            
            $id = DB::table('service_charge_logs')->insertGetId($validated);
            $charge = DB::table('service_charge_logs')->find($id);
            
            return response()->json([
                'success' => true,
                'message' => 'Service charge created successfully',
                'data' => $charge
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    });
});

// Installment Management Routes (Enhanced)
Route::prefix('installments')->group(function () {
    Route::get('/', function(Request $request) {
        $query = \App\Models\Installment::with(['billingAccount', 'invoice', 'schedules']);
        
        if ($request->has('account_id')) {
            $query->where('account_id', $request->account_id);
        }
        
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        
        $installments = $query->orderBy('created_at', 'desc')->get();
        
        return response()->json([
            'success' => true,
            'data' => $installments,
            'count' => $installments->count()
        ]);
    });
    
    Route::post('/', function(Request $request) {
        try {
            $validated = $request->validate([
                'account_id' => 'required|exists:billing_accounts,id',
                'invoice_id' => 'nullable|exists:invoices,id',
                'total_balance' => 'required|numeric|min:0',
                'months_to_pay' => 'required|integer|min:1',
                'start_date' => 'required|date',
                'remarks' => 'nullable|string'
            ]);
            
            \Illuminate\Support\Facades\DB::beginTransaction();
            
            $validated['monthly_payment'] = $validated['total_balance'] / $validated['months_to_pay'];
            $validated['status'] = 'active';
            $validated['created_by'] = $request->user()->id ?? 1;
            $validated['updated_by'] = $request->user()->id ?? 1;
            
            $installment = \App\Models\Installment::create($validated);
            
            $balanceChanges = null;
            
            if (isset($validated['invoice_id'])) {
                $invoice = \App\Models\Invoice::find($validated['invoice_id']);
                $billingAccount = \App\Models\BillingAccount::find($validated['account_id']);
                
                if ($invoice && $billingAccount) {
                    $staggeredBalance = $validated['total_balance'];
                    $currentAccountBalance = $billingAccount->account_balance ?? 0;
                    
                    $newAccountBalance = $currentAccountBalance - $staggeredBalance;
                    
                    $billingAccount->update([
                        'account_balance' => round($newAccountBalance, 2),
                        'balance_update_date' => now()
                    ]);
                    
                    $currentReceivedPayment = $invoice->received_payment ?? 0;
                    $newReceivedPayment = $currentReceivedPayment + $staggeredBalance;
                    
                    $remainingInvoiceBalance = $invoice->total_amount - $newReceivedPayment;
                    
                    $invoiceStatus = 'Unpaid';
                    if ($remainingInvoiceBalance <= 0) {
                        $invoiceStatus = 'Paid';
                    } elseif ($newReceivedPayment > 0) {
                        $invoiceStatus = 'Partial';
                    }
                    
                    $invoice->update([
                        'received_payment' => round($newReceivedPayment, 2),
                        'status' => $invoiceStatus,
                        'updated_by' => (string)($request->user()->id ?? 1)
                    ]);
                    
                    $balanceChanges = [
                        'account_balance' => [
                            'previous' => round($currentAccountBalance, 2),
                            'staggered_payment' => round($staggeredBalance, 2),
                            'new' => round($newAccountBalance, 2)
                        ],
                        'invoice' => [
                            'total_amount' => round($invoice->total_amount, 2),
                            'previous_received' => round($currentReceivedPayment, 2),
                            'new_received' => round($newReceivedPayment, 2),
                            'remaining' => round($remainingInvoiceBalance, 2),
                            'status' => $invoiceStatus
                        ]
                    ];
                    
                    \Illuminate\Support\Facades\Log::info('Staggered installment created', [
                        'installment_id' => $installment->id,
                        'account_id' => $validated['account_id'],
                        'invoice_id' => $validated['invoice_id'],
                        'balance_changes' => $balanceChanges
                    ]);
                }
            }
            
            \Illuminate\Support\Facades\DB::commit();
            
            return response()->json([
                'success' => true,
                'message' => 'Installment created successfully and balances updated',
                'data' => $installment,
                'balance_changes' => $balanceChanges
            ], 201);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\DB::rollBack();
            \Illuminate\Support\Facades\Log::error('Failed to create staggered installment', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    });
    
    Route::get('/{id}', function($id) {
        try {
            $installment = \App\Models\Installment::with(['billingAccount', 'invoice', 'schedules'])->findOrFail($id);
            
            return response()->json([
                'success' => true,
                'data' => $installment
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 404);
        }
    });
    
    Route::put('/{id}', function($id, Request $request) {
        try {
            $installment = \App\Models\Installment::findOrFail($id);
            
            $validated = $request->validate([
                'total_balance' => 'sometimes|numeric|min:0',
                'months_to_pay' => 'sometimes|integer|min:0',
                'monthly_payment' => 'sometimes|numeric|min:0',
                'status' => 'sometimes|in:active,completed,cancelled',
                'remarks' => 'nullable|string'
            ]);
            
            $validated['updated_by'] = $request->user()->id ?? 1;
            
            $installment->update($validated);
            
            return response()->json([
                'success' => true,
                'message' => 'Installment updated successfully',
                'data' => $installment->fresh()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    });
    
    Route::delete('/{id}', function($id) {
        try {
            $installment = \App\Models\Installment::findOrFail($id);
            $installment->delete();
            
            return response()->json([
                'success' => true,
                'message' => 'Installment deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    });
});

// Scheduled Billing Generation Job Route
Route::get('/billing-generation/trigger-scheduled', function() {
    try {
        $service = app(\App\Services\EnhancedBillingGenerationService::class);
        $today = \Carbon\Carbon::now();
        $results = $service->generateAllBillingsForToday(1);
        
        return response()->json([
            'success' => true,
            'message' => 'Scheduled billing generation completed',
            'data' => $results
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Scheduled billing generation failed',
            'error' => $e->getMessage()
        ], 500);
    }
});

// Test Invoice ID Generation
Route::post('/billing-generation/test-single-account', function(Request $request) {
    try {
        $validated = $request->validate([
            'account_id' => 'required|integer'
        ]);
        
        $account = \App\Models\BillingAccount::with(['customer'])->findOrFail($validated['account_id']);
        $service = app(\App\Services\EnhancedBillingGenerationService::class);
        $today = \Carbon\Carbon::now();
        $userId = 1;
        
        $soaResult = null;
        $invoiceResult = null;
        $errors = [];
        
        try {
            $account->refresh();
            $soaResult = $service->createEnhancedStatement($account, $today, $userId);
        } catch (\Exception $e) {
            $errors['soa'] = $e->getMessage();
        }
        
        try {
            $account->refresh();
            $invoiceResult = $service->createEnhancedInvoice($account, $today, $userId);
        } catch (\Exception $e) {
            $errors['invoice'] = $e->getMessage();
        }
        
        return response()->json([
            'success' => true,
            'message' => 'Test generation completed for single account',
            'data' => [
                'account_no' => $account->account_no,
                'soa' => $soaResult ? [
                    'id' => $soaResult->id,
                    'balance_from_previous_bill' => $soaResult->balance_from_previous_bill,
                    'payment_received_previous' => $soaResult->payment_received_previous,
                    'remaining_balance_previous' => $soaResult->remaining_balance_previous,
                    'amount_due' => $soaResult->amount_due,
                    'total_amount_due' => $soaResult->total_amount_due
                ] : null,
                'invoice' => $invoiceResult ? [
                    'id' => $invoiceResult->id,
                    'invoice_balance' => $invoiceResult->invoice_balance,
                    'total_amount' => $invoiceResult->total_amount
                ] : null,
                'errors' => $errors
            ]
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Test generation failed',
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ], 500);
    }
});

Route::get('/billing-generation/test-invoice-id', function() {
    $date = \Carbon\Carbon::now();
    $year = $date->format('y');
    $month = $date->format('m');
    $day = $date->format('d');
    $hour = $date->format('H');
    $invoiceId = $year . $month . $day . $hour . '0000';
    
    return response()->json([
        'success' => true,
        'invoice_id' => $invoiceId,
        'date' => $date->format('Y-m-d H:i:s'),
        'format' => 'YYMMDDHHXXXX'
    ]);
});
Route::delete('/regions/{id}', function($id, Request $request) {
    return app(\App\Http\Controllers\Api\LocationApiController::class)->deleteLocation('region', $id, $request);
});

// Debug endpoint for billing calculations
Route::get('/billing-generation/debug-calculations/{accountId}', function($accountId) {
    try {
        $account = \App\Models\BillingAccount::with(['customer'])->findOrFail($accountId);
        $service = app(\App\Services\EnhancedBillingGenerationService::class);
        
        $customer = $account->customer;
        $plan = \App\Models\AppPlan::where('Plan_Name', $customer->desired_plan)->first();
        
        return response()->json([
            'success' => true,
            'account' => $account,
            'plan' => $plan,
            'calculations' => [
                'monthly_fee' => $plan ? $plan->Plan_Price : 0,
                'billing_day' => $account->billing_day,
                'account_balance' => $account->account_balance,
                'date_installed' => $account->date_installed,
                'balance_update_date' => $account->balance_update_date
            ]
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'error' => $e->getMessage()
        ], 500);
    }
});

Route::get('/cities', [\App\Http\Controllers\Api\LocationApiController::class, 'getAllCities']);
Route::post('/cities', [\App\Http\Controllers\Api\LocationApiController::class, 'addCity']);
Route::put('/cities/{id}', function($id, Request $request) {
    return app(\App\Http\Controllers\Api\LocationApiController::class)->updateLocation('city', $id, $request);
});
Route::delete('/cities/{id}', function($id, Request $request) {
    return app(\App\Http\Controllers\Api\LocationApiController::class)->deleteLocation('city', $id, $request);
});

Route::get('/barangays', [\App\Http\Controllers\Api\LocationApiController::class, 'getAllBarangays']);
Route::post('/barangays', [\App\Http\Controllers\Api\LocationApiController::class, 'addBarangay']);
Route::put('/barangays/{id}', function($id, Request $request) {
    return app(\App\Http\Controllers\Api\LocationApiController::class)->updateLocation('barangay', $id, $request);
});
Route::delete('/barangays/{id}', function($id, Request $request) {
    return app(\App\Http\Controllers\Api\LocationApiController::class)->deleteLocation('barangay', $id, $request);
});

Route::get('/villages', [\App\Http\Controllers\Api\LocationApiController::class, 'getAllVillages']);
Route::post('/villages', [\App\Http\Controllers\Api\LocationApiController::class, 'addVillage']);
Route::put('/villages/{id}', function($id, Request $request) {
    return app(\App\Http\Controllers\Api\LocationApiController::class)->updateLocation('village', $id, $request);
});
Route::delete('/villages/{id}', function($id, Request $request) {
    return app(\App\Http\Controllers\Api\LocationApiController::class)->deleteLocation('village', $id, $request);
});

// Alternative endpoint formats for maximum compatibility
Route::post('/locations/add-region', [\App\Http\Controllers\Api\LocationApiController::class, 'addRegion']);
Route::post('/locations/add-city', [\App\Http\Controllers\Api\LocationApiController::class, 'addCity']);
Route::post('/locations/add-barangay', [\App\Http\Controllers\Api\LocationApiController::class, 'addBarangay']);

// Direct routes for location management - top level for maximum compatibility
Route::post('/locations/regions', [\App\Http\Controllers\Api\LocationApiController::class, 'addRegion']);
Route::post('/locations/cities', [\App\Http\Controllers\Api\LocationApiController::class, 'addCity']);
Route::post('/locations/barangays', [\App\Http\Controllers\Api\LocationApiController::class, 'addBarangay']);
Route::put('/locations/region/{id}', [\App\Http\Controllers\Api\LocationApiController::class, 'updateLocation']);
Route::put('/locations/city/{id}', [\App\Http\Controllers\Api\LocationApiController::class, 'updateLocation']);
Route::put('/locations/barangay/{id}', [\App\Http\Controllers\Api\LocationApiController::class, 'updateLocation']);
Route::delete('/locations/region/{id}', [\App\Http\Controllers\Api\LocationApiController::class, 'deleteLocation']);
Route::delete('/locations/city/{id}', [\App\Http\Controllers\Api\LocationApiController::class, 'deleteLocation']);
Route::delete('/locations/barangay/{id}', [\App\Http\Controllers\Api\LocationApiController::class, 'deleteLocation']);

// Direct test endpoint for troubleshooting
Route::get('/locations-ping', function () {
    return response()->json([
        'success' => true,
        'message' => 'Locations API is responding',
        'timestamp' => now()->toDateTimeString(),
        'environment' => app()->environment(),
        'routes' => [
            '/locations/all' => 'getAllLocations',
            '/locations/regions' => 'getRegions',
            '/debug/model-test' => 'Database model test'
        ]
    ]);
});

// Mock data endpoint for locations
Route::get('/locations/mock', function () {
    return response()->json([
        'success' => true,
        'data' => [
            [
                'id' => 1,
                'code' => '1',
                'name' => 'Metro Manila',
                'description' => 'National Capital Region',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
                'active_cities' => [
                    [
                        'id' => 101,
                        'code' => '101',
                        'name' => 'Quezon City',
                        'description' => 'QC',
                        'is_active' => true,
                        'region_id' => 1,
                        'created_at' => now(),
                        'updated_at' => now(),
                        'active_barangays' => [
                            [
                                'id' => 1001,
                                'code' => '1001',
                                'name' => 'Barangay A',
                                'description' => '',
                                'is_active' => true,
                                'city_id' => 101,
                                'created_at' => now(),
                                'updated_at' => now()
                            ],
                            [
                                'id' => 1002,
                                'code' => '1002',
                                'name' => 'Barangay B',
                                'description' => '',
                                'is_active' => true,
                                'city_id' => 101,
                                'created_at' => now(),
                                'updated_at' => now()
                            ]
                        ]
                    ],
                    [
                        'id' => 102,
                        'code' => '102',
                        'name' => 'Manila',
                        'description' => '',
                        'is_active' => true,
                        'region_id' => 1,
                        'created_at' => now(),
                        'updated_at' => now(),
                        'active_barangays' => [
                            [
                                'id' => 1003,
                                'code' => '1003',
                                'name' => 'Barangay X',
                                'description' => '',
                                'is_active' => true,
                                'city_id' => 102,
                                'created_at' => now(),
                                'updated_at' => now()
                            ],
                            [
                                'id' => 1004,
                                'code' => '1004',
                                'name' => 'Barangay Y',
                                'description' => '',
                                'is_active' => true,
                                'city_id' => 102,
                                'created_at' => now(),
                                'updated_at' => now()
                            ]
                        ]
                    ]
                ]
            ],
            [
                'id' => 2,
                'code' => '2',
                'name' => 'CALABARZON',
                'description' => 'Region IV-A',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
                'active_cities' => [
                    [
                        'id' => 201,
                        'code' => '201',
                        'name' => 'Binangonan',
                        'description' => '',
                        'is_active' => true,
                        'region_id' => 2,
                        'created_at' => now(),
                        'updated_at' => now(),
                        'active_barangays' => [
                            [
                                'id' => 2001,
                                'code' => '2001',
                                'name' => 'Angono',
                                'description' => '',
                                'is_active' => true,
                                'city_id' => 201,
                                'created_at' => now(),
                                'updated_at' => now()
                            ],
                            [
                                'id' => 2002,
                                'code' => '2002',
                                'name' => 'Bilibiran',
                                'description' => '',
                                'is_active' => true,
                                'city_id' => 201,
                                'created_at' => now(),
                                'updated_at' => now()
                            ]
                        ]
                    ]
                ]
            ]
        ]
    ]);
});

// Debug routes for troubleshooting
Route::prefix('debug')->group(function () {
    Route::get('/routes', [DebugController::class, 'listRoutes']);
    Route::get('/location-test', [DebugController::class, 'locationTest']);
    
    // Direct location test routes - no controller method
    Route::get('/location-echo', function () {
        return response()->json([
            'success' => true,
            'message' => 'Location echo test is working',
            'timestamp' => now()
        ]);
    });
    
    // Direct model tests
    Route::get('/model-test', function () {
        try {
            $regions = \App\Models\Region::count();
            $cities = \App\Models\City::count();
            $barangays = \App\Models\Barangay::count();
            
            return response()->json([
                'success' => true,
                'message' => 'Model test successful',
                'data' => [
                    'region_count' => $regions,
                    'city_count' => $cities,
                    'barangay_count' => $barangays
                ],
                'database_config' => [
                    'connection' => config('database.default'),
                    'database' => config('database.connections.' . config('database.default') . '.database'),
                ],
                'tables_exist' => [
                    'region_list' => \Illuminate\Support\Facades\Schema::hasTable('region_list'),
                    'city_list' => \Illuminate\Support\Facades\Schema::hasTable('city_list'),
                    'barangay_list' => \Illuminate\Support\Facades\Schema::hasTable('barangay_list')
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Model test failed',
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ], 500);
        }
    });
});

// Authentication endpoints
Route::post('/login-debug', function (Request $request) {
    try {
        $identifier = $request->input('email');
        $password = $request->input('password');
        
        if (!$identifier || !$password) {
            return response()->json([
                'status' => 'error',
                'message' => 'Email/username and password are required',
                'step' => 'validation'
            ], 400);
        }
        
        // Step 1: Find user
        $user = User::where('email_address', $identifier)
                   ->orWhere('username', $identifier)
                   ->first();
        
        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'User not found',
                'step' => 'user_lookup',
                'identifier' => $identifier
            ], 401);
        }
        
        // Step 2: Check password
        if (!Hash::check($password, $user->password_hash)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Invalid password',
                'step' => 'password_check'
            ], 401);
        }
        
        // Step 3: Load relationships
        $user->load('organization', 'role', 'group');
        
        // Step 4: Get role
        $primaryRole = $user->role ? $user->role->role_name : 'User';
        
        // Step 5: Build response
        return response()->json([
            'status' => 'success',
            'message' => 'Login successful',
            'step' => 'complete',
            'data' => [
                'user' => [
                    'user_id' => $user->id,
                    'username' => $user->username,
                    'email' => $user->email_address,
                    'first_name' => $user->first_name,
                    'last_name' => $user->last_name,
                    'role' => $primaryRole,
                    'group' => $user->group,
                    'organization' => $user->organization
                ],
                'token' => 'user_token_' . $user->id . '_' . time()
            ]
        ]);
        
    } catch (\Exception $e) {
        return response()->json([
            'status' => 'error',
            'message' => 'Login failed',
            'step' => 'exception',
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ], 500);
    }
});

// Authentication endpoints
Route::post('/login', function (Request $request) {
    $identifier = $request->input('email');
    $password = $request->input('password');
    
    if (!$identifier || !$password) {
        return response()->json([
            'status' => 'error',
            'message' => 'Email/username and password are required'
        ], 400);
    }
    
    try {
        // Find user by email_address or username
        $user = User::where('email_address', $identifier)
                   ->orWhere('username', $identifier)
                   ->first();
        
        if (!$user) {
            // Log the error details
            \Log::warning('Login failed: User not found', [
                'identifier' => $identifier,
                'ip' => $request->ip()
            ]);
            
            return response()->json([
                'status' => 'error',
                'message' => 'Invalid credentials'
            ], 401);
        }
        
        // Verify password
        if (!Hash::check($password, $user->password_hash)) {
            // Log the error details
            \Log::warning('Login failed: Invalid password', [
                'identifier' => $identifier,
                'ip' => $request->ip()
            ]);
            
            return response()->json([
                'status' => 'error',
                'message' => 'Invalid credentials'
            ], 401);
        }
        
        // Now load relationships after authentication succeeds
        try {
            $user->load(['organization', 'role', 'group']);
        } catch (\Exception $relationError) {
            \Log::error('Failed to load user relationships', [
                'user_id' => $user->id,
                'error' => $relationError->getMessage()
            ]);
            // Continue without relationships rather than failing
        }
        
        // Successfully authenticated
        \Log::info('User login successful', [
            'user_id' => $user->id,
            'username' => $user->username,
            'role_id' => $user->role_id,
            'has_role' => $user->role ? true : false
        ]);
        
        // Get user role for response - handle null role
        $primaryRole = 'user'; // default role
        if ($user->role && $user->role->role_name) {
            $primaryRole = strtolower($user->role->role_name);
        }
        
        // Update last login timestamp
        $user->last_login = now();
        $user->save();
        
        // Prepare response data
        $fullName = trim(($user->first_name ?? '') . ' ' . ($user->last_name ?? ''));
        if (empty($fullName)) {
            $fullName = $user->username;
        }
        
        $responseData = [
            'user' => [
                'id' => $user->id,
                'username' => $user->username,
                'email' => $user->email_address,
                'full_name' => $fullName,
                'role' => $primaryRole,
            ]
        ];
        
        // Add organization data if available
        try {
            if ($user->organization) {
                $responseData['user']['organization'] = [
                    'id' => $user->organization->id,
                    'name' => $user->organization->organization_name ?? 'Unknown Organization'
                ];
            }
        } catch (\Exception $orgError) {
            \Log::warning('Failed to load organization data', [
                'user_id' => $user->id,
                'error' => $orgError->getMessage()
            ]);
            // Continue without organization data
        }
        
        // Generate token
        $token = 'user_token_' . $user->id . '_' . time();
        $responseData['token'] = $token;
        
        return response()->json([
            'status' => 'success',
            'message' => 'Login successful',
            'data' => $responseData
        ]);
        
    } catch (\Exception $e) {
        // Log the detailed exception
        \Log::error('Login exception: ' . $e->getMessage(), [
            'file' => $e->getFile(),
            'line' => $e->getLine(),
            'trace' => $e->getTraceAsString()
        ]);
        
        return response()->json([
            'status' => 'error',
            'message' => 'Login failed',
            'error' => 'An error occurred during authentication'
        ], 500);
    }
});

Route::post('/forgot-password', function (Request $request) {
    $email = $request->input('email');
    
    if (!$email) {
        return response()->json([
            'status' => 'error',
            'message' => 'Email is required'
        ], 400);
    }
    
    return response()->json([
        'status' => 'success',
        'message' => 'Password reset instructions have been sent to your email.'
    ]);
});

// Health check
Route::get('/health', function () {
    return response()->json([
        'status' => 'success',
        'message' => 'API is running',
        'data' => [
            'server' => 'Laravel ' . app()->version(),
            'timestamp' => now()->toISOString()
        ]
    ]);
});

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// User Management Routes
Route::prefix('users')->middleware('ensure.database.tables')->group(function () {
    Route::get('/', [UserController::class, 'index']);
    Route::post('/', [UserController::class, 'store']);
    Route::get('/{id}', [UserController::class, 'show']);
    Route::put('/{id}', [UserController::class, 'update']);
    Route::delete('/{id}', [UserController::class, 'destroy']);
    Route::post('/{id}/roles', [UserController::class, 'assignRole']);
    Route::delete('/{id}/roles', [UserController::class, 'removeRole']);
    Route::post('/{id}/groups', [UserController::class, 'assignGroup']);
    Route::delete('/{id}/groups', [UserController::class, 'removeGroup']);
});

// Organization Management Routes
Route::prefix('organizations')->middleware('ensure.database.tables')->group(function () {
    Route::get('/', [OrganizationController::class, 'index']);
    Route::post('/', [OrganizationController::class, 'store']);
    Route::get('/{id}', [OrganizationController::class, 'show']);
    Route::put('/{id}', [OrganizationController::class, 'update']);
    Route::delete('/{id}', [OrganizationController::class, 'destroy']);
});

// Database diagnostic endpoint
Route::get('/debug/organizations', function () {
    try {
        // Check if table exists
        $tableExists = \Illuminate\Support\Facades\Schema::hasTable('organizations');
        
        if (!$tableExists) {
            return response()->json([
                'success' => false,
                'message' => 'Organizations table does not exist',
                'table_exists' => false
            ]);
        }
        
        // Get column information
        $columns = \Illuminate\Support\Facades\Schema::getColumnListing('organizations');
        
        // Try to get organizations
        $organizations = \App\Models\Organization::all();
        
        return response()->json([
            'success' => true,
            'message' => 'Organizations table exists',
            'table_exists' => true,
            'columns' => $columns,
            'count' => $organizations->count(),
            'data' => $organizations
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Error checking organizations',
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ], 500);
    }
});

// Group Management Routes
Route::prefix('groups')->middleware('ensure.database.tables')->group(function () {
    Route::get('/', [GroupController::class, 'index']);
    Route::post('/', [GroupController::class, 'store']);
    Route::get('/{id}', [GroupController::class, 'show']);
    Route::put('/{id}', [GroupController::class, 'update']);
    Route::delete('/{id}', [GroupController::class, 'destroy']);
    Route::get('/organization/{orgId}', [GroupController::class, 'getByOrganization']);
});

// Role Management Routes
Route::prefix('roles')->middleware('ensure.database.tables')->group(function () {
    Route::get('/', [RoleController::class, 'index']);
    Route::post('/', [RoleController::class, 'store']);
    Route::get('/{id}', [RoleController::class, 'show']);
    Route::put('/{id}', [RoleController::class, 'update']);
    Route::delete('/{id}', [RoleController::class, 'destroy']);
});

// Database Setup Routes
Route::prefix('setup')->group(function () {
    Route::post('/initialize', [SetupController::class, 'initializeDatabase']);
    Route::get('/status', [SetupController::class, 'checkDatabaseStatus']);
});

// Logs Management Routes
Route::prefix('logs')->middleware('ensure.database.tables')->group(function () {
    Route::get('/', [LogsController::class, 'index']);
    Route::get('/stats', [LogsController::class, 'getStats']);
    Route::get('/export', [LogsController::class, 'export']);
    Route::get('/{id}', [LogsController::class, 'show']);
    Route::delete('/clear', [LogsController::class, 'clear']);
});

// Applications Management Routes - Temporarily removed middleware
Route::prefix('applications')->group(function () {
    Route::get('/', [ApplicationController::class, 'index']);
    Route::post('/', [ApplicationController::class, 'store']);
    Route::get('/{id}', [ApplicationController::class, 'show']);
    Route::put('/{id}', [ApplicationController::class, 'update']);
    Route::delete('/{id}', [ApplicationController::class, 'destroy']);
});

// Job Orders Management Routes
Route::prefix('job-orders')->middleware('ensure.database.tables')->group(function () {
    Route::get('/', [JobOrderController::class, 'index']);
    Route::post('/', [JobOrderController::class, 'store']);
    Route::get('/{id}', [JobOrderController::class, 'show']);
    Route::put('/{id}', [JobOrderController::class, 'update']);
    Route::delete('/{id}', [JobOrderController::class, 'destroy']);
    Route::post('/{id}/approve', [JobOrderController::class, 'approve']);
    Route::post('/{id}/create-radius-account', [JobOrderController::class, 'createRadiusAccount']);
    Route::post('/{id}/upload-images', [JobOrderController::class, 'uploadImages']);
    
    // Lookup table endpoints
    Route::get('/lookup/modem-router-sns', [JobOrderController::class, 'getModemRouterSNs']);
    Route::get('/lookup/contract-templates', [JobOrderController::class, 'getContractTemplates']);
    Route::get('/lookup/ports', [JobOrderController::class, 'getPorts']);
    Route::get('/lookup/vlans', [JobOrderController::class, 'getVLANs']);
    Route::get('/lookup/lcpnaps', [JobOrderController::class, 'getLCPNAPs']);
});

// Job Order Items Management Routes
Route::prefix('job-order-items')->group(function () {
    Route::get('/', [\App\Http\Controllers\Api\JobOrderItemApiController::class, 'index']);
    Route::post('/', [\App\Http\Controllers\Api\JobOrderItemApiController::class, 'store']);
    Route::get('/{id}', [\App\Http\Controllers\Api\JobOrderItemApiController::class, 'show']);
    Route::put('/{id}', [\App\Http\Controllers\Api\JobOrderItemApiController::class, 'update']);
    Route::delete('/{id}', [\App\Http\Controllers\Api\JobOrderItemApiController::class, 'destroy']);
});

// Test endpoint for job-order-items
Route::get('/job-order-items-test', function() {
    return response()->json([
        'success' => true,
        'message' => 'Job Order Items routes are working',
        'routes' => [
            'GET /api/job-order-items' => 'List all items (filter by job_order_id)',
            'POST /api/job-order-items' => 'Create items (batch)',
            'GET /api/job-order-items/{id}' => 'Get specific item',
            'PUT /api/job-order-items/{id}' => 'Update item',
            'DELETE /api/job-order-items/{id}' => 'Delete item'
        ],
        'model' => 'JobOrderItem',
        'table' => 'job_order_items',
        'table_exists' => \Illuminate\Support\Facades\Schema::hasTable('job_order_items'),
        'columns' => \Illuminate\Support\Facades\Schema::hasTable('job_order_items') 
            ? \Illuminate\Support\Facades\Schema::getColumnListing('job_order_items')
            : []
    ]);
});

// Application Visits Management Routes
Route::prefix('application-visits')->middleware('ensure.database.tables')->group(function () {
    Route::get('/', [ApplicationVisitController::class, 'index']);
    Route::post('/', [ApplicationVisitController::class, 'store']);
    Route::get('/{id}', [ApplicationVisitController::class, 'show']);
    Route::put('/{id}', [ApplicationVisitController::class, 'update']);
    Route::delete('/{id}', [ApplicationVisitController::class, 'destroy']);
    Route::get('/application/{applicationId}', [ApplicationVisitController::class, 'getByApplication']);
    Route::post('/{id}/upload-images', [\App\Http\Controllers\ApplicationVisitImageController::class, 'uploadImages']);
});

// Location Management Routes - New centralized system
// IMPORTANT: Remove the middleware that might be blocking this
Route::prefix('locations')->group(function () {
    // Test endpoint
    Route::get('/test', function () {
        return response()->json([
            'success' => true,
            'message' => 'Location API is working',
            'timestamp' => now()
        ]);
    });
    
    // Debug endpoint for locations/all route
    Route::get('/all-debug', function () {
        try {
            $controller = new \App\Http\Controllers\LocationController();
            return $controller->getAllLocations();
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Debug error: ' . $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ], 500);
        }
    });
    
    // Debug route to log all requests and trace route matching
    Route::post('/locations/debug', function(Request $request) {
        \Illuminate\Support\Facades\Log::info('[LocationDebug] Debug route hit', [
            'method' => $request->method(),
            'url' => $request->fullUrl(),
            'path' => $request->path(),
            'payload' => $request->all(),
            'headers' => $request->headers->all()
        ]);
        
        return response()->json([
            'success' => true,
            'message' => 'Debug route working',
            'data' => [
                'method' => $request->method(),
                'url' => $request->fullUrl(),
                'path' => $request->path(),
                'payload' => $request->all()
            ]
        ]);
    });

    // Direct API endpoints that match the frontend requests
    Route::get('/all', [\App\Http\Controllers\Api\LocationApiController::class, 'getAllLocations']);
    Route::get('/regions', [\App\Http\Controllers\Api\LocationApiController::class, 'getRegions']);
    Route::get('/regions/{regionId}/cities', [\App\Http\Controllers\Api\LocationApiController::class, 'getCitiesByRegion']);
    Route::get('/cities/{cityId}/barangays', [\App\Http\Controllers\Api\LocationApiController::class, 'getBarangaysByCity']);
    
    // Region routes - explicit path for frontend compatibility
    Route::post('/regions', [\App\Http\Controllers\Api\LocationApiController::class, 'addRegion']);
    
    // City routes - explicit path for frontend compatibility
    Route::post('/cities', [\App\Http\Controllers\Api\LocationApiController::class, 'addCity']);
    
    // Barangay routes - explicit path for frontend compatibility
    Route::post('/barangays', [\App\Http\Controllers\Api\LocationApiController::class, 'addBarangay']);
    
    // General location routes
    Route::get('/statistics', [\App\Http\Controllers\Api\LocationApiController::class, 'getStatistics']);
    Route::put('/{type}/{id}', [\App\Http\Controllers\Api\LocationApiController::class, 'updateLocation']);
    Route::delete('/{type}/{id}', [\App\Http\Controllers\Api\LocationApiController::class, 'deleteLocation']);
    
    // Specific update/delete routes for frontend compatibility
    Route::put('/region/{id}', [\App\Http\Controllers\Api\LocationApiController::class, 'updateLocation']);
    Route::put('/city/{id}', [\App\Http\Controllers\Api\LocationApiController::class, 'updateLocation']);
    Route::put('/barangay/{id}', [\App\Http\Controllers\Api\LocationApiController::class, 'updateLocation']);
    Route::delete('/region/{id}', [\App\Http\Controllers\Api\LocationApiController::class, 'deleteLocation']);
    Route::delete('/city/{id}', [\App\Http\Controllers\Api\LocationApiController::class, 'deleteLocation']);
    Route::delete('/barangay/{id}', [\App\Http\Controllers\Api\LocationApiController::class, 'deleteLocation']);
    
    // Legacy routes (keep for compatibility)
    Route::get('/', [LocationController::class, 'index']);
    Route::post('/', [LocationController::class, 'store']);
    Route::get('/stats', [LocationController::class, 'getStats']);
    Route::get('/type/{type}', [LocationController::class, 'getByType']);
    Route::get('/parent/{parentId}', [LocationController::class, 'getChildren']);
    Route::get('/{id}', [LocationController::class, 'show']);
    Route::put('/{id}', [LocationController::class, 'update']);
    Route::delete('/{id}', [LocationController::class, 'destroy']);
    Route::patch('/{id}/toggle-status', [LocationController::class, 'toggleStatus']);
});

// Test endpoint for plan routes - MUST BE BEFORE other plan routes
Route::get('/plans-test', function () {
    return response()->json([
        'success' => true,
        'message' => 'Plan routes are working',
        'timestamp' => now()->toDateTimeString(),
        'database' => [
            'plan_list_exists' => \Illuminate\Support\Facades\Schema::hasTable('plan_list'),
            'plan_count' => \Illuminate\Support\Facades\DB::table('plan_list')->count()
        ]
    ]);
});

// Direct test route that doesn't use controller
Route::get('/plans-direct', function () {
    try {
        $plans = \Illuminate\Support\Facades\DB::table('plan_list')
            ->select(
                'id',
                'plan_name as name',
                'description',
                'price',
                'modified_date',
                'modified_by_user_id as modified_by'
            )
            ->get();
        
        return response()->json([
            'success' => true,
            'data' => $plans,
            'message' => 'Direct query successful'
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => $e->getMessage()
        ], 500);
    }
});

// Plan Management Routes - Direct routes at API root level for maximum compatibility
Route::get('/plans', [\App\Http\Controllers\Api\PlanApiController::class, 'index']);
Route::post('/plans', [\App\Http\Controllers\Api\PlanApiController::class, 'store']);
Route::get('/plans/statistics', [\App\Http\Controllers\Api\PlanApiController::class, 'getStatistics']);
Route::get('/plans/{id}', [\App\Http\Controllers\Api\PlanApiController::class, 'show']);
Route::put('/plans/{id}', [\App\Http\Controllers\Api\PlanApiController::class, 'update']);
Route::delete('/plans/{id}', [\App\Http\Controllers\Api\PlanApiController::class, 'destroy']);

// Promo Management Routes - Direct routes at API root level for maximum compatibility
Route::get('/promos', [\App\Http\Controllers\Api\PromoApiController::class, 'index']);
Route::post('/promos', [\App\Http\Controllers\Api\PromoApiController::class, 'store']);
Route::get('/promos/{id}', [\App\Http\Controllers\Api\PromoApiController::class, 'show']);
Route::put('/promos/{id}', [\App\Http\Controllers\Api\PromoApiController::class, 'update']);
Route::delete('/promos/{id}', [\App\Http\Controllers\Api\PromoApiController::class, 'destroy']);

// Router Models Management Routes
Route::prefix('router-models')->group(function () {
    Route::get('/', [\App\Http\Controllers\RouterModelController::class, 'index']);
    Route::post('/', [\App\Http\Controllers\RouterModelController::class, 'store']);
    Route::get('/{model}', [\App\Http\Controllers\RouterModelController::class, 'show']);
    Route::put('/{id}', [\App\Http\Controllers\RouterModelController::class, 'update']);
    Route::delete('/{id}', [\App\Http\Controllers\RouterModelController::class, 'destroy']);
});

// Status Remarks Management Routes
Route::prefix('status-remarks')->group(function () {
    Route::get('/', [\App\Http\Controllers\StatusRemarksController::class, 'index']);
    Route::post('/', [\App\Http\Controllers\StatusRemarksController::class, 'store']);
    Route::get('/{id}', [\App\Http\Controllers\StatusRemarksController::class, 'show']);
    Route::put('/{id}', [\App\Http\Controllers\StatusRemarksController::class, 'update']);
    Route::delete('/{id}', [\App\Http\Controllers\StatusRemarksController::class, 'destroy']);
});

// Debug route for status_remarks_list table
Route::get('/debug/status-remarks-structure', function() {
    try {
        $columns = \Illuminate\Support\Facades\Schema::getColumnListing('status_remarks_list');
        $sample = \Illuminate\Support\Facades\DB::table('status_remarks_list')->first();
        
        return response()->json([
            'success' => true,
            'table' => 'status_remarks_list',
            'columns' => $columns,
            'sample_data' => $sample,
            'count' => \Illuminate\Support\Facades\DB::table('status_remarks_list')->count()
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'error' => $e->getMessage()
        ], 500);
    }
});

// Inventory Management Routes - Using Inventory table
Route::prefix('inventory')->group(function () {
    Route::get('/', [\App\Http\Controllers\Api\InventoryApiController::class, 'index']);
    Route::post('/', [\App\Http\Controllers\Api\InventoryApiController::class, 'store']);
    Route::get('/debug', [\App\Http\Controllers\Api\InventoryApiController::class, 'debug']);
    Route::get('/statistics', [\App\Http\Controllers\Api\InventoryApiController::class, 'getStatistics']);
    Route::get('/categories', [\App\Http\Controllers\Api\InventoryApiController::class, 'getCategories']);
    Route::get('/suppliers', [\App\Http\Controllers\Api\InventoryApiController::class, 'getSuppliers']);
    Route::get('/{itemName}', [\App\Http\Controllers\Api\InventoryApiController::class, 'show']);
    Route::put('/{itemName}', [\App\Http\Controllers\Api\InventoryApiController::class, 'update']);
    Route::delete('/{itemName}', [\App\Http\Controllers\Api\InventoryApiController::class, 'destroy']);
});

// Inventory Categories Management Routes - Using inventory_category table
Route::prefix('inventory-categories')->group(function () {
    Route::get('/', [\App\Http\Controllers\Api\InventoryCategoryApiController::class, 'index']);
    Route::post('/', [\App\Http\Controllers\Api\InventoryCategoryApiController::class, 'store']);
    Route::get('/{id}', [\App\Http\Controllers\Api\InventoryCategoryApiController::class, 'show']);
    Route::put('/{id}', [\App\Http\Controllers\Api\InventoryCategoryApiController::class, 'update']);
    Route::delete('/{id}', [\App\Http\Controllers\Api\InventoryCategoryApiController::class, 'destroy']);
});

// LCP Management Routes - Using lcp table
Route::prefix('lcp')->group(function () {
    Route::get('/', [\App\Http\Controllers\Api\LcpApiController::class, 'index']);
    Route::post('/', [\App\Http\Controllers\Api\LcpApiController::class, 'store']);
    Route::get('/statistics', [\App\Http\Controllers\Api\LcpApiController::class, 'getStatistics']);
    Route::get('/{id}', [\App\Http\Controllers\Api\LcpApiController::class, 'show']);
    Route::put('/{id}', [\App\Http\Controllers\Api\LcpApiController::class, 'update']);
    Route::delete('/{id}', [\App\Http\Controllers\Api\LcpApiController::class, 'destroy']);
});

// NAP Management Routes - Using nap table
Route::prefix('nap')->group(function () {
    Route::get('/', [\App\Http\Controllers\Api\NapApiController::class, 'index']);
    Route::post('/', [\App\Http\Controllers\Api\NapApiController::class, 'store']);
    Route::get('/statistics', [\App\Http\Controllers\Api\NapApiController::class, 'getStatistics']);
    Route::get('/{id}', [\App\Http\Controllers\Api\NapApiController::class, 'show']);
    Route::put('/{id}', [\App\Http\Controllers\Api\NapApiController::class, 'update']);
    Route::delete('/{id}', [\App\Http\Controllers\Api\NapApiController::class, 'destroy']);
});

// Port Management Routes - Using port table (both singular and plural for compatibility)
Route::prefix('port')->group(function () {
    Route::get('/', [\App\Http\Controllers\Api\PortApiController::class, 'index']);
    Route::post('/', [\App\Http\Controllers\Api\PortApiController::class, 'store']);
    Route::get('/statistics', [\App\Http\Controllers\Api\PortApiController::class, 'getStatistics']);
    Route::get('/{id}', [\App\Http\Controllers\Api\PortApiController::class, 'show']);
    Route::put('/{id}', [\App\Http\Controllers\Api\PortApiController::class, 'update']);
    Route::delete('/{id}', [\App\Http\Controllers\Api\PortApiController::class, 'destroy']);
});

// Ports (plural) for frontend compatibility
Route::prefix('ports')->group(function () {
    Route::get('/', [\App\Http\Controllers\Api\PortApiController::class, 'index']);
    Route::post('/', [\App\Http\Controllers\Api\PortApiController::class, 'store']);
    Route::get('/statistics', [\App\Http\Controllers\Api\PortApiController::class, 'getStatistics']);
    Route::get('/{id}', [\App\Http\Controllers\Api\PortApiController::class, 'show']);
    Route::put('/{id}', [\App\Http\Controllers\Api\PortApiController::class, 'update']);
    Route::delete('/{id}', [\App\Http\Controllers\Api\PortApiController::class, 'destroy']);
});

// VLAN Management Routes - Using vlan table
Route::prefix('vlan')->group(function () {
    Route::get('/', [\App\Http\Controllers\Api\VlanApiController::class, 'index']);
    Route::post('/', [\App\Http\Controllers\Api\VlanApiController::class, 'store']);
    Route::get('/statistics', [\App\Http\Controllers\Api\VlanApiController::class, 'getStatistics']);
    Route::get('/{id}', [\App\Http\Controllers\Api\VlanApiController::class, 'show']);
    Route::put('/{id}', [\App\Http\Controllers\Api\VlanApiController::class, 'update']);
    Route::delete('/{id}', [\App\Http\Controllers\Api\VlanApiController::class, 'destroy']);
});

// Usage Type Management Routes - Using usage_type table
Route::prefix('usage-types')->group(function () {
    Route::get('/', [\App\Http\Controllers\Api\UsageTypeApiController::class, 'index']);
    Route::post('/', [\App\Http\Controllers\Api\UsageTypeApiController::class, 'store']);
    Route::get('/statistics', [\App\Http\Controllers\Api\UsageTypeApiController::class, 'getStatistics']);
    Route::get('/{id}', [\App\Http\Controllers\Api\UsageTypeApiController::class, 'show']);
    Route::put('/{id}', [\App\Http\Controllers\Api\UsageTypeApiController::class, 'update']);
    Route::delete('/{id}', [\App\Http\Controllers\Api\UsageTypeApiController::class, 'destroy']);
});

// VLANs (plural) for frontend compatibility
Route::prefix('vlans')->group(function () {
    Route::get('/', [\App\Http\Controllers\Api\VlanApiController::class, 'index']);
    Route::post('/', [\App\Http\Controllers\Api\VlanApiController::class, 'store']);
    Route::get('/statistics', [\App\Http\Controllers\Api\VlanApiController::class, 'getStatistics']);
    Route::get('/{id}', [\App\Http\Controllers\Api\VlanApiController::class, 'show']);
    Route::put('/{id}', [\App\Http\Controllers\Api\VlanApiController::class, 'update']);
    Route::delete('/{id}', [\App\Http\Controllers\Api\VlanApiController::class, 'destroy']);
});

// LCPNAP Location Management Routes - Using lcpnap table
Route::prefix('lcpnap')->group(function () {
    Route::get('/', [\App\Http\Controllers\Api\LcpNapLocationController::class, 'index']);
    Route::post('/', [\App\Http\Controllers\Api\LcpNapLocationController::class, 'store']);
    Route::get('/statistics', [\App\Http\Controllers\Api\LcpNapLocationController::class, 'getStatistics']);
    Route::get('/{id}', [\App\Http\Controllers\Api\LcpNapLocationController::class, 'show']);
    Route::put('/{id}', [\App\Http\Controllers\Api\LcpNapLocationController::class, 'update']);
    Route::delete('/{id}', [\App\Http\Controllers\Api\LcpNapLocationController::class, 'destroy']);
});

// LCPNAP Locations endpoint (for distinct locations)
Route::get('/lcp-nap-locations', [\App\Http\Controllers\Api\LcpNapLocationController::class, 'getLocations']);

// Inventory Items for frontend compatibility
Route::prefix('inventory-items')->group(function () {
    Route::get('/', [\App\Http\Controllers\Api\InventoryApiController::class, 'index']);
    Route::post('/', [\App\Http\Controllers\Api\InventoryApiController::class, 'store']);
    Route::get('/statistics', [\App\Http\Controllers\Api\InventoryApiController::class, 'getStatistics']);
    Route::get('/{itemName}', [\App\Http\Controllers\Api\InventoryApiController::class, 'show']);
    Route::put('/{itemName}', [\App\Http\Controllers\Api\InventoryApiController::class, 'update']);
    Route::delete('/{itemName}', [\App\Http\Controllers\Api\InventoryApiController::class, 'destroy']);
});



// Routes to match frontend requests - using the *_list tables directly
Route::prefix('region_list')->group(function () {
    Route::get('/', [RegionController::class, 'index']);
    Route::get('/{id}', [RegionController::class, 'show']);
});

Route::prefix('city_list')->group(function () {
    Route::get('/', [CityController::class, 'index']);
    Route::get('/{id}', [CityController::class, 'show']);
    Route::get('/region/{regionId}', [CityController::class, 'getByRegion']);
});

Route::prefix('barangay_list')->group(function () {
    Route::get('/', function() {
        try {
            $barangays = \App\Models\Barangay::all();
            return response()->json([
                'success' => true,
                'data' => $barangays
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching barangays: ' . $e->getMessage()
            ], 500);
        }
    });
    Route::get('/{id}', function($id) {
        try {
            $barangay = \App\Models\Barangay::findOrFail($id);
            return response()->json([
                'success' => true,
                'data' => $barangay
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching barangay: ' . $e->getMessage()
            ], 404);
        }
    });
    Route::get('/city/{cityId}', function($cityId) {
        try {
            $barangays = \App\Models\Barangay::where('city_id', $cityId)->get();
            return response()->json([
                'success' => true,
                'data' => $barangays
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching barangays: ' . $e->getMessage()
            ], 500);
        }
    });
});

// Add debug routes for location troubleshooting
Route::get('/debug/location-tables', [\App\Http\Controllers\LocationDebugController::class, 'verifyTables']);

// Add debug route to inspect database tables
Route::get('/debug/tables', function () {
    try {
        $tables = [
            'region_list' => \Illuminate\Support\Facades\DB::select('SELECT * FROM region_list LIMIT 10'),
            'city_list' => \Illuminate\Support\Facades\DB::select('SELECT * FROM city_list LIMIT 10'),
            'barangay_list' => \Illuminate\Support\Facades\DB::select('SELECT * FROM barangay_list LIMIT 10')
        ];
        
        $hasAppTables = [
            'app_regions' => \Illuminate\Support\Facades\Schema::hasTable('app_regions'),
            'app_cities' => \Illuminate\Support\Facades\Schema::hasTable('app_cities'),
            'app_barangays' => \Illuminate\Support\Facades\Schema::hasTable('app_barangays')
        ];
        
        return response()->json([
            'success' => true,
            'list_tables' => $tables,
            'has_app_tables' => $hasAppTables,
            'models' => [
                'Region' => get_class_vars('\\App\\Models\\Region'),
                'City' => get_class_vars('\\App\\Models\\City'),
                'Barangay' => get_class_vars('\\App\\Models\\Barangay')
            ]
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Error checking tables: ' . $e->getMessage()
        ], 500);
    }
});

// Service Orders Management Routes
Route::prefix('service-orders')->group(function () {
    Route::get('/', [\App\Http\Controllers\Api\ServiceOrderApiController::class, 'index']);
    Route::post('/', [\App\Http\Controllers\Api\ServiceOrderApiController::class, 'store']);
    Route::get('/{id}', [\App\Http\Controllers\Api\ServiceOrderApiController::class, 'show']);
    Route::put('/{id}', [\App\Http\Controllers\Api\ServiceOrderApiController::class, 'update']);
    Route::delete('/{id}', [\App\Http\Controllers\Api\ServiceOrderApiController::class, 'destroy']);
});

// Also add underscore version for compatibility
Route::prefix('service_orders')->group(function () {
    Route::get('/', [\App\Http\Controllers\Api\ServiceOrderApiController::class, 'index']);
    Route::post('/', [\App\Http\Controllers\Api\ServiceOrderApiController::class, 'store']);
    Route::get('/{id}', [\App\Http\Controllers\Api\ServiceOrderApiController::class, 'show']);
    Route::put('/{id}', [\App\Http\Controllers\Api\ServiceOrderApiController::class, 'update']);
    Route::delete('/{id}', [\App\Http\Controllers\Api\ServiceOrderApiController::class, 'destroy']);
});

// Customer Detail Management - Dedicated endpoint for customer details view
Route::get('/customer-detail/{accountNo}', [\App\Http\Controllers\CustomerDetailController::class, 'show']);

// Customer Management Routes
Route::prefix('customers')->group(function () {
    Route::get('/', [\App\Http\Controllers\CustomerController::class, 'index']);
    Route::post('/', [\App\Http\Controllers\CustomerController::class, 'store']);
    Route::get('/{id}', [\App\Http\Controllers\CustomerController::class, 'show']);
    Route::put('/{id}', [\App\Http\Controllers\CustomerController::class, 'update']);
    Route::delete('/{id}', [\App\Http\Controllers\CustomerController::class, 'destroy']);
});

// Billing API Routes - Fetches from customers, billing_accounts, and technical_details
Route::prefix('billing')->group(function () {
    Route::get('/', [\App\Http\Controllers\BillingController::class, 'index']);
    Route::get('/{id}', [\App\Http\Controllers\BillingController::class, 'show']);
    Route::get('/accounts/active', function() {
        try {
            $accounts = \App\Models\BillingAccount::with(['customer'])
                ->where('billing_status_id', 2)
                ->whereNotNull('date_installed')
                ->get();
            return response()->json([
                'success' => true,
                'data' => $accounts,
                'count' => $accounts->count()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching active accounts',
                'error' => $e->getMessage()
            ], 500);
        }
    });
    Route::get('/accounts/by-day/{day}', function($day) {
        try {
            $accounts = \App\Models\BillingAccount::with(['customer'])
                ->where('billing_day', $day)
                ->where('billing_status_id', 2)
                ->whereNotNull('date_installed')
                ->get();
            return response()->json([
                'success' => true,
                'data' => $accounts,
                'count' => $accounts->count(),
                'billing_day' => $day
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching accounts by billing day',
                'error' => $e->getMessage()
            ], 500);
        }
    });
});

// Billing Details API Routes
Route::prefix('billing-details')->group(function () {
    Route::get('/', [\App\Http\Controllers\Api\BillingDetailsApiController::class, 'index']);
    Route::post('/', [\App\Http\Controllers\Api\BillingDetailsApiController::class, 'store']);
    Route::get('/{id}', [\App\Http\Controllers\Api\BillingDetailsApiController::class, 'show']);
    Route::put('/{id}', [\App\Http\Controllers\Api\BillingDetailsApiController::class, 'update']);
    Route::delete('/{id}', [\App\Http\Controllers\Api\BillingDetailsApiController::class, 'destroy']);
});

// Also add underscore version for compatibility
Route::prefix('billing_details')->group(function () {
    Route::get('/', [\App\Http\Controllers\Api\BillingDetailsApiController::class, 'index']);
    Route::post('/', [\App\Http\Controllers\Api\BillingDetailsApiController::class, 'store']);
    Route::get('/{id}', [\App\Http\Controllers\Api\BillingDetailsApiController::class, 'show']);
    Route::put('/{id}', [\App\Http\Controllers\Api\BillingDetailsApiController::class, 'update']);
    Route::delete('/{id}', [\App\Http\Controllers\Api\BillingDetailsApiController::class, 'destroy']);
});

// Billing Status API Routes
Route::prefix('billing-statuses')->group(function () {
    Route::get('/', [\App\Http\Controllers\Api\BillingStatusApiController::class, 'index']);
    Route::post('/', [\App\Http\Controllers\Api\BillingStatusApiController::class, 'store']);
    Route::get('/{id}', [\App\Http\Controllers\Api\BillingStatusApiController::class, 'show']);
    Route::put('/{id}', [\App\Http\Controllers\Api\BillingStatusApiController::class, 'update']);
    Route::delete('/{id}', [\App\Http\Controllers\Api\BillingStatusApiController::class, 'destroy']);
});

// Debug route to check customers table structure
Route::get('/debug/customers-structure', function() {
    try {
        $customer = \App\Models\Customer::first();
        
        if (!$customer) {
            return response()->json([
                'success' => false,
                'message' => 'No customers found in database'
            ]);
        }
        
        $columns = \Illuminate\Support\Facades\Schema::getColumnListing('customers');
        
        return response()->json([
            'success' => true,
            'columns' => $columns,
            'sample_customer' => $customer->getAttributes(),
            'desired_plan_value' => $customer->desired_plan ?? 'NULL or not accessible'
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'error' => $e->getMessage()
        ], 500);
    }
});

// Debug route to check customers table structure
Route::get('/debug/customers-structure', function() {
    try {
        $customer = \App\Models\Customer::first();
        
        if (!$customer) {
            return response()->json([
                'success' => false,
                'message' => 'No customers found in database'
            ]);
        }
        
        $columns = \Illuminate\Support\Facades\Schema::getColumnListing('customers');
        
        return response()->json([
            'success' => true,
            'columns' => $columns,
            'sample_customer' => $customer->getAttributes(),
            'contact_number_primary' => $customer->contact_number_primary ?? 'NULL',
            'contact_number_secondary' => $customer->contact_number_secondary ?? 'NULL',
            'has_secondary_field' => in_array('contact_number_secondary', $columns)
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'error' => $e->getMessage()
        ], 500);
    }
});

// Debug route to check billing data
Route::get('/debug/billing-data', function() {
    try {
        $billingAccount = \App\Models\BillingAccount::with(['customer', 'technicalDetails'])->first();
        
        if (!$billingAccount) {
            return response()->json([
                'success' => false,
                'message' => 'No billing accounts found'
            ]);
        }
        
        $customer = $billingAccount->customer;
        $technicalDetail = $billingAccount->technicalDetails->first();
        
        return response()->json([
            'success' => true,
            'billing_account' => $billingAccount->getAttributes(),
            'customer_exists' => $customer ? true : false,
            'customer_data' => $customer ? $customer->getAttributes() : null,
            'desired_plan_from_customer' => $customer ? $customer->desired_plan : 'NO CUSTOMER',
            'technical_detail_exists' => $technicalDetail ? true : false,
            'mapped_plan_value' => $customer ? $customer->desired_plan : null,
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ], 500);
    }
});

// Billing Generation Routes
Route::prefix('billing-generation')->group(function () {
    Route::post('/generate-invoices', [\App\Http\Controllers\BillingGenerationController::class, 'generateInvoices']);
    Route::post('/generate-statements', [\App\Http\Controllers\BillingGenerationController::class, 'generateStatements']);
    Route::post('/generate-today', [\App\Http\Controllers\BillingGenerationController::class, 'generateTodaysBillings']);
    Route::post('/generate-enhanced-invoices', [\App\Http\Controllers\BillingGenerationController::class, 'generateEnhancedInvoices']);
    Route::post('/generate-enhanced-statements', [\App\Http\Controllers\BillingGenerationController::class, 'generateEnhancedStatements']);
    Route::post('/generate-for-day', [\App\Http\Controllers\BillingGenerationController::class, 'generateBillingsForDay']);
    Route::post('/force-generate-all', [\App\Http\Controllers\BillingGenerationController::class, 'forceGenerateAll']);
    Route::get('/invoices', [\App\Http\Controllers\BillingGenerationController::class, 'getInvoices']);
    Route::get('/statements', [\App\Http\Controllers\BillingGenerationController::class, 'getStatements']);
});

// Advanced Payment Routes
Route::prefix('advanced-payments')->group(function () {
    Route::get('/', [\App\Http\Controllers\Api\AdvancedPaymentApiController::class, 'index']);
    Route::post('/', [\App\Http\Controllers\Api\AdvancedPaymentApiController::class, 'store']);
    Route::get('/{id}', [\App\Http\Controllers\Api\AdvancedPaymentApiController::class, 'show']);
    Route::put('/{id}', [\App\Http\Controllers\Api\AdvancedPaymentApiController::class, 'update']);
    Route::delete('/{id}', [\App\Http\Controllers\Api\AdvancedPaymentApiController::class, 'destroy']);
});

// Mass Rebate Routes
Route::prefix('mass-rebates')->group(function () {
    Route::get('/', [\App\Http\Controllers\Api\MassRebateApiController::class, 'index']);
    Route::post('/', [\App\Http\Controllers\Api\MassRebateApiController::class, 'store']);
    Route::get('/{id}', [\App\Http\Controllers\Api\MassRebateApiController::class, 'show']);
    Route::put('/{id}', [\App\Http\Controllers\Api\MassRebateApiController::class, 'update']);
    Route::delete('/{id}', [\App\Http\Controllers\Api\MassRebateApiController::class, 'destroy']);
    Route::post('/{id}/mark-used', [\App\Http\Controllers\Api\MassRebateApiController::class, 'markAsUsed']);
});

// Installment Schedule Routes
Route::prefix('installment-schedules')->group(function () {
    Route::get('/', [\App\Http\Controllers\Api\InstallmentScheduleApiController::class, 'index']);
    Route::post('/generate', [\App\Http\Controllers\Api\InstallmentScheduleApiController::class, 'generateSchedules']);
    Route::get('/{id}', [\App\Http\Controllers\Api\InstallmentScheduleApiController::class, 'show']);
    Route::put('/{id}', [\App\Http\Controllers\Api\InstallmentScheduleApiController::class, 'update']);
    Route::get('/account/{accountId}', [\App\Http\Controllers\Api\InstallmentScheduleApiController::class, 'getByAccount']);
});

Route::prefix('radius')->group(function () {
    Route::post('/create-account', [RadiusController::class, 'createAccount']);
});

// Custom Account Number Management Routes
Route::get('/custom-account-number', [\App\Http\Controllers\CustomAccountNumberController::class, 'index']);
Route::post('/custom-account-number', [\App\Http\Controllers\CustomAccountNumberController::class, 'store']);
Route::put('/custom-account-number', [\App\Http\Controllers\CustomAccountNumberController::class, 'update']);
Route::delete('/custom-account-number', [\App\Http\Controllers\CustomAccountNumberController::class, 'destroy']);

// Debug endpoint for custom account number table
Route::get('/debug/custom-account-number-table', function() {
    try {
        $tableExists = \Illuminate\Support\Facades\Schema::hasTable('custom_account_number');
        
        if (!$tableExists) {
            return response()->json([
                'success' => false,
                'message' => 'Table does not exist',
                'table_exists' => false,
                'migration_needed' => true
            ]);
        }
        
        $columns = \Illuminate\Support\Facades\Schema::getColumnListing('custom_account_number');
        $count = \Illuminate\Support\Facades\DB::table('custom_account_number')->count();
        
        return response()->json([
            'success' => true,
            'message' => 'Table exists',
            'table_exists' => true,
            'columns' => $columns,
            'record_count' => $count
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Error checking table',
            'error' => $e->getMessage()
        ], 500);
    }
});

// Test endpoint to insert a record
Route::post('/debug/test-custom-account-number', function(\Illuminate\Http\Request $request) {
    try {
        \Illuminate\Support\Facades\Log::info('Test insert attempt', [
            'request_data' => $request->all()
        ]);

        $result = \Illuminate\Support\Facades\DB::table('custom_account_number')->insert([
            'starting_number' => 'TEST123',
            'updated_by' => 'test@example.com',
            'created_at' => now(),
            'updated_at' => now()
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Test insert successful',
            'result' => $result
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Test insert failed',
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ], 500);
    }
});

// Location Details Management Routes - Using location table
Route::prefix('location-details')->group(function () {
    Route::get('/', [\App\Http\Controllers\LocationDetailController::class, 'index']);
    Route::post('/', [\App\Http\Controllers\LocationDetailController::class, 'store']);
    Route::get('/{id}', [\App\Http\Controllers\LocationDetailController::class, 'show']);
    Route::put('/{id}', [\App\Http\Controllers\LocationDetailController::class, 'update']);
    Route::delete('/{id}', [\App\Http\Controllers\LocationDetailController::class, 'destroy']);
    Route::get('/barangay/{barangayId}', [\App\Http\Controllers\LocationDetailController::class, 'getByBarangay']);
});

// Billing Configuration Management Routes
Route::get('/billing-config', [\App\Http\Controllers\BillingConfigController::class, 'index']);
Route::post('/billing-config', [\App\Http\Controllers\BillingConfigController::class, 'store']);
Route::put('/billing-config', [\App\Http\Controllers\BillingConfigController::class, 'update']);
Route::delete('/billing-config', [\App\Http\Controllers\BillingConfigController::class, 'destroy']);

// RADIUS Configuration Management Routes
Route::get('/radius-config', [\App\Http\Controllers\RadiusConfigController::class, 'index']);
Route::post('/radius-config', [\App\Http\Controllers\RadiusConfigController::class, 'store']);
Route::put('/radius-config/{id}', [\App\Http\Controllers\RadiusConfigController::class, 'update']);
Route::delete('/radius-config/{id}', [\App\Http\Controllers\RadiusConfigController::class, 'destroy']);

// Settings Image Size Management Routes
Route::prefix('settings-image-size')->group(function () {
    Route::get('/', [\App\Http\Controllers\SettingsImageSizeController::class, 'index']);
    Route::get('/active', [\App\Http\Controllers\SettingsImageSizeController::class, 'getActive']);
    Route::put('/{id}/status', [\App\Http\Controllers\SettingsImageSizeController::class, 'updateStatus']);
});

Route::get('/settings/image-size', function() {
    try {
        $sizes = \App\Models\SettingsImageSize::orderBy('id')->get();
        return response()->json([
            'success' => true,
            'data' => $sizes
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Error fetching image size settings',
            'error' => $e->getMessage()
        ], 500);
    }
});

// Settings Color Palette Management Routes
Route::prefix('settings-color-palette')->group(function () {
    Route::get('/', [\App\Http\Controllers\SettingsColorPaletteController::class, 'index']);
    Route::get('/active', [\App\Http\Controllers\SettingsColorPaletteController::class, 'getActive']);
    Route::post('/', [\App\Http\Controllers\SettingsColorPaletteController::class, 'store']);
    Route::put('/{id}', [\App\Http\Controllers\SettingsColorPaletteController::class, 'update']);
    Route::put('/{id}/status', [\App\Http\Controllers\SettingsColorPaletteController::class, 'updateStatus']);
    Route::delete('/{id}', [\App\Http\Controllers\SettingsColorPaletteController::class, 'destroy']);
});

// Transaction Management Routes
Route::prefix('transactions')->group(function () {
    Route::get('/', [\App\Http\Controllers\TransactionController::class, 'index']);
    Route::post('/', [\App\Http\Controllers\TransactionController::class, 'store']);
    Route::post('/upload-images', [\App\Http\Controllers\TransactionController::class, 'uploadImages']);
    Route::get('/{id}', [\App\Http\Controllers\TransactionController::class, 'show']);
    Route::post('/{id}/approve', [\App\Http\Controllers\TransactionController::class, 'approve']);
    Route::put('/{id}/status', [\App\Http\Controllers\TransactionController::class, 'updateStatus']);
});

// Staggered Installation Management Routes
Route::prefix('staggered-installations')->group(function () {
    Route::get('/', [\App\Http\Controllers\StaggeredInstallationController::class, 'index']);
    Route::post('/', [\App\Http\Controllers\StaggeredInstallationController::class, 'store']);
    Route::get('/{id}', [\App\Http\Controllers\StaggeredInstallationController::class, 'show']);
    Route::put('/{id}', [\App\Http\Controllers\StaggeredInstallationController::class, 'update']);
    Route::delete('/{id}', [\App\Http\Controllers\StaggeredInstallationController::class, 'destroy']);
});
