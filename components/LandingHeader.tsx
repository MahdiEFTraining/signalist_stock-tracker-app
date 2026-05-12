import Link from "next/link";
import Image from "next/image";

export default function LandingHeader() {
    return (
        <header className="sticky top-0 z-50 w-full header bg-gray-800/85 backdrop-blur supports-backdrop-filter:bg-gray-800/70">
            <div className="container flex items-center justify-between header-wrapper">
                <Link href="/" className="flex items-center gap-2">
                    <Image
                        src="/assets/images/wealthflow_logo_large.png"
                        alt="WealthFlow"
                        width={600}
                        height={140}
                        className="h-10 w-auto"
                        priority
                    />
                </Link>

                <nav className="flex items-center gap-2 sm:gap-4">
                    <Link
                        href="/sign-in"
                        className="px-3 sm:px-4 py-2 text-sm font-medium text-gray-400 hover:text-yellow-500 transition-colors"
                    >
                        Sign In
                    </Link>
                    <Link
                        href="/sign-up"
                        className="inline-flex items-center justify-center px-4 py-2 rounded bg-gradient-to-b from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-gray-950 text-sm font-medium shadow-lg transition-colors"
                    >
                        Get Started
                    </Link>
                </nav>
            </div>
        </header>
    );
}
