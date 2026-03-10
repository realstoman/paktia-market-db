<?php

use App\Models\Banner;

test('api v1 banners index returns only active banners in slider order', function () {
    Banner::create([
        'title' => 'Inactive Banner',
        'image_path' => 'banners/inactive.jpg',
        'link' => 'https://facebook.com/babataste',
        'link_type' => 'external',
        'sort_order' => 1,
        'is_active' => false,
    ]);

    $second = Banner::create([
        'title' => 'Qabuli Palaw',
        'image_path' => 'banners/qabuli.jpg',
        'link' => '/products/qabuli-palaw',
        'link_type' => 'internal',
        'sort_order' => 2,
        'is_active' => true,
    ]);

    $first = Banner::create([
        'title' => 'Facebook Promo',
        'image_path' => 'banners/facebook.jpg',
        'link' => 'https://facebook.com/babataste',
        'link_type' => 'external',
        'sort_order' => 1,
        'is_active' => true,
    ]);

    $this->getJson('/api/v1/banners')
        ->assertOk()
        ->assertJsonCount(2, 'data')
        ->assertJsonPath('data.0.id', $first->id)
        ->assertJsonPath('data.0.link_type', 'external')
        ->assertJsonPath('data.0.image_url', '/storage/banners/facebook.jpg')
        ->assertJsonPath('data.1.id', $second->id)
        ->assertJsonPath('data.1.link', '/products/qabuli-palaw');
});
