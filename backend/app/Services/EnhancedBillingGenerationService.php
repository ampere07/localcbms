<?php

namespace App\Services;

use App\Models\BillingAccount;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\StatementOfAccount;
use App\Models\AppPlan;
use App\Models\Discount;
use App\Models\Installment;
use App\Models\InstallmentSchedule;
use App\Models\AdvancedPayment;
use App\Models\MassRebate;
use App\Models\Barangay;
use App\Models\BillingConfig;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

/**
 * Enhanced Billing Generation Service
 * 
 * CRITICAL ORDER OF OPERATIONS:
 * ================================
 * 1. Generate SOA FIRST (before invoice)
 * 2. Generate Invoice SECOND (after SOA)
 * 
 * Why this order matters:
 * - SOA needs to show the previous balance from the last billing period
 * - Invoice generation updates the account_balance to the new ending balance
 * - If invoice is generated first, SOA will incorrectly use the new ending balance
 *   instead of the actual previous balance
 * 
 * Example Flow:
 * =============
 * Previous Period:
 *   - Total Amount Due: ₱6,694.00 (this is the ending balance)
 * 
 * Current Period (CORRECT ORDER):
 *   Step 1 - Generate SOA:
 *     - getPreviousBalance() returns ₱6,694.00 (from last SOA)
 *     - Balance from Previous Bill: ₱6,694.00 ✓
 *     - New charges: ₱1,299.00
 *     - Total Amount Due: ₱7,993.00 (new ending balance)
 *   
 *   Step 2 - Generate Invoice:
 *     - Updates account_balance to ₱7,993.00
 *     - Invoice created with correct amounts
 * 
 * Next Period:
 *   - getPreviousBalance() will return ₱7,993.00 (from current SOA's total_amount_due)
 *   - Cycle continues correctly
 * 
 * All generation methods follow this order:
 * - generateAllBillingsForToday()
 * - generateBillingsForSpecificDay()
 * - forceGenerateAll() (in BillingGenerationController)
 */
class EnhancedBillingGenerationService
{
    protected const VAT_RATE = 0.12;
    protected const DAYS_IN_MONTH = 30;
    protected const DAYS_UNTIL_DUE = 7;
    protected const DAYS_UNTIL_DC_NOTICE = 4;
    protected const END_OF_MONTH_BILLING = 0;

    public function generateSOAForBillingDay(int $billingDay, Carbon $generationDate, int $userId): array
    {
        $results = [
            'success' => 0,
            'failed' => 0,
            'errors' => [],
            'statements' => []
        ];

        try {
            $accounts = $this->getActiveAccountsForBillingDay($billingDay, $generationDate);

            foreach ($accounts as $account) {
                try {
                    $statement = $this->createEnhancedStatement($account, $generationDate, $userId);
                    $results['statements'][] = $statement;
                    $results['success']++;
                } catch (\Exception $e) {
                    $results['failed']++;
                    $results['errors'][] = [
                        'account_id' => $account->id,
                        'account_no' => $account->account_no,
                        'error' => $e->getMessage()
                    ];
                    Log::error("Failed to generate SOA for account {$account->account_no}: " . $e->getMessage());
                }
            }

            return $results;
        } catch (\Exception $e) {
            Log::error("Error in generateSOAForBillingDay: " . $e->getMessage());
            throw $e;
        }
    }

    public function generateInvoicesForBillingDay(int $billingDay, Carbon $generationDate, int $userId): array
    {
        $results = [
            'success' => 0,
            'failed' => 0,
            'errors' => [],
            'invoices' => []
        ];

        try {
            $accounts = $this->getActiveAccountsForBillingDay($billingDay, $generationDate);

            foreach ($accounts as $account) {
                try {
                    $invoice = $this->createEnhancedInvoice($account, $generationDate, $userId);
                    $results['invoices'][] = $invoice;
                    $results['success']++;
                } catch (\Exception $e) {
                    $results['failed']++;
                    $results['errors'][] = [
                        'account_id' => $account->id,
                        'account_no' => $account->account_no,
                        'error' => $e->getMessage()
                    ];
                    Log::error("Failed to generate invoice for account {$account->account_no}: " . $e->getMessage());
                }
            }

            return $results;
        } catch (\Exception $e) {
            Log::error("Error in generateInvoicesForBillingDay: " . $e->getMessage());
            throw $e;
        }
    }

