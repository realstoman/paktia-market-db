<?php

namespace App\Http\Controllers\Api\V1\Mobile;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\Mobile\CartResource;
use App\Models\CartItem;
use App\Services\Mobile\CartService;
use Illuminate\Http\Request;

class CartController extends Controller
{
    public function show(Request $request, CartService $cartService): CartResource
    {
        $cart = $cartService->getOrCreateForRequest($request);
        $cart = $cartService->refreshTotals($cart);

        return CartResource::make($cart->load(['items.product.images', 'items.productSize']));
    }

    public function storeItem(Request $request, CartService $cartService): CartResource
    {
        $payload = $request->validate([
            'product_id' => 'required|exists:products,id',
            'product_size_id' => 'nullable|exists:product_sizes,id',
            'quantity' => 'required|integer|min:1',
            'note' => 'nullable|string|max:1000',
        ]);

        $cart = $cartService->getOrCreateForRequest($request);
        $cart = $cartService->addItem($cart, $payload);

        return CartResource::make($cart);
    }

    public function updateItem(Request $request, CartItem $cartItem, CartService $cartService): CartResource
    {
        $payload = $request->validate([
            'quantity' => 'required|integer|min:1',
            'note' => 'nullable|string|max:1000',
        ]);

        $cart = $cartService->getOrCreateForRequest($request);
        $cart = $cartService->updateItem($cart, $cartItem, $payload);

        return CartResource::make($cart);
    }

    public function destroyItem(Request $request, CartItem $cartItem, CartService $cartService): CartResource
    {
        $cart = $cartService->getOrCreateForRequest($request);
        $cart = $cartService->removeItem($cart, $cartItem);

        return CartResource::make($cart);
    }
}
