<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class ServiceOrderApiController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        try {
            $query = DB::table('service_orders as so')
                ->leftJoin('billing_accounts as ba', 'so.account_no', '=', 'ba.account_no')
                ->leftJoin('customers as c', 'ba.customer_id', '=', 'c.id')
                ->leftJoin('technical_details as td', 'so.account_no', '=', 'td.account_no')
                ->select(
                    'so.id',
                    'so.id as ticket_id',
                    'so.account_no',
                    'so.timestamp',
                    'ba.id as account_id',
                    'ba.date_installed',
                    DB::raw("CONCAT(IFNULL(c.first_name, ''), ' ', IFNULL(c.middle_initial, ''), ' ', IFNULL(c.last_name, '')) as full_name"),
                    'c.contact_number_primary as contact_number',
                    DB::raw("CONCAT(IFNULL(c.address, ''), ', ', IFNULL(c.barangay, ''), ', ', IFNULL(c.city, ''), ', ', IFNULL(c.region, '')) as full_address"),
                    'c.address as contact_address',
                    'c.email_address',
                    'c.house_front_picture_url',
                    'c.desired_plan as plan',
                    'td.username',
                    'td.connection_type',
                    'td.router_modem_sn',
                    'td.lcp',
                    'td.nap',
                    'td.port',
                    'td.vlan',
                    'so.concern',
                    'so.concern_remarks',
                    'so.requested_by',
                    'so.support_status',
                    'so.assigned_email',
                    'so.repair_category',
                    'so.visit_status',
                    'so.priority_level',
                    'so.visit_by_user',
                    'so.visit_with',
                    'so.visit_remarks',
                    'so.support_remarks',
                    'so.service_charge',
                    'so.new_router_sn',
                    'so.new_lcpnap',
                    'so.new_plan',
                    'so.client_signature_url',
                    'so.image1_url',
                    'so.image2_url',
                    'so.image3_url',
                    'so.created_at',
                    'so.created_by_user',
                    'so.updated_at',
                    'so.updated_by_user'
                )
                ->orderBy('so.created_at', 'desc');
            
            if ($request->has('assigned_email')) {
                $query->where('so.assigned_email', $request->input('assigned_email'));
            }
            
            if ($request->has('account_no')) {
                $query->where('so.account_no', $request->input('account_no'));
            }
            
            if ($request->has('support_status')) {
                $query->where('so.support_status', $request->input('support_status'));
            }
            
            $serviceOrders = $query->get();
            
            return response()->json([
                'success' => true,
                'data' => $serviceOrders,
                'count' => $serviceOrders->count()
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching service orders: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch service orders',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    public function store(Request $request): JsonResponse
    {
        try {
            Log::info('Service order creation request', ['data' => $request->all()]);
            
            $validated = $request->validate([
                'account_no' => 'required|string|max:255',
                'timestamp' => 'nullable|date',
                'support_status' => 'nullable|string|max:100',
                'concern' => 'required|string|max:255',
                'concern_remarks' => 'nullable|string',
                'priority_level' => 'nullable|string|max:50',
                'requested_by' => 'nullable|string|max:255',
                'assigned_email' => 'nullable|string|max:255',
                'visit_status' => 'nullable|string|max:100',
                'visit_by_user' => 'nullable|string|max:255',
                'visit_with' => 'nullable|string|max:255',
                'visit_remarks' => 'nullable|string',
                'repair_category' => 'nullable|string|max:255',
                'support_remarks' => 'nullable|string',
                'service_charge' => 'nullable|numeric',
                'new_router_sn' => 'nullable|string|max:255',
                'new_lcpnap' => 'nullable|string|max:255',
                'new_plan' => 'nullable|string|max:255',
                'created_by_user' => 'nullable|string|max:255',
                'updated_by_user' => 'nullable|string|max:255'
            ]);
            
            $timestamp = null;
            if (isset($validated['timestamp'])) {
                try {
                    $timestamp = Carbon::parse($validated['timestamp'])->format('Y-m-d H:i:s');
                } catch (\Exception $e) {
                    Log::warning('Invalid timestamp format, using current time', ['timestamp' => $validated['timestamp']]);
                    $timestamp = now()->format('Y-m-d H:i:s');
                }
            } else {
                $timestamp = now()->format('Y-m-d H:i:s');
            }
            
            $data = [
                'account_no' => $validated['account_no'],
                'timestamp' => $timestamp,
                'support_status' => $validated['support_status'] ?? 'Open',
                'concern' => $validated['concern'],
                'concern_remarks' => $validated['concern_remarks'] ?? null,
                'priority_level' => $validated['priority_level'] ?? 'Medium',
                'requested_by' => $validated['requested_by'] ?? null,
                'assigned_email' => $validated['assigned_email'] ?? null,
                'visit_status' => $validated['visit_status'] ?? 'Pending',
                'visit_by_user' => $validated['visit_by_user'] ?? null,
                'visit_with' => $validated['visit_with'] ?? null,
                'visit_remarks' => $validated['visit_remarks'] ?? null,
                'repair_category' => $validated['repair_category'] ?? null,
                'support_remarks' => $validated['support_remarks'] ?? null,
                'service_charge' => $validated['service_charge'] ?? null,
                'new_router_sn' => $validated['new_router_sn'] ?? null,
                'new_lcpnap' => $validated['new_lcpnap'] ?? null,
                'new_plan' => $validated['new_plan'] ?? null,
                'created_by_user' => $validated['created_by_user'] ?? null,
                'updated_by_user' => $validated['updated_by_user'] ?? null,
                'created_at' => now(),
                'updated_at' => now()
            ];
            
            $id = DB::table('service_orders')->insertGetId($data);
            
            $serviceOrder = DB::table('service_orders')->where('id', $id)->first();
            
            Log::info('Service order created successfully', ['id' => $id]);
            
            return response()->json([
                'success' => true,
                'message' => 'Service order created successfully',
                'data' => $serviceOrder,
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('Validation error creating service order', [
                'errors' => $e->errors(),
                'input' => $request->all()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error creating service order', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to create service order',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    public function show($id): JsonResponse
    {
        try {
            $serviceOrder = DB::table('service_orders as so')
                ->leftJoin('billing_accounts as ba', 'so.account_no', '=', 'ba.account_no')
                ->leftJoin('customers as c', 'ba.customer_id', '=', 'c.id')
                ->leftJoin('technical_details as td', 'so.account_no', '=', 'td.account_no')
                ->select(
                    'so.id',
                    'so.id as ticket_id',
                    'so.account_no',
                    'so.timestamp',
                    'ba.id as account_id',
                    'ba.date_installed',
                    DB::raw("CONCAT(IFNULL(c.first_name, ''), ' ', IFNULL(c.middle_initial, ''), ' ', IFNULL(c.last_name, '')) as full_name"),
                    'c.contact_number_primary as contact_number',
                    DB::raw("CONCAT(IFNULL(c.address, ''), ', ', IFNULL(c.barangay, ''), ', ', IFNULL(c.city, ''), ', ', IFNULL(c.region, '')) as full_address"),
                    'c.address as contact_address',
                    'c.email_address',
                    'c.house_front_picture_url',
                    'c.desired_plan as plan',
                    'td.username',
                    'td.connection_type',
                    'td.router_modem_sn',
                    'td.lcp',
                    'td.nap',
                    'td.port',
                    'td.vlan',
                    'so.concern',
                    'so.concern_remarks',
                    'so.requested_by',
                    'so.support_status',
                    'so.assigned_email',
                    'so.repair_category',
                    'so.visit_status',
                    'so.priority_level',
                    'so.visit_by_user',
                    'so.visit_with',
                    'so.visit_remarks',
                    'so.support_remarks',
                    'so.service_charge',
                    'so.new_router_sn',
                    'so.new_lcpnap',
                    'so.new_plan',
                    'so.client_signature_url',
                    'so.image1_url',
                    'so.image2_url',
                    'so.image3_url',
                    'so.created_at',
                    'so.created_by_user',
                    'so.updated_at',
                    'so.updated_by_user'
                )
                ->where('so.id', $id)
                ->first();
            
            if (!$serviceOrder) {
                return response()->json([
                    'success' => false,
                    'message' => 'Service order not found'
                ], 404);
            }
            
            return response()->json([
                'success' => true,
                'data' => $serviceOrder
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching service order details: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch service order',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    public function update(Request $request, $id): JsonResponse
    {
        try {
            Log::info('Service order update request', [
                'id' => $id,
                'data' => $request->all()
            ]);
            
            $serviceOrder = DB::table('service_orders')->where('id', $id)->first();
            
            if (!$serviceOrder) {
                return response()->json([
                    'success' => false,
                    'message' => 'Service order not found'
                ], 404);
            }
            
            $allowedFields = [
                'account_no',
                'timestamp',
                'support_status',
                'concern',
                'concern_remarks',
                'priority_level',
                'requested_by',
                'assigned_email',
                'visit_status',
                'visit_by_user',
                'visit_with',
                'visit_remarks',
                'repair_category',
                'support_remarks',
                'service_charge',
                'new_router_sn',
                'new_lcpnap',
                'new_plan',
                'client_signature_url',
                'image1_url',
                'image2_url',
                'image3_url'
            ];
            
            $data = [];
            foreach ($allowedFields as $field) {
                if ($request->has($field)) {
                    $data[$field] = $request->input($field);
                }
            }
            
            $data['updated_at'] = now();
            
            Log::info('Filtered data for update', ['data' => $data]);
            
            DB::table('service_orders')->where('id', $id)->update($data);
            
            $updatedServiceOrder = DB::table('service_orders')->where('id', $id)->first();
            
            return response()->json([
                'success' => true,
                'message' => 'Service order updated successfully',
                'data' => $updatedServiceOrder
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to update service order', [
                'id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to update service order',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    public function destroy($id): JsonResponse
    {
        try {
            $serviceOrder = DB::table('service_orders')->where('id', $id)->first();
            
            if (!$serviceOrder) {
                return response()->json([
                    'success' => false,
                    'message' => 'Service order not found'
                ], 404);
            }
            
            DB::table('service_orders')->where('id', $id)->delete();
            
            return response()->json([
                'success' => true,
                'message' => 'Service order deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete service order',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
