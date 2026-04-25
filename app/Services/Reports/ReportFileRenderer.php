<?php

namespace App\Services\Reports;

use Barryvdh\DomPDF\Facade\Pdf;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

/**
 * Renders prepared report payloads (the array returned by
 * ReportsController::buildReportPageData()) into binary PDF or XLSX
 * content. Used both synchronously by the controller and asynchronously
 * by RenderReportExportJob.
 */
class ReportFileRenderer
{
    public function defaultFilename(array $data, string $extension): string
    {
        return sprintf(
            '%s-report-%s-to-%s.%s',
            (string) ($data['filters']['module'] ?? 'report'),
            (string) ($data['period']['startDate'] ?? 'start'),
            (string) ($data['period']['endDate'] ?? 'end'),
            $extension,
        );
    }

    public function renderPdf(array $data): string
    {
        $report = $data['activeReport'] ?? [];
        $branchName = $this->resolveBranchName($data);

        return Pdf::loadView('reports/pdf', [
            'report' => $report,
            'period' => $data['period'] ?? [],
            'filters' => $data['filters'] ?? [],
            'branchName' => $branchName,
        ])->setPaper('a4', 'landscape')->output();
    }

    public function renderXlsx(array $data): string
    {
        $report = $data['activeReport'] ?? [];
        $branchName = $this->resolveBranchName($data);

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle(substr((string) ($report['title'] ?? 'Report'), 0, 31));

        $row = 1;
        $sheet->setCellValue("A{$row}", (string) ($report['title'] ?? 'Report'));
        $row++;
        $sheet->setCellValue("A{$row}", 'Reporting period');
        $sheet->setCellValue("B{$row}", (string) ($data['period']['label'] ?? ''));
        $row++;
        $sheet->setCellValue("A{$row}", 'Branch scope');
        $sheet->setCellValue("B{$row}", $branchName);
        $row += 2;

        $summary = $report['summary'] ?? [];
        if ($summary !== []) {
            $sheet->setCellValue("A{$row}", 'Summary');
            $row++;
            $sheet->setCellValue("A{$row}", 'Metric');
            $sheet->setCellValue("B{$row}", 'Value');
            $row++;

            foreach ($summary as $item) {
                $sheet->setCellValue("A{$row}", (string) ($item['label'] ?? ''));
                $sheet->setCellValue("B{$row}", (float) ($item['value'] ?? 0));
                $row++;
            }

            $row++;
        }

        $columns = $report['columns'] ?? [];
        $rows = $report['rows'] ?? [];
        $currencyColumns = collect($report['currencyColumns'] ?? [])
            ->map(fn ($column) => (string) $column)->all();

        foreach ($columns as $columnIndex => $column) {
            $sheet->setCellValue(
                $this->cellAddress($columnIndex + 1, $row),
                (string) ($column['label'] ?? ''),
            );
        }
        $row++;

        foreach ($rows as $reportRow) {
            foreach ($columns as $columnIndex => $column) {
                $key = (string) ($column['key'] ?? '');
                $value = $reportRow[$key] ?? '';
                $cellValue = in_array($key, $currencyColumns, true)
                    ? (float) $value
                    : (string) $value;

                $sheet->setCellValue(
                    $this->cellAddress($columnIndex + 1, $row),
                    $cellValue,
                );
            }

            $row++;
        }

        foreach (range(1, max(1, count($columns))) as $columnIndex) {
            $sheet->getColumnDimensionByColumn($columnIndex)->setAutoSize(true);
        }

        ob_start();
        try {
            $writer = new Xlsx($spreadsheet);
            $writer->save('php://output');

            return (string) ob_get_clean();
        } catch (\Throwable $exception) {
            ob_end_clean();
            throw $exception;
        }
    }

    private function resolveBranchName(array $data): string
    {
        $branchId = $data['filters']['branchId'] ?? null;
        $branches = $data['branches'] ?? [];
        $branch = collect($branches)->firstWhere('id', $branchId);

        return is_array($branch) ? (string) ($branch['name'] ?? 'All Branches') : 'All Branches';
    }

    private function cellAddress(int $columnIndex, int $row): string
    {
        return Coordinate::stringFromColumnIndex($columnIndex).$row;
    }
}
