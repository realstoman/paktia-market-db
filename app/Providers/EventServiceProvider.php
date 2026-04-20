<?php

namespace App\Providers;

use App\Listeners\LogAuthActivity;
use App\Listeners\LogTwoFactorActivity;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;

class EventServiceProvider extends ServiceProvider
{
    /**
     * The subscriber classes to register.
     *
     * @var array<int, class-string>
     */
    protected $subscribe = [
        LogAuthActivity::class,
        LogTwoFactorActivity::class,
    ];

    public function shouldDiscoverEvents(): bool
    {
        return false;
    }
}
