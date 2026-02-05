import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Field } from '@/components/ui/field';
import {
    InputGroup,
    InputGroupAddon,
    InputGroupButton,
    InputGroupInput,
} from '@/components/ui/input-group';
import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { illustrations } from '@/config/brand';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import {
    CalendarIcon,
    ChefHat,
    CookingPot,
    SquareX,
    Utensils,
} from 'lucide-react';
import React from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

function formatDate(date: Date | undefined) {
    if (!date) {
        return '';
    }
    return date.toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    });
}
function isValidDate(date: Date | undefined) {
    if (!date) {
        return false;
    }
    return !isNaN(date.getTime());
}

export default function Dashboard() {
    const [open, setOpen] = React.useState(false);
    const [date, setDate] = React.useState<Date | undefined>(
        new Date('2025-06-01'),
    );
    const [month, setMonth] = React.useState<Date | undefined>(date);
    const [value, setValue] = React.useState(formatDate(date));

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="grid auto-rows-min gap-4 md:grid-cols-4">
                    <div className="col-span-1 flex flex-col gap-4">
                        <div className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                            <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                        </div>
                        <div className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                            <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                        </div>
                    </div>
                    <div className="col-span-2 flex h-100 justify-between overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                        <div className="items-left flex w-100 flex-1 flex-col justify-between px-8 pt-12">
                            <div className="pb-8">
                                <h1 className="text-3xl">
                                    Order Status Overview
                                </h1>
                                <p>
                                    Track real-time order progress across all
                                    stages
                                </p>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <div className="rounded-sm border border-sidebar-border/70 bg-neutral-50 p-1 dark:border-sidebar-border">
                                        <ChefHat />
                                    </div>
                                    <p className="text-lg">Pending Orders</p>
                                    <Badge variant={'default'}>12</Badge>
                                </div>
                                <div className="flex gap-2">
                                    <CookingPot />
                                    Preparing Orders
                                </div>
                                <div className="flex gap-2">
                                    <Utensils />
                                    Completed Orders
                                </div>
                                <div className="flex gap-2">
                                    <SquareX />
                                    Cancelled Orders
                                </div>
                            </div>

                            <div className="pb-4">
                                <Field className="w-48">
                                    <InputGroup>
                                        <InputGroupInput
                                            id="date-required"
                                            value={value}
                                            placeholder="June 01, 2025"
                                            onChange={(e) => {
                                                const date = new Date(
                                                    e.target.value,
                                                );
                                                setValue(e.target.value);
                                                if (isValidDate(date)) {
                                                    setDate(date);
                                                    setMonth(date);
                                                }
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'ArrowDown') {
                                                    e.preventDefault();
                                                    setOpen(true);
                                                }
                                            }}
                                        />
                                        <InputGroupAddon align="inline-end">
                                            <Popover
                                                open={open}
                                                onOpenChange={setOpen}
                                            >
                                                <PopoverTrigger asChild>
                                                    <InputGroupButton
                                                        id="date-picker"
                                                        variant="ghost"
                                                        size="icon-xs"
                                                        aria-label="Select date"
                                                    >
                                                        <CalendarIcon />
                                                        <span className="sr-only">
                                                            Select date
                                                        </span>
                                                    </InputGroupButton>
                                                </PopoverTrigger>
                                                <PopoverContent
                                                    className="w-auto overflow-hidden p-0"
                                                    align="end"
                                                    alignOffset={-8}
                                                    sideOffset={10}
                                                >
                                                    <Calendar
                                                        mode="single"
                                                        selected={date}
                                                        month={month}
                                                        onMonthChange={setMonth}
                                                        onSelect={(date) => {
                                                            setDate(date);
                                                            setValue(
                                                                formatDate(
                                                                    date,
                                                                ),
                                                            );
                                                            setOpen(false);
                                                        }}
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                        </InputGroupAddon>
                                    </InputGroup>
                                </Field>
                            </div>
                        </div>
                        <div className="bottom-0 flex w-full flex-1 items-end justify-end">
                            <img
                                src={`${illustrations.babaChef}`}
                                width="350"
                                height="180"
                                alt="Logo"
                            />
                        </div>
                    </div>

                    <div className="col-span-1 flex flex-col gap-4">
                        <div className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                            <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                        </div>
                        <div className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                            <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                        </div>
                    </div>
                </div>
                <div className="relative min-h-[100vh] flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 md:min-h-min dark:border-sidebar-border">
                    <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                </div>
            </div>
        </AppLayout>
    );
}
