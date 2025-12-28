import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { LoginFormValues, loginSchema } from '@/schemas/auth-schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { Head, router } from '@inertiajs/react';
import { useForm } from 'react-hook-form';

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
}

export default function Login({ status, canResetPassword }: LoginProps) {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: '',
            password: '',
            remember: true,
        },
    });

    const onSubmit = (data: LoginFormValues) => {
        router.post('/login', data);
    };

    return (
        <>
            <Head title="Login" />

            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900">
                <Card className="w-full max-w-md border-zinc-700 bg-zinc-900/90 shadow-2xl backdrop-blur">
                    <CardHeader className="space-y-2 text-center">
                        {/* Logo / Brand */}
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-500 font-bold text-zinc-900">
                            R
                        </div>

                        <CardTitle className="text-2xl text-white">
                            Restaurant Admin
                        </CardTitle>
                        <CardDescription className="text-zinc-400">
                            Sign in to manage orders, kitchens & operations
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        <form
                            onSubmit={handleSubmit(onSubmit)}
                            className="space-y-5"
                        >
                            {/* Email */}
                            <div className="space-y-1">
                                <Label className="text-zinc-300">Email</Label>
                                <Input
                                    {...register('email')}
                                    placeholder="admin@restaurant.com"
                                    className="border-zinc-700 bg-zinc-800 text-white"
                                />
                                {errors.email && (
                                    <p className="text-sm text-red-400">
                                        {errors.email.message}
                                    </p>
                                )}
                            </div>

                            {/* Password */}
                            <div className="space-y-1">
                                <Label className="text-zinc-300">
                                    Password
                                </Label>
                                <Input
                                    {...register('password')}
                                    type="password"
                                    placeholder="••••••••"
                                    className="border-zinc-700 bg-zinc-800 text-white"
                                />
                                {errors.password && (
                                    <p className="text-sm text-red-400">
                                        {errors.password.message}
                                    </p>
                                )}
                            </div>

                            {/* Remember */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Checkbox {...register('remember')} />
                                    <span className="text-sm text-zinc-400">
                                        Remember me
                                    </span>
                                </div>

                                {canResetPassword && (
                                    <a
                                        href="/forgot-password"
                                        className="text-sm text-amber-400 hover:underline"
                                    >
                                        Forgot password?
                                    </a>
                                )}
                            </div>

                            {/* Submit */}
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-amber-500 font-semibold text-zinc-900 hover:bg-amber-600"
                            >
                                {isSubmitting ? <Spinner /> : 'Sign In'}
                            </Button>

                            {status && (
                                <p className="text-center text-sm text-green-400">
                                    {status}
                                </p>
                            )}
                        </form>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
