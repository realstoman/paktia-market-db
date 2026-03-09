<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\ProductImage;
use App\Models\ProductSize;
use App\Models\ProductType;
use App\Models\Kitchen;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class ProductController extends Controller
{
    public function index()
    {
        $products = Product::with(['category', 'kitchen', 'sizes', 'images'])
            ->orderBy('name')
            ->get()
            ->each(function (Product $product) {
                $product->images->each->append('url');
            });

        return Inertia::render('products/index', [
            'products' => $products,
            'categories' => ProductCategory::orderBy('name')->get(),
            'types' => ProductType::orderBy('name')->get(),
            'kitchens' => Kitchen::orderBy('name')->get(),
            'sizes' => ProductSize::orderBy('id')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'pashto_name' => 'nullable|string|max:255',
            'dari_name' => 'nullable|string|max:255',
            'description' => 'nullable|string|max:1000',
            'pashto_description' => 'nullable|string|max:1000',
            'dari_description' => 'nullable|string|max:1000',
            'product_category_id' => 'required|exists:product_categories,id',
            'kitchen_id' => 'required|exists:kitchens,id',
            'type' => 'required|string|max:50',
            'base_price' => 'required|integer|min:0',
            'is_active' => 'boolean',
            'size_prices' => 'array',
            'size_prices.*.product_size_id' => 'required|exists:product_sizes,id',
            'size_prices.*.price' => 'required|integer|min:0',
            'images' => 'array|max:10',
            'images.*' => 'image|max:4096',
        ]);

        DB::transaction(function () use ($request, $validated) {
            $product = Product::create([
                'name' => $validated['name'],
                'pashto_name' => $validated['pashto_name'] ?? null,
                'dari_name' => $validated['dari_name'] ?? null,
                'description' => $validated['description'] ?? null,
                'pashto_description' => $validated['pashto_description'] ?? null,
                'dari_description' => $validated['dari_description'] ?? null,
                'product_category_id' => $validated['product_category_id'],
                'kitchen_id' => $validated['kitchen_id'],
                'type' => strtolower(trim($validated['type'])),
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
            'pashto_name' => 'nullable|string|max:255',
            'dari_name' => 'nullable|string|max:255',
            'description' => 'nullable|string|max:1000',
            'pashto_description' => 'nullable|string|max:1000',
            'dari_description' => 'nullable|string|max:1000',
            'product_category_id' => 'required|exists:product_categories,id',
            'kitchen_id' => 'required|exists:kitchens,id',
            'type' => 'required|string|max:50',
            'base_price' => 'required|integer|min:0',
            'is_active' => 'boolean',
            'size_prices' => 'sometimes|array',
            'size_prices.*.product_size_id' => 'required|exists:product_sizes,id',
            'size_prices.*.price' => 'required|integer|min:0',
            'remove_image_ids' => 'array',
            'remove_image_ids.*' => 'integer|exists:product_images,id',
            'images' => 'array|max:10',
            'images.*' => 'image|max:4096',
        ]);

        $removeImageIds = collect($validated['remove_image_ids'] ?? []);
        if ($removeImageIds->isNotEmpty()) {
            $validCount = $product->images()
                ->whereIn('id', $removeImageIds)
                ->count();

            if ($validCount !== $removeImageIds->count()) {
                throw ValidationException::withMessages([
                    'remove_image_ids' => 'One or more images do not belong to this product.',
                ]);
            }
        }

        $remainingCount = $product->images()
            ->whereNotIn('id', $removeImageIds->all())
            ->count();
        $newUploadCount = count($request->file('images', []));
        if (($remainingCount + $newUploadCount) > 10) {
            throw ValidationException::withMessages([
                'images' => 'A product can have at most 10 images.',
            ]);
        }

        DB::transaction(function () use ($request, $validated, $product) {
            $product->update([
                'name' => $validated['name'],
                'pashto_name' => $validated['pashto_name'] ?? null,
                'dari_name' => $validated['dari_name'] ?? null,
                'description' => $validated['description'] ?? null,
                'pashto_description' => $validated['pashto_description'] ?? null,
                'dari_description' => $validated['dari_description'] ?? null,
                'product_category_id' => $validated['product_category_id'],
                'kitchen_id' => $validated['kitchen_id'],
                'type' => strtolower(trim($validated['type'])),
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

            $removeImageIds = $validated['remove_image_ids'] ?? [];
            if (!empty($removeImageIds)) {
                $imagesToRemove = $product->images()
                    ->whereIn('id', $removeImageIds)
                    ->get();

                Storage::disk('public')->delete($imagesToRemove->pluck('path')->all());
                $product->images()->whereIn('id', $removeImageIds)->delete();
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

    public function storeCategory(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:product_categories,name',
            'description' => 'nullable|string|max:1000',
            'image' => 'nullable|image|max:5120|dimensions:min_width=1200,min_height=500,ratio=12/5',
        ]);

        $imagePath = $request->file('image')?->store('product-categories', 'public');

        ProductCategory::create([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'image_path' => $imagePath,
        ]);

        return redirect()->route('products.index')
            ->with('success', 'Product category created successfully.');
    }

    public function updateCategory(Request $request, ProductCategory $category)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:product_categories,name,'.$category->id,
            'description' => 'nullable|string|max:1000',
            'image' => 'nullable|image|max:5120|dimensions:min_width=1200,min_height=500,ratio=12/5',
        ]);

        $payload = [
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
        ];

        if ($request->hasFile('image')) {
            if ($category->image_path) {
                Storage::disk('public')->delete($category->image_path);
            }

            $payload['image_path'] = $request->file('image')->store('product-categories', 'public');
        }

        $category->update($payload);

        return redirect()->route('products.index')
            ->with('success', 'Product category updated successfully.');
    }

    public function destroyCategory(ProductCategory $category)
    {
        if ($category->products()->exists()) {
            throw ValidationException::withMessages([
                'category' => 'This category is in use by products and cannot be deleted.',
            ]);
        }

        if ($category->image_path) {
            Storage::disk('public')->delete($category->image_path);
        }

        $category->delete();

        return redirect()->route('products.index')
            ->with('success', 'Product category deleted successfully.');
    }

    public function storeType(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:50|unique:product_types,name',
        ]);

        ProductType::create([
            'name' => strtolower(trim($validated['name'])),
        ]);

        return redirect()->route('products.index')
            ->with('success', 'Product type created successfully.');
    }

    public function destroyType(ProductType $type)
    {
        if (Product::where('type', $type->name)->exists()) {
            throw ValidationException::withMessages([
                'type' => 'This type is in use by products and cannot be deleted.',
            ]);
        }

        $type->delete();

        return redirect()->route('products.index')
            ->with('success', 'Product type deleted successfully.');
    }

    public function destroyImage(Product $product, ProductImage $productImage)
    {
        if ($productImage->product_id !== $product->id) {
            throw ValidationException::withMessages([
                'image' => 'Invalid product image.',
            ]);
        }

        Storage::disk('public')->delete($productImage->path);
        $productImage->delete();

        return redirect()->route('products.index')
            ->with('success', 'Product image removed successfully.');
    }
}
