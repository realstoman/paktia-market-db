<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\ProductImage;
use App\Models\ProductSize;
use App\Models\ProductType;
use App\Models\Cuisine;
use App\Models\Kitchen;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class ProductController extends Controller
{
    private const IMAGE_RULE = ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'];
    private const GALLERY_IMAGE_RULE = ['image', 'mimes:jpg,jpeg,png,webp', 'max:5120'];
    private const CATEGORY_IMAGE_DIMENSIONS = 'dimensions:min_width=400,min_height=167,ratio=400/167';
    private const TYPE_IMAGE_DIMENSIONS = 'dimensions:min_width=400,min_height=167,ratio=400/167';

    public function index()
    {
        $products = Product::with(['category', 'cuisine', 'kitchen', 'sizes', 'images'])
            ->orderBy('name')
            ->get()
            ->each(function (Product $product) {
                $product->images->each->append('url');
            });

        return Inertia::render('products/index', [
            'products' => $products,
            'categories' => ProductCategory::orderBy('sort_order')->orderBy('name')->get(),
            'cuisines' => Cuisine::orderBy('name')->get(),
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
            'cuisine_id' => 'nullable|exists:cuisines,id',
            'kitchen_id' => 'nullable|exists:kitchens,id',
            'type' => 'required|string|max:50',
            'base_price' => 'required|integer|min:0',
            'is_active' => 'boolean',
            'size_prices' => 'array',
            'size_prices.*.product_size_id' => 'required|exists:product_sizes,id',
            'size_prices.*.price' => 'required|integer|min:0',
            'images' => 'array|max:10',
            'images.*' => self::GALLERY_IMAGE_RULE,
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
                'cuisine_id' => $validated['cuisine_id'] ?? null,
                'kitchen_id' => $validated['kitchen_id'] ?? null,
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
            'cuisine_id' => 'nullable|exists:cuisines,id',
            'kitchen_id' => 'nullable|exists:kitchens,id',
            'type' => 'required|string|max:50',
            'base_price' => 'required|integer|min:0',
            'is_active' => 'boolean',
            'sync_size_prices' => 'nullable|boolean',
            'size_prices' => 'sometimes|array',
            'size_prices.*.product_size_id' => 'required|exists:product_sizes,id',
            'size_prices.*.price' => 'required|integer|min:0',
            'remove_image_ids' => 'array',
            'remove_image_ids.*' => 'integer|exists:product_images,id',
            'images' => 'array|max:10',
            'images.*' => self::GALLERY_IMAGE_RULE,
        ]);

        $removeImageIds = $request->user()?->hasRole('super-admin')
            ? collect($validated['remove_image_ids'] ?? [])
            : collect();
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
                'cuisine_id' => $validated['cuisine_id'] ?? null,
                'kitchen_id' => $validated['kitchen_id'] ?? null,
                'type' => strtolower(trim($validated['type'])),
                'base_price' => $validated['base_price'],
                'is_active' => $validated['is_active'] ?? true,
            ]);

            if ($request->boolean('sync_size_prices')) {
                $syncData = [];
                foreach (($validated['size_prices'] ?? []) as $sizePrice) {
                    $syncData[$sizePrice['product_size_id']] = [
                        'price' => $sizePrice['price'],
                    ];
                }
                $product->sizes()->sync($syncData);
            }

            $removeImageIds = $request->user()?->hasRole('super-admin')
                ? ($validated['remove_image_ids'] ?? [])
                : [];
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
        $productName = $product->name;
        $categoryName = $product->category?->name;
        $paths = $product->images()->pluck('path')->all();

        $product->delete();

        if (!empty($paths)) {
            Storage::disk('public')->delete($paths);
        }

        return redirect()->route('products.index')
            ->with('notification', [
                'id' => 'product-deleted-'.str()->uuid(),
                'category' => 'products',
                'title' => 'Product removed',
                'description' => "{$productName} was removed from the catalog.",
                'meta' => $categoryName,
                'href' => '/products',
                'priority' => 'medium',
            ])
            ->with('success', 'Product deleted successfully.');
    }

    public function storeCategory(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:product_categories,name',
            'sort_order' => 'nullable|integer|min:0',
            'pashto_name' => 'nullable|string|max:255',
            'dari_name' => 'nullable|string|max:255',
            'description' => 'nullable|string|max:1000',
            'pashto_description' => 'nullable|string|max:1000',
            'dari_description' => 'nullable|string|max:1000',
            'image' => [...self::IMAGE_RULE, self::CATEGORY_IMAGE_DIMENSIONS],
        ]);

        $imagePath = $request->file('image')?->store('product-categories', 'public');

        ProductCategory::create([
            'name' => $validated['name'],
            'sort_order' => $validated['sort_order'] ?? 0,
            'pashto_name' => $validated['pashto_name'] ?? null,
            'dari_name' => $validated['dari_name'] ?? null,
            'description' => $validated['description'] ?? null,
            'pashto_description' => $validated['pashto_description'] ?? null,
            'dari_description' => $validated['dari_description'] ?? null,
            'image_path' => $imagePath,
        ]);

        return redirect()->route('products.index')
            ->with('success', 'Product category created successfully.');
    }

    public function updateCategory(Request $request, ProductCategory $category)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:product_categories,name,'.$category->id,
            'sort_order' => 'nullable|integer|min:0',
            'pashto_name' => 'nullable|string|max:255',
            'dari_name' => 'nullable|string|max:255',
            'description' => 'nullable|string|max:1000',
            'pashto_description' => 'nullable|string|max:1000',
            'dari_description' => 'nullable|string|max:1000',
            'image' => [...self::IMAGE_RULE, self::CATEGORY_IMAGE_DIMENSIONS],
        ]);

        $payload = [
            'name' => $validated['name'],
            'sort_order' => $validated['sort_order'] ?? 0,
            'pashto_name' => $validated['pashto_name'] ?? null,
            'dari_name' => $validated['dari_name'] ?? null,
            'description' => $validated['description'] ?? null,
            'pashto_description' => $validated['pashto_description'] ?? null,
            'dari_description' => $validated['dari_description'] ?? null,
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
            'pashto_name' => 'nullable|string|max:255',
            'dari_name' => 'nullable|string|max:255',
            'description' => 'nullable|string|max:1000',
            'pashto_description' => 'nullable|string|max:1000',
            'dari_description' => 'nullable|string|max:1000',
            'image' => [...self::IMAGE_RULE, self::TYPE_IMAGE_DIMENSIONS],
        ]);

        $normalizedName = strtolower(trim($validated['name']));
        $imagePath = $request->file('image')?->store('product-types', 'public');

        ProductType::create([
            'name' => $normalizedName,
            'pashto_name' => $validated['pashto_name'] ?? null,
            'dari_name' => $validated['dari_name'] ?? null,
            'description' => $validated['description'] ?? null,
            'pashto_description' => $validated['pashto_description'] ?? null,
            'dari_description' => $validated['dari_description'] ?? null,
            'image_path' => $imagePath,
        ]);

        return redirect()->route('products.index')
            ->with('success', 'Product type created successfully.');
    }

    public function updateType(Request $request, ProductType $type)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:50|unique:product_types,name,'.$type->id,
            'pashto_name' => 'nullable|string|max:255',
            'dari_name' => 'nullable|string|max:255',
            'description' => 'nullable|string|max:1000',
            'pashto_description' => 'nullable|string|max:1000',
            'dari_description' => 'nullable|string|max:1000',
            'image' => [...self::IMAGE_RULE, self::TYPE_IMAGE_DIMENSIONS],
        ]);

        $oldName = $type->name;
        $newName = strtolower(trim($validated['name']));
        $payload = [
            'name' => $newName,
            'pashto_name' => $validated['pashto_name'] ?? null,
            'dari_name' => $validated['dari_name'] ?? null,
            'description' => $validated['description'] ?? null,
            'pashto_description' => $validated['pashto_description'] ?? null,
            'dari_description' => $validated['dari_description'] ?? null,
        ];

        if ($request->hasFile('image')) {
            if ($type->image_path) {
                Storage::disk('public')->delete($type->image_path);
            }

            $payload['image_path'] = $request->file('image')->store('product-types', 'public');
        }

        DB::transaction(function () use ($oldName, $newName, $payload, $type) {
            $type->update($payload);

            if ($oldName !== $newName) {
                Product::where('type', $oldName)->update([
                    'type' => $newName,
                ]);
            }
        });

        return redirect()->route('products.index')
            ->with('success', 'Product type updated successfully.');
    }

    public function destroyType(ProductType $type)
    {
        if (Product::where('type', $type->name)->exists()) {
            throw ValidationException::withMessages([
                'type' => 'This type is in use by products and cannot be deleted.',
            ]);
        }

        if ($type->image_path) {
            Storage::disk('public')->delete($type->image_path);
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
