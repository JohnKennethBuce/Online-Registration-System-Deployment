<?php

namespace App\Providers;

use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;
use App\Models\User;
use App\Enums\Permission; // <-- 1. Import our new Permission Enum

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

        // 2. This Gate runs before all others. If the user's email matches the
        // one in the .env file, they are the "Root" Super Admin and can do anything.
        Gate::before(function (User $user, string $ability) {
            if ($user->email === env('SUPERADMIN_EMAIL')) {
                return true;
            }
        });

        // 3. This loop dynamically registers a gate for every single permission
        // we defined in our Permission Enum.
        foreach (Permission::cases() as $permission) {
            Gate::define($permission->value, function (User $user) use ($permission) {
                // The check is simple: does the user's role's permission array
                // contain the permission being checked?
                return in_array($permission->value, $user->role->permissions ?? []);
            });
        }
    }
}