<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Auth;

class UserController extends Controller
{
    /**
     * List all users (excluding the superadmin role).
     */
    public function index()
    {
        $adminRole = Role::where('name', 'admin')->first();
        if (!$adminRole) {
            return response()->json(['users' => []]);
        }
        
        $users = User::where('role_id', $adminRole->id)->latest()->paginate(25);
        return response()->json($users);
    }

    /**
     * Create a new admin user.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'role_id' => 'required|integer|exists:roles,id', // <-- Add validation for role_id
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => $validated['password'],
            'role_id' => $validated['role_id'], // <-- Use the role_id from the request
            'created_by' => Auth::id(),
        ]);

        return response()->json($user, 201);
    }

    /**
     * Update a user's information.
     */
    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'password' => 'nullable|string|min:8', // Password is optional on update
        ]);

        $user->update([
            'name' => $validated['name'],
            'email' => $validated['email'],
        ]);

        if (!empty($validated['password'])) {
            $user->password = $validated['password']; // Hashing is handled by the model
            $user->save();
        }

        return response()->json($user);
    }

    /**
     * Delete a user.
     */
    public function destroy(User $user)
    {
        // Add a safeguard to prevent deleting a superadmin
        if ($user->role->name === 'superadmin') {
            return response()->json(['error' => 'Cannot delete a superadmin.'], 403);
        }

        $user->delete();

        return response()->json(null, 204);
    }
}