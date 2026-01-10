<?php

namespace App\Enums;

enum KitchenType: string
{
    case MAIN = 'main';
    case GRILL = 'grill';
    case PIZZA = 'pizza';
    case DESSERT = 'dessert';
    case DRINKS = 'drinks';
}
