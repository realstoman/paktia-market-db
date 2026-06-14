<?php

use App\Models\Banner;

test('api v1 banners index returns only active banners in slider order', function () {
    Banner::create([
        'title' => 'Inactive Banner',
        'banner_type' => 'social',
        'image_path' => 'banners/inactive.jpg',
        'link' => 'https://example.com/paktia-market',
        'link_type' => 'external',
        'sort_order' => 1,
        'is_active' => false,
    ]);

    $second = Banner::create([
        'title' => 'Qabuli Palaw',
        'banner_type' => 'product',
        'image_path' => 'banners/qabuli.jpg',
        'link' => '/products/qabuli-palaw',
        'link_type' => 'internal',
        'sort_order' => 2,
        'is_active' => true,
    ]);

    $first = Banner::create([
        'title' => 'Facebook Promo',
        'banner_type' => 'social',
        'image_path' => 'banners/facebook.jpg',
        'link' => 'https://example.com/paktia-market',
        'link_type' => 'external',
        'sort_order' => 1,
        'is_active' => true,
    ]);

    $this->getJson('/api/v1/banners')
        ->assertOk()
        ->assertJsonCount(2, 'data')
        ->assertJsonPath('data.0.id', $first->id)
        ->assertJsonPath('data.0.banner_type', 'social')
        ->assertJsonPath('data.0.link_type', 'external')
        ->assertJsonPath('data.0.image_url', '/storage/banners/facebook.jpg')
        ->assertJsonPath('data.1.id', $second->id)
        ->assertJsonPath('data.1.banner_type', 'product')
        ->assertJsonPath('data.1.link', '/products/qabuli-palaw');
});

test('api v1 banners show returns a single active banner', function () {
    $banner = Banner::create([
        'title' => 'Afghan Dishes',
        'banner_type' => 'category',
        'image_path' => 'banners/afghan-dishes.jpg',
        'link' => '/categories/afghan-dishes',
        'link_type' => 'internal',
        'sort_order' => 3,
        'is_active' => true,
    ]);

    $this->getJson('/api/v1/banners/'.$banner->id)
        ->assertOk()
        ->assertJsonPath('data.id', $banner->id)
        ->assertJsonPath('data.title', 'Afghan Dishes')
        ->assertJsonPath('data.banner_type', 'category')
        ->assertJsonPath('data.link_type', 'internal')
        ->assertJsonPath('data.image_url', '/storage/banners/afghan-dishes.jpg');
});

test('api v1 banners show returns 404 for inactive banners', function () {
    $banner = Banner::create([
        'title' => 'Hidden Banner',
        'banner_type' => 'gift',
        'image_path' => 'banners/hidden.jpg',
        'link' => '/gifts/nowruz',
        'link_type' => 'internal',
        'sort_order' => 4,
        'is_active' => false,
    ]);

    $this->getJson('/api/v1/banners/'.$banner->id)
        ->assertNotFound();
});
