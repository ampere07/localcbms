<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class LiveMonitorController extends Controller
{
    // ========================================
    // HELPER METHODS
    // ========================================

    /**
     * Get scope filter for date queries
     * @param string $column The date column name
     * @param string $scope 'today', 'overall', or 'custom'
     * @param string|null $start Start date for custom range
     * @param string|null $end End date for custom range
     * @return \Closure Query builder closure
     */
    private function applyScopeFilter($query, $column, $scope, $start = null, $end = null)
    {
        if ($scope === 'today') {
            return $query->whereDate($column, Carbon::today());
        }
        
        // Future proofing: Custom date range
        if ($scope === 'custom' && $start && $end) {
            return $query->whereBetween($column, [$start, $end]);
        }
        
        // Default 'overall' - no filter
        return $query;
    }

    private function getBarangays()
    {
        return DB::table('barangay')
            ->select('barangay as Name')
            ->whereNotNull('barangay')
            ->where('barangay', '!=', '')
            ->distinct()
            ->get();
    }

    private function formatResponse($data, $barangays = null)
    {
        $response = [
            'status' => !empty($data) ? 'success' : 'empty',
            'data' => $data,
            'barangays' => $barangays ?? []
        ];
        return response()->json($response);
    }

    private function handleError(\Exception $e)
    {
        \Log::error('LiveMonitor Error: ' . $e->getMessage());
        return response()->json([
            'status' => 'error',
            'message' => $e->getMessage()
        ]);
    }

    private function structureMonthlyData($rawData)
    {
        $months = ['January', 'February', 'March', 'April', 'May', 'June', 
                  'July', 'August', 'September', 'October', 'November', 'December'];
        
        $structured = [];
        foreach ($months as $m) {
            $structured[$m] = ['label' => $m, 'series' => []];
        }

        foreach ($rawData as $row) {
            if (isset($structured[$row->label])) {
                $structured[$row->label]['series'][$row->Status] = $row->val;
            }
        }

        return array_values($structured);
    }

    // ========================================
    // WIDGET DATA METHODS
    // ========================================

    /**
     * Get Billing Status Data
     * NOTE: This does NOT filter by date scope per api.php requirements
     */
    private function getBillingStatusData($bgy)
    {
        $query = DB::table('billing_accounts as ba')
            ->leftJoin('billing_status as bs', 'ba.billing_status_id', '=', 'bs.id')
            ->leftJoin('customers as c', 'ba.customer_id', '=', 'c.id')
            ->select('bs.status_name as label', DB::raw('COUNT(*) as value'))
            ->whereNotNull('bs.status_name')
            ->whereIn('bs.status_name', ['Active', 'Inactive', 'VIP', 'Pullout']);

        if ($bgy !== 'All') {
            $query->where(DB::raw('TRIM(c.barangay)'), $bgy);
        }

        return $query->groupBy('bs.status_name')->get();
    }

    private function getOnlineStatusData()
    {
        return DB::table('online_status')
            ->select(
                DB::raw("CASE 
                    WHEN session_status = 'active' THEN 'Online'
                    WHEN session_status = 'inactive' THEN 'Offline'
                    WHEN session_status = 'blocked' THEN 'Blocked'
                    WHEN session_status = 'not_found' THEN 'Not Found'
                    ELSE COALESCE(session_status, 'Unknown')
                END as label"),
                DB::raw('COUNT(*) as value')
            )
            ->whereNotNull('session_status')
            ->whereIn('session_status', ['active', 'inactive', 'blocked', 'not_found'])
            ->groupBy('session_status')
            ->get();
    }

    private function getAppStatusData($scope, $bgy, $start = null, $end = null)
    {
        $query = DB::table('applications')
            ->select('status as label', DB::raw('COUNT(*) as value'))
            ->whereNotNull('status');

        $query = $this->applyScopeFilter($query, 'timestamp', $scope, $start, $end);

        if ($bgy !== 'All') {
            $query->where(DB::raw('TRIM(barangay)'), $bgy);
        }

        return $query->groupBy('status')->get();
    }

    private function getServiceOrderStatusData($param, $scope, $bgy, $start = null, $end = null)
    {
        $colMapping = [
            'support' => 'support_status',
            'visit' => 'visit_status',
            'onsite' => 'onsite_status',
            'billing' => 'billing_status'
        ];
        
        $col = $colMapping[$param] ?? 'support_status';
        
        $query = DB::table('service_orders')
            ->select("$col as label", DB::raw('COUNT(*) as value'))
            ->whereNotNull($col)
            ->where($col, '!=', '');

        $query = $this->applyScopeFilter($query, 'timestamp', $scope, $start, $end);

        if ($bgy !== 'All') {
            $query->whereExists(function($q) use ($bgy) {
                $q->select(DB::raw(1))
                  ->from('billing_accounts as ba')
                  ->leftJoin('customers as c', 'ba.customer_id', '=', 'c.id')
                  ->whereColumn('ba.account_no', 'service_orders.account_no')
                  ->where(DB::raw('TRIM(c.barangay)'), $bgy);
            });
        }

        return $query->groupBy($col)->get();
    }

    private function getJobOrderStatusData($param, $scope, $bgy, $start = null, $end = null)
    {
        $colMapping = [
            'support' => 'support_status',
            'visit' => 'visit_status',
            'onsite' => 'onsite_status',
            'billing' => 'billing_status'
        ];
        
        $col = $colMapping[$param] ?? 'onsite_status';
        
        $query = DB::table('job_orders')
            ->select("$col as label", DB::raw('COUNT(*) as value'))
            ->whereNotNull($col)
            ->where($col, '!=', '');

        $query = $this->applyScopeFilter($query, 'timestamp', $scope, $start, $end);

        if ($bgy !== 'All') {
            $query->whereExists(function($q) use ($bgy) {
                $q->select(DB::raw(1))
                  ->from('billing_accounts as ba')
                  ->leftJoin('customers as c', 'ba.customer_id', '=', 'c.id')
                  ->whereColumn('ba.id', 'job_orders.account_id')
                  ->where(DB::raw('TRIM(c.barangay)'), $bgy);
            });
        }

        return $query->groupBy($col)->get();
    }

    private function getQueueMonitorData($param, $scope, $start = null, $end = null)
    {
        $table = $param === 'jo' ? 'job_orders' : 'service_orders';
        $statusCol = $param === 'jo' ? 'onsite_status' : 'visit_status';

        $query = DB::table($table)
            ->select('assigned_email as raw_email', DB::raw('COUNT(*) as value'))
            ->where($statusCol, 'In Progress')
            ->whereNotNull('assigned_email')
            ->where('assigned_email', '!=', '');

        $query = $this->applyScopeFilter($query, 'timestamp', $scope, $start, $end);

        $raw = $query->groupBy('assigned_email')->get();

        $data = [];
        foreach ($raw as $row) {
            $name = ucwords(str_replace(['.', '_'], ' ', strstr($row->raw_email, '@', true) ?: $row->raw_email));
            $data[] = ['label' => $name, 'value' => $row->value];
        }

        return $data;
    }

    private function getTechPerformanceData($type, $scope, $start = null, $end = null)
    {
        $table = $type === 'jo' ? 'job_orders' : 'service_orders';
        $statusCol = $type === 'jo' ? 'onsite_status' : 'visit_status';
        $visitByCol = $type === 'jo' ? 'visit_by' : 'visit_by_user';
        $dateCol = 'updated_at'; // Using Modified Date equivalent

        // Build UNION query for all technician columns
        $query1 = DB::table($table)
            ->select(
                DB::raw("UPPER(TRIM($visitByCol)) as Tech"),
                "$statusCol as Status"
            );
        
        $query1 = $this->applyScopeFilter($query1, $dateCol, $scope, $start, $end);

        $query2 = DB::table($table)
            ->select(
                DB::raw("UPPER(TRIM(visit_with)) as Tech"),
                "$statusCol as Status"
            );
        
        $query2 = $this->applyScopeFilter($query2, $dateCol, $scope, $start, $end);

        $subQuery = $query1->unionAll($query2);

        // Add third column (visit_with_other for job_orders, visit_with_other for service_orders)
        $thirdCol = $type === 'jo' ? 'visit_with_other' : 'visit_with_other';
        
        $query3 = DB::table($table)
            ->select(
                DB::raw("UPPER(TRIM($thirdCol)) as Tech"),
                "$statusCol as Status"
            );
        
        $query3 = $this->applyScopeFilter($query3, $dateCol, $scope, $start, $end);
        $subQuery = $subQuery->unionAll($query3);

        $raw = DB::table(DB::raw("({$subQuery->toSql()}) as T"))
            ->mergeBindings($subQuery)
            ->select('Tech as label', 'Status', DB::raw('COUNT(*) as count'))
            ->whereNotNull('Tech')
            ->where('Tech', '!=', '')
            ->whereIn('Status', ['Done', 'Reschedule', 'Failed'])
            ->groupBy('Tech', 'Status')
            ->get();

        $structured = [];
        foreach ($raw as $row) {
            $tech = ucwords(strtolower($row->label));
            if (!isset($structured[$tech])) {
                $structured[$tech] = ['label' => $tech, 'series' => []];
            }
            $structured[$tech]['series'][$row->Status] = $row->count;
        }

        return array_values($structured);
    }

    private function getExpensesData($scope, $start = null, $end = null)
    {
        $query = DB::table('expenses_log as el')
            ->leftJoin('expenses_category as ec', 'el.category_id', '=', 'ec.id')
            ->select('ec.category_name as label', DB::raw('SUM(el.amount) as value'))
            ->whereNotNull('ec.category_name');

        $query = $this->applyScopeFilter($query, 'el.expense_date', $scope, $start, $end);

        return $query->groupBy('ec.category_name')
            ->orderBy('value', 'desc')
            ->get();
    }

    private function getPaymentMethodsData($scope, $start = null, $end = null)
    {
        $query = DB::table('transactions')
            ->select('payment_method as label', DB::raw('SUM(received_payment) as value'))
            ->whereNotNull('payment_method')
            ->where('payment_method', '!=', '');

        $query = $this->applyScopeFilter($query, 'date_processed', $scope, $start, $end);

        return $query->groupBy('payment_method')
            ->orderBy('value', 'desc')
            ->get();
    }

    private function getInvoiceMonitorData($param, $year)
    {
        $dateCol = 'invoice_date';
        $statusCol = 'status';
        
        $valCol = $param === 'amount' ? 
            "SUM(CASE WHEN status = 'Unpaid' THEN COALESCE(invoice_balance, 0) ELSE COALESCE(received_payment, 0) END)" : 
            "COUNT(*)";

        $raw = DB::table('invoices')
            ->select(
                DB::raw("MONTHNAME($dateCol) as label"),
                "$statusCol as Status",
                DB::raw("$valCol as val")
            )
            ->whereYear($dateCol, $year)
            ->whereIn('status', ['Paid', 'Unpaid', 'Partial'])
            ->groupBy(DB::raw("MONTH($dateCol)"), $statusCol)
            ->orderBy(DB::raw("MONTH($dateCol)"))
            ->get();

        return $this->structureMonthlyData($raw);
    }

    private function getTransactionsMonitorData($param, $year)
    {
        $dateCol = 'date_processed';
        $statusCol = 'status';
        $valCol = $param === 'amount' ? "SUM(COALESCE(received_payment, 0))" : "COUNT(*)";

        $raw = DB::table('transactions')
            ->select(
                DB::raw("MONTHNAME($dateCol) as label"),
                "$statusCol as Status",
                DB::raw("$valCol as val")
            )
            ->whereYear($dateCol, $year)
            ->whereNotNull($statusCol)
            ->groupBy(DB::raw("MONTH($dateCol)"), $statusCol)
            ->orderBy(DB::raw("MONTH($dateCol)"))
            ->get();

        return $this->structureMonthlyData($raw);
    }

    private function getPortalMonitorData($param, $year)
    {
        $dateCol = 'date_time';
        $statusCol = 'status';
        $valCol = $param === 'amount' ? "SUM(COALESCE(total_amount, 0))" : "COUNT(*)";

        $raw = DB::table('payment_portal_logs')
            ->select(
                DB::raw("MONTHNAME($dateCol) as label"),
                "$statusCol as Status",
                DB::raw("$valCol as val")
            )
            ->whereYear($dateCol, $year)
            ->whereNotNull($statusCol)
            ->groupBy(DB::raw("MONTH($dateCol)"), $statusCol)
            ->orderBy(DB::raw("MONTH($dateCol)"))
            ->get();

        return $this->structureMonthlyData($raw);
    }

    private function getJobOrderReferRankData($scope, $start = null, $end = null)
    {
        $query = DB::table('job_orders as jo')
            ->leftJoin('billing_accounts as ba', 'jo.account_id', '=', 'ba.id')
            ->leftJoin('customers as c', 'ba.customer_id', '=', 'c.id')
            ->select('c.referred_by as label', DB::raw('COUNT(*) as value'))
            ->where('jo.onsite_status', 'Done')
            ->whereNotNull('c.referred_by')
            ->where('c.referred_by', '!=', '');

        $query = $this->applyScopeFilter($query, 'jo.timestamp', $scope, $start, $end);

        return $query->groupBy('c.referred_by')
            ->orderBy('value', 'desc')
            ->limit(20)
            ->get();
    }

    private function getInvoiceOverallData()
    {
        return DB::table('invoices')
            ->select('status as label', DB::raw('COUNT(*) as value'))
            ->whereIn('status', ['Paid', 'Unpaid', 'Partial'])
            ->groupBy('status')
            ->get();
    }

    private function getApplicationMapData($scope, $bgy, $start = null, $end = null)
    {
        $query = DB::table('applications')
            ->select(
                'first_name',
                'middle_initial',
                'last_name',
                'long_lat as address_coordinates',
                'desired_plan',
                'barangay'
            )
            ->whereNotNull('long_lat')
            ->where('long_lat', '!=', '');

        $query = $this->applyScopeFilter($query, 'timestamp', $scope, $start, $end);

        if ($bgy !== 'All') {
            $query->where(DB::raw('TRIM(barangay)'), $bgy);
        }

        $raw = $query->get();

        $data = [];
        foreach ($raw as $row) {
            $name = trim($row->first_name . ' ' . ($row->middle_initial ?? '') . ' ' . $row->last_name);
            $data[] = [
                'name' => $name,
                'coords' => $row->address_coordinates,
                'plan' => $row->desired_plan,
                'bgy' => $row->barangay
            ];
        }

        return $data;
    }

    // ========================================
    // API ENDPOINTS
    // ========================================

    public function billingStatus(Request $request)
    {
        try {
            $bgy = $request->input('bgy', 'All');
            // NOTE: Billing Status does NOT use scope filter per api.php
            $data = $this->getBillingStatusData($bgy);
            $barangays = $this->getBarangays();
            return $this->formatResponse($data, $barangays);
        } catch (\Exception $e) {
            return $this->handleError($e);
        }
    }

    public function onlineStatus(Request $request)
    {
        try {
            $data = $this->getOnlineStatusData();
            return $this->formatResponse($data);
        } catch (\Exception $e) {
            return $this->handleError($e);
        }
    }

    public function appStatus(Request $request)
    {
        try {
            $scope = $request->input('scope', 'overall');
            $bgy = $request->input('bgy', 'All');
            $start = $request->input('start');
            $end = $request->input('end');
            
            $data = $this->getAppStatusData($scope, $bgy, $start, $end);
            $barangays = $this->getBarangays();
            return $this->formatResponse($data, $barangays);
        } catch (\Exception $e) {
            return $this->handleError($e);
        }
    }

    public function soStatus(Request $request)
    {
        try {
            $param = $request->input('param', 'support');
            $scope = $request->input('scope', 'overall');
            $bgy = $request->input('bgy', 'All');
            $start = $request->input('start');
            $end = $request->input('end');
            
            $data = $this->getServiceOrderStatusData($param, $scope, $bgy, $start, $end);
            $barangays = $this->getBarangays();
            return $this->formatResponse($data, $barangays);
        } catch (\Exception $e) {
            return $this->handleError($e);
        }
    }

    public function joStatus(Request $request)
    {
        try {
            $param = $request->input('param', 'onsite');
            $scope = $request->input('scope', 'overall');
            $bgy = $request->input('bgy', 'All');
            $start = $request->input('start');
            $end = $request->input('end');
            
            $data = $this->getJobOrderStatusData($param, $scope, $bgy, $start, $end);
            $barangays = $this->getBarangays();
            return $this->formatResponse($data, $barangays);
        } catch (\Exception $e) {
            return $this->handleError($e);
        }
    }

    public function queueMon(Request $request)
    {
        try {
            $param = $request->input('param', 'jo');
            $scope = $request->input('scope', 'overall');
            $start = $request->input('start');
            $end = $request->input('end');
            
            $data = $this->getQueueMonitorData($param, $scope, $start, $end);
            return $this->formatResponse($data);
        } catch (\Exception $e) {
            return $this->handleError($e);
        }
    }

    public function techMonJo(Request $request)
    {
        try {
            $scope = $request->input('scope', 'overall');
            $start = $request->input('start');
            $end = $request->input('end');
            
            $data = $this->getTechPerformanceData('jo', $scope, $start, $end);
            return $this->formatResponse($data);
        } catch (\Exception $e) {
            return $this->handleError($e);
        }
    }

    public function techMonSo(Request $request)
    {
        try {
            $scope = $request->input('scope', 'overall');
            $start = $request->input('start');
            $end = $request->input('end');
            
            $data = $this->getTechPerformanceData('so', $scope, $start, $end);
            return $this->formatResponse($data);
        } catch (\Exception $e) {
            return $this->handleError($e);
        }
    }

    public function expensesMon(Request $request)
    {
        try {
            $scope = $request->input('scope', 'overall');
            $start = $request->input('start');
            $end = $request->input('end');
            
            $data = $this->getExpensesData($scope, $start, $end);
            return $this->formatResponse($data);
        } catch (\Exception $e) {
            return $this->handleError($e);
        }
    }

    public function payMethodMon(Request $request)
    {
        try {
            $scope = $request->input('scope', 'overall');
            $start = $request->input('start');
            $end = $request->input('end');
            
            $data = $this->getPaymentMethodsData($scope, $start, $end);
            return $this->formatResponse($data);
        } catch (\Exception $e) {
            return $this->handleError($e);
        }
    }

    public function invoiceMon(Request $request)
    {
        try {
            $param = $request->input('param', 'count');
            $year = $request->input('year', date('Y'));
            $data = $this->getInvoiceMonitorData($param, $year);
            return $this->formatResponse($data);
        } catch (\Exception $e) {
            return $this->handleError($e);
        }
    }

    public function transactionsMon(Request $request)
    {
        try {
            $param = $request->input('param', 'count');
            $year = $request->input('year', date('Y'));
            $data = $this->getTransactionsMonitorData($param, $year);
            return $this->formatResponse($data);
        } catch (\Exception $e) {
            return $this->handleError($e);
        }
    }

    public function portalMon(Request $request)
    {
        try {
            $param = $request->input('param', 'count');
            $year = $request->input('year', date('Y'));
            $data = $this->getPortalMonitorData($param, $year);
            return $this->formatResponse($data);
        } catch (\Exception $e) {
            return $this->handleError($e);
        }
    }

    public function joReferRank(Request $request)
    {
        try {
            $scope = $request->input('scope', 'overall');
            $start = $request->input('start');
            $end = $request->input('end');
            
            $data = $this->getJobOrderReferRankData($scope, $start, $end);
            return $this->formatResponse($data);
        } catch (\Exception $e) {
            return $this->handleError($e);
        }
    }

    public function invoiceOverall(Request $request)
    {
        try {
            $data = $this->getInvoiceOverallData();
            return $this->formatResponse($data);
        } catch (\Exception $e) {
            return $this->handleError($e);
        }
    }

    public function appMap(Request $request)
    {
        try {
            $scope = $request->input('scope', 'overall');
            $bgy = $request->input('bgy', 'All');
            $start = $request->input('start');
            $end = $request->input('end');
            
            $data = $this->getApplicationMapData($scope, $bgy, $start, $end);
            $barangays = $this->getBarangays();
            return $this->formatResponse($data, $barangays);
        } catch (\Exception $e) {
            return $this->handleError($e);
        }
    }

    // ========================================
    // TEMPLATE MANAGEMENT
    // ========================================

    public function getTemplates(Request $request)
    {
        try {
            $templates = DB::table('dashboard_templates')
                ->select('id', 'template_name', 'layout_data', 'style_data', 'created_at', 'updated_at')
                ->orderBy('created_at', 'desc')
                ->get();

            $formatted = $templates->map(function($template) {
                return [
                    'id' => $template->id,
                    'name' => $template->template_name,
                    'states' => json_decode($template->layout_data, true),
                    'timestamp' => $template->created_at
                ];
            });

            return response()->json([
                'status' => 'success',
                'data' => $formatted
            ]);
        } catch (\Exception $e) {
            return $this->handleError($e);
        }
    }

    public function saveTemplate(Request $request)
    {
        try {
            $request->validate([
                'template_name' => 'required|string|max:255',
                'layout_data' => 'required'
            ]);

            $id = DB::table('dashboard_templates')->insertGetId([
                'template_name' => $request->input('template_name'),
                'layout_data' => json_encode($request->input('layout_data')),
                'style_data' => json_encode($request->input('style_data', [])),
                'created_at' => now(),
                'updated_at' => now()
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Template saved successfully',
                'data' => [
                    'id' => $id,
                    'name' => $request->input('template_name'),
                    'states' => $request->input('layout_data'),
                    'timestamp' => now()->toISOString()
                ]
            ]);
        } catch (\Exception $e) {
            return $this->handleError($e);
        }
    }

    public function deleteTemplate(Request $request, $id)
    {
        try {
            $deleted = DB::table('dashboard_templates')
                ->where('id', $id)
                ->delete();

            if ($deleted) {
                return response()->json([
                    'status' => 'success',
                    'message' => 'Template deleted successfully'
                ]);
            }

            return response()->json([
                'status' => 'error',
                'message' => 'Template not found'
            ], 404);
        } catch (\Exception $e) {
            return $this->handleError($e);
        }
    }
}
