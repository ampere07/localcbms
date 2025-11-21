<?php

namespace App\Http\Controllers;

use App\Services\BillingGenerationService;
use App\Services\EnhancedBillingGenerationService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class BillingGenerationController extends Controller
{
    protected $billingService;
    protected $enhancedBillingService;

    public function __construct(
        BillingGenerationService $billingService,
        EnhancedBillingGenerationService $enhancedBillingService
    ) {
        $this->billingService = $billingService;
        $this->enhancedBillingService = $enhancedBillingService;
    }

    public function generateInvoices(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'billing_day' => 'required|integer|min:1|max:31'
            ]);

            $userId = $request->user()->id ?? 1;

            $results = $this->billingService->generateInvoicesForBillingDay(
                $validated['billing_day'],
                $userId
            );

            return response()->json([
                'success' => true,
                'message' => "Generated {$results['success']} invoices successfully",
                'data' => $results
            ]);
        } catch (\Exception $e) {
            Log::error('Error generating invoices: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());

            return response()->json([
                'success' => false,
                'message' => 'Failed to generate invoices',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function generateStatements(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'billing_day' => 'required|integer|min:1|max:31'
            ]);

            $userId = $request->user()->id ?? 1;

            $results = $this->billingService->generateStatementsForBillingDay(
                $validated['billing_day'],
                $userId
            );

            return response()->json([
                'success' => true,
                'message' => "Generated {$results['success']} statements successfully",
                'data' => $results
            ]);
        } catch (\Exception $e) {
            Log::error('Error generating statements: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());

            return response()->json([
                'success' => false,
                'message' => 'Failed to generate statements',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function generateTodaysBillings(Request $request): JsonResponse
    {
        try {
            $userId = $request->user()->id ?? 1;

            $results = $this->enhancedBillingService->generateAllBillingsForToday($userId);

            $totalGenerated = $results['invoices']['success'] + $results['statements']['success'];

            return response()->json([
                'success' => true,
                'message' => "Generated {$totalGenerated} billing records successfully",
                'data' => $results
            ]);
        } catch (\Exception $e) {
            Log::error('Error generating today\'s billings: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());

            return response()->json([
                'success' => false,
                'message' => 'Failed to generate today\'s billings',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function generateEnhancedInvoices(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'billing_day' => 'required|integer|min:1|max:31',
                'generation_date' => 'nullable|date'
            ]);

            $userId = $request->user()->id ?? 1;
            $generationDate = $validated['generation_date'] 
                ? Carbon::parse($validated['generation_date']) 
                : Carbon::now();

            $results = $this->enhancedBillingService->generateInvoicesForBillingDay(
                $validated['billing_day'],
                $generationDate,
                $userId
            );

            return response()->json([
                'success' => true,
                'message' => "Generated {$results['success']} invoices successfully",
                'data' => $results
            ]);
        } catch (\Exception $e) {
            Log::error('Error generating enhanced invoices: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());

            return response()->json([
                'success' => false,
                'message' => 'Failed to generate invoices',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function generateEnhancedStatements(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'billing_day' => 'required|integer|min:1|max:31',
                'generation_date' => 'nullable|date'
            ]);

            $userId = $request->user()->id ?? 1;
            $generationDate = $validated['generation_date'] 
                ? Carbon::parse($validated['generation_date']) 
                : Carbon::now();

            $results = $this->enhancedBillingService->generateSOAForBillingDay(
                $validated['billing_day'],
                $generationDate,
                $userId
            );

            return response()->json([
                'success' => true,
                'message' => "Generated {$results['success']} statements successfully",
                'data' => $results
            ]);
        } catch (\Exception $e) {
            Log::error('Error generating enhanced statements: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());

            return response()->json([
                'success' => false,
                'message' => 'Failed to generate statements',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function generateBillingsForDay(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'billing_day' => 'required|integer|min:1|max:31'
            ]);

            $userId = $request->user()->id ?? 1;

            $results = $this->enhancedBillingService->generateBillingsForSpecificDay(
                $validated['billing_day'],
                $userId
            );

            $totalGenerated = $results['invoices']['success'] + $results['statements']['success'];

            return response()->json([
                'success' => true,
                'message' => "Generated {$totalGenerated} billing records for day {$validated['billing_day']}",
                'data' => $results
            ]);
        } catch (\Exception $e) {
            Log::error('Error generating billings for specific day: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());

            return response()->json([
                'success' => false,
                'message' => 'Failed to generate billings',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getInvoices(Request $request): JsonResponse
    {
        try {
            $query = \App\Models\Invoice::with(['billingAccount.customer']);

            if ($request->has('account_id')) {
                $query->where('account_id', $request->account_id);
            }

            if ($request->has('status')) {
                $query->where('status', $request->status);
            }

            if ($request->has('date_from') && $request->has('date_to')) {
                $query->whereBetween('invoice_date', [
                    $request->date_from,
                    $request->date_to
                ]);
            }

            $invoices = $query->orderBy('invoice_date', 'desc')->get();

            return response()->json([
                'success' => true,
                'data' => $invoices,
                'count' => $invoices->count()
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching invoices: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch invoices',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getStatements(Request $request): JsonResponse
    {
        try {
            $query = \App\Models\StatementOfAccount::with(['billingAccount.customer']);

            if ($request->has('account_id')) {
                $query->where('account_id', $request->account_id);
            }

            if ($request->has('date_from') && $request->has('date_to')) {
                $query->whereBetween('statement_date', [
                    $request->date_from,
                    $request->date_to
                ]);
            }

            $statements = $query->orderBy('statement_date', 'desc')->get();

            return response()->json([
                'success' => true,
                'data' => $statements,
                'count' => $statements->count()
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching statements: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch statements',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function forceGenerateAll(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'generation_date' => 'nullable|date'
            ]);

            $userId = $request->user()->id ?? 1;
            $generationDate = isset($validated['generation_date']) 
                ? Carbon::parse($validated['generation_date']) 
                : Carbon::now();

            $allBillingAccounts = \App\Models\BillingAccount::with(['customer'])->get();
            
            Log::info('All billing accounts found', [
                'total' => $allBillingAccounts->count(),
                'accounts' => $allBillingAccounts->map(function($acc) {
                    return [
                        'account_no' => $acc->account_no,
                        'billing_status_id' => $acc->billing_status_id,
                        'billing_status_id_type' => gettype($acc->billing_status_id),
                        'date_installed' => $acc->date_installed,
                        'has_customer' => $acc->customer ? true : false
                    ];
                })->toArray()
            ]);

            $accounts = \App\Models\BillingAccount::with(['customer'])
                ->whereNotNull('date_installed')
                ->get();

            Log::info('Force generate started', [
                'total_accounts' => $accounts->count(),
                'generation_date' => $generationDate->format('Y-m-d')
            ]);

            if ($accounts->count() === 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'No active accounts found. Check billing_status_id=2 and date_installed is not null',
                    'data' => [
                        'total_accounts' => 0,
                        'criteria' => 'billing_status_id = 2 AND date_installed IS NOT NULL'
                    ]
                ], 404);
            }

            $invoiceResults = [
                'success' => 0,
                'failed' => 0,
                'errors' => []
            ];

            $soaResults = [
                'success' => 0,
                'failed' => 0,
                'errors' => []
            ];

            foreach ($accounts as $account) {
                Log::info('Processing account', [
                    'account_no' => $account->account_no,
                    'customer' => $account->customer ? $account->customer->full_name : 'NO CUSTOMER'
                ]);

                try {
                    $account->refresh();
                    $this->enhancedBillingService->createEnhancedStatement($account, $generationDate, $userId);
                    $soaResults['success']++;
                    Log::info('SOA created successfully', ['account_no' => $account->account_no]);
                } catch (\Exception $e) {
                    $soaResults['failed']++;
                    $soaResults['errors'][] = [
                        'account_id' => $account->id,
                        'account_no' => $account->account_no,
                        'error' => $e->getMessage(),
                        'trace' => $e->getTraceAsString()
                    ];
                    Log::error('SOA generation failed', [
                        'account_no' => $account->account_no,
                        'error' => $e->getMessage()
                    ]);
                }

                try {
                    $account->refresh();
                    $this->enhancedBillingService->createEnhancedInvoice($account, $generationDate, $userId);
                    $invoiceResults['success']++;
                    Log::info('Invoice created successfully', ['account_no' => $account->account_no]);
                } catch (\Exception $e) {
                    $invoiceResults['failed']++;
                    $invoiceResults['errors'][] = [
                        'account_id' => $account->id,
                        'account_no' => $account->account_no,
                        'error' => $e->getMessage(),
                        'trace' => $e->getTraceAsString()
                    ];
                    Log::error('Invoice generation failed', [
                        'account_no' => $account->account_no,
                        'error' => $e->getMessage()
                    ]);
                }
            }

            $totalGenerated = $invoiceResults['success'] + $soaResults['success'];

            return response()->json([
                'success' => true,
                'message' => "Force generated {$totalGenerated} billing records for {$accounts->count()} active accounts",
                'data' => [
                    'invoices' => $invoiceResults,
                    'statements' => $soaResults,
                    'total_accounts' => $accounts->count(),
                    'generation_date' => $generationDate->format('Y-m-d')
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error in force generate all: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());

            return response()->json([
                'success' => false,
                'message' => 'Failed to force generate billings',
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ], 500);
        }
    }
}
