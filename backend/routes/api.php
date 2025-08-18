<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\RegistrationController;

Route::get('/test', function () {
    return response()->json(['message' => 'API is working!']);
});

Route::post('/register', [RegistrationController::class, 'store']);

Route::post('/register/{id}', [RegistrationController::class, 'update']);