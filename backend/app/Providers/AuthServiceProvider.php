<?php

namespace App\Providers;

use App\Enums\Permission;
use App\Models\User;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;

class AuthServiceProvider extends ServiceProvider
{
    protected $policies = [
        // 'App\Models\Model' => 'App\Policies\ModelPolicy',
    ];

    public function boot(): void
    {
        $this->registerPolicies();

        // Superadmin bypass
        Gate::before(function (?User $user, string $ability) {
            if ($user && $user->role && $user->role->name === 'superadmin') {
                return true;
            }
            return null; // Let other checks run
        });

        // Register all enum permissions as abilities
        foreach (Permission::cases() as $permission) {
            Gate::define($permission->value, function (User $user) use ($permission) {
                // permissions is already an array thanks to Role::$casts
                $rolePermissions = $user->role?->permissions ?? [];
                return in_array($permission->value, $rolePermissions, true);
            });
        }
    }
}