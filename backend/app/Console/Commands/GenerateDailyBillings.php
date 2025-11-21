<?php

namespace App\Console\Commands;

use App\Services\EnhancedBillingGenerationService;
use Illuminate\Console\Command;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

/**
 * Daily Billing Generation Command
 * 
 * CRITICAL ORDER OF OPERATIONS:
 * 1. Generate SOA FIRST (uses previous account_balance)
 * 2. Generate Invoice SECOND (updates account_balance)
 * 
 * This order ensures that:
 * - SOA "Balance from Previous Bill" shows the correct previous balance (e.g., 6694)
 * - Invoice generation updates the account_balance to the new ending balance (e.g., 7993)
 * - Next month's SOA will correctly use the previous SOA's "Total Amount Due" as starting balance
 * 
 * Schedule: Runs daily at 1:00 AM (configured in app/Console/Kernel.php)
 * 
 * Manual Usage:
 *   php artisan billing:generate-daily                    # Generate for today's billing day
 *   php artisan billing:generate-daily --day=15           # Generate for specific billing day
 *   php artisan billing:generate-daily --day=0            # Generate for end-of-month billing
 *   php artisan billing:generate-daily --date=2025-11-15  # Generate for specific date
 */
class GenerateDailyBillings extends Command
{
    protected $signature = 'billing:generate-daily 
                            {--day= : Specific billing day to generate (0 for end-of-month, 1-31 for specific day)}
                            {--date= : Specific generation date (Y-m-d format)}
                            {--user-id=1 : User ID to attribute the generation to}';

    protected $description = 'Generate daily billings (SOA and Invoices) for accounts with matching billing day. Use --day=0 for end-of-month billing.';

    protected $billingService;

    public function __construct(EnhancedBillingGenerationService $billingService)
    {
        parent::__construct();
        $this->billingService = $billingService;
    }

    public function handle()
    {
        $startTime = microtime(true);
        $userId = $this->option('user-id');
        
        $generationDate = $this->option('date') 
            ? Carbon::parse($this->option('date')) 
            : Carbon::now();

        if ($this->option('day') !== null) {
            $billingDay = (int) $this->option('day');
            $this->generateForSpecificBillingDay($billingDay, $generationDate, $userId, $startTime);
        } else {
            $this->generateForToday($generationDate, $userId, $startTime);
        }

        return Command::SUCCESS;
    }

