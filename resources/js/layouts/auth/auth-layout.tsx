import { brand } from '@/config/brand';
import { ChefHat, ShieldCheck, Utensils } from 'lucide-react';
import { type PropsWithChildren } from 'react';

interface AuthLayoutProps {
    name?: string;
    title?: string;
    description?: string;
}

export default function AuthLayout({
    children,
}: PropsWithChildren<AuthLayoutProps>) {
    return (
        <div className="flex min-h-screen w-full">
            {/* Left Side - Auth Forms */}
            <div className="flex-center flex flex-1 items-center justify-center bg-brand-primary p-8">
                <div className="flex h-full w-full max-w-lg flex-col items-start justify-between">
                    {/* Brand Logo */}
                    <div className="mb-12 flex items-center justify-center">
                        <img
                            src={`${brand.logoFull}`}
                            width="120"
                            height="120"
                            alt="Logo"
                        />
                    </div>

                    <div className="bottom-0 w-full">
                        {/* Form Content */}
                        {children}

                        {/* Footer - Security Note */}
                        <div className="mt-8 border-t border-slate-800 pt-6">
                            <p className="flex items-center justify-center gap-2 text-center text-sm text-slate-400">
                                <ShieldCheck className="h-5 w-5" />
                                Secured by industry-standard encryption
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Promotional Content */}
            <div className="relative hidden flex-1 items-center justify-center overflow-hidden bg-white p-12 lg:flex">
                {/* Decorative Background Elements */}
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
                                    Complete ERP solution for modern restaurant
                                    operations
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
                </div>
            </div>
        </div>
    );
}
