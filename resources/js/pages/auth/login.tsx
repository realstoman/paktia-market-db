import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { brand } from '@/config/brand';
import { store } from '@/routes/login';
import { request } from '@/routes/password';
import { Form, Head } from '@inertiajs/react';
import { ChefHat, ShieldCheck, Utensils } from 'lucide-react';
// import * as z from 'zod';

// const loginSchema = z.object({
//     email: z.string().email('Please enter a valid email address'),
//     password: z.string().min(1, 'Password is required'),
//     remember: z.boolean().optional(),
// });

// type LoginFormData = z.infer<typeof loginSchema>;

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
    canRegister: boolean;
}

export default function Login({
    status,
    canResetPassword,
    // canRegister,
}: LoginProps) {
    return (
        <>
            <Head title="Log in" />

            <div className="flex min-h-screen">
                {/* Left Side - Login Form */}
                <div className="flex-center flex flex-1 flex-col items-center justify-center bg-brand-primary p-8">
                    <div className="w-full max-w-md">
                        {/* Brand Logo */}
                        <div className="mb-12 flex items-center justify-center">
                            <img
                                src={`${brand.logoFull}`}
                                width="150"
                                height="150"
                                alt="Logo"
                            />
                        </div>

                        {/* Welcome Text */}
                        <div className="mb-8 text-center">
                            <h2 className="mb-2 text-3xl font-bold text-white">
                                Welcome back!
                            </h2>
                            <p className="text-slate-300">
                                Enter your credentials to access your account on
                                Baba Restaurant ERP System
                            </p>
                        </div>

                        {/* Status Message */}
                        {status && (
                            <div className="mb-6 rounded-lg border border-green-500/20 bg-green-500/10 p-4">
                                <p className="text-sm text-green-400">
                                    {status}
                                </p>
                            </div>
                        )}

                        {/* Login Form */}
                        <Form
                            {...store.form()}
                            resetOnSuccess={['password']}
                            className="space-y-6"
                        >
                            {({ processing, errors }) => (
                                <>
                                    {/* Email Field */}
                                    <div className="space-y-1">
                                        <Label
                                            htmlFor="email"
                                            className="flex items-center justify-start gap-1 text-base text-slate-200"
                                        >
                                            Email address{' '}
                                            <span className="pt-2 text-red-600">
                                                *
                                            </span>
                                        </Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            name="email"
                                            required
                                            autoFocus
                                            tabIndex={1}
                                            autoComplete="email"
                                            placeholder="you@restaurant.com"
                                            className="h-10 border-slate-700 bg-white text-base placeholder:text-slate-600 focus:border-brand-secondary focus:ring-brand-secondary/20"
                                        />
                                        <InputError
                                            message={errors.email}
                                            className="text-red-400"
                                        />
                                    </div>

                                    {/* Password Field */}
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between">
                                            <Label
                                                htmlFor="password"
                                                className="flex items-center justify-start gap-1 text-base text-slate-200"
                                            >
                                                Password
                                                <span className="pt-2 text-red-600">
                                                    *
                                                </span>
                                            </Label>
                                            {canResetPassword && (
                                                <TextLink
                                                    href={request()}
                                                    className="text-sm text-brand-secondary hover:text-orange-300"
                                                    tabIndex={5}
                                                >
                                                    Forgot password?
                                                </TextLink>
                                            )}
                                        </div>
                                        <Input
                                            id="password"
                                            type="password"
                                            name="password"
                                            required
                                            tabIndex={2}
                                            autoComplete="current-password"
                                            placeholder="Enter your password"
                                            className="mt-1 h-10 border-slate-700 bg-white text-base placeholder:text-slate-600 focus:border-brand-secondary focus:ring-brand-secondary/20"
                                        />
                                        <InputError
                                            message={errors.password}
                                            className="text-red-400"
                                        />
                                    </div>

                                    {/* Remember Me */}
                                    <div className="flex items-center space-x-3">
                                        <Checkbox
                                            id="remember"
                                            name="remember"
                                            tabIndex={3}
                                            className="border-slate-600 data-[state=checked]:border-brand-secondary data-[state=checked]:bg-brand-secondary"
                                        />
                                        <Label
                                            htmlFor="remember"
                                            className="cursor-pointer text-sm text-slate-300"
                                        >
                                            Keep me logged in
                                        </Label>
                                    </div>

                                    {/* Submit Button */}
                                    <Button
                                        type="submit"
                                        className="w-full cursor-pointer rounded-lg bg-brand-secondary py-6 font-semibold text-white transition-all duration-300 hover:bg-[#b07b3b]"
                                        tabIndex={4}
                                        disabled={processing}
                                        data-test="login-button"
                                    >
                                        {processing && (
                                            <Spinner className="mr-2" />
                                        )}
                                        Sign in to your account
                                    </Button>
                                </>
                            )}
                        </Form>

                        {/* Footer */}
                        <div className="mt-8 border-t border-slate-800 pt-6">
                            <p className="flex items-center justify-center gap-2 text-center text-sm text-slate-400">
                                <ShieldCheck className="h-5 w-5" />
                                Secured by industry-standard encryption
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right Side - Promotional Content */}
                <div className="relative hidden flex-1 items-center justify-center overflow-hidden bg-white p-12 lg:flex">
                    {/* Decorative Background Elements */}
                    {/* <div className="absolute top-20 right-20 h-72 w-72 rounded-full "></div>
                    <div className="absolute bottom-20 left-20 h-96 w-96 rounded-full bg-amber-200/30 blur-3xl"></div> */}

                    <div className="relative z-10 max-w-lg">
                        {/* Feature Cards */}
                        <div className="mb-12 space-y-6">
                            {/* Main Hero Image Card */}
                            <div className="relative overflow-hidden rounded-2xl shadow-2xl">
                                <img
                                    src="https://images.pexels.com/photos/1566837/pexels-photo-1566837.jpeg?auto=compress&cs=tinysrgb&w=800"
                                    alt="Delicious pizza"
                                    className="h-80 w-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                <div className="absolute right-6 bottom-6 left-6">
                                    <h3 className="mb-2 text-2xl font-bold text-white">
                                        Manage Your Restaurant
                                    </h3>
                                    <p className="text-sm text-white/90">
                                        Complete ERP solution for modern
                                        restaurant operations
                                    </p>
                                </div>
                            </div>

                            {/* Feature Cards Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="rounded-xl border border-orange-100 bg-white/80 p-6">
                                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-brand-secondary">
                                        <ChefHat className="h-6 w-6 text-white" />
                                    </div>
                                    <h4 className="mb-1 font-semibold text-slate-800">
                                        Kitchen Management
                                    </h4>
                                    <p className="text-xs text-slate-600">
                                        Real-time order tracking
                                    </p>
                                </div>

                                <div className="rounded-xl border border-orange-100 bg-white/80 p-6">
                                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-brand-secondary">
                                        <Utensils className="h-6 w-6 text-white" />
                                    </div>
                                    <h4 className="mb-1 font-semibold text-slate-800">
                                        Menu Control
                                    </h4>
                                    <p className="text-xs text-slate-600">
                                        Dynamic pricing & inventory
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Testimonial Section */}
                        <div className="rounded-xl border border-orange-100 bg-white/60 p-6">
                            <div className="flex items-start gap-4">
                                <img
                                    src="https://images.pexels.com/photos/3814446/pexels-photo-3814446.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop"
                                    alt="Chef"
                                    className="h-12 w-12 rounded-full object-cover"
                                />
                                <div>
                                    <p className="mb-2 text-sm text-slate-700 italic">
                                        "This ERP system transformed how we
                                        manage our restaurant chain. Highly
                                        recommended!"
                                    </p>
                                    <p className="text-xs font-semibold text-slate-800">
                                        Maria Rodriguez
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        Restaurant Owner
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
