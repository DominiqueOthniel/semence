import React, { useId, useMemo, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type ViewStyle } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import { colors } from '../theme/colors';

type Variant = 'light' | 'dark';
type Density = 'screen' | 'card' | 'panel';

type Pt = { x: number; y: number };

function cubic(p0: Pt, p1: Pt, p2: Pt, p3: Pt, t: number): Pt {
  const u = 1 - t;
  const uu = u * u;
  const tt = t * t;
  return {
    x: uu * u * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + tt * t * p3.x,
    y: uu * u * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + tt * t * p3.y,
  };
}

function cubicDeriv(p0: Pt, p1: Pt, p2: Pt, p3: Pt, t: number): Pt {
  const u = 1 - t;
  return {
    x: 3 * u * u * (p1.x - p0.x) + 6 * u * t * (p2.x - p1.x) + 3 * t * t * (p3.x - p2.x),
    y: 3 * u * u * (p1.y - p0.y) + 6 * u * t * (p2.y - p1.y) + 3 * t * t * (p3.y - p2.y),
  };
}

const LEAF =
  'M0 0.3 C5 -6.2, 16 -12.4, 28.5 -7.2 C36.5 -3.2, 38.5 3.4, 32 8.2 C23.5 14.2, 11.5 10.4, 3.6 4.8 C1.2 2.8, 0.1 1.4, 0 0.3 Z';
const RIB = 'M2.2 0.8 C10.5 -1.6, 18.8 -2.1, 30.2 0.2';

const OLIVE_STEM: [Pt, Pt, Pt, Pt] = [
  { x: 88, y: 336 },
  { x: 44, y: 228 },
  { x: 72, y: 104 },
  { x: 146, y: 16 },
];

const OLIVE_LEAVES: { t: number; side: 1 | -1; scale: number; tilt: number }[] = [
  { t: 0.08, side: 1, scale: 0.88, tilt: -8 },
  { t: 0.1, side: -1, scale: 0.8, tilt: 10 },
  { t: 0.18, side: 1, scale: 1.04, tilt: -4 },
  { t: 0.2, side: -1, scale: 0.96, tilt: 6 },
  { t: 0.28, side: 1, scale: 1.14, tilt: -10 },
  { t: 0.3, side: -1, scale: 1.06, tilt: 4 },
  { t: 0.38, side: 1, scale: 1.12, tilt: -2 },
  { t: 0.4, side: -1, scale: 1.0, tilt: 8 },
  { t: 0.48, side: 1, scale: 1.08, tilt: -6 },
  { t: 0.5, side: -1, scale: 0.94, tilt: 5 },
  { t: 0.58, side: 1, scale: 0.98, tilt: -8 },
  { t: 0.6, side: -1, scale: 0.86, tilt: 7 },
  { t: 0.68, side: 1, scale: 0.84, tilt: -3 },
  { t: 0.7, side: -1, scale: 0.74, tilt: 6 },
  { t: 0.78, side: 1, scale: 0.68, tilt: -7 },
  { t: 0.8, side: -1, scale: 0.58, tilt: 4 },
  { t: 0.88, side: 1, scale: 0.5, tilt: -2 },
  { t: 0.9, side: -1, scale: 0.42, tilt: 8 },
];

const SPRIG_STEM: [Pt, Pt, Pt, Pt] = [
  { x: 20, y: 210 },
  { x: 36, y: 150 },
  { x: 28, y: 80 },
  { x: 48, y: 18 },
];

const SPRIG_LEAVES: { t: number; side: 1 | -1; scale: number; tilt: number }[] = [
  { t: 0.12, side: 1, scale: 0.72, tilt: -6 },
  { t: 0.16, side: -1, scale: 0.64, tilt: 8 },
  { t: 0.32, side: 1, scale: 0.84, tilt: -4 },
  { t: 0.36, side: -1, scale: 0.76, tilt: 5 },
  { t: 0.52, side: 1, scale: 0.78, tilt: -8 },
  { t: 0.56, side: -1, scale: 0.68, tilt: 6 },
  { t: 0.72, side: 1, scale: 0.58, tilt: -2 },
  { t: 0.76, side: -1, scale: 0.5, tilt: 4 },
  { t: 0.9, side: 1, scale: 0.4, tilt: 0 },
];

