<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * Define the application's command schedule.
     *
     * @param  \Illuminate\Console\Scheduling\Schedule  $schedule
     * @return void
     */
    protected function schedule(Schedule $schedule)
    {
        // Generate daily billings at 1:00 AM every day
        $schedule->command('billing:generate-daily')
                 ->dailyAt('01:00')
                 ->withoutOverlapping()
                 ->runInBackground()
                 ->onSuccess(function () {
                     \Illuminate\Support\Facades\Log::info('Scheduled billing generation completed successfully');
                 })
                 ->onFailure(function () {
                     \Illuminate\Support\Facades\Log::error('Scheduled billing generation failed');
                 });

        // Additional hourly generation during business hours (optional backup)
        // Uncomment if you want hourly checks during business hours
        // $schedule->command('billing:generate-daily')
        //          ->hourly()
        //          ->between('08:00', '18:00')
        //          ->withoutOverlapping();
    }

    /**
     * Register the commands for the application.
     *
     * @return void
     */
    protected function commands()
    {
        $this->load(__DIR__.'/Commands');

        require base_path('routes/console.php');
    }
}
