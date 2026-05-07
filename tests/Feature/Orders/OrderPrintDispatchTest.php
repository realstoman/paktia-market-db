<?php

use App\Models\Branch;
use App\Models\Country;
use App\Models\Kitchen;
use App\Models\Order;
use App\Models\Printer;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\Province;
use App\Models\User;
use App\Services\Order\OrderService;
use App\Services\Printing\PrinterTransportService;
use Database\Seeders\RolePermissionSeeder;

function createOrderPrintDispatchData(): array
{
    $country = Country::create([
        'name' => 'Afghanistan',
        'code' => 'AF',
        'currency_code' => 'AFN',
        'currency_symbol' => 'AFN',
        'is_active' => true,
    ]);

    $province = Province::create([
        'country_id' => $country->id,
        'name' => 'Kabul',
    ]);

    $branch = Branch::create([
        'country_id' => $country->id,
        'province_id' => $province->id,
        'name' => 'Main Branch',
        'address' => 'Kabul',
        'description' => 'HQ',
        'is_active' => true,
    ]);

    $kitchen = Kitchen::create([
        'branch_id' => $branch->id,
        'name' => 'Afghan Dishes Kitchen',
        'is_active' => true,
    ]);

    $category = ProductCategory::create([
        'name' => 'Afghan Foods',
    ]);

    $product = Product::create([
        'name' => 'Kabuli Pulao',
        'product_category_id' => $category->id,
        'kitchen_id' => $kitchen->id,
        'type' => 'food',
        'base_price' => 450,
        'is_active' => true,
    ]);

    return [$branch, $kitchen, $product];
}

function registerPrinterFixtures(Branch $branch, Kitchen $kitchen): array
{
    $kitchenPrinter = Printer::create([
        'branch_id' => $branch->id,
        'name' => 'Afghan Kitchen Printer',
        'ip_address' => '192.168.10.21',
        'port' => 9100,
        'connection_type' => 'network',
        'paper_width' => '80mm',
        'copies' => 1,
        'is_active' => true,
    ]);

    $kitchenPrinter->assignments()->create([
        'assignment_type' => 'kitchen',
        'kitchen_id' => $kitchen->id,
        'is_active' => true,
        'priority' => 1,
    ]);

    $operatorPrinter = Printer::create([
        'branch_id' => $branch->id,
        'name' => 'Order Taker Printer',
        'ip_address' => '192.168.10.31',
        'port' => 9100,
        'connection_type' => 'network',
        'paper_width' => '80mm',
        'copies' => 1,
        'is_active' => true,
    ]);

    $operatorPrinter->assignments()->create([
        'assignment_type' => 'order_taker',
        'station_label' => 'Front Desk',
        'is_active' => true,
        'priority' => 1,
    ]);

    return [$kitchenPrinter, $operatorPrinter];
}

function fakeSuccessfulPrinterTransport(): object
{
    $transport = new class extends PrinterTransportService
    {
        public array $sent = [];

        public function sendNetworkPrint(Printer $printer, string $content): array
        {
            $this->sent[] = [
                'printer_id' => $printer->id,
                'content' => $content,
            ];

            return ['success' => true];
        }
    };

    app()->instance(PrinterTransportService::class, $transport);

    return $transport;
}

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

test('creating an order dispatches kitchen and operator print jobs', function () {
    [$branch, $kitchen, $product] = createOrderPrintDispatchData();
    [$kitchenPrinter, $operatorPrinter] = registerPrinterFixtures($branch, $kitchen);
    $transport = fakeSuccessfulPrinterTransport();

    $orderTaker = User::factory()->create(['branch_id' => $branch->id]);
    $orderTaker->assignRole('order-taker');

    app(OrderService::class)->createOrder([
        'branch_id' => $branch->id,
        'order_type' => 'takeaway',
        'customer_name' => 'Walk In',
        'customer_phone' => '0700000000',
        'delivery_address' => null,
        'items' => [
            [
                'product_id' => $product->id,
                'product_size_id' => null,
                'quantity' => 2,
                'price' => 450,
            ],
        ],
    ], $orderTaker->id, $orderTaker);

    $order = Order::query()->latest('id')->firstOrFail();
    $order->refresh();

    expect($order->items)->toHaveCount(1);
    expect($order->items->first()?->kitchen_receipt_printed_at)->not->toBeNull();
    expect($transport->sent)->toHaveCount(2);
    expect(collect($transport->sent)->pluck('printer_id')->all())
        ->toEqualCanonicalizing([$kitchenPrinter->id, $operatorPrinter->id]);
    expect($transport->sent[0]['content'].$transport->sent[1]['content'])
        ->toContain('Kabuli Pulao');
    expect(\App\Models\PrintJob::query()->count())->toBe(2);
});

test('updating an order with extra quantity prints only the kitchen delta', function () {
    [$branch, $kitchen, $product] = createOrderPrintDispatchData();
    [$kitchenPrinter, $operatorPrinter] = registerPrinterFixtures($branch, $kitchen);
    $transport = fakeSuccessfulPrinterTransport();

    $orderTaker = User::factory()->create(['branch_id' => $branch->id]);
    $orderTaker->assignRole('order-taker');

    $service = app(OrderService::class);

    $service->createOrder([
        'branch_id' => $branch->id,
        'order_type' => 'takeaway',
        'customer_name' => 'Walk In',
        'customer_phone' => '0700000000',
        'delivery_address' => null,
        'items' => [
            [
                'product_id' => $product->id,
                'product_size_id' => null,
                'quantity' => 1,
                'price' => 450,
            ],
        ],
    ], $orderTaker->id, $orderTaker);

    $order = Order::query()->latest('id')->firstOrFail();

    $service->updateOrder($order, [
        'branch_id' => $branch->id,
        'branch_table_id' => null,
        'order_type' => 'takeaway',
        'customer_name' => 'Walk In',
        'customer_phone' => '0700000000',
        'delivery_address' => null,
        'items' => [
            [
                'product_id' => $product->id,
                'product_size_id' => null,
                'quantity' => 2,
                'price' => 450,
            ],
        ],
    ], $orderTaker);

    $order->refresh();
    $items = $order->items()->orderBy('id')->get();

    expect($items)->toHaveCount(2);
    expect((int) $items[0]->quantity)->toBe(1);
    expect((int) $items[1]->quantity)->toBe(1);
    expect($items[0]->kitchen_receipt_printed_at)->not->toBeNull();
    expect($items[1]->kitchen_receipt_printed_at)->not->toBeNull();

    $kitchenPrints = collect($transport->sent)
        ->where('printer_id', $kitchenPrinter->id)
        ->pluck('content')
        ->values();

    $operatorPrints = collect($transport->sent)
        ->where('printer_id', $operatorPrinter->id)
        ->pluck('content')
        ->values();

    expect($kitchenPrints)->toHaveCount(2);
    expect($operatorPrints)->toHaveCount(2);
    expect($kitchenPrints[1])->toContain('1 x Kabuli Pulao');
    expect($kitchenPrints[1])->not->toContain('2 x Kabuli Pulao');
    expect($operatorPrints[1])->toContain('Updated order');
});