    protected function getActiveAccountsForBillingDay(int $billingDay, Carbon $generationDate)
    {
        $targetDay = $this->adjustBillingDayForMonth($billingDay, $generationDate);

        $query = BillingAccount::with(['customer'])
            ->where('billing_status_id', 2)
            ->whereNotNull('date_installed');

        if ($billingDay === self::END_OF_MONTH_BILLING) {
            $query->where('billing_day', self::END_OF_MONTH_BILLING);
        } else {
            $query->where('billing_day', $targetDay);
        }

        return $query->get();
    }

    protected function getAdvanceGenerationDay(): int
    {
        $billingConfig = BillingConfig::first();
        
        if (!$billingConfig || $billingConfig->advance_generation_day === null) {
            Log::info('No advance_generation_day configured, using default 0');
            return 0;
        }
        
        return $billingConfig->advance_generation_day;
    }

    protected function calculateTargetBillingDays(Carbon $generationDate): array
    {
        $advanceGenerationDay = $this->getAdvanceGenerationDay();
        $currentDay = $generationDate->day;
        $targetBillingDay = $currentDay + $advanceGenerationDay;
        
        $billingDays = [];
        
        if ($generationDate->isLastOfMonth()) {
            $billingDays[] = self::END_OF_MONTH_BILLING;
            
            $lastDayOfMonth = $generationDate->day;
            $targetDay = $lastDayOfMonth + $advanceGenerationDay;
            
            if ($targetDay <= 31) {
                $billingDays[] = $targetDay;
            }
        } else {
            if ($targetBillingDay <= 31) {
                $billingDays[] = $targetBillingDay;
            }
            
            $lastDayOfMonth = $generationDate->copy()->endOfMonth()->day;
            if ($targetBillingDay > $lastDayOfMonth) {
                $billingDays[] = self::END_OF_MONTH_BILLING;
            }
        }
        
        Log::info('Calculated target billing days', [
            'generation_date' => $generationDate->format('Y-m-d'),
            'current_day' => $currentDay,
            'advance_generation_day' => $advanceGenerationDay,
            'target_billing_day' => $targetBillingDay,
            'billing_days_to_process' => $billingDays
        ]);
        
        return $billingDays;
    }

    protected function adjustBillingDayForMonth(int $billingDay, Carbon $date): int
    {
        if ($billingDay === self::END_OF_MONTH_BILLING) {
            return self::END_OF_MONTH_BILLING;
        }

        if ($date->format('M') === 'Feb') {
            if ($billingDay === 29) {
                return 1;
            } elseif ($billingDay === 30) {
                return 2;
            } elseif ($billingDay === 31) {
                return 3;
            }
        }
        return $billingDay;
    }

