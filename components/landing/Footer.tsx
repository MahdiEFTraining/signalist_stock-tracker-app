import Link from "next/link";
import Image from "next/image";

export default function Footer() {
    return (
        <footer className="relative border-t border-gray-600 bg-gray-900/80 backdrop-blur">
            <div className="container py-8 flex flex-col md:flex-row items-center justify-between gap-4">
                <Link
                    href="/"
                    className="flex items-center gap-2 opacity-70 hover:opacity-100 transition-opacity"
                >
                    <Image
                        src="/assets/images/wealthflow_logo_large.png"
                        alt="WealthFlow"
                        width={600}
                        height={140}
                        className="h-7 w-auto"
                    />
                </Link>

                <p className="text-xs text-gray-500 text-center">
                    Paper trading platform · educational use only · not investment advice
                </p>

                <div className="flex items-center gap-4 text-xs text-gray-500">
                    <Link href="/sign-in" className="hover:text-yellow-500 transition-colors">
                        Sign in
                    </Link>
                    <Link href="/sign-up" className="hover:text-yellow-500 transition-colors">
                        Sign up
                    </Link>
                </div>
            </div>
        </footer>
    );
}
