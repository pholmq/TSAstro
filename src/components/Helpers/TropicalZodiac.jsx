import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { CanvasTexture, DoubleSide } from "three";
import { useStore } from "../../store";
import { ZODIAC_SIGNS } from "../../utils/astrology";

const INNER_RADIUS = 195;
const GLYPH_RING_RADIUS = 215;
const NAME_RING_RADIUS = 245;
const OUTER_RADIUS = 260;

const DEG_TO_RAD = Math.PI / 180;

/**
 * 3D wireframe overlay for the Tropical Zodiac ring in Earth-Pivot local space:
 * +Z = 0 deg Aries (Vernal Equinox), +X = 90 deg Cancer (Summer Solstice),
 * -Z = 180 deg Libra (Autumnal Equinox), -X = 270 deg Capricorn (Winter Solstice).
 */
function ZodiacGrid() {
  const geometry = useMemo(() => {
    const positions = [];
    const colors = [];

    const pushSegment = (x1, z1, x2, z2, colorHex) => {
      const c = new THREE.Color(colorHex);
      positions.push(x1, 0, z1, x2, 0, z2);
      colors.push(c.r, c.g, c.b, c.r, c.g, c.b);
    };

    // Concentric gold/midnight rings
    const circleSpecs = [
      { radius: INNER_RADIUS, color: "#D4AF37", divisions: 128 },
      { radius: GLYPH_RING_RADIUS, color: "#9E7E24", divisions: 128 },
      { radius: NAME_RING_RADIUS, color: "#9E7E24", divisions: 128 },
      { radius: OUTER_RADIUS, color: "#F5D061", divisions: 128 },
    ];

    for (const { radius, color, divisions } of circleSpecs) {
      for (let i = 0; i < divisions; i++) {
        const a1 = (i / divisions) * Math.PI * 2;
        const a2 = ((i + 1) / divisions) * Math.PI * 2;
        pushSegment(
          Math.sin(a1) * radius,
          Math.cos(a1) * radius,
          Math.sin(a2) * radius,
          Math.cos(a2) * radius,
          color
        );
      }
    }

    // 30-degree sign boundary dividers across the zodiac band (no cluttered spokes converging on Earth)
    for (let lon = 0; lon < 360; lon += 30) {
      const lonRad = lon * DEG_TO_RAD;
      const sin = Math.sin(lonRad);
      const cos = Math.cos(lonRad);

      // Polished gold divider across the zodiac band
      pushSegment(
        sin * INNER_RADIUS,
        cos * INNER_RADIUS,
        sin * OUTER_RADIUS,
        cos * OUTER_RADIUS,
        "#F5D061"
      );
    }

    // 5-degree and 10-degree ticks along the inner border
    for (let lon = 0; lon < 360; lon += 5) {
      if (lon % 30 === 0) continue;
      const lonRad = lon * DEG_TO_RAD;
      const sin = Math.sin(lonRad);
      const cos = Math.cos(lonRad);
      const isTen = lon % 10 === 0;
      const tickOuter = isTen ? INNER_RADIUS + 12 : INNER_RADIUS + 6;
      const tickColor = isTen ? "#D4AF37" : "#8E7222";

      pushSegment(
        sin * INNER_RADIUS,
        cos * INNER_RADIUS,
        sin * tickOuter,
        cos * tickOuter,
        tickColor
      );
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3)
    );
    geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    return geo;
  }, []);

  useEffect(() => {
    return () => geometry.dispose();
  }, [geometry]);

  return (
    <lineSegments geometry={geometry} raycast={() => null}>
      <lineBasicMaterial
        vertexColors
        transparent
        opacity={0.85}
        depthWrite={false}
      />
    </lineSegments>
  );
}

/**
 * High-resolution CanvasTexture ring displaying the midnight navy band,
 * gold borders, degree ticks, zodiac glyphs, and uppercase sign names.
 */
