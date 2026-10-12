/** Displays the supplied artwork, framing its wordmark without the square margins. */
export function BrandLogo({ className = "" }: { className?: string }) {
  return (
    <span className={`relative block shrink-0 overflow-hidden rounded-sm bg-white aspect-[4.5/1] ${className}`}>
      <img
        src="/grand-hour-logo.png"
        alt="Grand Hour"
        width={1254}
        height={1254}
        className="absolute left-0 top-1/2 w-full max-w-none h-auto -translate-y-[49.2%]"
      />
    </span>
  );
}
