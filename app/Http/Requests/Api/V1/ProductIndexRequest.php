<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProductIndexRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'category_id' => ['nullable', 'integer', 'exists:product_categories,id'],
            'cuisine_id' => ['nullable', 'integer', 'exists:cuisines,id'],
            'type' => ['nullable', 'string', 'max:50'],
            'kitchen_id' => ['nullable', 'integer', 'exists:kitchens,id'],
            'is_active' => ['nullable', 'boolean'],
            'q' => ['nullable', 'string', 'max:100'],
            'sort_by' => ['nullable', Rule::in(['id', 'name', 'base_price', 'created_at'])],
            'sort_direction' => ['nullable', Rule::in(['asc', 'desc'])],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }
}
