import Heading from '@/components/shared/heading';
import { DataTable } from '@/components/ui/table/data-table';
import { useLocalization } from '@/lib/localization';
import { Branch, Country, Province } from '@/types';
import { formatNumber } from '@/utils/format';
import { useMemo } from 'react';
import { buildColumns } from './columns';

interface BranchesClientProps {
    data: Branch[];
    countries: Country[];
    provinces: Province[];
    isLoading?: boolean;
}

export function BranchesClient({
    data,
    countries,
    provinces,
    isLoading = false,
}: BranchesClientProps) {
    const { t, locale } = useLocalization();
    const columns = useMemo(
        () => buildColumns(countries, provinces, t, locale),
        [countries, locale, provinces, t],
    );

    return (
        <div className="space-y-4">
            <Heading
                title={`${t('branches.page.title', 'Branches')}: ${formatNumber(data.length)}`}
                description={t(
                    'branches.page.description',
                    'Manage market branches',
                )}
            />
            <DataTable
                searchKey={['name', 'country', 'province', 'address']}
                columns={columns}
                data={data}
                isLoading={isLoading}
                searchPlaceholder={t(
                    'branches.filters.searchPlaceholder',
                    'Search branches...',
                )}
            />
        </div>
    );
}
