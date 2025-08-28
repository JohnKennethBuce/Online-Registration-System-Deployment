<?php

namespace App\Providers;

use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        // 'App\Models\Model' => 'App\Policies\ModelPolicy',
    ];

    /**
     * Register any authentication / authorization services.
     */
    public function boot(): void
    {
        $this->registerPolicies();

        Log::debug('✅ AuthServiceProvider booted successfully');

        // 🔹 Superadmin only
        Gate::define('superadmin-only', function (User $user) {
            Log::debug('Checking superadmin-only gate', ['user_id' => $user->id, 'role_id' => $user->role_id]);
            return $user->role_id === 1;
        });

        // 🔹 Admin or Superadmin
        Gate::define('admin-or-superadmin', function (User $user) {
            Log::debug('Checking admin-or-superadmin gate', ['user_id' => $user->id, 'role_id' => $user->role_id]);
            return in_array($user->role_id, [1, 2], true);
        });
    }
}
