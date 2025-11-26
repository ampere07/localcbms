<?php

namespace App\Http\Controllers;

use App\Models\ServiceOrder;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class ServiceOrderController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        try {
            Log::info('Fetching service orders with related data');
            
            $query = "SELECT * FROM service_orders";
            $params = [];
            
            if ($request->has('assigned_email')) {
                Log::info('Filtering by assigned_email: ' . $request->assigned_email);
                $query .= " WHERE assigned_email = ?";
                $params[] = $request->assigned_email;
            }
            
            $query .= " ORDER BY created_at DESC";
            $serviceOrders = DB::select($query, $params);
            
            $enrichedOrders = [];
            foreach ($serviceOrders as $order) {
                $customer = DB::selectOne("SELECT * FROM customers WHERE account_no = ?", [$order->account_no]);
                $billingAccount = DB::selectOne("SELECT * FROM billing_accounts WHERE account_no = ?", [$order->account_no]);
                $technicalDetails = DB::selectOne("SELECT * FROM technical_details WHERE account_no = ?", [$order->account_no]);
                $supportConcern = $order->concern_id ? DB::selectOne("SELECT * FROM support_concern WHERE id = ?", [$order->concern_id]) : null;
                $repairCategory = $order->repair_category_id ? DB::selectOne("SELECT * FROM repair_category WHERE id = ?", [$order->repair_category_id]) : null;
                $createdUser = $order->created_by_user_id ? DB::selectOne("SELECT * FROM users WHERE id = ?", [$order->created_by_user_id]) : null;
                $updatedUser = $order->updated_by_user_id ? DB::selectOne("SELECT * FROM users WHERE id = ?", [$order->updated_by_user_id]) : null;
                $visitUser = $order->visit_by_user_id ? DB::selectOne("SELECT * FROM users WHERE id = ?", [$order->visit_by_user_id]) : null;
                
                $enrichedOrders[] = [
                    'id' => $order->id,
                    'ticket_id' => $order->id,
                    'timestamp' => $order->timestamp,
                    'account_no' => $order->account_no,
                    'account_id' => $billingAccount->id ?? null,
                    'full_name' => $customer ? trim(($customer->first_name ?? '') . ' ' . ($customer->middle_initial ?? '') . ' ' . ($customer->last_name ?? '')) : null,
                    'contact_number' => $customer->contact_number_primary ?? null,
                    'full_address' => $customer ? trim(($customer->address ?? '') . ', ' . ($customer->barangay ?? '') . ', ' . ($customer->city ?? '') . ', ' . ($customer->region ?? '')) : null,
                    'contact_address' => $customer->address ?? null,
                    'date_installed' => $billingAccount->date_installed ?? null,
                    'email_address' => $customer->email_address ?? null,
                    'house_front_picture_url' => $customer->house_front_picture_url ?? null,
                    'plan' => $customer->desired_plan ?? null,
                    'group_name' => $customer->group_name ?? null,
                    'username' => $technicalDetails->username ?? null,
                    'connection_type' => $technicalDetails->connection_type ?? null,
                    'router_modem_sn' => $technicalDetails->router_modem_sn ?? null,
                    'lcp' => $technicalDetails->lcp ?? null,
                    'nap' => $technicalDetails->nap ?? null,
                    'port' => $technicalDetails->port ?? null,
                    'vlan' => $technicalDetails->vlan ?? null,
                    'lcpnap' => $technicalDetails->lcpnap ?? null,
                    'concern' => $supportConcern->name ?? null,
                    'concern_remarks' => $order->concern_remarks,
                    'requested_by' => $order->requested_by,
                    'support_status' => $order->support_status,
                    'assigned_email' => $order->assigned_email,
                    'repair_category' => $repairCategory->name ?? null,
                    'visit_status' => $order->visit_status,
                    'priority_level' => $order->priority_level,
                    'visit_by_user' => $visitUser->name ?? null,
                    'visit_with' => $order->visit_with,
                    'visit_remarks' => $order->visit_remarks,
                    'support_remarks' => $order->support_remarks,
                    'service_charge' => $order->service_charge,
                    'new_router_sn' => $order->new_router_sn,
                    'new_lcpnap_id' => $order->new_lcpnap_id,
                    'new_plan_id' => $order->new_plan_id,
                    'client_signature_url' => $order->client_signature_url,
                    'image1_url' => $order->image1_url,
                    'image2_url' => $order->image2_url,
                    'image3_url' => $order->image3_url,
                    'created_at' => $order->created_at,
                    'created_by_user' => $createdUser->name ?? null,
                    'updated_at' => $order->updated_at,
                    'updated_by_user' => $updatedUser->name ?? null,
                ];
            }

            $count = count($enrichedOrders);
            Log::info('Found ' . $count . ' service orders');

            return response()->json([
                'success' => true,
                'data' => $enrichedOrders,
                'count' => $count
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching service orders: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch service orders: ' . $e->getMessage(),
                'error' => $e->getMessage(),
                'file' => $e->getFile() . ':' . $e->getLine()
            ], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'Ticket_ID' => 'required|string|max:255|unique:service_orders,Ticket_ID',
                'Full_Name' => 'required|string|max:255',
                'Contact_Number' => 'required|string|max:255',
                'Full_Address' => 'required|string',
                'Concern' => 'required|string|max:255',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }
            
            $serviceOrder = ServiceOrder::create($request->all());

            return response()->json([
                'success' => true,
                'message' => 'Service order created successfully',
                'data' => $serviceOrder,
            ], 201);
        } catch (\Exception $e) {
            Log::error('Error creating service order: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to create service order',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function show($id): JsonResponse
    {
        try {
            Log::info("Fetching service order with ID: {$id}");
            
            $order = DB::selectOne("SELECT * FROM service_orders WHERE id = ?", [$id]);

            if (!$order) {
                Log::warning("Service order not found: {$id}");
                return response()->json([
                    'success' => false,
                    'message' => 'Service order not found',
                ], 404);
            }
            
            $customer = DB::selectOne("SELECT * FROM customers WHERE account_no = ?", [$order->account_no]);
            $billingAccount = DB::selectOne("SELECT * FROM billing_accounts WHERE account_no = ?", [$order->account_no]);
            $technicalDetails = DB::selectOne("SELECT * FROM technical_details WHERE account_no = ?", [$order->account_no]);
            $supportConcern = $order->concern_id ? DB::selectOne("SELECT * FROM support_concern WHERE id = ?", [$order->concern_id]) : null;
            $repairCategory = $order->repair_category_id ? DB::selectOne("SELECT * FROM repair_category WHERE id = ?", [$order->repair_category_id]) : null;
            $createdUser = $order->created_by_user_id ? DB::selectOne("SELECT * FROM users WHERE id = ?", [$order->created_by_user_id]) : null;
            $updatedUser = $order->updated_by_user_id ? DB::selectOne("SELECT * FROM users WHERE id = ?", [$order->updated_by_user_id]) : null;
            $visitUser = $order->visit_by_user_id ? DB::selectOne("SELECT * FROM users WHERE id = ?", [$order->visit_by_user_id]) : null;
            
            $enrichedOrder = [
                'id' => $order->id,
                'ticket_id' => $order->id,
                'timestamp' => $order->timestamp,
                'account_no' => $order->account_no,
                'account_id' => $billingAccount->id ?? null,
                'full_name' => $customer ? trim(($customer->first_name ?? '') . ' ' . ($customer->middle_initial ?? '') . ' ' . ($customer->last_name ?? '')) : null,
                'contact_number' => $customer->contact_number_primary ?? null,
                'full_address' => $customer ? trim(($customer->address ?? '') . ', ' . ($customer->barangay ?? '') . ', ' . ($customer->city ?? '') . ', ' . ($customer->region ?? '')) : null,
                'contact_address' => $customer->address ?? null,
                'date_installed' => $billingAccount->date_installed ?? null,
                'email_address' => $customer->email_address ?? null,
                'house_front_picture_url' => $customer->house_front_picture_url ?? null,
                'plan' => $customer->desired_plan ?? null,
                'group_name' => $customer->group_name ?? null,
                'username' => $technicalDetails->username ?? null,
                'connection_type' => $technicalDetails->connection_type ?? null,
                'router_modem_sn' => $technicalDetails->router_modem_sn ?? null,
                'lcp' => $technicalDetails->lcp ?? null,
                'nap' => $technicalDetails->nap ?? null,
                'port' => $technicalDetails->port ?? null,
                'vlan' => $technicalDetails->vlan ?? null,
                'lcpnap' => $technicalDetails->lcpnap ?? null,
                'concern' => $supportConcern->name ?? null,
                'concern_remarks' => $order->concern_remarks,
                'requested_by' => $order->requested_by,
                'support_status' => $order->support_status,
                'assigned_email' => $order->assigned_email,
                'repair_category' => $repairCategory->name ?? null,
                'visit_status' => $order->visit_status,
                'priority_level' => $order->priority_level,
                'visit_by_user' => $visitUser->name ?? null,
                'visit_with' => $order->visit_with,
                'visit_remarks' => $order->visit_remarks,
                'support_remarks' => $order->support_remarks,
                'service_charge' => $order->service_charge,
                'new_router_sn' => $order->new_router_sn,
                'new_lcpnap_id' => $order->new_lcpnap_id,
                'new_plan_id' => $order->new_plan_id,
                'client_signature_url' => $order->client_signature_url,
                'image1_url' => $order->image1_url,
                'image2_url' => $order->image2_url,
                'image3_url' => $order->image3_url,
                'created_at' => $order->created_at,
                'created_by_user' => $createdUser->name ?? null,
                'updated_at' => $order->updated_at,
                'updated_by_user' => $updatedUser->name ?? null,
            ];

            return response()->json([
                'success' => true,
                'data' => $enrichedOrder,
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching service order: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            
            return response()->json([
                'success' => false,
                'message' => 'Service order not found',
                'error' => $e->getMessage(),
            ], 404);
        }
    }

    public function update(Request $request, $id): JsonResponse
    {
        try {
            $serviceOrder = ServiceOrder::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'Ticket_ID' => 'string|max:255|unique:service_orders,Ticket_ID,' . $id . ',id',
                'Full_Name' => 'string|max:255',
                'Contact_Number' => 'string|max:255',
                'Full_Address' => 'string',
                'Concern' => 'string|max:255',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }
            
            $serviceOrder->update($request->all());

            return response()->json([
                'success' => true,
                'message' => 'Service order updated successfully',
                'data' => $serviceOrder,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update service order',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function destroy($id): JsonResponse
    {
        try {
            $serviceOrder = ServiceOrder::findOrFail($id);
            $serviceOrder->delete();

            return response()->json([
                'success' => true,
                'message' => 'Service order deleted successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete service order',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
