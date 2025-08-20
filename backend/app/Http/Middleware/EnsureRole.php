<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnsureRole {
    /**
     * Ensure the authenticated user has at least one of the allowed roles.
     */
    public function handle(Request $request, Closure $next, ...$roles)
    {
        $user = $request->user();

        if (!$user || !$user->relationLoaded('role'))
        {
            $user?->load('role');
        }

        $name = optional($user->role)->name;

        if (!$name || !in_array($name, $roles, true))
        {
            abort(403, 'Unauthorized action.');
        }

        return $next($request);
    }

}