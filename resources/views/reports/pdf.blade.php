<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>{{ $report['title'] ?? 'Report' }}</title>
    <style>
        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 11px;
            color: #102f33;
            margin: 24px;
        }
        h1 {
            margin: 0 0 6px;
            font-size: 24px;
        }
        p {
            margin: 0 0 12px;
            color: #49666a;
            line-height: 1.5;
        }
        .meta {
            margin-bottom: 18px;
            font-size: 10px;
        }
        .summary {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 18px;
        }
        .summary td {
            width: 25%;
            border: 1px solid #d7e3e2;
            padding: 10px;
            vertical-align: top;
        }
        .summary-label {
            display: block;
            margin-bottom: 4px;
            font-size: 9px;
            color: #5c787c;
            text-transform: uppercase;
            letter-spacing: 0.08em;
        }
        .summary-value {
            font-size: 16px;
            font-weight: bold;
        }
        table.report {
            width: 100%;
            border-collapse: collapse;
        }
        table.report th,
        table.report td {
            border: 1px solid #d7e3e2;
            padding: 7px 8px;
            text-align: left;
            vertical-align: top;
        }
        table.report th {
            background: #eef6f5;
            font-size: 10px;
        }
        .notes {
            margin-top: 18px;
        }
        .notes ul {
            margin: 8px 0 0 18px;
            padding: 0;
        }
        .notes li {
            margin-bottom: 4px;
        }
    </style>
</head>
<body>
    <h1>{{ $report['title'] ?? 'Report' }}</h1>
    <p>{{ $report['description'] ?? '' }}</p>

    <div class="meta">
        <strong>Reporting period:</strong> {{ $period['label'] ?? '' }}<br>
        <strong>Branch scope:</strong> {{ $branchName ?? 'All Branches' }}
    </div>

    @if (!empty($report['summary']))
        <table class="summary">
            <tr>
                @foreach ($report['summary'] as $item)
                    <td>
                        <span class="summary-label">{{ $item['label'] ?? '' }}</span>
                        <span class="summary-value">
                            @if (($item['format'] ?? 'number') === 'currency')
                                {{ 'AFN '.number_format((float) ($item['value'] ?? 0), 0) }}
                            @else
                                {{ number_format((float) ($item['value'] ?? 0), 0) }}
                            @endif
                        </span>
                    </td>
                @endforeach
            </tr>
        </table>
    @endif

    <table class="report">
        <thead>
            <tr>
                @foreach (($report['columns'] ?? []) as $column)
                    <th>{{ $column['label'] ?? '' }}</th>
                @endforeach
            </tr>
        </thead>
        <tbody>
            @forelse (($report['rows'] ?? []) as $row)
                <tr>
                    @foreach (($report['columns'] ?? []) as $column)
                        @php
                            $key = $column['key'] ?? '';
                            $value = $row[$key] ?? '-';
                            $isCurrency = in_array($key, $report['currencyColumns'] ?? [], true);
                        @endphp
                        <td>
                            {{ $isCurrency ? 'AFN '.number_format((float) $value, 0) : $value }}
                        </td>
                    @endforeach
                </tr>
            @empty
                <tr>
                    <td colspan="{{ max(1, count($report['columns'] ?? [])) }}">No rows matched this date range.</td>
                </tr>
            @endforelse
        </tbody>
    </table>

    @if (!empty($report['exportNotes']))
        <div class="notes">
            <strong>Notes</strong>
            <ul>
                @foreach ($report['exportNotes'] as $note)
                    <li>{{ $note }}</li>
                @endforeach
            </ul>
        </div>
    @endif
</body>
</html>
