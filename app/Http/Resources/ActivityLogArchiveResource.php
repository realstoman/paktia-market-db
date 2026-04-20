<?php

namespace App\Http\Resources;

use App\Models\AuditLogArchive;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin AuditLogArchive
 */
class ActivityLogArchiveResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'period' => $this->period,
            'disk' => $this->disk,
            'path' => $this->path,
            'records_count' => $this->records_count,
            'size_bytes' => $this->size_bytes,
            'checksum' => $this->checksum,
            'created_at' => optional($this->created_at)->toIso8601String(),
        ];
    }
}
