<?php

namespace App\Http\Controllers;

use App\Models\DiscountCard;
use App\Services\Caching\CatalogCacheService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class DiscountCardController extends Controller
{
    private function redirectToToolbarOrigin(Request $request)
    {
        $referer = $request->headers->get('referer');

        if ($referer && ! str_contains($referer, '/tools/reference-data')) {
            return redirect()->to($referer);
        }

        return redirect()->route('orders.index');
    }

    private function toolbarResponse(Request $request, string $message)
    {
        if ($request->expectsJson()) {
            return response()->json([
                'success' => true,
                'message' => $message,
            ]);
        }

        return $this->redirectToToolbarOrigin($request)->with('success', $message);
    }

    public function store(Request $request, CatalogCacheService $catalogCacheService)
    {
        $validated = $this->validatePayload($request);

        DiscountCard::create($validated);
        $catalogCacheService->invalidateReferenceData();

        return $this->toolbarResponse($request, 'Discount card created successfully.');
    }

    public function update(Request $request, DiscountCard $discountCard, CatalogCacheService $catalogCacheService)
    {
        $validated = $this->validatePayload($request, $discountCard);

        $discountCard->update($validated);
        $catalogCacheService->invalidateReferenceData();

        return $this->toolbarResponse($request, 'Discount card updated successfully.');
    }

    public function destroy(Request $request, DiscountCard $discountCard, CatalogCacheService $catalogCacheService)
    {
        $discountCard->delete();
        $catalogCacheService->invalidateReferenceData();

        return $this->toolbarResponse($request, 'Discount card deleted successfully.');
    }

    private function validatePayload(Request $request, ?DiscountCard $discountCard = null): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => [
                'required',
                'string',
                'max:50',
                Rule::unique('discount_cards', 'code')->ignore($discountCard?->id),
            ],
            'discount_type' => ['required', Rule::in(['percentage', 'fixed'])],
            'discount_value' => ['required', 'numeric', 'min:0'],
            'max_discount_amount' => ['nullable', 'numeric', 'min:0'],
            'description' => ['nullable', 'string', 'max:2000'],
            'is_active' => ['nullable', 'boolean'],
        ]);
    }
}
