import type { ReactNode, SVGProps } from "react";
type Name = "inbox" | "search" | "refresh" | "arrow" | "spark" | "close";
const paths: Record<Name, ReactNode> = {
  inbox: (
    <>
      <path d="m4 4-2 9v6a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-6l-2-9H4Z" />
      <path d="M2 13h6l2 3h4l2-3h6M8 8h8" />
    </>
  ),
  search: (
    <>
      <circle cx="10.8" cy="10.8" r="6.8" />
      <path d="m16 16 4.5 4.5" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 11a8 8 0 1 0-2.3 6.7" />
      <path d="M20 4v7h-7" />
    </>
  ),
  arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
  spark: (
    <path d="m12 3 2.4 6.6L21 12l-6.6 2.4L12 21l-2.4-6.6L3 12l6.6-2.4L12 3Z" />
  ),
  close: <path d="m6 6 12 12M18 6 6 18" />,
};
export default function Icon({
  name,
  ...props
}: SVGProps<SVGSVGElement> & { name: Name }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {paths[name]}
    </svg>
  );
}
