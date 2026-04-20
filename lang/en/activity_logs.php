<?php

return [
    'title' => 'Activity Logs',
    'description' => 'Track activity across the system. Retained for the last 30 days; older data is available in monthly archives.',
    'filters' => [
        'search' => 'Search',
        'action' => 'Action',
        'entity' => 'Entity',
        'user' => 'User',
        'from' => 'From',
        'to' => 'To',
        'reset' => 'Reset',
        'apply' => 'Apply filters',
    ],
    'columns' => [
        'when' => 'When',
        'user' => 'User',
        'action' => 'Action',
        'entity' => 'Entity',
        'branch' => 'Branch',
        'ip' => 'IP',
        'details' => 'Details',
    ],
    'detail' => [
        'changes' => 'Changes',
        'context' => 'Additional context',
        'no_changes' => 'No field-level changes recorded.',
        'back' => 'Back to list',
    ],
    'archives' => [
        'title' => 'Archived periods',
        'description' => 'Download archived logs for record-keeping. Each archive is a gzipped JSON-lines file keyed by month.',
        'empty' => 'No archives yet. Archives are generated daily at 02:45.',
        'period' => 'Period',
        'records' => 'Records',
        'size' => 'Size',
        'created' => 'Created',
        'download' => 'Download',
    ],
];
