<?php

namespace App\Http\Controllers;

use App\Models\Banner;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class BannerController extends Controller
{
    private const IMAGE_RULE = ['image', 'mimes:jpg,jpeg,png,webp', 'max:5120'];

    private function redirectToToolbarOrigin(Request $request)
    {
        $referer = $request->headers->get('referer');

        if ($referer && ! str_contains($referer, '/tools/reference-data')) {
            return redirect()->to($referer);
        }

        return redirect()->route('inventory.index');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'banner_type' => ['required', Rule::in(['product', 'gift', 'category', 'type', 'social'])],
            'image' => ['required', ...self::IMAGE_RULE],
            'link' => ['nullable', 'string', 'max:2048'],
            'link_type' => ['required', Rule::in(['internal', 'external'])],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $imagePath = $request->file('image')?->store('banners', 'public');

        Banner::create([
            'title' => $validated['title'],
            'banner_type' => $validated['banner_type'],
            'image_path' => $imagePath,
            'link' => $validated['link'] ?? null,
            'link_type' => $validated['link_type'],
            'sort_order' => $validated['sort_order'] ?? 0,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return $this->redirectToToolbarOrigin($request)
            ->with('success', 'Banner created successfully.');
    }

    public function update(Request $request, Banner $banner)
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'banner_type' => ['required', Rule::in(['product', 'gift', 'category', 'type', 'social'])],
            'image' => ['nullable', ...self::IMAGE_RULE],
            'link' => ['nullable', 'string', 'max:2048'],
            'link_type' => ['required', Rule::in(['internal', 'external'])],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $imagePath = $banner->image_path;

        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')?->store('banners', 'public');

            if ($banner->image_path) {
                Storage::disk('public')->delete($banner->image_path);
            }
        }

        $banner->update([
            'title' => $validated['title'],
            'banner_type' => $validated['banner_type'],
            'image_path' => $imagePath,
            'link' => $validated['link'] ?? null,
            'link_type' => $validated['link_type'],
            'sort_order' => $validated['sort_order'] ?? 0,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return $this->redirectToToolbarOrigin($request)
            ->with('success', 'Banner updated successfully.');
    }

    public function destroy(Request $request, Banner $banner)
    {
        if ($banner->image_path) {
            Storage::disk('public')->delete($banner->image_path);
        }

        $banner->delete();

        return $this->redirectToToolbarOrigin($request)
            ->with('success', 'Banner deleted successfully.');
    }
}
