import Link from "next/link";
import Image from "next/image";
import NavItems from "@/components/NavItems";
import UserDropdown from "@/components/UserDropdown";

/**
 * Header Component
 *
 * The main top navigation bar for the application.
 *
 * Layout Strategy:
 * - Uses 'sticky top-0' to remain visible while scrolling.
 * - 'container': Centers content with max-width.
 * - Flexbox: Aligns Logo (Left), NavItems (Center), and UserDropdown (Right).
 *
 * Responsive Behavior:
 * - On Mobile: Hides the central <NavItems />. The UserDropdown takes over navigation duties.
 * - On Desktop: Displays the full <NavItems /> in the center.
 */
const Header = ({ user }:{ user: User}) => {
    return (
        <header className="sticky top-0 z-50 w-full header bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
            <div className="container flex h-16 items-center justify-between header-wrapper">

                {/* 1. Logo Section */}
                <Link href="/" className="flex items-center gap-2">
                    <Image
                        src="/assets/icons/logo.svg"
                        alt="Signalist logo"
                        width={140}
                        height={32}
                        className="h-8 w-auto cursor-pointer"
                        priority // Loads image immediately for LCP optimization
                    />
                </Link>

                {/* 2. Desktop Navigation */}
                {/* Hidden on mobile (xs), Visible on Small (sm) screens and up */}
                <nav className="hidden sm:block">
                    <NavItems />
                </nav>

                {/* 3. User Actions / Mobile Menu Trigger */}
                <UserDropdown user={user} />
            </div>
        </header>
    )
}

export default Header;