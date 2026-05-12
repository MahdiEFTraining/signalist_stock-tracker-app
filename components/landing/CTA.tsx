import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function CTA() {
    return (
        <section className="relative">
            <div className="container py-20 md:py-28">
                <div className="relative overflow-hidden rounded-lg border border-yellow-500/40 bg-gradient-to-br from-yellow-400/10 via-yellow-500/5 to-transparent p-10 md:p-16 text-center">
                    <div className="absolute -top-20 left-1/2 -translate-x-1/2 h-60 w-[600px] rounded-full bg-yellow-400/15 blur-3xl -z-10" />

                    <h2 className="text-3xl md:text-4xl font-bold text-gray-100 tracking-tight">
                        Ready to make your first trade?
                    </h2>
                    <p className="mt-4 text-gray-400 max-w-xl mx-auto">
                        Sign up in 30 seconds. We'll spin up your $100,000 paper portfolio and a
                        personalized welcome — no credit card needed.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
                        <Link
                            href="/sign-up"
                            className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-lg bg-gradient-to-b from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-gray-950 text-base font-medium shadow-lg shadow-yellow-500/30 transition-colors"
                        >
                            Create your account
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                        <Link
                            href="/sign-in"
                            className="inline-flex items-center justify-center h-12 px-6 rounded-lg border border-gray-600 bg-gray-800 text-gray-400 text-base font-medium hover:text-gray-100 hover:border-gray-500 hover:bg-gray-700 transition-colors"
                        >
                            I already have an account
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
