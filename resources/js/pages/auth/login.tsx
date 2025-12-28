'use client';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useForm as useInertiaForm } from '@inertiajs/react';
import { ArrowRight, ChefHat, LogIn, Utensils } from 'lucide-react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

const loginSchema = z.object({
    email: z.string().email('Invalid work email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    remember: z.boolean(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
    canRegister: boolean;
}

export default function Login({
    status,
    canResetPassword,
    canRegister,
}: LoginProps) {
    /**
     * RHF (Validation)
     */
    const form = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: '',
            password: '',
            remember: false,
        },
    });

    /**
     * Inertia (Submission)
     */
    const inertia = useInertiaForm<LoginFormValues>({
        email: '',
        password: '',
        remember: false,
    });

    const onSubmit = (values: LoginFormValues) => {
        inertia.setData('email', values.email);
        inertia.setData('password', values.password);
        inertia.setData('remember', values.remember);

        inertia.post(route('login'), {
            onFinish: () => inertia.setData('password', ''),
        });
    };

    return (
        <div className="flex min-h-screen flex-col bg-background lg:flex-row">
            {/* LEFT PANEL */}
            <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-black p-16 text-white lg:flex">
                <div className="absolute inset-0">
                    <img
                        src="/high-end-restaurant-interior-dark-moody.jpg"
                        alt="Restaurant"
                        className="h-full w-full object-cover opacity-60 grayscale"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                </div>

                <div className="relative z-10 flex items-center gap-3">
                    <div className="rounded-sm bg-white p-2">
                        <Utensils className="h-6 w-6 text-black" />
                    </div>
                    <span className="font-serif text-2xl font-bold">
                        CulinaSystem
                    </span>
                </div>

                <div className="relative z-10 space-y-6">
                    <h1 className="font-serif text-6xl leading-tight">
                        Elevating every service instance.
                    </h1>
                    <p className="max-w-md text-xl font-light text-neutral-400">
                        Intelligent hospitality management from prep to plate.
                    </p>

                    <div className="flex items-center gap-6 pt-8">
                        <div className="flex -space-x-3">
                            {[1, 2, 3].map((i) => (
                                <div
                                    key={i}
                                    className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-black bg-neutral-800"
                                >
                                    <ChefHat className="h-5 w-5 text-neutral-400" />
                                </div>
                            ))}
                        </div>
                        <p className="text-sm text-neutral-400 italic">
                            Trusted by premium establishments.
                        </p>
                    </div>
                </div>
            </div>

            {/* RIGHT PANEL */}
            <div className="flex flex-1 items-center justify-center p-8 lg:p-20">
                <div className="w-full max-w-[440px] space-y-10">
                    <div>
                        <h2 className="font-serif text-4xl font-semibold">
                            Staff Entrance
                        </h2>
                        <p className="mt-2 text-muted-foreground">
                            Authorized personnel only
                        </p>
                    </div>

                    {status && (
                        <div className="rounded border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                            {status}
                        </div>
                    )}

                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-8"
                    >
                        {/* EMAIL */}
                        <div>
                            <Label className="text-xs font-bold uppercase">
                                Work Email
                            </Label>
                            <Input
                                {...form.register('email')}
                                className={cn(
                                    'mt-2 h-12 rounded-none border-b-2 bg-transparent px-0',
                                    form.formState.errors.email &&
                                        'border-destructive',
                                )}
                            />
                            {form.formState.errors.email && (
                                <p className="mt-1 text-xs text-destructive">
                                    {form.formState.errors.email.message}
                                </p>
                            )}
                        </div>

                        {/* PASSWORD */}
                        <div>
                            <div className="flex justify-between">
                                <Label className="text-xs font-bold uppercase">
                                    Passcode
                                </Label>
                                {canResetPassword && (
                                    <Link
                                        href={route('password.request')}
                                        className="text-xs text-muted-foreground uppercase hover:underline"
                                    >
                                        Recover
                                    </Link>
                                )}
                            </div>
                            <Input
                                type="password"
                                {...form.register('password')}
                                className={cn(
                                    'mt-2 h-12 rounded-none border-b-2 bg-transparent px-0',
                                    form.formState.errors.password &&
                                        'border-destructive',
                                )}
                            />
                            {form.formState.errors.password && (
                                <p className="mt-1 text-xs text-destructive">
                                    {form.formState.errors.password.message}
                                </p>
                            )}
                        </div>

                        {/* REMEMBER */}
                        <div className="flex items-center gap-3">
                            <Checkbox
                                checked={form.watch('remember')}
                                onCheckedChange={(v) =>
                                    form.setValue('remember', Boolean(v))
                                }
                            />
                            <span className="text-sm">Stay signed in</span>
                        </div>

                        {/* SUBMIT */}
                        <Button
                            type="submit"
                            disabled={inertia.processing}
                            className="h-14 w-full rounded-none text-lg"
                        >
                            {inertia.processing ? (
                                <LogIn className="h-5 w-5 animate-spin" />
                            ) : (
                                <span className="flex items-center gap-2">
                                    Initiate Session
                                    <ArrowRight className="h-5 w-5" />
                                </span>
                            )}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}
