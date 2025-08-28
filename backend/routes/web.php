<?php

use Illuminate\Support\Facades\Route;

// 🚀 Catch-all route to serve React app (from public/index.html)
Route::get('/{any}', function () {
    return file_get_contents(public_path('index.html'));
})->where('any', '.*');
