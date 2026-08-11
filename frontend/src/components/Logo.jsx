export default function Logo({ className = "w-8 h-8" }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className}>
      <circle cx="24" cy="24" r="20" fill="#10192E" />
      <circle cx="24" cy="24" r="20" stroke="#A9762F" strokeWidth="1.5" strokeDasharray="3 2.5" />
      <circle cx="24" cy="24" r="15" stroke="#A9762F" strokeWidth="1" opacity="0.5" />
      <path
        d="M18 15H27L30 18V33H18V15Z"
        fill="none"
        stroke="#F6F5F1"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M27 15V18H30" stroke="#F6F5F1" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M21 22H27M21 26H27M21 30H24" stroke="#A9762F" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}