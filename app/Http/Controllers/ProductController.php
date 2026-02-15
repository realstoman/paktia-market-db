<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\ProductSize;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class ProductController extends Controller
{
    public function index()
    {
        return Inertia::render('products/index', [
            'products' => Product::with(['category', 'sizes', 'images'])
                ->orderBy('name')
                ->get(),
            'categories' => ProductCategory::orderBy('name')->get(),
            'sizes' => ProductSize::orderBy('name')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'product_category_id' => 'required|exists:product_categories,id',
            'type' => 'required|string|max:50',
            'base_price' => 'required|numeric|min:0',
            'is_active' => 'boolean',
            'size_prices' => 'array',
            'size_prices.*.product_size_id' => 'required|exists:product_sizes,id',
            'size_prices.*.price' => 'required|numeric|min:0',
            'images' => 'array|max:10',
            'images.*' => 'image|max:4096',
        ]);

        DB::transaction(function () use ($request, $validated) {
            $product = Product::create([
                'name' => $validated['name'],
                'description' => $validated['description'] ?? null,
                'product_category_id' => $validated['product_category_id'],
                'type' => $validated['type'],
                'base_price' => $validated['base_price'],
                'is_active' => $validated['is_active'] ?? true,
            ]);

            if (!empty($validated['size_prices'])) {
                $syncData = [];
                foreach ($validated['size_prices'] as $sizePrice) {
                    $syncData[$sizePrice['product_size_id']] = [
                        'price' => $sizePrice['price'],
                    ];
                }
                $product->sizes()->sync($syncData);
            }

            $images = $request->file('images', []);
            foreach ($images as $index => $image) {
                $path = $image->store('products', 'public');
                $product->images()->create([
                    'path' => $path,
                    'sort_order' => $index,
                ]);
            }
        });

        return redirect()->route('products.index')
            ->with('success', 'Product created successfully.');
    }

    public function update(Request $request, Product $product)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'product_category_id' => 'required|exists:product_categories,id',
            'type' => 'required|string|max:50',
            'base_price' => 'required|numeric|min:0',
            'is_active' => 'boolean',
            'size_prices' => 'sometimes|array',
            'size_prices.*.product_size_id' => 'required|exists:product_sizes,id',
            'size_prices.*.price' => 'required|numeric|min:0',
            'images' => 'array|max:10',
            'images.*' => 'image|max:4096',
        ]);

        DB::transaction(function () use ($request, $validated, $product) {
            $product->update([
                'name' => $validated['name'],
                'description' => $validated['description'] ?? null,
                'product_category_id' => $validated['product_category_id'],
                'type' => $validated['type'],
                'base_price' => $validated['base_price'],
                'is_active' => $validated['is_active'] ?? true,
            ]);

            if (array_key_exists('size_prices', $validated)) {
                $syncData = [];
                foreach ($validated['size_prices'] as $sizePrice) {
                    $syncData[$sizePrice['product_size_id']] = [
                        'price' => $sizePrice['price'],
                    ];
                }
                $product->sizes()->sync($syncData);
            }

            $images = $request->file('images', []);
            $startingOrder = $product->images()->count();
            foreach ($images as $index => $image) {
                $path = $image->store('products', 'public');
                $product->images()->create([
                    'path' => $path,
                    'sort_order' => $startingOrder + $index,
                ]);
            }
        });

        return redirect()->route('products.index')
            ->with('success', 'Product updated successfully.');
    }

    public function destroy(Product $product)
    {
        $paths = $product->images()->pluck('path')->all();

        $product->delete();

        if (!empty($paths)) {
            Storage::disk('public')->delete($paths);
        }

        return redirect()->route('products.index')
            ->with('success', 'Product deleted successfully.');
    }
}
