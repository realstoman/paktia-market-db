<?php

namespace App\Http\Controllers;

use App\Models\Client;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ClientController extends Controller
{
    public function index(): Response
    {
        $clients = Client::query()
            ->withCount('orders')
            ->withCount([
                'orders as mobile_orders_count' => fn ($query) => $query->where('source', 'mobile_app'),
                'orders as website_orders_count' => fn ($query) => $query->where('source', 'website'),
            ])
            ->addSelect([
                'last_order_at' => DB::table('orders')
                    ->selectRaw('MAX(created_at)')
                    ->whereColumn('orders.client_id', 'clients.id'),
            ])
            ->orderByDesc('last_order_at')
            ->orderByDesc('last_login_at')
            ->orderBy('name')
            ->get();

        return Inertia::render('clients/index', [
            'clients' => $clients,
        ]);
    }
}