function ZodiacDial() {
  const texture = useMemo(() => {
    const size = 2048;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext("2d");
    const cx = size / 2;
    const cy = size / 2;
    const pxPerUnit = cx / OUTER_RADIUS;
    const rPx = (r) => r * pxPerUnit;

    ctx.clearRect(0, 0, size, size);

    // Translucent cosmic midnight navy annular band
    const bandGrad = ctx.createRadialGradient(
      cx,
      cy,
      rPx(INNER_RADIUS),
      cx,
      cy,
      rPx(OUTER_RADIUS)
    );
    bandGrad.addColorStop(0, "rgba(11, 19, 43, 0.65)");
    bandGrad.addColorStop(0.5, "rgba(11, 19, 43, 0.55)");
    bandGrad.addColorStop(1, "rgba(11, 19, 43, 0.68)");

    ctx.beginPath();
    ctx.arc(cx, cy, rPx(OUTER_RADIUS), 0, Math.PI * 2, false);
    ctx.arc(cx, cy, rPx(INNER_RADIUS), 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fillStyle = bandGrad;
    ctx.fill();

    // Concentric gold border rings
    const drawRing = (r, strokeStyle, lineWidth) => {
      ctx.beginPath();
      ctx.arc(cx, cy, rPx(r), 0, Math.PI * 2);
      ctx.strokeStyle = strokeStyle;
      ctx.lineWidth = lineWidth;
      ctx.stroke();
    };

    drawRing(INNER_RADIUS, "#D4AF37", 3.5);
    drawRing(GLYPH_RING_RADIUS, "rgba(212, 175, 55, 0.55)", 2);
    drawRing(NAME_RING_RADIUS, "rgba(212, 175, 55, 0.55)", 2);
    drawRing(OUTER_RADIUS - 0.5, "#F5D061", 4);

    // 1-degree, 5-degree, and 10-degree ticks inside [195, 215]
    for (let deg = 0; deg < 360; deg += 1) {
      if (deg % 30 === 0) continue;
      const rad = deg * DEG_TO_RAD;
      const sin = Math.sin(rad);
      const cos = Math.cos(rad);
      const isTen = deg % 10 === 0;
      const isFive = deg % 5 === 0;
      const rEnd = isTen
        ? INNER_RADIUS + 12
        : isFive
        ? INNER_RADIUS + 7
        : INNER_RADIUS + 3.5;

      ctx.beginPath();
      ctx.moveTo(cx + rPx(INNER_RADIUS) * sin, cy + rPx(INNER_RADIUS) * cos);
      ctx.lineTo(cx + rPx(rEnd) * sin, cy + rPx(rEnd) * cos);
      ctx.strokeStyle = isTen
        ? "rgba(245, 208, 97, 0.85)"
        : isFive
        ? "rgba(212, 175, 55, 0.65)"
        : "rgba(212, 175, 55, 0.28)";
      ctx.lineWidth = isTen ? 2 : isFive ? 1.5 : 1;
      ctx.stroke();
    }

    // 30-degree sector dividers across the entire ring
    for (let i = 0; i < 12; i++) {
      const lonRad = i * 30 * DEG_TO_RAD;
      const sin = Math.sin(lonRad);
      const cos = Math.cos(lonRad);

      ctx.beginPath();
      ctx.moveTo(cx + rPx(INNER_RADIUS) * sin, cy + rPx(INNER_RADIUS) * cos);
      ctx.lineTo(cx + rPx(OUTER_RADIUS) * sin, cy + rPx(OUTER_RADIUS) * cos);
      ctx.strokeStyle = "#D4AF37";
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }

    // Zodiac glyphs and uppercase names centered at each sign midpoint (i * 30 + 15 deg)
    ZODIAC_SIGNS.forEach((sign, i) => {
      const midLonRad = (i * 30 + 15) * DEG_TO_RAD;

      ctx.save();
      ctx.translate(cx, cy);
      // On RingGeometry rotated [-PI/2, 0, 0], canvas (cx + r*sin, cy + r*cos) maps to (x = r*sin, z = r*cos)
      ctx.rotate(-midLonRad);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Glyph in [215, 245]
      ctx.save();
      ctx.font =
        '60px "Segoe UI Symbol", "Apple Symbols", "Noto Sans Symbols", Georgia, serif';
      ctx.fillStyle = "#F5D061";
      ctx.shadowColor = "rgba(245, 208, 97, 0.45)";
      ctx.shadowBlur = 10;
      // Variation selector \uFE0E forces monochrome glyph presentation instead of color emoji
      ctx.fillText(`${sign.symbol}\uFE0E`, 0, rPx(230));
      ctx.restore();

      // Uppercase sign name in [245, 260]
      ctx.font = '600 22px "Times New Roman", Georgia, serif';
      ctx.fillStyle = "#D4AF37";
      ctx.fillText(sign.name.toUpperCase(), 0, rPx(252.5));

      ctx.restore();
    });

    const tex = new CanvasTexture(canvas);
    tex.anisotropy = 8;
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    return tex;
  }, []);

  useEffect(() => {
    return () => texture.dispose();
  }, [texture]);

  return (
    <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
      <ringGeometry args={[INNER_RADIUS, OUTER_RADIUS, 128]} />
      <meshBasicMaterial
        map={texture}
        side={DoubleSide}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}

export default function TropicalZodiac() {
  const tropicalZodiac = useStore((s) => s.tropicalZodiac);
  const hScale = useStore((s) => s.hScale);
  const zodiacSize = 100;
  const size = (zodiacSize * hScale) / 100;

  if (!tropicalZodiac) return null;

  return (
    <group position={[0, -0.01, 0]} scale={size}>
      <ZodiacDial />
      <ZodiacGrid />
    </group>
  );
}
