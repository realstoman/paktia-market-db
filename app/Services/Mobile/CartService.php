<?php

namespace App\Services\Mobile;

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Client;
use App\Models\GuestSession;
use App\Models\Product;
use App\Models\ProductSize;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class CartService
{
    public function getOrCreateForRequest(Request $request): Cart
    {
        $client = $request->attributes->get('client');
        $guestSession = $request->attributes->get('guestSession');

        if ($client instanceof Client) {
            return $this->getOrCreateForClient($client);
        }

        if ($guestSession instanceof GuestSession) {
            return $this->getOrCreateForGuestSession($guestSession);
        }

        throw ValidationException::withMessages([
            'actor' => 'A cart actor is required.',
        ]);
    }

    public function getOrCreateForClient(Client $client): Cart
    {
        return Cart::query()->firstOrCreate(
            [
                'client_id' => $client->id,
                'status' => 'active',
            ],
            [
                'currency_code' => 'AFN',
            ],
        );
    }

    public function getOrCreateForGuestSession(GuestSession $guestSession): Cart
    {
        return Cart::query()->firstOrCreate(
            [
                'guest_session_id' => $guestSession->id,
                'status' => 'active',
            ],
            [
                'currency_code' => 'AFN',
                'expires_at' => $guestSession->expires_at,
            ],
        );
    }

    public function addItem(Cart $cart, array $payload): Cart
    {
        $product = Product::query()
            ->with(['sizes', 'images'])
            ->findOrFail($payload['product_id']);

        if (! $product->is_active) {
            throw ValidationException::withMessages([
                'product_id' => 'This product is not available.',
            ]);
        }

        $resolvedSize = $this->resolveProductSize($product, $payload['product_size_id'] ?? null);
        $unitPrice = $this->resolveUnitPrice($product, $resolvedSize);
        $note = $payload['note'] ?? null;

        $existingItem = $cart->items()
            ->where('product_id', $product->id)
            ->where('product_size_id', $resolvedSize?->id)
            ->where('note', $note)
            ->first();

        if ($existingItem) {
            $existingItem->update([
                'quantity' => $existingItem->quantity + $payload['quantity'],
                'unit_price' => $unitPrice,
                'line_total' => ($existingItem->quantity + $payload['quantity']) * $unitPrice,
            ]);
        } else {
            $cart->items()->create([
                'product_id' => $product->id,
                'product_size_id' => $resolvedSize?->id,
                'quantity' => $payload['quantity'],
                'note' => $note,
                'unit_price' => $unitPrice,
                'line_total' => $payload['quantity'] * $unitPrice,
            ]);
        }

        return $this->refreshTotals($cart);
    }

    public function updateItem(Cart $cart, CartItem $cartItem, array $payload): Cart
    {
        $this->assertItemBelongsToCart($cart, $cartItem);

        $product = $cartItem->product()->with('sizes')->firstOrFail();
        $resolvedSize = $cartItem->productSize;
        $unitPrice = $this->resolveUnitPrice($product, $resolvedSize);

        $cartItem->update([
            'quantity' => $payload['quantity'],
            'note' => $payload['note'] ?? $cartItem->note,
            'unit_price' => $unitPrice,
            'line_total' => $payload['quantity'] * $unitPrice,
        ]);

        return $this->refreshTotals($cart);
    }

    public function removeItem(Cart $cart, CartItem $cartItem): Cart
    {
        $this->assertItemBelongsToCart($cart, $cartItem);

        $cartItem->delete();

        return $this->refreshTotals($cart);
    }

    public function mergeGuestCartIntoClientCart(GuestSession $guestSession, Client $client): Cart
    {
        $guestCart = Cart::query()
            ->where('guest_session_id', $guestSession->id)
            ->where('status', 'active')
            ->with('items.productSize')
            ->first();

        $clientCart = $this->getOrCreateForClient($client);

        if (! $guestCart) {
            return $this->refreshTotals($clientCart);
        }

        foreach ($guestCart->items as $guestItem) {
            $matchingItem = $clientCart->items()
                ->where('product_id', $guestItem->product_id)
                ->where('product_size_id', $guestItem->product_size_id)
                ->where('note', $guestItem->note)
                ->first();

            if ($matchingItem) {
                $matchingItem->update([
                    'quantity' => $matchingItem->quantity + $guestItem->quantity,
                    'unit_price' => $guestItem->unit_price,
                    'line_total' => ($matchingItem->quantity + $guestItem->quantity) * $guestItem->unit_price,
                ]);
            } else {
                $guestItem->update([
                    'cart_id' => $clientCart->id,
                ]);
            }
        }

        $guestCart->update([
            'status' => 'merged',
            'checked_out_at' => now(),
        ]);

        $guestSession->update([
            'merged_at' => now(),
            'is_active' => false,
        ]);

        return $this->refreshTotals($clientCart);
    }

    public function refreshTotals(Cart $cart): Cart
    {
        $cart->load(['items.product.images', 'items.productSize']);

        $subtotal = $cart->items->sum(fn (CartItem $item) => (float) $item->line_total);

        $cart->update([
            'subtotal' => $subtotal,
            'discount_total' => 0,
            'delivery_fee' => 0,
            'total' => $subtotal,
        ]);

        return $cart->fresh(['items.product.images', 'items.productSize']);
    }

    private function resolveProductSize(Product $product, ?int $productSizeId): ?ProductSize
    {
        $product->loadMissing('sizes');

        if ($productSizeId === null) {
            if ($product->sizes->isNotEmpty()) {
                throw ValidationException::withMessages([
                    'product_size_id' => 'A size is required for this product.',
                ]);
            }

            return null;
        }

        $size = $product->sizes->firstWhere('id', $productSizeId);

        if (! $size) {
            throw ValidationException::withMessages([
                'product_size_id' => 'The selected size does not belong to this product.',
            ]);
        }

        return $size;
    }

    private function resolveUnitPrice(Product $product, ?ProductSize $productSize): float
    {
        if ($productSize) {
            return (float) $productSize->pivot->price;
        }

        return (float) $product->base_price;
    }

    private function assertItemBelongsToCart(Cart $cart, CartItem $cartItem): void
    {
        if ($cartItem->cart_id !== $cart->id) {
            throw ValidationException::withMessages([
                'cart_item' => 'The selected cart item does not belong to this cart.',
            ]);
        }
    }
}
