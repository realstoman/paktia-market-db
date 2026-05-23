<?php

namespace App\Policies;

use App\Enums\PermissionEnum;
use App\Models\Order;
use App\Models\User;

class OrderPolicy
{
    /**
     * Kitchen role is restricted to the kitchen workflow surface and must
     * never be allowed to use the order management endpoints.
     */
    private function isKitchenOnly(User $user): bool
    {
        return $user->hasRole('kitchen') && ! $user->hasRole('super-admin');
    }

    private function isOnlineOrdersOperator(User $user): bool
    {
        return $user->hasRole('online-orders-operator')
            && ! $user->hasRole('super-admin');
    }

    private function isOnlineOrder(Order $order): bool
    {
        return in_array((string) ($order->source ?? 'pos'), ['website', 'mobile_app'], true);
    }

    public function viewAny(User $user): bool
    {
        if ($this->isKitchenOnly($user)) {
            return false;
        }

        return $user->can(PermissionEnum::ORDERS_VIEW->value);
    }

    public function view(User $user, Order $order): bool
    {
        if ($this->isOnlineOrdersOperator($user) && ! $this->isOnlineOrder($order)) {
            return false;
        }

        return $this->viewAny($user);
    }

    public function create(User $user): bool
    {
        if ($this->isKitchenOnly($user) || $this->isOnlineOrdersOperator($user)) {
            return false;
        }

        return $user->can(PermissionEnum::ORDERS_CREATE->value);
    }

    public function update(User $user, Order $order): bool
    {
        if ($this->isKitchenOnly($user)) {
            return false;
        }

        if ($this->isOnlineOrdersOperator($user) && ! $this->isOnlineOrder($order)) {
            return false;
        }

        return $user->can(PermissionEnum::ORDERS_UPDATE->value);
    }

    /**
     * Generic gate for write actions on the order surface (status updates,
     * table re-assignment, item additions). Mirrors update() but lets the
     * controller call it without a route-bound Order instance.
     */
    public function manage(User $user): bool
    {
        if ($this->isKitchenOnly($user) || $this->isOnlineOrdersOperator($user)) {
            return false;
        }

        return $user->can(PermissionEnum::ORDERS_UPDATE->value);
    }
}
