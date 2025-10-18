<?php

namespace App\Enums;
use Illuminate\Support\Facades\Gate;

enum Permission: string
{

    public function boot(): void
{
    foreach (Permission::cases() as $permission) {
        Gate::define($permission->value, function ($user) use ($permission) {
            $rolePermissions = json_decode($user->role?->permissions ?? '[]');
            return in_array($permission->value, $rolePermissions);
        });
    }
}
    // Dashboard Permissions
    case VIEW_DASHBOARD = 'view-dashboard';

    // Registration Permissions
    case VIEW_REGISTRATIONS = 'view-registrations';
    case CREATE_REGISTRATION = 'create-registration';
    case EDIT_REGISTRATION = 'edit-registration';
    case DELETE_REGISTRATION = 'delete-registration';
    case SCAN_REGISTRATION = 'scan-registration';

    // User Management Permissions
    case VIEW_USERS = 'view-users';
    case CREATE_USER = 'create-user';
    case EDIT_USER = 'edit-user';
    case DELETE_USER = 'delete-user';

    // Settings Permissions
    case VIEW_SETTINGS = 'view-settings';
    case EDIT_SETTINGS = 'edit-settings';

    // Server Mode Permissions
    case VIEW_SERVER_MODE = 'view-server-mode';
    case EDIT_SERVER_MODE = 'edit-server-mode';

    // Report Permissions
    case VIEW_REPORTS = 'view-reports';

    // Role Management Permissions
    case MANAGE_ROLES = 'manage-roles';

    /**
     * Helper function to get all permission values as an array.
     * Useful for seeding the database.
     */
    public static function all(): array
    {
        return array_column(self::cases(), 'value');
    }
}