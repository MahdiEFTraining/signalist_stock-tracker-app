'use client'
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import InputField from "@/components/forms/InputField";
import FooterLink from "@/components/forms/FooterLink";
import { forgotPassword } from "@/lib/actions/auth.actions";
import { toast } from "sonner";

const ForgotPassword = () => {
    const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<ForgotPasswordFormData>({
        defaultValues: { email: '' },
        mode: 'onBlur',
    });

    const onSubmit = async (data: ForgotPasswordFormData) => {
        try {
            const result = await forgotPassword(data);
            if (result.success) setSubmittedEmail(data.email);
        } catch (e) {
            console.error(e);
            toast.error('Failed to send reset email', {
                description: e instanceof Error ? e.message : 'Please try again',
            });
        }
    };

    if (submittedEmail) {
        return (
            <>
                <h1 className="form-title">Check your email</h1>
                <p className="text-gray-400 mt-4 mb-6">
                    If an account exists for <span className="text-yellow-500">{submittedEmail}</span>,
                    we&#39;ve sent a password reset link. The link expires in 1 hour.
                </p>
                <FooterLink text="Back to" linkText="Sign in" href="/sign-in" />
            </>
        );
    }

    return (
        <>
            <h1 className="form-title">Forgot password</h1>
            <p className="text-gray-500 mt-2 mb-5 text-sm">
                Enter your email and we&#39;ll send you a link to reset it.
            </p>

            <form id="forgot-password-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <InputField
                    name="email"
                    label="Email"
                    placeholder="Enter your email"
                    register={register}
                    error={errors.email}
                    validation={{
                        required: 'Email is required',
                        pattern: { value: /^\w+@\w+\.\w+$/, message: 'Invalid email address' },
                    }}
                />

                <Button
                    type="submit"
                    form="forgot-password-form"
                    disabled={isSubmitting}
                    className="yellow-btn w-full mt-5"
                >
                    {isSubmitting ? 'Sending...' : 'Send Reset Link'}
                </Button>

                <FooterLink text="Remember your password?" linkText="Sign in" href="/sign-in" />
            </form>
        </>
    );
};

export default ForgotPassword;
