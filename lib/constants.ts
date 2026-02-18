/**
 * Navigation Configuration
 *
 * This array defines the links displayed in the main navigation bar.
 * Separating data from logic makes the NavItems component reusable and easier to maintain.
 *
 * @property {string} href - The URL path the link points to.
 * @property {string} label - The text displayed to the user.
 */
const NAV_ITEMS = [
    { href: '/', label: 'Dashboard' },
    { href: '/search', label: 'Search' },
    { href: '/watchlist', label: 'Watchlist' },
];

export default NAV_ITEMS;