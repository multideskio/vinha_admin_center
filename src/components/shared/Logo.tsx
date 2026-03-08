/**
 * Logo SVG compartilhado da marca Videira
 * Extraído para evitar duplicação entre sidebar e header
 */
export const Logo = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M12 22a2.5 2.5 0 0 1-2.5-2.5V18h5v1.5A2.5 2.5 0 0 1 12 22Z" />
    <path d="M12 2v2" />
    <path d="M12 18v-8" />
    <path d="M15 9.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z" />
    <path d="M19 14a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z" />
    <path d="M9 14a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z" />
  </svg>
)
