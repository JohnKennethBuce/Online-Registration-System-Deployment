<?php

namespace App\Providers;

use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;
use App\Models\User;

class AuthServiceProvider extends ServiceProvider
{
    protected $policies = [
        // 'App\Models\Model' => 'App\Policies\ModelPolicy',
    ];

    public function boot(): void
    {
        $this->registerPolicies();

        // Super Admin bypass
        Gate::before(function (User $user, string $ability) {
            if ($user->email === env('SUPERADMIN_EMAIL')) {
                return true;
            }
            return null;
        });

        // Helper to decode permissions safely
        $hasPermission = function (User $user, string $perm) {
            $permissions = $user->role?->permissions;
            if (is_string($permissions)) {
                $permissions = json_decode($permissions, true) ?? [];
            }
            return in_array($perm, $permissions);
        };

        // Dashboard
        Gate::define('view-dashboard', fn(User $u) => $hasPermission($u, 'view-dashboard'));

        // Registrations
        Gate::define('view-registrations', fn(User $u) => $hasPermission($u, 'view-registrations'));
        Gate::define('create-registration', fn(User $u) => $hasPermission($u, 'create-registration'));
        Gate::define('edit-registration', fn(User $u) => $hasPermission($u, 'edit-registration'));
        Gate::define('delete-registration', fn(User $u) => $hasPermission($u, 'delete-registration'));

        // User Management
        Gate::define('view-users', fn(User $u) => $hasPermission($u, 'view-users'));
        Gate::define('create-user', fn(User $u) => $hasPermission($u, 'create-user'));
        Gate::define('edit-user', fn(User $u) => $hasPermission($u, 'edit-user'));
        Gate::define('delete-user', fn(User $u) => $hasPermission($u, 'delete-user'));
        Gate::define('manage-roles', fn(User $u) => $hasPermission($u, 'manage-roles'));

        // Settings
        Gate::define('view-settings', fn(User $u) => $hasPermission($u, 'view-settings'));
        Gate::define('edit-settings', fn(User $u) => $hasPermission($u, 'edit-settings'));

        // Server Mode
        Gate::define('view-server-mode', fn(User $u) => $hasPermission($u, 'view-server-mode'));
        Gate::define('edit-server-mode', fn(User $u) => $hasPermission($u, 'edit-server-mode'));
    }
}
