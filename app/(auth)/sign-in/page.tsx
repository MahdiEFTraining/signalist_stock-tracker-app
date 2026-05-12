'use client'
import {useForm} from "react-hook-form";
import {Button} from "@/components/ui/button";
import InputField from "@/components/forms/InputField";
import FooterLink from "@/components/forms/FooterLink";
import {signInWithEmail} from "@/lib/actions/auth.actions";
import {toast} from "sonner";
import {useRouter} from "next/navigation";
import Link from "next/link";

const SignIn = () => {

    const router = useRouter();
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<SignInFormData>({
        defaultValues: {
            email: '',
            password: '',
        },
        mode: 'onBlur'
    });

    const onSubmit = async(data: SignInFormData) => {
        try {
            const result = await signInWithEmail(data);
            if(result.success) router.push("/dashboard");
        } catch(e) {
            console.error(e);
            toast.error('Sign In failed', {
                description: e instanceof Error ? e.message: 'Failed to Sign in'
            })
        }
    }
    return (
        <>
            <h1 className="form-title">Sign In</h1>

            <form id="sign-in-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <InputField
                    name="email"
                    label="Email"
                    placeholder="Enter your email"
                    register={register}
                    error={errors.email}
                    validation={{ required: 'Email is required', pattern: { value: /^\w+@\w+\.\w+$/, message: 'Invalid email address' } }} />
                <InputField
                    name="password"
                    label="Password"
                    placeholder="Enter your password"
                    type="password"
                    register={register}
                    error={errors.password}
                    validation={{ required: 'Password is required' }} />

                <div className="flex justify-end">
                    <Link href="/forgot-password" className="text-sm text-yellow-500 hover:text-yellow-400 transition-colors">
                        Forgot password?
                    </Link>
                </div>

                <Button type="submit" form="sign-in-form" disabled={isSubmitting} className="yellow-btn w-full mt-5">
                    {isSubmitting ? 'Signing In...' : 'Sign In'}
                </Button>

                <FooterLink text="Don't have an account? " linkText="Sign up" href="/sign-up" />
            </form>
        </>
    )
}
export default SignIn