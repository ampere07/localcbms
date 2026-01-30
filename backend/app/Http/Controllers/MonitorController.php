<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MonitorController extends Controller
{
    public function handle(Request $request)
    {
        $action = $request->query('action', $request->input('action', ''));
        $param  = $request->query('param', '');
        $year   = $request->query('year', date('Y'));

        // scope: overall | today | custom
        $scope  = $request->query('scope', 'overall');
        $start  = $request->query('start', '');
        $end    = $request->query('end', '');

        // barangay filter (uses applications.barangay / customers.barangay where available)
        $bgy    = $request->query('bgy', 'All');

        $response = [
            'status' => 'empty',
            'data' => [],
        ];

        try {
            // -------------------------
            // Helpers
            // -------------------------
            $applyScope = function ($qb, string $col) use ($scope, $start, $end) {
                if ($scope === 'today') {
                    return $qb->whereDate($col, now()->toDateString());
                }

                if ($scope === 'custom' && $start && $end) {
                    // If you pass date only (YYYY-MM-DD), it still works.
                    return $qb->whereBetween($col, [$start, $end]);
                }

                return $qb; // overall
            };

            $applyBarangayOnApplications = function ($qb, string $col = 'applications.barangay') use ($bgy) {
                if (!$bgy || $bgy === 'All') return $qb;
                return $qb->where($col, $bgy);
            };

            // -------------------------
            // Barangay list (from barangay table)
            // -------------------------
            $barangays = DB::table('barangay')
                ->select(DB::raw('TRIM(barangay) as Name'))
                ->where('barangay', '!=', '')
                ->orderBy('barangay')
                ->get();

            $response['barangays'] = $barangays;

            // -------------------------
            // TEMPLATE MANAGEMENT
            // dashboard_templates: id, template_name, layout_data, style_data
            // -------------------------
            if ($action === 'save_template') {
                $name   = $request->input('name', 'Untitled');
                $layout = $request->input('layout', '[]');
                $styles = $request->input('styles', '{}');

                $id = DB::table('dashboard_templates')->insertGetId([
                    'template_name' => $name,
                    'layout_data'   => $layout,
                    'style_data'    => $styles,
                    'created_at'    => now(),
                    'updated_at'    => now(),
                ]);

                return response()->json([
                    'status' => 'success',
                    'id' => $id,
                    'message' => 'Template saved successfully',
                ]);
            }

            if ($action === 'update_template') {
                $id     = $request->input('id');
                $layout = $request->input('layout', '[]');
                $styles = $request->input('styles', '{}');

                DB::table('dashboard_templates')
                    ->where('id', $id)
                    ->update([
                        'layout_data' => $layout,
                        'style_data'  => $styles,
                        'updated_at'  => now(),
                    ]);

                return response()->json(['status' => 'success', 'message' => 'Template updated successfully']);
            }

            if ($action === 'list_templates') {
                $data = DB::table('dashboard_templates')
                    ->select('id', 'template_name', 'created_at')
                    ->orderByDesc('created_at')
                    ->get();

                return response()->json(['status' => 'success', 'data' => $data]);
            }

            if ($action === 'load_template') {
                $id = $request->query('id', 0);
                $res = DB::table('dashboard_templates')->where('id', $id)->first();

                if ($res) return response()->json(['status' => 'success', 'data' => $res]);
                return response()->json(['status' => 'error', 'message' => 'Template not found'], 404);
            }

            if ($action === 'delete_template') {
                $id = $request->input('id', 0);
                DB::table('dashboard_templates')->where('id', $id)->delete();
                return response()->json(['status' => 'success']);
            }

            // -------------------------
            // DATA ACTIONS (based on your SQL dump tables)
            // -------------------------

            // 1) BILLING STATUS (based on billing_accounts + billing_status)
            // NOTE: billing_accounts.billing_status_id -> billing_status.id
            if ($action === 'billing_status') {
                $qb = DB::table('billing_accounts')
                    ->leftJoin('billing_status', 'billing_accounts.billing_status_id', '=', 'billing_status.id')
                    // OPTIONAL barangay filtering via customers table
                    ->leftJoin('customers', 'billing_accounts.customer_id', '=', 'customers.id')
                    ->select(
                        DB::raw("COALESCE(billing_status.status_name, 'Unknown') as label"),
                        DB::raw('COUNT(*) as value')
                    )
                    ->groupBy('billing_status.status_name');

                if ($bgy && $bgy !== 'All') {
                    $qb->where('customers.barangay', $bgy);
                }

                $response['data'] = $qb->get();
                $response['status'] = 'success';
                return response()->json($response);
            }

            // 2) ONLINE STATUS (online_status.session_status or session_status?)
            if ($action === 'online_status') {
                $qb = DB::table('online_status')
                    ->select(
                        DB::raw("COALESCE(session_status, 'Unknown') as label"),
                        DB::raw('COUNT(*) as value')
                    )
                    ->groupBy('session_status');

                $response['data'] = $qb->get();
                $response['status'] = 'success';
                return response()->json($response);
            }

            // 3) APPLICATION STATUS (applications.status)
            if ($action === 'app_status') {
                $qb = DB::table('applications')
                    ->select(
                        DB::raw("COALESCE(status, 'Unknown') as label"),
                        DB::raw('COUNT(*) as value')
                    );

                $applyScope($qb, 'applications.timestamp');
                $applyBarangayOnApplications($qb, 'applications.barangay');

                $qb->groupBy('applications.status');

                $response['data'] = $qb->get();
                $response['status'] = 'success';
                return response()->json($response);
            }

            // 4) SO/JO STATUS
            // - job_orders: onsite_status / visit_status is in service_orders (visit_status)
            if ($action === 'jo_status') {
                // param: onsite | billing (you had more in old file; your table has onsite_status)
                $col = ($param === 'onsite') ? 'job_orders.onsite_status' : 'job_orders.onsite_status';

                $qb = DB::table('job_orders')
                    ->select(
                        DB::raw("COALESCE($col, 'Unknown') as label"),
                        DB::raw('COUNT(*) as value')
                    );

                $applyScope($qb, 'job_orders.timestamp');

                // optional barangay filter via applications (job_orders.application_id)
                $qb->leftJoin('applications', 'job_orders.application_id', '=', 'applications.id');
                $applyBarangayOnApplications($qb, 'applications.barangay');

                $qb->whereNotNull($col)->where($col, '!=', '');
                $qb->groupBy(DB::raw($col));

                $response['data'] = $qb->get();
                $response['status'] = 'success';
                return response()->json($response);
            }

            if ($action === 'so_status') {
                // param: visit | support (your table has support_status + visit_status)
                $col = ($param === 'support') ? 'service_orders.support_status' : 'service_orders.visit_status';

                $qb = DB::table('service_orders')
                    ->select(
                        DB::raw("COALESCE($col, 'Unknown') as label"),
                        DB::raw('COUNT(*) as value')
                    );

                $applyScope($qb, 'service_orders.timestamp');

                // optional barangay filter via billing_accounts->customers
                $qb->leftJoin('billing_accounts', 'service_orders.account_no', '=', 'billing_accounts.account_no')
                   ->leftJoin('customers', 'billing_accounts.customer_id', '=', 'customers.id');

                if ($bgy && $bgy !== 'All') {
                    $qb->where('customers.barangay', $bgy);
                }

                $qb->whereNotNull($col)->where($col, '!=', '');
                $qb->groupBy(DB::raw($col));

                $response['data'] = $qb->get();
                $response['status'] = 'success';
                return response()->json($response);
            }

            // 5) QUEUE MONITOR (In Progress per assigned_email)
            if ($action === 'queue_mon') {
                $isJo = ($param === 'jo');

                if ($isJo) {
                    $qb = DB::table('job_orders')
                        ->select('assigned_email as raw_email', DB::raw('COUNT(*) as value'))
                        ->where('onsite_status', 'In Progress')
                        ->whereNotNull('assigned_email')
                        ->where('assigned_email', '!=', '');

                    $applyScope($qb, 'job_orders.timestamp');
                    $qb->groupBy('assigned_email');

                    // optional barangay filter via applications
                    $qb->leftJoin('applications', 'job_orders.application_id', '=', 'applications.id');
                    $applyBarangayOnApplications($qb, 'applications.barangay');
                } else {
                    $qb = DB::table('service_orders')
                        ->select('assigned_email as raw_email', DB::raw('COUNT(*) as value'))
                        ->where('visit_status', 'In Progress')
                        ->whereNotNull('assigned_email')
                        ->where('assigned_email', '!=', '');

                    $applyScope($qb, 'service_orders.timestamp');
                    $qb->groupBy('assigned_email');

                    // optional barangay filter via billing_accounts->customers
                    $qb->leftJoin('billing_accounts', 'service_orders.account_no', '=', 'billing_accounts.account_no')
                       ->leftJoin('customers', 'billing_accounts.customer_id', '=', 'customers.id');

                    if ($bgy && $bgy !== 'All') {
                        $qb->where('customers.barangay', $bgy);
                    }
                }

                $raw = $qb->get();

                $data = [];
                foreach ($raw as $row) {
                    $email = $row->raw_email ?? '';
                    $beforeAt = explode('@', $email)[0] ?? $email;
                    $name = ucwords(str_replace(['.', '_'], ' ', $beforeAt));
                    $data[] = ['label' => $name, 'value' => (int)$row->value];
                }

                return response()->json(['status' => 'success', 'data' => $data, 'barangays' => $response['barangays']]);
            }

            // 6) TECH PERFORMANCE (Done/Reschedule/Failed)
            // job_orders: visit_by, visit_with, visit_with_other + onsite_status
            // service_orders: visit_by_user, visit_with + visit_status
            if ($action === 'tech_mon_jo') {
                $qb = DB::table('job_orders')
                    ->select(
                        DB::raw("UPPER(TRIM(visit_by)) as tech"),
                        DB::raw("onsite_status as status"),
                        DB::raw("COUNT(*) as count")
                    )
                    ->whereIn('onsite_status', ['Done', 'Reschedule', 'Failed']);

                $applyScope($qb, 'job_orders.updated_at'); // closest equivalent to "Modified Date"
                $qb->whereNotNull('visit_by')->where('visit_by', '!=', '');
                $qb->groupBy('tech', 'status');

                $rows1 = $qb->get();

                // Also include visit_with and visit_with_other
                $rows2 = DB::table('job_orders')
                    ->select(DB::raw("UPPER(TRIM(visit_with)) as tech"), DB::raw("onsite_status as status"), DB::raw("COUNT(*) as count"))
                    ->whereIn('onsite_status', ['Done', 'Reschedule', 'Failed'])
                    ->whereNotNull('visit_with')->where('visit_with', '!=', '')
                    ->tap(fn($q) => $applyScope($q, 'job_orders.updated_at'))
                    ->groupBy('tech', 'status')
                    ->get();

                $rows3 = DB::table('job_orders')
                    ->select(DB::raw("UPPER(TRIM(visit_with_other)) as tech"), DB::raw("onsite_status as status"), DB::raw("COUNT(*) as count"))
                    ->whereIn('onsite_status', ['Done', 'Reschedule', 'Failed'])
                    ->whereNotNull('visit_with_other')->where('visit_with_other', '!=', '')
                    ->tap(fn($q) => $applyScope($q, 'job_orders.updated_at'))
                    ->groupBy('tech', 'status')
                    ->get();

                $all = $rows1->concat($rows2)->concat($rows3);

                $structured = [];
                foreach ($all as $r) {
                    $tech = ucwords(strtolower($r->tech ?? ''));
                    if ($tech === '') continue;
                    if (!isset($structured[$tech])) $structured[$tech] = ['label' => $tech, 'series' => []];
                    $structured[$tech]['series'][$r->status] = ($structured[$tech]['series'][$r->status] ?? 0) + (int)$r->count;
                }

                return response()->json(['status' => 'success', 'data' => array_values($structured), 'barangays' => $response['barangays']]);
            }

            if ($action === 'tech_mon_so') {
                $rows1 = DB::table('service_orders')
                    ->select(DB::raw("UPPER(TRIM(visit_by_user)) as tech"), DB::raw("visit_status as status"), DB::raw("COUNT(*) as count"))
                    ->whereIn('visit_status', ['Done', 'Reschedule', 'Failed'])
                    ->whereNotNull('visit_by_user')->where('visit_by_user', '!=', '')
                    ->tap(fn($q) => $applyScope($q, 'service_orders.updated_at'))
                    ->groupBy('tech', 'status')
                    ->get();

                $rows2 = DB::table('service_orders')
                    ->select(DB::raw("UPPER(TRIM(visit_with)) as tech"), DB::raw("visit_status as status"), DB::raw("COUNT(*) as count"))
                    ->whereIn('visit_status', ['Done', 'Reschedule', 'Failed'])
                    ->whereNotNull('visit_with')->where('visit_with', '!=', '')
                    ->tap(fn($q) => $applyScope($q, 'service_orders.updated_at'))
                    ->groupBy('tech', 'status')
                    ->get();

                $all = $rows1->concat($rows2);

                $structured = [];
                foreach ($all as $r) {
                    $tech = ucwords(strtolower($r->tech ?? ''));
                    if ($tech === '') continue;
                    if (!isset($structured[$tech])) $structured[$tech] = ['label' => $tech, 'series' => []];
                    $structured[$tech]['series'][$r->status] = ($structured[$tech]['series'][$r->status] ?? 0) + (int)$r->count;
                }

                return response()->json(['status' => 'success', 'data' => array_values($structured), 'barangays' => $response['barangays']]);
            }

            // 7) INVOICE/TRANSACTIONS/PORTAL yearly chart
            if (in_array($action, ['invoice_mon', 'transactions_mon', 'portal_mon'], true)) {
                if ($action === 'invoice_mon') {
                    $dateCol = 'invoices.invoice_date';
                    $statusCol = 'invoices.status';
                    $valExpr = ($param === 'amount')
                        ? DB::raw("SUM(COALESCE(invoices.total_amount,0)) as val")
                        : DB::raw("COUNT(*) as val");

                    $qb = DB::table('invoices')
                        ->select(
                            DB::raw("MONTHNAME($dateCol) as label"),
                            DB::raw("$statusCol as status"),
                            $valExpr
                        )
                        ->whereYear($dateCol, $year)
                        ->groupBy(DB::raw("MONTH($dateCol)"), 'status')
                        ->orderBy(DB::raw("MONTH($dateCol)"));
                } elseif ($action === 'transactions_mon') {
                    $dateCol = 'transactions.date_processed';
                    $statusCol = 'transactions.status';
                    $valExpr = ($param === 'amount')
                        ? DB::raw("SUM(COALESCE(transactions.received_payment,0)) as val")
                        : DB::raw("COUNT(*) as val");

                    $qb = DB::table('transactions')
                        ->select(DB::raw("MONTHNAME($dateCol) as label"), DB::raw("$statusCol as status"), $valExpr)
                        ->whereYear($dateCol, $year)
                        ->groupBy(DB::raw("MONTH($dateCol)"), 'status')
                        ->orderBy(DB::raw("MONTH($dateCol)"));
                } else {
                    $dateCol = 'payment_portal_logs.date_time';
                    $statusCol = 'payment_portal_logs.status';
                    $valExpr = ($param === 'amount')
                        ? DB::raw("SUM(COALESCE(payment_portal_logs.total_amount,0)) as val")
                        : DB::raw("COUNT(*) as val");

                    $qb = DB::table('payment_portal_logs')
                        ->select(DB::raw("MONTHNAME($dateCol) as label"), DB::raw("$statusCol as status"), $valExpr)
                        ->whereYear($dateCol, $year)
                        ->groupBy(DB::raw("MONTH($dateCol)"), 'status')
                        ->orderBy(DB::raw("MONTH($dateCol)"));
                }

                $raw = $qb->get();

                $months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
                $structured = [];
                foreach ($months as $m) $structured[$m] = ['label' => $m, 'series' => []];

                foreach ($raw as $row) {
                    if (isset($structured[$row->label])) {
                        $structured[$row->label]['series'][$row->status ?? 'Unknown'] = (float)$row->val;
                    }
                }

                return response()->json(['status' => 'success', 'data' => array_values($structured), 'barangays' => $response['barangays']]);
            }

            // 8) EXPENSES (your real table is expenses_log; category_id exists)
            if ($action === 'expenses_mon') {
                $qb = DB::table('expenses_log')
                    ->leftJoin('expenses_category', 'expenses_log.category_id', '=', 'expenses_category.id')
                    ->select(
                        DB::raw("COALESCE(expenses_category.category_name, 'Unknown') as label"),
                        DB::raw("SUM(COALESCE(expenses_log.amount,0)) as value")
                    );

                $applyScope($qb, 'expenses_log.expense_date');
                $qb->groupBy('expenses_category.category_name')
                   ->orderByDesc('value');

                return response()->json(['status' => 'success', 'data' => $qb->get(), 'barangays' => $response['barangays']]);
            }

            // 9) PAYMENT METHODS (transactions.payment_method)
            if ($action === 'pay_method_mon') {
                $qb = DB::table('transactions')
                    ->select(
                        DB::raw("COALESCE(payment_method, 'Unknown') as label"),
                        DB::raw("SUM(COALESCE(received_payment,0)) as value")
                    )
                    ->whereNotNull('payment_method')
                    ->where('payment_method', '!=', '');

                $applyScope($qb, 'transactions.date_processed');
                $qb->groupBy('payment_method')
                   ->orderByDesc('value');

                return response()->json(['status' => 'success', 'data' => $qb->get(), 'barangays' => $response['barangays']]);
            }

            // 10) MAP (applications.long_lat or applications.location? you have long_lat varchar(255))
            if ($action === 'app_map') {
                $qb = DB::table('applications')
                    ->select('first_name', 'middle_initial', 'last_name', 'long_lat', 'desired_plan', 'barangay')
                    ->whereNotNull('long_lat')
                    ->where('long_lat', '!=', '');

                $applyScope($qb, 'applications.timestamp');
                $applyBarangayOnApplications($qb, 'applications.barangay');

                $raw = $qb->get();
                $data = [];
                foreach ($raw as $row) {
                    $data[] = [
                        'name'  => trim(($row->first_name ?? '').' '.($row->last_name ?? '')),
                        'coords'=> $row->long_lat,
                        'plan'  => $row->desired_plan,
                        'bgy'   => $row->barangay,
                    ];
                }

                return response()->json(['status' => 'success', 'data' => $data, 'barangays' => $response['barangays']]);
            }

            // 11) REFER RANK (job_orders.referred_by)
            if ($action === 'jo_refer_rank') {
                $qb = DB::table('job_orders')
                    ->select(
                        DB::raw("COALESCE(referred_by, 'Unknown') as label"),
                        DB::raw("COUNT(*) as value")
                    )
                    ->where('onsite_status', 'Done')
                    ->whereNotNull('referred_by')
                    ->where('referred_by', '!=', '');

                $applyScope($qb, 'job_orders.timestamp');

                $qb->groupBy('referred_by')
                   ->orderByDesc('value')
                   ->limit(20);

                return response()->json(['status' => 'success', 'data' => $qb->get(), 'barangays' => $response['barangays']]);
            }

            // 12) INVOICE OVERALL (invoices.status)
            if ($action === 'invoice_overall') {
                $qb = DB::table('invoices')
                    ->select(
                        DB::raw("COALESCE(status, 'Unknown') as label"),
                        DB::raw("COUNT(*) as value")
                    )
                    ->groupBy('status');

                return response()->json(['status' => 'success', 'data' => $qb->get(), 'barangays' => $response['barangays']]);
            }

            return response()->json([
                'status' => 'error',
                'message' => "Unknown action: $action",
                'barangays' => $response['barangays'],
            ], 400);

        } catch (\Throwable $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage(),
            ], 500);
        }
    }
}