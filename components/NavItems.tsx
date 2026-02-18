'use client'

import Link from "next/link";
import NAV_ITEMS from "@/lib/constants";
import { usePathname } from "next/navigation";

/**
 * NavItems Component
 *
 * Renders a responsive list of navigation links based on the NAV_ITEMS constant.
 * It handles the "active" state logic to highlight the current page.
 */
const NavItems = () => {
    // Hook to get the current URL path (e.g., "/search" or "/dashboard")
    const pathname = usePathname();

    /**
     * Determines if a specific navigation link is active.
     *
     * @param {string} path - The href of the link being checked.
     * @returns {boolean} - True if the link matches the current route.
     */
    const isActive = (path: string) => {
        // Strict check for the Home page to prevent it from being active on every route
        if (path === '/') return pathname === '/';

        // Partial match check for sub-routes (e.g., "/search/results" keeps "/search" active)
        return pathname.startsWith(path);
    }

    return (
        // Container: Flexbox handles layout.
        // 'flex-col': Vertical stack on mobile.
        // 'sm:flex-row': Horizontal row on tablets and up.
        <ul className="flex flex-col sm:flex-row p-2 gap-3 sm:gap-10 font-medium">
            {NAV_ITEMS.map(({ href, label }) => (
                <li key={href}>
                    <Link
                        href={href}
                        className={`
                            hover:text-yellow-500 transition-colors 
                            ${isActive(href) ? 'text-gray-100' : ''} 
                        `}
                    >
                        {label}
                    </Link>
                </li>
            ))}
        </ul>
    )
}

export default NavItems;