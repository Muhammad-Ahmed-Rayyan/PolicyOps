export default function Logo({ className = "w-8 h-8" }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className}>
      <path d="M24 4L42 11V22C42 33 34.5 41.5 24 44C13.5 41.5 6 33 6 22V11L24 4Z" fill="#10192E" />
      <path d="M24 4L42 11V22C42 33 34.5 41.5 24 44C13.5 41.5 6 33 6 22V11L24 4Z" stroke="#A9762F" strokeWidth="1.5" />
      <path d="M16 24L21 29L32 18" stroke="#A9762F" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}