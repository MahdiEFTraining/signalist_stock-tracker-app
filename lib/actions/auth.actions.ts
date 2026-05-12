'use server';

import {auth} from "@/lib/better-auth/auth"
import {inngest} from "@/lib/inngest/client";
import {headers} from "next/headers";

export const signUpWithEmail = async ({ email, password, fullName, country, investmentGoals, riskTolerance, preferredIndustry}:SignUpFormData)=> {
    try {
        const response = await auth.api.signUpEmail({
            body: { email, password, name: fullName },
        })

        if(response) {
            await inngest.send({
                name: 'app/user.created',
                data: {email, name: fullName, country, investmentGoals, riskTolerance, preferredIndustry,}
            })
        }

        return { success: true, data: response }
    } catch(e) {
        console.log('Sign up failed', e)
        return { success: false, error: 'Sign Up Failed' };
    }
}

export const signInWithEmail = async ({ email, password} : SignInFormData)=> {
    try {
        const response = await auth.api.signInEmail({
            body: { email, password } })

        return { success: true, data: response }
    } catch(e) {
        console.log('Sign in failed', e)
        return { success: false, error: 'Sign in Failed' };
    }
}

export const forgotPassword = async ({ email }: ForgotPasswordFormData) => {
    console.log('[forgotPassword] called for', email);
    try {
        const result = await auth.api.requestPasswordReset({
            body: {
                email,
                redirectTo: '/reset-password',
            },
        });
        console.log('[forgotPassword] better-auth returned', result);
    } catch (e) {
        console.error('[forgotPassword] better-auth threw', e);
    }
    return { success: true };
};

export const resetPassword = async ({ token, newPassword }: { token: string; newPassword: string }) => {
    try {
        await auth.api.resetPassword({
            body: { newPassword, token },
        });
        return { success: true };
    } catch (e) {
        console.log('Reset password failed', e);
        return { success: false, error: 'This reset link is invalid or has expired.' };
    }
};

export const signOut = async () => {
    try {
        await auth.api.signOut({ headers: await headers() });
    } catch (e) {
        console.log('Sign Out Failed', e)
        return { success: false, error: 'Sign Out Failed' };
    }
}