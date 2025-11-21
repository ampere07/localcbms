<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MassRebate extends Model
{
    protected $table = 'mass_rebates';

    protected $fillable = [
        'rebate_days',
        'billing_day',
        'status',
        'rebate_date',
        'barangay_code',
        'description',
        'remarks',
        'created_by_user_id',
        'updated_by_user_id'
    ];

    protected $casts = [
        'rebate_days' => 'integer',
        'billing_day' => 'integer',
        'rebate_date' => 'date'
    ];
}
