import React, { useMemo, useRef, useEffect } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import constellationsData from "../../settings/constellations.json"; // Adjust path if necessary
import bscSettings from "../../settings/BSC.json"; // Need this to map HIP to positions
import { useBSCStarData } from "./useBSCStarData";
import { computeConstellationLabelEntries } from "./constellationLabels";
import { useStore, usePlotStore } from "../../store";
import { dateTimeToPos } from "../../utils/time-date-functions";
import { movePlotModel } from "../../utils/plotModelFunctions";

const LABEL_CANVAS_WIDTH = 384;
const LABEL_CANVAS_HEIGHT = 64;
const TARGET_LABEL_PX_HEIGHT = 34;

function createConstellationLabelTexture(name) {
  const canvas = document.createElement("canvas");
  canvas.width = LABEL_CANVAS_WIDTH;
  canvas.height = LABEL_CANVAS_HEIGHT;
  const ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = "600 30px Arial, Helvetica, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  ctx.lineWidth = 6;
  ctx.strokeStyle = "rgba(6, 10, 22, 0.92)";
  ctx.strokeText(name, canvas.width / 2, canvas.height / 2 + 1, canvas.width - 24);

  ctx.fillStyle = "#93c5fd";
  ctx.fillText(name, canvas.width / 2, canvas.height / 2 + 1, canvas.width - 24);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

const Constellations = () => {
  // 1. Get current star positions from the hook (reactive to store settings)
  // Pass true to force positions to be calculated on the sphere
  const { positions } = useBSCStarData(true);
  const plotObjects = usePlotStore((s) => s.plotObjects);
  const showConstellations = useStore((s) => s.showConstellations);
  const showConstellationLabels = useStore((s) => s.showConstellationLabels ?? true);
  const hScale = useStore((s) => s.hScale);
  const groupRef = useRef();
  const labelSpriteRefs = useRef([]);
  const textureCacheRef = useRef(new Map());

  const sphereRadius = (20000 * hScale) / 100;

  // 2. Create a lookup map: HIP Number -> Index in the positions array
  // We utilize bscSettings (BSC.json) because useBSCStarData returns positions 
  // in the same order as BSC.json.
  const hipToIndexMap = useMemo(() => {
    const map = new Map();
    bscSettings.forEach((star, index) => {
      if (star.HIP) {
        // Parse int to ensure we match the format in constellations.json
        map.set(parseInt(star.HIP), index);
      }
    });
    return map;
  }, []);

  // 3. Generate the Geometry for the Constellation lines
  const geometry = useMemo(() => {
    const points = [];
    const constellations = constellationsData.constellations || [];
    const missingHips = new Set(); // To prevent duplicate logs for the same star

    // Filter out invalid constellations or those without lines
    const validConstellations = constellations.filter(
      (c) => c.lines && c.lines.length > 0
    );

    validConstellations.forEach((constellation) => {
      constellation.lines.forEach((lineSeq) => {
        // lineSeq is an array of HIP numbers connected in sequence
        for (let i = 0; i < lineSeq.length - 1; i++) {
          const hip1 = lineSeq[i];
          const hip2 = lineSeq[i + 1];

          const idx1 = hipToIndexMap.get(hip1);
          const idx2 = hipToIndexMap.get(hip2);

          // LOGGING LOGIC: Check for missing stars
          if (idx1 === undefined && !missingHips.has(hip1)) {
            //console.warn(`Constellation "${constellation.common_name?.english || constellation.id}": HIP ${hip1} not found in BSC data.`);
            missingHips.add(hip1);
          }
          if (idx2 === undefined && !missingHips.has(hip2)) {
            //console.warn(`Constellation "${constellation.common_name?.english || constellation.id}": HIP ${hip2} not found in BSC data.`);
            missingHips.add(hip2);
          }

          // Only draw line if both stars exist in our dataset
          if (idx1 !== undefined && idx2 !== undefined) {
            // Retrieve x,y,z from the flat positions array (stride of 3)
            const p1 = new THREE.Vector3(
              positions[idx1 * 3],
              positions[idx1 * 3 + 1],
              positions[idx1 * 3 + 2]
            );
            const p2 = new THREE.Vector3(
              positions[idx2 * 3],
              positions[idx2 * 3 + 1],
              positions[idx2 * 3 + 2]
            );
            points.push(p1, p2);
          }
        }
      });
    });

    return new THREE.BufferGeometry().setFromPoints(points);
  }, [positions, hipToIndexMap]);

  // 4. Compute primary constellation label centroids on the celestial sphere
  const labelItems = useMemo(() => {
    const entries = computeConstellationLabelEntries(
      constellationsData.constellations || [],
      hipToIndexMap,
      positions,
      sphereRadius
    );
    const cache = textureCacheRef.current;
    return entries.map((entry) => {
      if (!cache.has(entry.id)) {
        cache.set(entry.id, createConstellationLabelTexture(entry.name));
      }
      return {
        ...entry,
        texture: cache.get(entry.id),
      };
    });
  }, [positions, hipToIndexMap, sphereRadius]);

  useEffect(() => {
    const cache = textureCacheRef.current;
    return () => {
      cache.forEach((tex) => tex.dispose());
      cache.clear();
    };
  }, []);

  const scratch = useMemo(
    () => ({
      cameraWorldPos: new THREE.Vector3(),
      cameraForward: new THREE.Vector3(),
      spriteWorldPos: new THREE.Vector3(),
      toSprite: new THREE.Vector3(),
    }),
    []
  );

  // 5. Alignment Logic (Must match Stars.jsx to ensure overlay is correct)
  // This positions the group at Earth's location and aligns it with J2000 orientation
  useEffect(() => {
    if (plotObjects.length > 0 && groupRef.current) {
      const epochJ2000Pos = dateTimeToPos("2000-01-01", "12:00:00");
      
      // Temporarily move plot model to J2000 to grab the correct reference frame
      // This mimics the logic in Stars.jsx
      movePlotModel(plotObjects, epochJ2000Pos);
      
      const earthObj = plotObjects.find((p) => p.name === "Earth");
      
      if (earthObj && earthObj.cSphereRef.current) {
        const worldPosition = new THREE.Vector3();
        const worldQuaternion = new THREE.Quaternion();
        
        earthObj.cSphereRef.current.getWorldPosition(worldPosition);
        earthObj.cSphereRef.current.getWorldQuaternion(worldQuaternion);
        
        groupRef.current.position.copy(worldPosition);
        groupRef.current.quaternion.copy(worldQuaternion);
      }
    }
  }, [plotObjects]);

  useFrame(({ camera, size }) => {
    if (!showConstellations || !showConstellationLabels || size.height <= 0) {
      return;
    }

    camera.getWorldPosition(scratch.cameraWorldPos);
    camera.getWorldDirection(scratch.cameraForward);

    const maxWorldHeight = sphereRadius * 0.038;
    const aspect = LABEL_CANVAS_WIDTH / LABEL_CANVAS_HEIGHT;

    for (let i = 0; i < labelItems.length; i++) {
      const sprite = labelSpriteRefs.current[i];
      if (!sprite) continue;

      sprite.getWorldPosition(scratch.spriteWorldPos);
      scratch.toSprite.subVectors(scratch.spriteWorldPos, scratch.cameraWorldPos);
      const depth = scratch.toSprite.dot(scratch.cameraForward);

      if (depth <= 1) {
        sprite.visible = false;
        continue;
      }

      sprite.visible = true;
      let unitsPerPixel;
      if (camera.isOrthographicCamera) {
        unitsPerPixel = (camera.top - camera.bottom) / camera.zoom / size.height;
      } else {
        const vFov = (camera.fov * Math.PI) / 180;
        unitsPerPixel =
          (2 * Math.tan(vFov / 2) * depth) / (size.height * camera.zoom);
      }

      const worldHeight = Math.min(
        TARGET_LABEL_PX_HEIGHT * unitsPerPixel,
        maxWorldHeight
      );
      sprite.scale.set(worldHeight * aspect, worldHeight, 1);
    }
  });

  return (
    <group ref={groupRef} visible={showConstellations}>
      <lineSegments geometry={geometry}>
        <lineBasicMaterial
          color={0x0044ff} // Deep Blue
          opacity={0.8}
          transparent={true}
          depthWrite={false} // Prevents lines from obscuring distant stars or creating Z-fighting
        />
      </lineSegments>

      <group visible={showConstellationLabels}>
        {labelItems.map((item, idx) => (
          <sprite
            key={item.id}
            ref={(el) => {
              labelSpriteRefs.current[idx] = el;
            }}
            position={item.position}
            raycast={() => null}
          >
            <spriteMaterial
              map={item.texture}
              transparent={true}
              opacity={0.92}
              depthWrite={false}
              depthTest={true}
            />
          </sprite>
        ))}
      </group>
    </group>
  );
};

export default Constellations;