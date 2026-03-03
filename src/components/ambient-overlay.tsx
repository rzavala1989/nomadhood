export function AmbientOverlay() {
  return (
    <>
      {/* Film grain */}
      <svg className="pointer-events-none fixed inset-0 z-50 h-full w-full opacity-[0.025] mix-blend-multiply">
        <filter id="grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.80"
            numOctaves="4"
            stitchTiles="stitch"
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>

      {/* Scanline */}
      <div
        className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
        aria-hidden="true"
      >
        <div
          className="absolute left-0 right-0 h-[2px] bg-black/[0.02]"
          style={{
            animation: 'scanline 8s linear infinite',
          }}
        />
      </div>
    </>
  );
}
