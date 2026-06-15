// Deterministic, anonymous avatar styling from a trip id. Same id → same colors;
// reveals nothing about the user.
function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export interface AvatarStyle {
  from: string;
  to: string;
}

export function avatarStyle(id: string): AvatarStyle {
  const hue = hashString(id) % 360;
  return {
    from: `hsl(${hue} 70% 55%)`,
    to: `hsl(${(hue + 40) % 360} 70% 45%)`,
  };
}
