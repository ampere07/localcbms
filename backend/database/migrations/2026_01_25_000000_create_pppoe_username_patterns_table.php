<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pppoe_username_patterns', function (Blueprint $table) {
            $table->id();
            $table->string('pattern_name');
            $table->json('sequence');
            $table->string('created_by')->default('system');
            $table->string('updated_by')->default('system');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pppoe_username_patterns');
    }
};
