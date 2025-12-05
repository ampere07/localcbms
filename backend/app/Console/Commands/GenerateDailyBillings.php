<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\EnhancedBillingGenerationServiceWithNotifications;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class GenerateDailyBillings extends Command
{
    protected $signature = 'billing:generate-daily';
    protected $description = 'Generate daily billings with PDF and notifications';

    protected EnhancedBillingGenerationServiceWithNotifications $billingService;

    public function __construct(EnhancedBillingGenerationServiceWithNotifications $billingService)
    {
        parent::__construct();
        $this->billingService = $billingService;
    }

    public function handle()
    {
        $this->info('Starting daily billing generation...');
        Log::info('Daily billing generation started');

        try {
            $today = Carbon::now();
            $advanceDays = config('billing.advance_generation_days', 7);
            $targetDate = $today->copy()->addDays($advanceDays);
            $targetBillingDay = $targetDate->day;

            $this->info("Target billing day: {$targetBillingDay}");

            $soaResults = $this->billingService->generateSOAForBillingDay(
                $targetBillingDay,
                $today,
                1
            );

            $this->info("SOA Generation: {$soaResults['success']} successful, {$soaResults['failed']} failed");

            $invoiceResults = $this->billingService->generateInvoicesForBillingDay(
                $targetBillingDay,
                $today,
                1
            );

            $this->info("Invoice Generation: {$invoiceResults['success']} successful, {$invoiceResults['failed']} failed");

            $totalSuccess = $soaResults['success'] + $invoiceResults['success'];

            Log::info('Daily billing generation completed', [
                'soa_success' => $soaResults['success'],
                'invoice_success' => $invoiceResults['success'],
                'total_success' => $totalSuccess
            ]);

            $this->info("Daily billing generation completed successfully!");
            $this->info("Total generated: {$totalSuccess}");

            return 0;

        } catch (\Exception $e) {
            $this->error('Failed to generate daily billings: ' . $e->getMessage());
            Log::error('Daily billing generation failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return 1;
        }
    }
}