    protected function generateForToday(Carbon $generationDate, int $userId, float $startTime)
    {
        $currentDay = $generationDate->day;
        $isLastDayOfMonth = $generationDate->isLastOfMonth();

        $this->info("Starting billing generation for {$generationDate->format('Y-m-d')}");
        $this->info("Current day: {$currentDay}");
        $this->info("Is last day of month: " . ($isLastDayOfMonth ? 'Yes' : 'No'));
        $this->info("User ID: {$userId}");
        $this->line('---');

        try {
            $allResults = $this->billingService->generateAllBillingsForToday($userId);

            $this->displayResults($allResults, $startTime);

            Log::info("Daily billing generation completed", [
                'date' => $generationDate->format('Y-m-d'),
                'billing_days_processed' => $allResults['billing_days_processed'],
                'invoices' => $allResults['invoices'],
                'statements' => $allResults['statements']
            ]);

        } catch (\Exception $e) {
            $this->error("Fatal error during billing generation: {$e->getMessage()}");
            Log::error("Fatal error in daily billing generation", [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return Command::FAILURE;
        }
    }

    protected function generateForSpecificBillingDay(int $billingDay, Carbon $generationDate, int $userId, float $startTime)
    {
        $billingDayLabel = $billingDay === 0 ? 'End of Month (0)' : "Day {$billingDay}";
        
        $this->info("Starting billing generation for specific billing day");
        $this->info("Billing Day: {$billingDayLabel}");
        $this->info("Generation Date: {$generationDate->format('Y-m-d')}");
        $this->info("User ID: {$userId}");
        $this->line('---');

        try {
            $this->info('Generating Statements of Account...');
            $soaResults = $this->billingService->generateSOAForBillingDay($billingDay, $generationDate, $userId);
            
            $this->info("SOA Results:");
            $this->line("  Success: {$soaResults['success']}");
            $this->line("  Failed: {$soaResults['failed']}");
            
            if ($soaResults['failed'] > 0) {
                $this->warn("  Errors occurred:");
                foreach ($soaResults['errors'] as $error) {
                    $this->error("    Account {$error['account_no']}: {$error['error']}");
                }
            }

            $this->line('---');

            $this->info('Generating Invoices...');
            $invoiceResults = $this->billingService->generateInvoicesForBillingDay($billingDay, $generationDate, $userId);
            
            $this->info("Invoice Results:");
            $this->line("  Success: {$invoiceResults['success']}");
            $this->line("  Failed: {$invoiceResults['failed']}");
            
            if ($invoiceResults['failed'] > 0) {
                $this->warn("  Errors occurred:");
                foreach ($invoiceResults['errors'] as $error) {
                    $this->error("    Account {$error['account_no']}: {$error['error']}");
                }
            }

            $this->line('---');

            $totalSuccess = $soaResults['success'] + $invoiceResults['success'];
            $totalFailed = $soaResults['failed'] + $invoiceResults['failed'];

            $endTime = microtime(true);
            $executionTime = round($endTime - $startTime, 2);

            $this->info("Summary:");
            $this->line("  Billing Day: {$billingDayLabel}");
            $this->line("  SOA Generated: {$soaResults['success']}");
            $this->line("  Invoices Generated: {$invoiceResults['success']}");
            $this->line("  Total Generated: {$totalSuccess}");
            $this->line("  Total Failed: {$totalFailed}");
            $this->line("  Execution Time: {$executionTime} seconds");

            Log::info("Billing generation completed for specific day", [
                'billing_day' => $billingDay,
                'billing_day_label' => $billingDayLabel,
                'generation_date' => $generationDate->format('Y-m-d'),
                'soa_success' => $soaResults['success'],
                'soa_failed' => $soaResults['failed'],
                'invoice_success' => $invoiceResults['success'],
                'invoice_failed' => $invoiceResults['failed'],
                'execution_time' => $executionTime
            ]);

        } catch (\Exception $e) {
            $this->error("Fatal error during billing generation: {$e->getMessage()}");
            Log::error("Fatal error in billing generation for specific day", [
                'billing_day' => $billingDay,
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return Command::FAILURE;
        }
    }

    protected function displayResults(array $results, float $startTime)
    {
        $this->info("Billing Days Processed:");
        foreach ($results['billing_days_processed'] as $day) {
            $this->line("  - {$day}");
        }
        
        $this->line('---');

        $this->info("Invoice Results:");
        $this->line("  Success: {$results['invoices']['success']}");
        $this->line("  Failed: {$results['invoices']['failed']}");
        
        if ($results['invoices']['failed'] > 0) {
            $this->warn("  Invoice Errors:");
            foreach ($results['invoices']['errors'] as $error) {
                $this->error("    Account {$error['account_no']}: {$error['error']}");
            }
        }

        $this->line('---');

        $this->info("Statement Results:");
        $this->line("  Success: {$results['statements']['success']}");
        $this->line("  Failed: {$results['statements']['failed']}");
        
        if ($results['statements']['failed'] > 0) {
            $this->warn("  Statement Errors:");
            foreach ($results['statements']['errors'] as $error) {
                $this->error("    Account {$error['account_no']}: {$error['error']}");
            }
        }

        $this->line('---');

        $totalSuccess = $results['invoices']['success'] + $results['statements']['success'];
        $totalFailed = $results['invoices']['failed'] + $results['statements']['failed'];

        $endTime = microtime(true);
        $executionTime = round($endTime - $startTime, 2);

        $this->info("Summary:");
        $this->line("  Total Generated: {$totalSuccess}");
        $this->line("  Total Failed: {$totalFailed}");
        $this->line("  Execution Time: {$executionTime} seconds");
    }
}
