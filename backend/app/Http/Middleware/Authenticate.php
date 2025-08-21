<?php

namespace App\Http\Middleware;

use Illuminate\Auth\Middleware\Authenticate as Middleware;

class Authenticate extends Middleware
{
    protected function redirectTo($request): ?string
    {
        // API should NOT redirect to /login. Return null → Laravel returns 401 JSON.
        return null;
    }
}
