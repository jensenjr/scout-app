/**
 * Scouterna trefoil / fleur-de-lis — stiliserad SVG i Scouternas lila
 * Används i header och login-sida.
 */
export default function ScoutLogo({ size = 40, className = '', white = false }) {
  const color = white ? '#ffffff' : '#5c2d91';
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Scouterna logotyp"
    >
      {/* Trefoil — tre sammanlänkade cirklar */}
      <circle cx="50" cy="30" r="22" fill={color} />
      <circle cx="25" cy="68" r="22" fill={color} />
      <circle cx="75" cy="68" r="22" fill={color} />

      {/* Stjälk */}
      <rect x="44" y="72" width="12" height="30" rx="6" fill={color} />

      {/* Bas-balk */}
      <rect x="28" y="98" width="44" height="10" rx="5" fill={color} />

      {/* Stjärna i mitten av trefoil */}
      <circle cx="50" cy="30" r="7" fill="white" opacity="0.9" />
      <circle cx="25" cy="68" r="7" fill="white" opacity="0.9" />
      <circle cx="75" cy="68" r="7" fill="white" opacity="0.9" />
    </svg>
  );
}
