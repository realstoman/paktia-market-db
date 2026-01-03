// Components
import { login } from '@/routes';
import { email } from '@/routes/password';
import { Form, Head } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';

export default function ForgotPassword({ status }: { status?: string }) {
    return (
        <AuthLayout
            title="Forgot password"
            description="Enter your email to receive a password reset link"
        >
            <Head title="Forgot password" />

            {status && (
                <div className="mb-4 text-center text-sm font-medium text-green-600">
                    {status}
                </div>
            )}

            <div className="space-y-6">
                <Form {...email.form()}>
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-2">
                                <Label
                                    htmlFor="email"
                                    className="flex items-center justify-start gap-1 text-base text-slate-200"
                                >
                                    Email address{' '}
                                    <span className="pt-2 text-red-600">*</span>
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    autoComplete="off"
                                    autoFocus
                                    placeholder="you@babarestaurant.com"
                                    className="h-11 border-slate-700 bg-white text-base placeholder:text-slate-600 focus:border-brand-secondary focus:ring-brand-secondary/20"
                                />

                                <InputError
                                    message={errors.email}
                                    className="text-red-400"
                                />
                            </div>

                            <div className="my-6 flex items-center justify-start">
                                <Button
                                    className="text-md mt-2 w-full cursor-pointer rounded-lg bg-brand-secondary py-6 font-semibold text-white transition-all duration-300 hover:bg-[#b07b3b]"
                                    disabled={processing}
                                    data-test="email-password-reset-link-button"
                                >
                                    {processing && (
                                        <LoaderCircle className="h-4 w-4 animate-spin" />
                                    )}
                                    Email password reset link
                                </Button>
                            </div>
                        </>
                    )}
                </Form>

                <div className="text-md space-x-1 text-center text-muted-foreground">
                    <span className="text-gray-300">Or, return to</span>
                    <TextLink href={login()} className="text-brand-secondary">
                        login
                    </TextLink>
                </div>
            </div>
        </AuthLayout>
    );
}
