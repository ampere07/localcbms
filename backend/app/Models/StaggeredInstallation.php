<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StaggeredInstallation extends Model
{
    protected $table = 'staggered_installation';

    protected $fillable = [
        'account_no',
        'staggered_install_no',
        'staggered_date',
        'staggered_balance',
        'months_to_pay',
        'monthly_payment',
        'modified_by',
        'modified_date',
        'user_email',
        'remarks'
    ];

    protected $casts = [
        'staggered_date' => 'date',
        'staggered_balance' => 'decimal:2',
        'months_to_pay' => 'integer',
        'monthly_payment' => 'decimal:2',
        'modified_date' => 'datetime'
    ];

    public $timestamps = true;

    public function billingAccount()
    {
        return $this->belongsTo(BillingAccount::class, 'account_no', 'account_no');
    }
}
