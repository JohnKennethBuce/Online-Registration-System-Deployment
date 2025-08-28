<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    /**
     * Handle login and return a Sanctum token
     */
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        if (!Auth::attempt($credentials)) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        /** @var \App\Models\User $user */
        $user = Auth::user();

        // 🔹 Create a fresh token
        $token = $user->createToken('api-token')->plainTextToken;

        return response()->json([
            'user'  => $user->load('role'),
            'token' => $token,
        ]);
    }

    /**
     * Handle logout and revoke the Sanctum token
     */
    public function logout(Request $request)
    {
        $user = $request->user();

        if ($user) {
            // 🔹 If currentAccessToken exists, delete it
            $token = $user->currentAccessToken();
            if ($token) {
                $token->delete();
            }

            return response()->json(['message' => 'Logged out successfully']);
        }

        return response()->json(['message' => 'Unauthorized'], 401);
    }
}
