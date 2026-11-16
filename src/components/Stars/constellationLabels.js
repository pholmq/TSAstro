import * as THREE from "three";

const EXCLUDED_ASTERISM_CODES = new Set(["BgD", "GSq"]);

/**
 * Extracts the trailing skyculture code from a Stellarium constellation id
 * (e.g. "CON western_rey Tau" -> "Tau").
 */
export function getPrimaryConstellationCode(id) {
  const parts = String(id || "").trim().split(/\s+/);
  return parts[parts.length - 1] || "";
}

/**
 * Filters out H.A. Rey anatomical sub-part asterisms (e.g. "head", "feet",
 * "belt", "Pointers") and duplicate overlapping asterisms ("Big Dipper",
 * "Great Square") so each primary constellation receives one clean label.
 */
export function isPrimaryConstellation(constellation) {
  const name = constellation?.common_name?.english;
  if (!name || !Array.isArray(constellation?.lines) || constellation.lines.length === 0) {
    return false;
  }
  const code = getPrimaryConstellationCode(constellation.id);
  if (!code || code.length > 3) return false;
  if (EXCLUDED_ASTERISM_CODES.has(code)) return false;
  return true;
}

/**
 * Computes spherical centroid positions for every primary constellation label
 * from the projected celestial-sphere star positions.
 */
export function computeConstellationLabelEntries(
  constellations,
  hipToIndexMap,
  positions,
  sphereRadius
) {
  if (!Array.isArray(constellations) || !hipToIndexMap || !positions) {
    return [];
  }

  const labelRadius = sphereRadius * 0.992;
  const entries = [];
  const sumVec = new THREE.Vector3();
  const tmpVec = new THREE.Vector3();

  for (const constellation of constellations) {
    if (!isPrimaryConstellation(constellation)) continue;

    const seenHips = new Set();
    sumVec.set(0, 0, 0);
    let count = 0;

    for (const lineSeq of constellation.lines) {
      if (!Array.isArray(lineSeq)) continue;
      for (const hip of lineSeq) {
        if (seenHips.has(hip)) continue;
        seenHips.add(hip);
        const idx = hipToIndexMap.get(hip);
        if (idx === undefined) continue;
        const base = idx * 3;
        tmpVec.set(positions[base], positions[base + 1], positions[base + 2]);
        if (tmpVec.lengthSq() <= 1e-8) continue;
        tmpVec.normalize();
        sumVec.add(tmpVec);
        count++;
      }
    }

    if (count === 0 || sumVec.lengthSq() <= 1e-8) continue;

    sumVec.normalize().multiplyScalar(labelRadius);
    entries.push({
      id: constellation.id,
      name: constellation.common_name.english,
      position: [sumVec.x, sumVec.y, sumVec.z],
    });
  }

  return entries;
}
