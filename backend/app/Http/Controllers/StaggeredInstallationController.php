<?php

namespace App\Http\Controllers;

use App\Models\StaggeredInstallation;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class StaggeredInstallationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        try {
            $query = StaggeredInstallation::query();

            if ($request->has('account_no')) {
                $query->where('account_no', $request->account_no);
            }

            $staggeredInstallations = $query->orderBy('created_at', 'desc')->get();

            return response()->json([
                'success' => true,
                'data' => $staggeredInstallations,
                'count' => $staggeredInstallations->count()
            ]);
        } catch (\Exception $e) {
            \Log::error('Error fetching staggered installations: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch staggered installations',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'account_no' => 'required|string|max:255',
                'staggered_install_no' => 'required|string|max:255',
                'staggered_date' => 'required|date',
                'staggered_balance' => 'required|numeric|min:0',
                'months_to_pay' => 'required|integer|min:0',
                'monthly_payment' => 'required|numeric|min:0',
                'modified_by' => 'nullable|string|max:255',
                'modified_date' => 'nullable|date',
                'user_email' => 'nullable|email|max:255',
                'remarks' => 'nullable|string'
            ]);

            DB::beginTransaction();

            $staggeredInstallation = StaggeredInstallation::create($validated);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Staggered installation created successfully',
                'data' => $staggeredInstallation
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error creating staggered installation: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to create staggered installation',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show(string $id): JsonResponse
    {
        try {
            $staggeredInstallation = StaggeredInstallation::findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $staggeredInstallation
            ]);
        } catch (\Exception $e) {
            \Log::error('Error fetching staggered installation: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Staggered installation not found',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    public function update(Request $request, string $id): JsonResponse
    {
        try {
            $validated = $request->validate([
                'account_no' => 'sometimes|string|max:255',
                'staggered_install_no' => 'sometimes|string|max:255',
                'staggered_date' => 'sometimes|date',
                'staggered_balance' => 'sometimes|numeric|min:0',
                'months_to_pay' => 'sometimes|integer|min:0',
                'monthly_payment' => 'sometimes|numeric|min:0',
                'modified_by' => 'nullable|string|max:255',
                'modified_date' => 'nullable|date',
                'user_email' => 'nullable|email|max:255',
                'remarks' => 'nullable|string'
            ]);

            DB::beginTransaction();

            $staggeredInstallation = StaggeredInstallation::findOrFail($id);
            $staggeredInstallation->update($validated);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Staggered installation updated successfully',
                'data' => $staggeredInstallation
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error updating staggered installation: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update staggered installation',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function destroy(string $id): JsonResponse
    {
        try {
            DB::beginTransaction();

            $staggeredInstallation = StaggeredInstallation::findOrFail($id);
            $staggeredInstallation->delete();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Staggered installation deleted successfully'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error deleting staggered installation: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete staggered installation',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
