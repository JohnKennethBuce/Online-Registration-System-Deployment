<?php

namespace App\Http\Controllers;

use App\Models\Role;
use Illuminate\Http\Request;
use App\Enums\Permission;
use Illuminate\Validation\Rule;

class RoleController extends Controller
{
    /**
     * List all editable roles.
     */
    public function index()
    {
        // We exclude the 'user' role as it has no system permissions to edit.
        $roles = Role::where('name', '!=', 'user')->get();
        return response()->json($roles);
    }

    /**
     * Update the permissions for a specific role.
     */
    public function update(Request $request, Role $role)
    {
        $validated = $request->validate([
            'permissions' => 'required|array',
            'permissions.*' => ['string', Rule::in(Permission::all())],
        ]);
        
        // This is a safeguard. It prevents the 'root' superadmin from accidentally
        // removing all permissions from the 'superadmin' role itself.
        if ($role->name === 'superadmin') {
            $validated['permissions'] = Permission::all();
        }

        $role->update(['permissions' => $validated['permissions']]);

        return response()->json($role);
    }

    /**
     * Provide a list of all available permissions from the Enum.
     */
    public function getAllPermissions()
    {
        return response()->json(Permission::all());
    }
}