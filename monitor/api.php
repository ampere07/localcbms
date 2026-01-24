<?php
require 'config.php'; 
header('Content-Type: application/json');

$action = $_GET['action'] ?? $_POST['action'] ?? '';
$param  = $_GET['param'] ?? '';
$year   = isset($_GET['year']) ? $_GET['year'] : date('Y');

$scope = $_GET['scope'] ?? 'overall';
$startDt = $_GET['start'] ?? '';
$endDt   = $_GET['end'] ?? '';

function getScopeFilter($col, $scope, $start, $end) {
    if ($scope === 'today') {
        return "DATE(`$col`) = CURDATE()";
    }
    if ($start && $end && $scope === 'custom') {
        return "`$col` BETWEEN '$start' AND '$end'";
    }
    return "1=1";
}

$response = ['status' => 'empty', 'data' => []];

try {
    // --- TEMPLATE MANAGEMENT ---
    if ($action === 'save_template') {
        $name = $_POST['name'] ?? 'Untitled';
        $layout = $_POST['layout'] ?? '[]';
        $styles = $_POST['styles'] ?? '{}';
        
        $stmt = $pdo->prepare("INSERT INTO dashboard_templates (template_name, layout_data, style_data) VALUES (?, ?, ?)");
        if($stmt->execute([$name, $layout, $styles])) {
            echo json_encode(['status' => 'success', 'id' => $pdo->lastInsertId(), 'message' => 'Template saved successfully']);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Failed to save']);
        }
        exit;
    }

    if ($action === 'update_template') {
        $id = $_POST['id'];
        $layout = $_POST['layout'] ?? '[]';
        $styles = $_POST['styles'] ?? '{}';

        $stmt = $pdo->prepare("UPDATE dashboard_templates SET layout_data = ?, style_data = ? WHERE id = ?");
        if($stmt->execute([$layout, $styles, $id])) {
            echo json_encode(['status' => 'success', 'message' => 'Template updated successfully']);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Failed to update']);
        }
        exit;
    }

    if ($action === 'list_templates') {
        $stmt = $pdo->query("SELECT id, template_name, created_at FROM dashboard_templates ORDER BY created_at DESC");
        echo json_encode(['status' => 'success', 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        exit;
    }

    if ($action === 'load_template') {
        $id = $_GET['id'] ?? 0;
        $stmt = $pdo->prepare("SELECT * FROM dashboard_templates WHERE id = ?");
        $stmt->execute([$id]);
        $res = $stmt->fetch(PDO::FETCH_ASSOC);
        if($res) echo json_encode(['status' => 'success', 'data' => $res]);
        else echo json_encode(['status' => 'error', 'message' => 'Template not found']);
        exit;
    }

    if ($action === 'delete_template') {
        $id = $_POST['id'] ?? 0;
        $stmt = $pdo->prepare("DELETE FROM dashboard_templates WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(['status' => 'success']);
        exit;
    }

    // --- DATA FETCHING ---
    
    // Fetch Barangay Map
    $bgyMap = [];
    try {
        $stmt = $pdo->query("SELECT `id`, TRIM(`barangay`) as barangay FROM `barangay` WHERE `barangay` != ''");
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) { 
            $bgyMap[$row['barangay']] = $row['id']; 
        }
    } catch(Exception $e) { }

    $response['barangays'] = [];
    foreach($bgyMap as $name => $id) $response['barangays'][] = ['Name' => $name];

    $getBgyFilter = function($selectedBgy, $colName, $useId = true) use ($bgyMap) {
        if (!$selectedBgy || $selectedBgy === 'All') return "";
        if ($useId) {
            $id = $bgyMap[$selectedBgy] ?? null;
            return $id ? "AND `$colName` = '$id'" : "AND 1=0";
        } else {
            return "AND TRIM(`$colName`) = '$selectedBgy'";
        }
    };
    
    $bgy = $_GET['bgy'] ?? 'All';
    $data = []; 
    $query = "";

    // 1. BILLING STATUS
    if ($action === 'billing_status') {
        $where = "1=1";
        if ($bgy !== 'All') {
            $bgyFilter = $getBgyFilter($bgy, 'ba.barangay', false);
            $where .= " " . str_replace("AND", "", $bgyFilter);
        }
        
        $query = "SELECT bs.status_name as label, COUNT(*) as value 
                  FROM billing_accounts ba
                  LEFT JOIN billing_status bs ON ba.billing_status_id = bs.id
                  LEFT JOIN customers c ON ba.customer_id = c.id
                  WHERE $where AND bs.status_name IS NOT NULL
                  GROUP BY bs.status_name";
    }
    
    // 2. ONLINE STATUS
    elseif ($action === 'online_status') {
        $query = "SELECT 
                    CASE 
                        WHEN `session_status` = 'active' THEN 'Online'
                        WHEN `session_status` = 'inactive' THEN 'Offline'
                        ELSE COALESCE(`session_status`, 'Unknown')
                    END as label, 
                    COUNT(*) as value 
                  FROM `online_status` 
                  WHERE `session_status` IS NOT NULL
                  GROUP BY `session_status`";
    }
    
    // 3. APP STATUS
    elseif ($action === 'app_status') {
        $where = getScopeFilter('timestamp', $scope, $startDt, $endDt) . " " . $getBgyFilter($bgy, 'barangay', false);
        $query = "SELECT `status` as label, COUNT(*) as value 
                  FROM `applications` 
                  WHERE $where AND `status` IS NOT NULL
                  GROUP BY `status`";
    }
    
    // 4. SO STATUS
    elseif ($action === 'so_status') {
        $col = ($param === 'support') ? "`support_status`" : "`visit_status`";
        $where = getScopeFilter('timestamp', $scope, $startDt, $endDt);
        
        if ($bgy !== 'All') {
            $where .= " AND EXISTS (
                SELECT 1 FROM billing_accounts ba 
                LEFT JOIN customers c ON ba.customer_id = c.id 
                WHERE ba.account_no = service_orders.account_no 
                AND TRIM(c.barangay) = '$bgy'
            )";
        }
        
        $query = "SELECT $col as label, COUNT(*) as value 
                  FROM `service_orders` 
                  WHERE $where AND $col != '' AND $col IS NOT NULL
                  GROUP BY $col";
    }
    
    // 5. JO STATUS
    elseif ($action === 'jo_status') {
        $col = ($param === 'onsite') ? "`onsite_status`" : "`onsite_status`";
        $where = getScopeFilter('timestamp', $scope, $startDt, $endDt);
        
        if ($bgy !== 'All') {
            $where .= " AND EXISTS (
                SELECT 1 FROM billing_accounts ba 
                LEFT JOIN customers c ON ba.customer_id = c.id 
                WHERE ba.id = job_orders.account_id 
                AND TRIM(c.barangay) = '$bgy'
            )";
        }
        
        $query = "SELECT $col as label, COUNT(*) as value 
                  FROM `job_orders` 
                  WHERE $where AND $col != '' AND $col IS NOT NULL
                  GROUP BY $col";
    }
    
    // 6. QUEUE MONITOR
    elseif ($action === 'queue_mon') {
        $table = ($param === 'jo') ? "`job_orders`" : "`service_orders`";
        $statusCol = ($param === 'jo') ? "`onsite_status`" : "`visit_status`";
        $dateCol = "timestamp"; 
        
        $where = getScopeFilter($dateCol, $scope, $startDt, $endDt);
        $query = "SELECT `assigned_email` as raw_email, COUNT(*) as value 
                  FROM $table 
                  WHERE $statusCol = 'In Progress' AND `assigned_email` != '' AND `assigned_email` IS NOT NULL AND $where 
                  GROUP BY `assigned_email`";
        
        $stmt = $pdo->query($query);
        $raw = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach($raw as $row) {
            $name = ucwords(str_replace(['.', '_'], ' ', strstr($row['raw_email'], '@', true) ?: $row['raw_email']));
            $data[] = ['label' => $name, 'value' => $row['value']];
        }
    }
    
    // 7. TECH PERFORMANCE
    elseif ($action === 'tech_mon_jo' || $action === 'tech_mon_so') {
        $table = ($action === 'tech_mon_jo') ? 'job_orders' : 'service_orders';
        $statusCol = ($action === 'tech_mon_jo') ? 'onsite_status' : 'visit_status';
        $where = getScopeFilter('updated_at', $scope, $startDt, $endDt);
        
        $subQuery = "SELECT UPPER(TRIM(`visit_by_user`)) as Tech, `$statusCol` as Status FROM `$table` WHERE $where 
                     UNION ALL SELECT UPPER(TRIM(`visit_with`)) as Tech, `$statusCol` as Status FROM `$table` WHERE $where";
        
        $query = "SELECT Tech as label, Status, COUNT(*) as count 
                  FROM ($subQuery) as T 
                  WHERE Tech != '' AND Tech IS NOT NULL AND Status IN ('Done', 'Reschedule', 'Failed') 
                  GROUP BY Tech, Status";
        
        $stmt = $pdo->query($query);
        $raw = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $structured = [];
        foreach($raw as $row) {
            $tech = ucwords(strtolower($row['label'])); 
            if(!isset($structured[$tech])) $structured[$tech] = ['label' => $tech, 'series' => []];
            $structured[$tech]['series'][$row['Status']] = $row['count'];
        }
        $data = array_values($structured);
    }
    
    // 8. INVOICE/TRANS
    elseif ($action === 'invoice_mon' || $action === 'transactions_mon' || $action === 'portal_mon') {
        $table = ($action === 'invoice_mon') ? 'invoices' : (($action === 'transactions_mon') ? 'transactions' : 'payment_portal_logs');
        $dateCol = ($action === 'invoice_mon') ? '`invoice_date`' : (($action === 'transactions_mon') ? '`date_processed`' : '`date_time`');
        $statusCol = '`status`';
        $valCol = "COUNT(*)"; 
        $extraWhere = "";
        
        if($action === 'invoice_mon') {
            $valCol = ($param === 'amount') ? "SUM(CASE WHEN `status` = 'Unpaid' THEN COALESCE(`invoice_balance`, 0) ELSE COALESCE(`received_payment`, 0) END)" : "COUNT(*)";
            $extraWhere = "AND `status` IN ('Paid', 'Unpaid', 'Partial')";
        } elseif ($action === 'transactions_mon' || $action === 'portal_mon') {
            $valCol = ($param === 'amount') ? "SUM(COALESCE(" . ($action==='transactions_mon' ? '`received_payment`' : '`total_amount`') . ", 0))" : "COUNT(*)";
        }
        
        $query = "SELECT MONTHNAME($dateCol) as label, $statusCol as Status, $valCol as val 
                  FROM `$table` 
                  WHERE YEAR($dateCol) = '$year' $extraWhere AND $statusCol IS NOT NULL
                  GROUP BY MONTH($dateCol), $statusCol 
                  ORDER BY MONTH($dateCol)";
        
        $stmt = $pdo->query($query);
        $raw = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $structured = [];
        $months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
        foreach($months as $m) $structured[$m] = ['label' => $m, 'series' => []];
        foreach($raw as $row) if(isset($structured[$row['label']])) $structured[$row['label']]['series'][$row['Status']] = $row['val'];
        $data = array_values($structured);
    }
    
    // 9. EXPENSES WIDGET
    elseif ($action === 'expenses_mon') {
        $where = getScopeFilter('expense_date', $scope, $startDt, $endDt);
        $query = "SELECT ec.category_name as label, SUM(el.amount) as value 
                  FROM `expenses_log` el
                  LEFT JOIN `expenses_category` ec ON el.category_id = ec.id
                  WHERE $where AND ec.category_name IS NOT NULL
                  GROUP BY ec.category_name 
                  ORDER BY value DESC";
    }
    
    // 10. PAYMENT METHODS WIDGET
    elseif ($action === 'pay_method_mon') {
        $where = getScopeFilter('date_processed', $scope, $startDt, $endDt);
        $query = "SELECT `payment_method` as label, SUM(`received_payment`) as value 
                  FROM `transactions` 
                  WHERE `payment_method` != '' AND `payment_method` IS NOT NULL AND $where 
                  GROUP BY `payment_method` 
                  ORDER BY value DESC";
    }
    
    // 11. MAP
    elseif ($action === 'app_map') {
        $where = getScopeFilter('timestamp', $scope, $startDt, $endDt) . " " . $getBgyFilter($bgy, 'barangay', false);
        $query = "SELECT 
                    CONCAT_WS(' ', `first_name`, `middle_initial`, `last_name`) as full_name,
                    `address_coordinates`, 
                    `desired_plan`, 
                    `barangay` 
                  FROM `applications` 
                  WHERE `address_coordinates` != '' AND `address_coordinates` IS NOT NULL AND $where";
        
        $stmt = $pdo->query($query);
        $raw = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach($raw as $row) {
            $data[] = [
                'name' => $row['full_name'], 
                'coords' => $row['address_coordinates'], 
                'plan' => $row['desired_plan'], 
                'bgy' => $row['barangay']
            ];
        }
    }
    
    // 12. REFER RANK
    elseif ($action === 'jo_refer_rank') {
        $where = getScopeFilter('timestamp', $scope, $startDt, $endDt);
        $query = "SELECT c.referred_by as label, COUNT(*) as value 
                  FROM `job_orders` jo
                  LEFT JOIN `billing_accounts` ba ON jo.account_id = ba.id
                  LEFT JOIN `customers` c ON ba.customer_id = c.id
                  WHERE jo.onsite_status = 'Done' AND c.referred_by != '' AND c.referred_by IS NOT NULL AND $where 
                  GROUP BY c.referred_by 
                  ORDER BY value DESC 
                  LIMIT 20";
    }
    
    // 13. INVOICE OVERALL
    elseif ($action === 'invoice_overall') {
        $query = "SELECT `status` as label, COUNT(*) as value 
                  FROM `invoices` 
                  WHERE `status` IN ('Paid', 'Unpaid', 'Partial') 
                  GROUP BY `status`";
    }

    // Execute Query if defined and data empty
    if ($query && empty($data)) {
        $stmt = $pdo->query($query);
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    if (!empty($data)) { 
        $response['status'] = 'success'; 
        $response['data'] = $data; 
    }

} catch (Exception $e) { 
    $response['status'] = 'error'; 
    $response['message'] = $e->getMessage(); 
}

echo json_encode($response);
?>
