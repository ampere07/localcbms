<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ServiceOrderApiController extends Controller
{
    /**
     * Display a listing of service orders
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = DB::table('service_orders');
            
            // Filter by assigned email if provided
            if ($request->has('assigned_email')) {
                $query->where('Assigned_Email', $request->input('assigned_email'));
                Log::info('Filtering service orders by email: ' . $request->input('assigned_email'));
            }
            
            $serviceOrders = $query->get();
            
            // Log the results
            Log::info('Found ' . $serviceOrders->count() . ' service orders');
            
            return response()->json([
                'success' => true,
                'data' => $serviceOrders,
                'table' => 'service_orders',
                'count' => $serviceOrders->count()
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching service orders: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch service orders: ' . $e->getMessage(),
                'error' => $e->getMessage(),
                'table' => 'service_orders'
            ], 500);
        }
    }
    
    /**
     * Store a newly created service order
     */
    public function store(Request $request): JsonResponse
    {
        try {
            // Validate request
            $request->validate([
                'Ticket_ID' => 'required|string|max:255',
                'Full_Name' => 'required|string|max:255',
                'Contact_Number' => 'required|string|max:255',
                'Full_Address' => 'required|string',
                'Concern' => 'required|string|max:255',
            ]);
            
            // Add timestamps
            $data = $request->all();
            $data['created_at'] = now();
            $data['updated_at'] = now();
            
            // Insert into database
            $id = DB::table('service_orders')->insertGetId($data);
            
            // Get the created record
            $serviceOrder = DB::table('service_orders')->where('id', $id)->first();
            
            return response()->json([
                'success' => true,
                'message' => 'Service order created successfully',
                'data' => $serviceOrder,
            ], 201);
        } catch (\Exception $e) {
            Log::error('Error creating service order: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to create service order: ' . $e->getMessage(),
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Display the specified service order
     */
    public function show($id): JsonResponse
    {
        try {
            $serviceOrder = DB::table('service_orders')->where('id', $id)->first();
            
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
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch service order: ' . $e->getMessage(),
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Update the specified service order
     */
    public function update(Request $request, $id): JsonResponse
    {
        try {
            // Verify service order exists
            $serviceOrder = DB::table('service_orders')->where('id', $id)->first();
            
            if (!$serviceOrder) {
                return response()->json([
                    'success' => false,
                    'message' => 'Service order not found'
                ], 404);
            }
            
            // Update data
            $data = $request->all();
            $data['updated_at'] = now();
            
            DB::table('service_orders')->where('id', $id)->update($data);
            
            // Get updated record
            $updatedServiceOrder = DB::table('service_orders')->where('id', $id)->first();
            
            return response()->json([
                'success' => true,
                'message' => 'Service order updated successfully',
                'data' => $updatedServiceOrder
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update service order: ' . $e->getMessage(),
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Remove the specified service order
     */
    public function destroy($id): JsonResponse
    {
        try {
            // Verify service order exists
            $serviceOrder = DB::table('service_orders')->where('ID', $id)->first();
            
            if (!$serviceOrder) {
                return response()->json([
                    'success' => false,
                    'message' => 'Service order not found'
                ], 404);
            }
            
            // Delete the record
            DB::table('service_orders')->where('id', $id)->delete();
            
            return response()->json([
                'success' => true,
                'message' => 'Service order deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete service order: ' . $e->getMessage(),
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
