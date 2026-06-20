<?php

namespace App\Models;

use App\Support\Audit\Auditable;
use Illuminate\Database\Eloquent\Model;

class ContractTemplateArticle extends Model
{
    use Auditable;

    protected $fillable = [
        'contract_template_id',
        'article_number',
        'title',
        'body',
        'sort_order',
    ];

    public function template()
    {
        return $this->belongsTo(ContractTemplate::class, 'contract_template_id');
    }
}
