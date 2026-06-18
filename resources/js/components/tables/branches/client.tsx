import Heading from '@/components/shared/heading';
import { DataTable } from '@/components/ui/table/data-table';
import { useLocalization } from '@/lib/localization';
import { Property, Country, Province } from '@/types';
import { formatNumber } from '@/utils/format';
import { useMemo } from 'react';
import { buildColumns } from './columns';

interface PropertiesClientProps {
    data: Property[];
    countries: Country[];
    provinces: Province[];
    isLoading?: boolean;
}

export function PropertiesClient({
    data,
    countries,
    provinces,
    isLoading = false,
}: PropertiesClientProps) {
    const { t, locale } = useLocalization();
    const columns = useMemo(
        () => buildColumns(countries, provinces, t, locale),
        [countries, locale, provinces, t],
    );

    return (
        <div className="space-y-4">
            <Heading
                title={`${t('properties.page.title', 'Properties')}: ${formatNumber(data.length)}`}
                description={t(
                    'properties.page.description',
                    'Manage market properties',
                )}
            />
            <DataTable
                searchKey={['name', 'country', 'province', 'address']}
                columns={columns}
                data={data}
                isLoading={isLoading}
                searchPlaceholder={t(
                    'properties.filters.searchPlaceholder',
                    'Search properties...',
                )}
            />
        </div>
    );
}
