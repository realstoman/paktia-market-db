<?php

namespace App\Support\Audit;

use App\Services\Audit\AuditLogger;
use Illuminate\Database\Eloquent\Model;

/**
 * Attach to any Eloquent model to have its lifecycle changes recorded in audit_logs.
 *
 * Override `auditIgnoredAttributes()` on the model to skip specific columns.
 */
trait Auditable
{
    public static function bootAuditable(): void
    {
        static::created(function (Model $model) {
            self::writeAudit('created', $model, null, self::auditableValuesFor($model, $model->getAttributes()));
        });

        static::updated(function (Model $model) {
            $changes = $model->getChanges();

            if ($changes === []) {
                return;
            }

            $ignored = array_flip($model->auditIgnoredAttributes());
            $changes = array_diff_key($changes, $ignored);

            if ($changes === []) {
                return;
            }

            $original = collect($changes)
                ->mapWithKeys(fn ($value, string $key) => [$key => $model->getOriginal($key)])
                ->all();

            self::writeAudit(
                'updated',
                $model,
                self::auditableValuesFor($model, $original),
                self::auditableValuesFor($model, $changes),
            );
        });

        static::deleted(function (Model $model) {
            self::writeAudit(
                'deleted',
                $model,
                self::auditableValuesFor($model, $model->getOriginal()),
                null,
            );
        });

        if (method_exists(static::class, 'restored')) {
            static::restored(function (Model $model) {
                self::writeAudit(
                    'restored',
                    $model,
                    null,
                    self::auditableValuesFor($model, $model->getAttributes()),
                );
            });
        }
    }

    /**
     * @return array<int, string>
     */
    public function auditIgnoredAttributes(): array
    {
        return array_values(array_unique(array_merge(
            [
                'updated_at',
                'created_at',
                'remember_token',
                'password',
                'two_factor_secret',
                'two_factor_recovery_codes',
            ],
            $this->getHidden(),
        )));
    }

    /**
     * @param  array<string, mixed>  $values
     * @return array<string, mixed>
     */
    protected static function auditableValuesFor(Model $model, array $values): array
    {
        $ignored = array_flip($model->auditIgnoredAttributes());

        $filtered = array_diff_key($values, $ignored);

        // Mask any field that was explicitly hidden. Keep the key so reviewers know
        // something changed but never leak the actual value.
        foreach ($model->getHidden() as $hiddenKey) {
            if (array_key_exists($hiddenKey, $filtered)) {
                $filtered[$hiddenKey] = '***';
            }
        }

        return $filtered;
    }

    protected static function writeAudit(
        string $action,
        Model $model,
        ?array $old,
        ?array $new,
    ): void {
        app(AuditLogger::class)->log(
            action: $action,
            subject: $model,
            oldValues: $old,
            newValues: $new,
        );
    }
}
