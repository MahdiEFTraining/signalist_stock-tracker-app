'use client'

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import NavItems from "@/components/NavItems";

/**
 * UserDropdown Component
 *
 * Displays the current user's profile information in a dropdown menu.
 *
 * Features:
 * 1. Desktop: Shows Avatar + Name.
 * 2. Mobile: Acts as a "Hamburger" menu by rendering <NavItems /> inside the dropdown
 *    when the screen size is small.
 * 3. Logout functionality using Next.js router.
 */
const UserDropdown = () => {
    const router = useRouter();

    /**
     * Handles the logout process.
     * Currently redirects to the sign-in page.
     */
    const handleSignOut = async () => {
        // Add actual logout logic here (e.g., supabase.auth.signOut())
        router.push("/sign-in");
    };

    // Mock user data - Replace with actual auth context or props
    const user = { name: 'John', email: 'contact@test.com' };

    return (
        <DropdownMenu>
            {/* Trigger: The button visible on the header */}
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-3 text-gray-400 hover:text-yellow-500">
                    <Avatar className="h-10 w-10">
                        <AvatarImage src="https://github.com/shadcn.png" />
                        <AvatarFallback className="bg-yellow-500 text-yellow-900 text-sm font-bold">
                            {user.name[0]}
                        </AvatarFallback>
                    </Avatar>

                    {/* User Name: Hidden on mobile, visible on medium screens and up */}
                    <div className="hidden md:flex flex-col items-start">
                        <span className='text-base font-medium text-gray-400'>
                            {user.name}
                        </span>
                    </div>
                </Button>
            </DropdownMenuTrigger>

            {/* Dropdown Content */}
            <DropdownMenuContent className="text-gray-400 w-56" align="end">
                <DropdownMenuLabel>
                    <div className="flex relative items-center gap-3 py-2">
                        <Avatar className="h-10 w-10">
                            <AvatarImage src="https://github.com/shadcn.png" />
                            <AvatarFallback className="bg-yellow-500 text-yellow-900 text-sm font-bold">
                                {user.name[0]}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                            <span className='text-base font-medium text-gray-400'>
                                {user.name}
                            </span>
                            <span className="text-xs text-gray-500">{user.email}</span>
                        </div>
                    </div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator className="bg-gray-600" />

                {/* Logout Button */}
                <DropdownMenuItem
                    onClick={handleSignOut}
                    className="text-gray-100 text-md font-medium focus:bg-transparent focus:text-yellow-500 transition-colors cursor-pointer"
                >
                    <LogOut className="h-4 w-4 mr-2" />
                    Log Out
                </DropdownMenuItem>

                {/* Mobile Navigation Fallback */}
                {/* This section only appears on small screens (< sm) */}
                <div className="sm:hidden block">
                    <DropdownMenuSeparator className="bg-gray-600" />
                    <div className="px-2 py-2">
                        <NavItems />
                    </div>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

export default UserDropdown;