    /**
     * Generate Statement of Account for a billing account
     * 
     * IMPORTANT: This method should be called BEFORE invoice generation to ensure
     * the "Balance from Previous Bill" uses the correct previous balance.
     * 
     * Logic:
     * 1. Get previous balance from last SOA's total_amount_due (or account_balance if first SOA)
     * 2. Calculate payment received from last period
     * 3. Calculate remaining balance: previous_balance - payment_received
     * 4. Calculate current period charges (monthly fee, VAT, others)
     * 5. Calculate total_amount_due: remaining_balance + amount_due
     * 
     * This ensures the SOA shows:
     * - balance_from_previous_bill = Last SOA's total_amount_due (e.g., 6694)
     * - NOT the account_balance which may have been updated by invoice generation
     */
    public function createEnhancedStatement(BillingAccount $account, Carbon $statementDate, int $userId): StatementOfAccount
    {
        DB::beginTransaction();

        try {
            $customer = $account->customer;
            if (!$customer) {
                throw new \Exception("Customer not found for account {$account->account_no}");
            }

            $desiredPlan = $customer->desired_plan;
            if (!$desiredPlan) {
                throw new \Exception("No desired_plan found for customer {$customer->full_name}");
            }

            $planName = $this->extractPlanName($desiredPlan);
            
            Log::info('Looking up plan', [
                'plan_name_extracted' => $planName,
                'original_desired_plan' => $desiredPlan
            ]);
            
            $plan = AppPlan::where('plan_name', $planName)->first();
                
            if (!$plan) {
                $allPlans = AppPlan::select('id', 'plan_name', 'price')->get();
                Log::error('Plan not found', [
                    'searching_for' => $planName,
                    'available_plans' => $allPlans->toArray()
                ]);
                throw new \Exception("Plan '{$planName}' not found in plan_list table (extracted from '{$desiredPlan}'). Available plans: " . $allPlans->pluck('plan_name')->implode(', '));
            }

            if (!$plan->price || $plan->price <= 0) {
                throw new \Exception("Plan '{$planName}' has invalid price: " . ($plan->price ?? 'NULL'));
            }

            $adjustedDate = $this->calculateAdjustedBillingDate($account, $statementDate);
            $dueDate = $adjustedDate->copy()->addDays(self::DAYS_UNTIL_DUE);

            $prorateAmount = $this->calculateProrateAmount($account, $plan->price, $adjustedDate);
            $monthlyFeeGross = $prorateAmount / (1 + self::VAT_RATE);
            $vat = $monthlyFeeGross * self::VAT_RATE;
            $monthlyServiceFee = $prorateAmount - $vat;

            $invoiceId = $this->generateInvoiceId($statementDate);
            
            $charges = $this->calculateChargesAndDeductions(
                $account, 
                $statementDate, 
                $userId, 
                $invoiceId,
                $plan->price
            );
            
            $othersAndBasicCharges = $charges['staggered_fees'] + 
                                     $charges['staggered_install_fees'] + 
                                     $charges['service_fees'] - 
                                     $charges['total_deductions'];

            $amountDue = $monthlyServiceFee + $vat + $othersAndBasicCharges;
            
            $previousBalance = $this->getPreviousBalance($account, $statementDate);
            $paymentReceived = $charges['payment_received_previous'];
            $remainingBalance = $previousBalance - $paymentReceived;
            $totalAmountDue = $remainingBalance + $amountDue;

            $statement = StatementOfAccount::create([
                'account_id' => $account->id,
                'statement_date' => $statementDate,
                'balance_from_previous_bill' => round($previousBalance, 2),
                'payment_received_previous' => round($paymentReceived, 2),
                'remaining_balance_previous' => round($remainingBalance, 2),
                'monthly_service_fee' => round($monthlyServiceFee, 2),
                'others_and_basic_charges' => round($othersAndBasicCharges, 2),
                'vat' => round($vat, 2),
                'due_date' => $dueDate,
                'amount_due' => round($amountDue, 2),
                'total_amount_due' => round($totalAmountDue, 2),
                'print_link' => null,
                'created_by' => (string) $userId,
                'updated_by' => (string) $userId
            ]);

            DB::commit();
            return $statement;

        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Generate Invoice for a billing account
     * 
     * IMPORTANT: This method should be called AFTER SOA generation because it updates
     * the account_balance, which would affect the SOA's "Balance from Previous Bill".
     * 
     * This method:
     * 1. Calculates the invoice amount
     * 2. Updates account_balance to new ending balance (previous + new charges)
     * 3. Creates the invoice record
     * 
     * The updated account_balance will be used by the next period's SOA.
     */
    public function createEnhancedInvoice(BillingAccount $account, Carbon $invoiceDate, int $userId): Invoice
    {
        DB::beginTransaction();

        try {
            $customer = $account->customer;
            if (!$customer) {
                throw new \Exception("Customer not found for account {$account->account_no}");
            }

            $desiredPlan = $customer->desired_plan;
            if (!$desiredPlan) {
                throw new \Exception("No desired_plan found for customer {$customer->full_name}");
            }

            $planName = $this->extractPlanName($desiredPlan);
            
            $plan = AppPlan::where('plan_name', $planName)->first();
            if (!$plan) {
                throw new \Exception("Plan '{$planName}' not found in plan_list table (extracted from '{$desiredPlan}')");
            }

            if (!$plan->price || $plan->price <= 0) {
                throw new \Exception("Plan '{$planName}' has invalid price: " . ($plan->price ?? 'NULL'));
            }

            $adjustedDate = $this->calculateAdjustedBillingDate($account, $invoiceDate);
            $dueDate = $adjustedDate->copy()->addDays(self::DAYS_UNTIL_DUE);

            $invoiceId = $this->generateInvoiceId($invoiceDate);
            
            $prorateAmount = $this->calculateProrateAmount($account, $plan->price, $adjustedDate);
            $charges = $this->calculateChargesAndDeductions(
                $account, 
                $invoiceDate, 
                $userId, 
                $invoiceId,
                $plan->price
            );
            
            $othersBasicCharges = $charges['staggered_fees'] + 
                                  $charges['staggered_install_fees'] + 
                                  $charges['service_fees'] - 
                                  $charges['total_deductions'];

            $totalAmount = $prorateAmount + $othersBasicCharges;
            
            if ($account->account_balance < 0) {
                $totalAmount += $account->account_balance;
            }

            $invoice = Invoice::create([
                'account_id' => $account->id,
                'invoice_date' => $invoiceDate,
                'invoice_balance' => round($prorateAmount, 2),
                'others_and_basic_charges' => round($othersBasicCharges, 2),
                'total_amount' => round($totalAmount, 2),
                'received_payment' => 0.00,
                'due_date' => $dueDate,
                'status' => $totalAmount <= 0 ? 'Paid' : 'Unpaid',
                'payment_portal_log_ref' => null,
                'transaction_id' => null,
                'created_by' => (string) $userId,
                'updated_by' => (string) $userId
            ]);

            $newBalance = $account->account_balance > 0 
                ? $totalAmount + $account->account_balance 
                : $totalAmount;

            $account->update([
                'account_balance' => round($newBalance, 2),
                'balance_update_date' => $invoiceDate
            ]);

            DB::commit();
            return $invoice;

        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    protected function generateInvoiceId(Carbon $date): string
    {
        $year = $date->format('y');
        $month = $date->format('m');
        $day = $date->format('d');
        $hour = $date->format('H');
        $randomId = '0000';
        
        return $year . $month . $day . $hour . $randomId;
    }

    protected function calculateAdjustedBillingDate(BillingAccount $account, Carbon $baseDate): Carbon
    {
        if ($account->billing_day === self::END_OF_MONTH_BILLING) {
            return $baseDate->copy()->endOfMonth();
        }

        if ($account->billing_day != 30) {
            $daysRemaining = 30 - $account->billing_day;
            return $baseDate->copy()->addDays($daysRemaining);
        }
        
        return $baseDate->copy();
    }

    protected function calculateProrateAmount(BillingAccount $account, float $monthlyFee, Carbon $currentDate): float
    {
        if ($account->balance_update_date) {
            return $monthlyFee;
        }

        if (!$account->date_installed) {
            return $monthlyFee;
        }

        $dateInstalled = Carbon::parse($account->date_installed);
        $daysToCalculate = $this->getDaysBetweenDatesIncludingDueDate($dateInstalled, $currentDate);
        $dailyRate = $monthlyFee / self::DAYS_IN_MONTH;
        
        return round($dailyRate * $daysToCalculate, 2);
    }

    protected function calculateChargesAndDeductions(
        BillingAccount $account, 
        Carbon $date, 
        int $userId, 
        string $invoiceId,
        float $monthlyFee
    ): array {
        $staggeredFees = $this->calculateStaggeredFees($account, $userId, $invoiceId);
        $staggeredInstallFees = $this->calculateStaggeredInstallFees($account, $userId, $invoiceId);
        $discounts = $this->calculateDiscounts($account, $userId, $invoiceId);
        $advancedPayments = $this->calculateAdvancedPayments($account, $date, $userId, $invoiceId);
        $rebates = $this->calculateRebates($account, $date, $monthlyFee);
        $serviceFees = $this->calculateServiceFees($account, $date, $userId);
        $paymentReceived = $this->calculatePaymentReceived($account, $date);

        return [
            'staggered_fees' => $staggeredFees,
            'staggered_install_fees' => $staggeredInstallFees,
            'discounts' => $discounts,
            'advanced_payments' => $advancedPayments,
            'rebates' => $rebates,
            'service_fees' => $serviceFees,
            'total_deductions' => $advancedPayments + $discounts + $rebates,
            'payment_received_previous' => $paymentReceived
        ];
    }

    protected function calculateStaggeredFees(BillingAccount $account, int $userId, string $invoiceId): float
    {
        $total = 0;

        $installments = Installment::where('account_id', $account->id)
            ->where('status', 'active')
            ->with('schedules')
            ->get();

        foreach ($installments as $installment) {
            $nextPendingSchedule = InstallmentSchedule::where('installment_id', $installment->id)
                ->where('status', 'pending')
                ->orderBy('installment_no', 'asc')
                ->first();

            if ($nextPendingSchedule) {
                $total += $nextPendingSchedule->amount;
                
                $nextPendingSchedule->update([
                    'invoice_id' => $invoiceId,
                    'status' => 'paid',
                    'updated_by' => $userId
                ]);

                $remainingSchedules = InstallmentSchedule::where('installment_id', $installment->id)
                    ->where('status', 'pending')
                    ->count();

                if ($remainingSchedules === 0) {
                    $installment->update([
                        'status' => 'completed',
                        'updated_by' => $userId
                    ]);
                }
            }
        }

        return round($total, 2);
    }

    /**
     * Calculate staggered installation fees and process monthly payments
     * 
     * This method handles staggered payment plans where:
     * 1. An installment is created with total_balance split across months_to_pay
     * 2. Each billing cycle adds monthly_payment to the balance
     * 3. Decrements months_to_pay by 1 each cycle
     * 4. When months_to_pay reaches 0, marks installment as completed and stops adding fees
     * 
     * Initial Payment Flow:
     * - Account balance: 999
     * - Staggered balance: 888
     * - Immediate deduction: 999 - 888 = 111 (new account balance)
     * - Invoice status: Unpaid (if remaining balance > 0)
     * 
     * Monthly Addition:
     * - Each billing cycle: balance += monthly_payment
     * - Decrements: months_to_pay -= 1
     * - Completion: months_to_pay = 0, status = completed
     * 
     * @param BillingAccount $account
     * @param int $userId
     * @param string $invoiceId
     * @return float Total staggered fees to add to current billing
     */
    protected function calculateStaggeredInstallFees(BillingAccount $account, int $userId, string $invoiceId): float
    {
        $total = 0;

        $installments = Installment::where('account_id', $account->id)
            ->where('status', 'active')
            ->where('months_to_pay', '>', 0)
            ->get();

        Log::info('Processing staggered installments', [
            'account_id' => $account->id,
            'account_no' => $account->account_no,
            'installments_count' => $installments->count()
        ]);

        foreach ($installments as $installment) {
            $total += $installment->monthly_payment;
            
            $newMonthsToPay = $installment->months_to_pay - 1;
            
            Log::info('Processing installment', [
                'installment_id' => $installment->id,
                'monthly_payment' => $installment->monthly_payment,
                'previous_months_to_pay' => $installment->months_to_pay,
                'new_months_to_pay' => $newMonthsToPay
            ]);
            
            if ($newMonthsToPay <= 0) {
                $installment->update([
                    'months_to_pay' => 0,
                    'status' => 'completed',
                    'updated_by' => $userId
                ]);
                
                Log::info('Installment completed', [
                    'installment_id' => $installment->id
                ]);
            } else {
                $installment->update([
                    'months_to_pay' => $newMonthsToPay,
                    'updated_by' => $userId
                ]);
            }
        }

        Log::info('Staggered installments total', [
            'account_id' => $account->id,
            'total_staggered_fees' => $total
        ]);

        return round($total, 2);
    }

    protected function calculateDiscounts(BillingAccount $account, int $userId, string $invoiceId): float
    {
        $total = 0;

        $discounts = Discount::where('account_id', $account->id)
            ->whereIn('status', ['Unused', 'Permanent', 'Monthly'])
            ->get();

        foreach ($discounts as $discount) {
            if ($discount->status === 'Unused') {
                $total += $discount->discount_amount;
                $discount->update([
                    'status' => 'Used',
                    'invoice_used_id' => $invoiceId,
                    'used_date' => now(),
                    'updated_by' => $userId
                ]);
            } elseif ($discount->status === 'Permanent') {
                $total += $discount->discount_amount;
                $discount->update([
                    'invoice_used_id' => $invoiceId,
                    'updated_by' => $userId
                ]);
            } elseif ($discount->status === 'Monthly' && $discount->remaining > 0) {
                $total += $discount->discount_amount;
                $discount->update([
                    'invoice_used_id' => $invoiceId,
                    'remaining' => $discount->remaining - 1,
                    'updated_by' => $userId
                ]);
            }
        }

        return round($total, 2);
    }

    protected function calculateAdvancedPayments(
        BillingAccount $account, 
        Carbon $date, 
        int $userId, 
        string $invoiceId
    ): float {
        $total = 0;
        $currentMonth = $date->format('F');

        $advancedPayments = AdvancedPayment::where('account_id', $account->id)
            ->where('payment_month', $currentMonth)
            ->where('status', 'Unused')
            ->get();

        foreach ($advancedPayments as $payment) {
            $total += $payment->payment_amount;
            $payment->update([
                'status' => 'Used',
                'invoice_used_id' => $invoiceId,
                'updated_by' => $userId
            ]);
        }

        return round($total, 2);
    }

    protected function calculateRebates(BillingAccount $account, Carbon $date, float $monthlyFee): float
    {
        $total = 0;
        
        $customer = $account->customer;
        if (!$customer) {
            return 0;
        }

        $barangayCode = $customer->barangay_id ?? null;
        
        if (!$barangayCode) {
            return 0;
        }

        $billingDayToMatch = $account->billing_day === self::END_OF_MONTH_BILLING 
            ? $date->endOfMonth()->day 
            : $account->billing_day;

        $rebates = MassRebate::where(function($query) use ($barangayCode) {
                $query->where('barangay_code', $barangayCode)
                      ->orWhere('barangay_code', 'All');
            })
            ->where('billing_day', $billingDayToMatch)
            ->where('status', 'Unused')
            ->get();

        foreach ($rebates as $rebate) {
            $dailyRate = $monthlyFee / self::DAYS_IN_MONTH;
            $total += $dailyRate * $rebate->rebate_days;
        }

        return round($total, 2);
    }

    protected function calculateServiceFees(BillingAccount $account, Carbon $date, int $userId): float
    {
        $total = 0;

        $serviceFees = DB::table('service_charge_logs')
            ->where('account_id', $account->id)
            ->where('status', 'Unused')
            ->get();

        foreach ($serviceFees as $fee) {
            $total += $fee->service_charge;
            
            DB::table('service_charge_logs')
                ->where('id', $fee->id)
                ->update([
                    'status' => 'Used',
                    'date_used' => now(),
                    'updated_at' => now()
                ]);
        }

        return round($total, 2);
    }

    protected function calculatePaymentReceived(BillingAccount $account, Carbon $date): float
    {
        $lastMonth = $date->copy()->subMonth()->format('F');
        
        $lastInvoice = Invoice::where('account_id', $account->id)
            ->whereMonth('invoice_date', $date->copy()->subMonth()->month)
            ->whereYear('invoice_date', $date->copy()->subMonth()->year)
            ->first();

        if ($lastInvoice) {
            return $lastInvoice->received_payment ?? 0;
        }

        return 0;
    }

    protected function getDaysBetweenDatesIncludingDueDate(Carbon $startDate, Carbon $endDate): int
    {
        $endDateWithBuffer = $endDate->copy()->addDays(self::DAYS_UNTIL_DUE);
        return $startDate->diffInDays($endDateWithBuffer) + 1;
    }

    public function generateAllBillingsForToday(int $userId): array
    {
        $today = Carbon::now();
        $targetBillingDays = $this->calculateTargetBillingDays($today);
        $advanceGenerationDay = $this->getAdvanceGenerationDay();

        $results = [
            'date' => $today->format('Y-m-d'),
            'advance_generation_day' => $advanceGenerationDay,
            'billing_days_processed' => [],
            'invoices' => ['success' => 0, 'failed' => 0, 'errors' => []],
            'statements' => ['success' => 0, 'failed' => 0, 'errors' => []]
        ];

        foreach ($targetBillingDays as $billingDay) {
            $billingDayLabel = $billingDay === self::END_OF_MONTH_BILLING ? 'End of Month (0)' : "Day {$billingDay}";
            
            Log::info("Processing billing day: {$billingDayLabel}");
            
            $soaResults = $this->generateSOAForBillingDay($billingDay, $today, $userId);
            $invoiceResults = $this->generateInvoicesForBillingDay($billingDay, $today, $userId);
            
            $results['billing_days_processed'][] = $billingDayLabel;
            $results['invoices']['success'] += $invoiceResults['success'];
            $results['invoices']['failed'] += $invoiceResults['failed'];
            $results['invoices']['errors'] = array_merge($results['invoices']['errors'], $invoiceResults['errors']);
            
            $results['statements']['success'] += $soaResults['success'];
            $results['statements']['failed'] += $soaResults['failed'];
            $results['statements']['errors'] = array_merge($results['statements']['errors'], $soaResults['errors']);
        }

        return $results;
    }

    public function generateBillingsForSpecificDay(int $billingDay, int $userId): array
    {
        $today = Carbon::now();

        $soaResults = $this->generateSOAForBillingDay($billingDay, $today, $userId);
        $invoiceResults = $this->generateInvoicesForBillingDay($billingDay, $today, $userId);

        return [
            'date' => $today->format('Y-m-d'),
            'billing_day' => $billingDay === self::END_OF_MONTH_BILLING ? 'End of Month (0)' : $billingDay,
            'invoices' => $invoiceResults,
            'statements' => $soaResults
        ];
    }

    protected function extractPlanName(string $desiredPlan): string
    {
        if (strpos($desiredPlan, ' - ') !== false) {
            $parts = explode(' - ', $desiredPlan);
            return trim($parts[0]);
        }
        
        return trim($desiredPlan);
    }

    /**
     * Get the previous balance for SOA generation
     * 
     * This method retrieves the correct previous balance to use in the SOA:
     * 1. If a previous SOA exists: Use its total_amount_due (the ending balance from last period)
     * 2. If this is the first SOA: Use the current account_balance
     * 
     * Example:
     * - Previous SOA: total_amount_due = 6694 (this becomes current period's starting balance)
     * - Current SOA: balance_from_previous_bill = 6694
     * 
     * CRITICAL: This method must be called BEFORE invoice generation updates account_balance
     */
    protected function getPreviousBalance(BillingAccount $account, Carbon $currentDate): float
    {
        $lastSoa = StatementOfAccount::where('account_id', $account->id)
            ->where('statement_date', '<', $currentDate)
            ->orderBy('statement_date', 'desc')
            ->first();

        if ($lastSoa) {
            return $lastSoa->total_amount_due ?? 0;
        }

        return $account->account_balance ?? 0;
    }
}
