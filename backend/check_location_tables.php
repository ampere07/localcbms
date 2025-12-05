<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

echo "=== LOCATION TABLES DIAGNOSTIC ===\n\n";

// Check if tables exist
$tables = ['region', 'city', 'barangay', 'village'];

foreach ($tables as $table) {
    echo "Checking table: {$table}\n";
    echo str_repeat('-', 50) . "\n";
    
    if (Schema::hasTable($table)) {
        echo "✓ Table EXISTS\n";
        
        // Get columns
        $columns = Schema::getColumnListing($table);
        echo "Columns: " . implode(', ', $columns) . "\n";
        
        // Get row count
        $count = DB::table($table)->count();
        echo "Row count: {$count}\n";
        
        // Get sample data
        if ($count > 0) {
            echo "\nSample data:\n";
            $samples = DB::table($table)->limit(5)->get();
            foreach ($samples as $sample) {
                echo json_encode($sample, JSON_PRETTY_PRINT) . "\n";
            }
        } else {
            echo "⚠ TABLE IS EMPTY\n";
        }
    } else {
        echo "✗ Table DOES NOT EXIST\n";
    }
    
    echo "\n\n";
}

// Test models
echo "=== TESTING MODELS ===\n\n";

try {
    echo "Testing Region model:\n";
    $regions = \App\Models\Region::all();
    echo "Regions count: " . $regions->count() . "\n";
    if ($regions->count() > 0) {
        echo "First region: " . json_encode($regions->first(), JSON_PRETTY_PRINT) . "\n";
    }
    echo "\n";
    
    echo "Testing City model:\n";
    $cities = \App\Models\City::all();
    echo "Cities count: " . $cities->count() . "\n";
    if ($cities->count() > 0) {
        echo "First city: " . json_encode($cities->first(), JSON_PRETTY_PRINT) . "\n";
    }
    echo "\n";
    
    echo "Testing Barangay model:\n";
    $barangays = \App\Models\Barangay::all();
    echo "Barangays count: " . $barangays->count() . "\n";
    if ($barangays->count() > 0) {
        echo "First barangay: " . json_encode($barangays->first(), JSON_PRETTY_PRINT) . "\n";
    }
    echo "\n";
    
    echo "Testing Village model:\n";
    $villages = \App\Models\Village::all();
    echo "Villages count: " . $villages->count() . "\n";
    if ($villages->count() > 0) {
        echo "First village: " . json_encode($villages->first(), JSON_PRETTY_PRINT) . "\n";
    }
    echo "\n";
    
} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    echo "Trace: " . $e->getTraceAsString() . "\n";
}

echo "=== END DIAGNOSTIC ===\n";
