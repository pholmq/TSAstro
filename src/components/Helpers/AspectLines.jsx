import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { useStore } from "../../store";
import { useAstroStore } from "../../astroStore";

const MAX_SEGMENTS = 64;

const ASPECT_SHORT_NAMES = {
  conjunction: "Conj",
  sextile: "Sextile",
  square: "Square",
  trine: "Trine",
  opposition: "Opp",
};

const ASPECT_EXACT_ANGLES = {
  conjunction: "0°",
  sextile: "60°",
  square: "90°",
  trine: "120°",
  opposition: "180°",
};

function getAspectKey(aspect) {
  return `${aspect.bodyA}-${aspect.type}-${aspect.bodyB}`;
}

const BADGE_WIDTH = 896;
const BADGE_HEIGHT = 128;

function createAspectBadgeTexture(aspect, isHighlighted) {
  const canvas = document.createElement("canvas");
  canvas.width = BADGE_WIDTH;
  canvas.height = BADGE_HEIGHT;
  const ctx = canvas.getContext("2d");

  const shortName = ASPECT_SHORT_NAMES[aspect.type] || aspect.type;
  const angleStr = ASPECT_EXACT_ANGLES[aspect.type] || `${aspect.exactAngle}°`;
  const text = `${aspect.symbol} ${shortName} ${angleStr} · ${aspect.bodyA}–${aspect.bodyB}`;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.font = "700 50px 'Segoe UI Symbol', 'Segoe UI', Arial, sans-serif";
  const textMetrics = ctx.measureText(text);
  const pillWidth = Math.min(BADGE_WIDTH - 16, Math.max(320, textMetrics.width + 64));
  const pillHeight = 96;
  const x = (canvas.width - pillWidth) / 2;
  const y = (canvas.height - pillHeight) / 2;
  const r = 24;

  // Rounded pill background
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + pillWidth - r, y);
  ctx.quadraticCurveTo(x + pillWidth, y, x + pillWidth, y + r);
  ctx.lineTo(x + pillWidth, y + pillHeight - r);
  ctx.quadraticCurveTo(
    x + pillWidth,
    y + pillHeight,
    x + pillWidth - r,
    y + pillHeight
  );
  ctx.lineTo(x + r, y + pillHeight);
  ctx.quadraticCurveTo(x, y + pillHeight, x, y + pillHeight - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();

  ctx.fillStyle = isHighlighted
    ? "rgba(11, 19, 43, 0.96)"
    : "rgba(11, 19, 43, 0.9)";
  ctx.fill();

  ctx.lineWidth = isHighlighted ? 5 : 3.5;
  ctx.strokeStyle = aspect.color || "#D4AF37";
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = isHighlighted ? "#FFFFFF" : aspect.color || "#FDE68A";
  ctx.fillText(text, canvas.width / 2, canvas.height / 2 + 2, pillWidth - 32);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Renders labeled 3D planetary aspect lines connecting pairs of planets forming
 * geocentric astrological angles (0°, 60°, 90°, 120°, 180°), plus optional
 * Earth-centered angle sightlines when an aspect is highlighted in the HUD.
 */
export default function AspectLines() {
  const { scene } = useThree();
  const showAspects = useStore((s) => s.showAspects ?? true);
  const showAspectLabels = useStore((s) => s.showAspectLabels ?? true);
  const runIntro = useStore((s) => s.runIntro);
  const welcomeOpen = useAstroStore((s) => s.welcomeOpen);
  const chartSnapshot = useAstroStore((s) => s.chartSnapshot);
  const visibleAspectTypes = useAstroStore((s) => s.visibleAspectTypes);
  const highlightedAspectKey = useAstroStore((s) => s.highlightedAspectKey);

  const spriteRefs = useRef([]);
  const textureCacheRef = useRef(new Map());

  const filteredAspects = useMemo(() => {
    const all = chartSnapshot?.aspects || [];
    if (!visibleAspectTypes) return all;
    return all.filter((a) => visibleAspectTypes[a.type] !== false);
  }, [chartSnapshot?.aspects, visibleAspectTypes]);

  const {
    geometry,
    posAttr,
    colAttr,
    rayGeometry,
    rayPosAttr,
    rayColAttr,
    posA,
    posB,
    earthPos,
    midPos,
    cameraWorldPos,
    cameraForward,
    vecToMid,
    tempColor,
    dimColor,
  } = useMemo(() => {
    const createBuffer = (maxSegs) => {
      const geo = new THREE.BufferGeometry();
      const positions = new Float32Array(maxSegs * 2 * 3);
      const colors = new Float32Array(maxSegs * 2 * 3);
      const pAttr = new THREE.BufferAttribute(positions, 3);
      pAttr.setUsage(THREE.DynamicDrawUsage);
      const cAttr = new THREE.BufferAttribute(colors, 3);
      cAttr.setUsage(THREE.DynamicDrawUsage);
      geo.setAttribute("position", pAttr);
      geo.setAttribute("color", cAttr);
      geo.setDrawRange(0, 0);
      return { geo, pAttr, cAttr };
    };

    const main = createBuffer(MAX_SEGMENTS);
    const rays = createBuffer(2);

    return {
      geometry: main.geo,
      posAttr: main.pAttr,
      colAttr: main.cAttr,
      rayGeometry: rays.geo,
      rayPosAttr: rays.pAttr,
      rayColAttr: rays.cAttr,
      posA: new THREE.Vector3(),
      posB: new THREE.Vector3(),
      earthPos: new THREE.Vector3(),
      midPos: new THREE.Vector3(),
      cameraWorldPos: new THREE.Vector3(),
      cameraForward: new THREE.Vector3(),
      vecToMid: new THREE.Vector3(),
      tempColor: new THREE.Color(),
      dimColor: new THREE.Color(),
    };
  }, []);

  useEffect(() => {
    return () => {
      geometry.dispose();
      rayGeometry.dispose();
      textureCacheRef.current.forEach((tex) => tex.dispose());
      textureCacheRef.current.clear();
    };
  }, [geometry, rayGeometry]);

  const badgeTextures = useMemo(() => {
    const cache = textureCacheRef.current;
    const activeKeys = new Set();

    const list = filteredAspects.slice(0, MAX_SEGMENTS).map((aspect) => {
      const key = getAspectKey(aspect);
      const isHighlighted = highlightedAspectKey === key;
      const cacheKey = `${key}|${isHighlighted ? "1" : "0"}`;
      activeKeys.add(cacheKey);
      if (!cache.has(cacheKey)) {
        cache.set(cacheKey, createAspectBadgeTexture(aspect, isHighlighted));
      }
      return {
        key,
        aspect,
        isHighlighted,
        texture: cache.get(cacheKey),
      };
    });

    // Prune stale textures if cache grows large
    if (cache.size > 96) {
      for (const [k, tex] of cache.entries()) {
        if (!activeKeys.has(k)) {
          tex.dispose();
          cache.delete(k);
        }
      }
    }

    return list;
  }, [filteredAspects, highlightedAspectKey]);

  const isActive = Boolean(showAspects && !welcomeOpen && filteredAspects.length);

  useFrame(({ camera, size }) => {
    if (!isActive) {
      geometry.setDrawRange(0, 0);
      rayGeometry.setDrawRange(0, 0);
      return;
    }

    cameraWorldPos.setFromMatrixPosition(camera.matrixWorld);
    camera.getWorldDirection(cameraForward);

    const posArray = posAttr.array;
    const colArray = colAttr.array;
    const count = Math.min(filteredAspects.length, MAX_SEGMENTS);
    let vertexCount = 0;
    let rayVertices = 0;

    const hasHighlight = Boolean(highlightedAspectKey);

    for (let i = 0; i < count; i++) {
      const aspect = filteredAspects[i];
      const key = getAspectKey(aspect);
      const isHighlighted = highlightedAspectKey === key;

      const objA = scene.getObjectByName(aspect.bodyA);
      const objB = scene.getObjectByName(aspect.bodyB);
      const sprite = spriteRefs.current[i];

      if (!objA || !objB) {
        if (sprite) sprite.visible = false;
        continue;
      }

      objA.getWorldPosition(posA);
      objB.getWorldPosition(posB);

      tempColor.set(aspect.color || "#D4AF37");
      if (hasHighlight && !isHighlighted) {
        dimColor.copy(tempColor).multiplyScalar(0.28);
      } else {
        dimColor.copy(tempColor);
      }

      const base = vertexCount * 3;
      posArray[base] = posA.x;
      posArray[base + 1] = posA.y;
      posArray[base + 2] = posA.z;
      posArray[base + 3] = posB.x;
      posArray[base + 4] = posB.y;
      posArray[base + 5] = posB.z;

      colArray[base] = dimColor.r;
      colArray[base + 1] = dimColor.g;
      colArray[base + 2] = dimColor.b;
      colArray[base + 3] = dimColor.r;
      colArray[base + 4] = dimColor.g;
      colArray[base + 5] = dimColor.b;

      vertexCount += 2;

      // Update midpoint label sprite
      if (sprite) {
        if (!showAspectLabels || runIntro || (hasHighlight && !isHighlighted)) {
          sprite.visible = false;
        } else {
          sprite.visible = true;
          midPos.addVectors(posA, posB).multiplyScalar(0.5);
          sprite.position.copy(midPos);

          vecToMid.subVectors(midPos, cameraWorldPos);
          const depth = Math.max(vecToMid.dot(cameraForward), 1);
          let unitsPerPixel;
          if (camera.isOrthographicCamera) {
            unitsPerPixel =
              (camera.top - camera.bottom) / camera.zoom / size.height;
          } else {
            const vFov = (camera.fov * Math.PI) / 180;
            unitsPerPixel =
              (2 * Math.tan(vFov / 2) * depth) / (size.height * camera.zoom);
          }

          const targetPxHeight = isHighlighted ? 56 : 44;
          const worldHeight = targetPxHeight * unitsPerPixel;
          sprite.scale.set(
            worldHeight * (BADGE_WIDTH / BADGE_HEIGHT),
            worldHeight,
            1
          );
        }
      }

      // Draw Earth-centered geocentric angle rays for the highlighted aspect
      if (isHighlighted) {
        const earthObj = scene.getObjectByName("Earth");
        if (earthObj) {
          earthObj.getWorldPosition(earthPos);
          const rArr = rayPosAttr.array;
          const cArr = rayColAttr.array;

          rArr[0] = earthPos.x;
          rArr[1] = earthPos.y;
          rArr[2] = earthPos.z;
          rArr[3] = posA.x;
          rArr[4] = posA.y;
          rArr[5] = posA.z;

          rArr[6] = earthPos.x;
          rArr[7] = earthPos.y;
          rArr[8] = earthPos.z;
          rArr[9] = posB.x;
          rArr[10] = posB.y;
          rArr[11] = posB.z;

          for (let k = 0; k < 4; k++) {
            cArr[k * 3] = tempColor.r;
            cArr[k * 3 + 1] = tempColor.g;
            cArr[k * 3 + 2] = tempColor.b;
          }
          rayVertices = 4;
        }
      }
    }

    // Hide unused sprite refs
    for (let i = count; i < spriteRefs.current.length; i++) {
      if (spriteRefs.current[i]) spriteRefs.current[i].visible = false;
    }

    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
    geometry.setDrawRange(0, vertexCount);

    rayPosAttr.needsUpdate = true;
    rayColAttr.needsUpdate = true;
    rayGeometry.setDrawRange(0, rayVertices);
  });

  if (!isActive) {
    return null;
  }

  return (
    <group name="AspectLinesGroup">
      <lineSegments
        name="AspectLines"
        geometry={geometry}
        frustumCulled={false}
        raycast={() => null}
      >
        <lineBasicMaterial
          vertexColors
          transparent
          opacity={highlightedAspectKey ? 0.9 : 0.5}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </lineSegments>

      <lineSegments
        name="AspectGeocentricRays"
        geometry={rayGeometry}
        frustumCulled={false}
        raycast={() => null}
      >
        <lineBasicMaterial
          vertexColors
          transparent
          opacity={0.78}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </lineSegments>

      {badgeTextures.map((item, idx) => (
        <sprite
          key={item.key}
          ref={(el) => {
            spriteRefs.current[idx] = el;
          }}
          raycast={() => null}
          renderOrder={100}
        >
          <spriteMaterial
            map={item.texture}
            transparent
            depthTest={false}
            depthWrite={false}
            toneMapped={false}
          />
        </sprite>
      ))}
    </group>
  );
}
