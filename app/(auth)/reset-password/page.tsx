'use client'
import { Suspense } from "react";
import { useForm } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import InputField from "@/components/forms/InputField";
import FooterLink from "@/components/forms/FooterLink";
import { resetPassword } from "@/lib/actions/auth.actions";

const ResetPasswordForm = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token') ?? '';

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors, isSubmitting },
    } = useForm<ResetPasswordFormData>({
        defaultValues: { password: '', confirmPassword: '' },
        mode: 'onBlur',
    });

    const password = watch('password');

    const onSubmit = async (data: ResetPasswordFormData) => {
        try {
            const result = await resetPassword({ token, newPassword: data.password });
            if (result.success) {
                toast.success('Password changed successfully', {
                    description: 'You can now sign in with your new password.',
                    duration: 5000,
                });
                router.push('/sign-in');
            } else {
                toast.error('Reset failed', { description: result.error });
            }
        } catch (e) {
            console.error(e);
            toast.error('Reset failed', {
                description: e instanceof Error ? e.message : 'Please try again',
            });
        }
    };

    if (!token) {
        return (
            <>
                <h1 className="form-title">Invalid link</h1>
                <p className="text-gray-400 mt-4 mb-6">
                    This reset link is missing or invalid. Please request a new one.
                </p>
                <FooterLink text="Need a new link?" linkText="Forgot password" href="/forgot-password" />
            </>
        );
    }

    return (
        <>
            <h1 className="form-title">Set new password</h1>

            <form id="reset-password-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <InputField
                    name="password"
                    label="New Password"
                    placeholder="At least 8 characters"
                    type="password"
                    register={register}
                    error={errors.password}
                    validation={{
                        required: 'Password is required',
                        minLength: { value: 8, message: 'Minimum 8 characters' },
                    }}
                />
                <InputField
                    name="confirmPassword"
                    label="Confirm Password"
                    placeholder="Re-enter your new password"
                    type="password"
                    register={register}
                    error={errors.confirmPassword}
                    validation={{
                        required: 'Please confirm your password',
                        validate: (value) => value === password || "Passwords don't match",
                    }}
                />

                <Button
                    type="submit"
                    form="reset-password-form"
                    disabled={isSubmitting}
                    className="yellow-btn w-full mt-5"
                >
                    {isSubmitting ? 'Resetting...' : 'Reset Password'}
                </Button>

                <FooterLink text="Remember your password?" linkText="Sign in" href="/sign-in" />
            </form>
        </>
    );
};

const ResetPassword = () => (
    <Suspense fallback={<h1 className="form-title">Loading...</h1>}>
        <ResetPasswordForm />
    </Suspense>
);

export default ResetPassword;