function stemPath(p: [Pt, Pt, Pt, Pt]) {
  return `M ${p[0].x} ${p[0].y} C ${p[1].x} ${p[1].y}, ${p[2].x} ${p[2].y}, ${p[3].x} ${p[3].y}`;
}

function Leaf({
  at,
  deriv,
  side,
  scale,
  tilt,
  color,
  sw,
}: {
  at: Pt;
  deriv: Pt;
  side: 1 | -1;
  scale: number;
  tilt: number;
  color: string;
  sw: number;
}) {
  const ang = (Math.atan2(deriv.y, deriv.x) * 180) / Math.PI + side * 54 + tilt;
  return (
    <G x={at.x} y={at.y} rotation={ang} scale={scale}>
      <Path d={LEAF} fill="none" stroke={color} strokeWidth={sw} strokeLinejoin="round" />
      <Path d={RIB} fill="none" stroke={color} strokeWidth={sw * 0.55} strokeLinecap="round" />
    </G>
  );
}

function Branch({
  stem,
  leaves,
  color,
  sw = 1.15,
  tip = true,
}: {
  stem: [Pt, Pt, Pt, Pt];
  leaves: { t: number; side: 1 | -1; scale: number; tilt: number }[];
  color: string;
  sw?: number;
  tip?: boolean;
}) {
  const [p0, p1, p2, p3] = stem;
  return (
    <G>
      <Path
        d={stemPath(stem)}
        fill="none"
        stroke={color}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {leaves.map((leaf, i) => (
        <Leaf
          key={i}
          at={cubic(p0, p1, p2, p3, leaf.t)}
          deriv={cubicDeriv(p0, p1, p2, p3, leaf.t)}
          side={leaf.side}
          scale={leaf.scale}
          tilt={leaf.tilt}
          color={color}
          sw={sw}
        />
      ))}
      {tip ? (
        <Leaf
          at={p3}
          deriv={cubicDeriv(p0, p1, p2, p3, 0.97)}
          side={1}
          scale={0.38}
          tilt={-40}
          color={color}
          sw={sw}
        />
      ) : null}
    </G>
  );
}

function Wheat({ color, sw = 1 }: { color: string; sw?: number }) {
  const grains = [
    { x: 22, y: 28, r: -18, s: 1 },
    { x: 30, y: 26, r: 16, s: 1 },
    { x: 21, y: 40, r: -20, s: 0.95 },
    { x: 31, y: 38, r: 18, s: 0.95 },
    { x: 20.5, y: 52, r: -16, s: 0.9 },
    { x: 31.5, y: 50, r: 14, s: 0.9 },
    { x: 21.5, y: 64, r: -18, s: 0.84 },
    { x: 30.5, y: 62, r: 16, s: 0.84 },
    { x: 22.5, y: 76, r: -12, s: 0.76 },
    { x: 29.5, y: 74, r: 12, s: 0.76 },
    { x: 26, y: 16, r: 0, s: 0.7 },
  ];
  return (
    <G>
      <Path
        d="M26 168 C25 120, 26 88, 26 18"
        fill="none"
        stroke={color}
        strokeWidth={sw}
        strokeLinecap="round"
      />
      {grains.map((g, i) => (
        <G key={i} x={g.x} y={g.y} rotation={g.r} scale={g.s}>
          <Ellipse
            cx={0}
            cy={0}
            rx={5.2}
            ry={9.5}
            fill="none"
            stroke={color}
            strokeWidth={sw * 0.9}
          />
        </G>
      ))}
    </G>
  );
}

