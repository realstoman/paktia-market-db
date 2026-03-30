<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('pos:prune-runtime-data')->dailyAt('02:30');
Schedule::command('projection:refresh-recent-branch-daily-metrics --hours=36')->everyThirtyMinutes();
Schedule::command('projection:health-check')->hourly();
