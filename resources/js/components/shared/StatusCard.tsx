import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface StatusCardProps {
    icon: ReactNode;
    title: string;
    value: number;
    description?: string;
    color?: string;
    badgeVariant?:
        | 'default'
        | 'secondary'
        | 'destructive'
        | 'outline'
        | 'success';
}

const StatusCard = ({
    icon,
    title,
    value,
    description,
    color = 'bg-primary',
    badgeVariant = 'default',
}: StatusCardProps) => {
    const getBadgeVariant = () => {
        const variantMap: Record<
            string,
            'default' | 'secondary' | 'destructive' | 'outline'
        > = {
            Pending: 'secondary',
            Preparing: 'default',
            Completed: 'outline',
            Cancelled: 'destructive',
        };
        return variantMap[title] || badgeVariant;
    };

    return (
        <Card className="relative overflow-hidden transition-all hover:shadow-md">
            <div className="absolute top-0 right-0 h-24 w-24">
                <div
                    className={cn(
                        'absolute -top-6 -right-6 h-32 w-32 rounded-full opacity-10',
                        color,
                    )}
                />
            </div>

            <CardContent className="p-6">
                <div className="flex items-start justify-between">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <div className={cn('rounded-lg p-2', color)}>
                                <div className="h-4 w-4 text-white">{icon}</div>
                            </div>
                            <h3 className="text-sm font-medium text-muted-foreground">
                                {title}
                            </h3>
                        </div>

                        <div className="space-y-1">
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-bold tracking-tight">
                                    {value}
                                </span>
                                <Badge
                                    variant={getBadgeVariant()}
                                    className="font-semibold"
                                >
                                    {value}
                                </Badge>
                            </div>

                            {description && (
                                <p className="text-xs text-muted-foreground">
                                    {description}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default StatusCard;