function seeded(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function Grain({ w, h, color, count }: { w: number; h: number; color: string; count: number }) {
  const dots = useMemo(() => {
    const rand = seeded(Math.round(w * 13 + h * 7));
    const out: { x: number; y: number; r: number; o: number }[] = [];
    for (let i = 0; i < count; i++) {
      out.push({
        x: rand() * w,
        y: rand() * h,
        r: 0.35 + rand() * 0.7,
        o: 0.08 + rand() * 0.22,
      });
    }
    return out;
  }, [w, h, count]);

  return (
    <G>
      {dots.map((d, i) => (
        <Circle key={i} cx={d.x} cy={d.y} r={d.r} fill={color} opacity={d.o} />
      ))}
    </G>
  );
}

function Glow({ id, w, h }: { id: string; w: number; h: number }) {
  return (
    <>
      <Defs>
        <RadialGradient
          id={id}
          cx={w * 0.36}
          cy={h * 0.3}
          rx={w * 0.62}
          ry={h * 0.58}
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0" stopColor="#2C5646" stopOpacity="0.72" />
          <Stop offset="1" stopColor="#163529" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Rect x={0} y={0} width={w} height={h} fill={`url(#${id})`} />
    </>
  );
}

function Art({
  density,
  w,
  h,
  color,
  accent,
}: {
  density: Density;
  w: number;
  h: number;
  color: string;
  accent: string;
}) {
  if (density === 'card') {
    const s = Math.max(h, 180) / 340;
    return (
      <G>
        <G x={w - 6} y={h * 0.04} scaleX={-s} scaleY={s}>
          <Branch stem={OLIVE_STEM} leaves={OLIVE_LEAVES} color={color} sw={1.2} />
        </G>
        <G x={w * 0.62} y={h * 0.42} scaleX={-s * 0.55} scaleY={s * 0.55} rotation={-12}>
          <Branch stem={SPRIG_STEM} leaves={SPRIG_LEAVES} color={accent} sw={1.05} />
        </G>
      </G>
    );
  }

  if (density === 'panel') {
    const s = Math.max(h, 280) / 420;
    return (
      <G>
        <G x={w * 0.92} y={h * 0.08} scaleX={-s} scaleY={s}>
          <Branch stem={OLIVE_STEM} leaves={OLIVE_LEAVES} color={color} sw={1.15} />
        </G>
        <G x={12} y={h * 0.55} scale={s * 0.48}>
          <Wheat color={accent} />
        </G>
      </G>
    );
  }

  const s = Math.min(Math.max(w, 320), 900) / 520;
  return (
    <G>
      <G x={w + 8} y={-12} scaleX={-s} scaleY={s}>
        <Branch stem={OLIVE_STEM} leaves={OLIVE_LEAVES} color={color} sw={1.1} />
      </G>
      <G x={-20} y={h * 0.52} scale={s * 0.72} rotation={18}>
        <Branch stem={SPRIG_STEM} leaves={SPRIG_LEAVES} color={color} sw={1.05} />
      </G>
      <G x={w * 0.08} y={h * 0.02} scale={s * 0.42} rotation={-12}>
        <Wheat color={accent} />
      </G>
      <G x={w * 0.72} y={h * 0.68} scale={s * 0.36} rotation={28}>
        <Wheat color={accent} />
      </G>
    </G>
  );
}

export function BotanicalField({
  variant = 'light',
  density = 'screen',
  style,
}: {
  variant?: Variant;
  density?: Density;
  style?: ViewStyle;
}) {
  const rawId = useId();
  const glowId = `glow${rawId.replace(/[^a-zA-Z0-9]/g, '')}`;
  const [size, setSize] = useState({ w: 0, h: 0 });

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (Math.abs(width - size.w) < 1 && Math.abs(height - size.h) < 1) return;
    setSize({ w: width, h: height });
  };

  const color = variant === 'dark' ? 'rgba(236,228,206,0.48)' : 'rgba(42,99,73,0.3)';
  const accent = variant === 'dark' ? 'rgba(201,146,44,0.32)' : 'rgba(184,130,40,0.2)';
  const grainColor = variant === 'dark' ? '#F4EBD4' : colors.or;
  const grainCount = density === 'screen' ? 120 : 70;

  return (
    <View
      pointerEvents="none"
      onLayout={onLayout}
      style={[styles.host, style]}
      accessible={false}
      importantForAccessibility="no-hide-descendants"
    >
      {size.w > 0 && size.h > 0 ? (
        <Svg width={size.w} height={size.h} style={StyleSheet.absoluteFill}>
          {variant === 'dark' ? <Glow id={glowId} w={size.w} h={size.h} /> : null}
          <Art density={density} w={size.w} h={size.h} color={color} accent={accent} />
          <Grain w={size.w} h={size.h} color={grainColor} count={grainCount} />
        </Svg>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
});
