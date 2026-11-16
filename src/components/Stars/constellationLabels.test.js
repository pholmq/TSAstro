import constellationsData from "../../settings/constellations.json";
import bscSettings from "../../settings/BSC.json";
import {
  computeConstellationLabelEntries,
  getPrimaryConstellationCode,
  isPrimaryConstellation,
} from "./constellationLabels";

describe("constellationLabels", () => {
  test("extracts trailing constellation codes accurately", () => {
    expect(getPrimaryConstellationCode("CON western_rey Tau")).toBe("Tau");
    expect(getPrimaryConstellationCode("CON western_rey Tauh")).toBe("Tauh");
    expect(getPrimaryConstellationCode("CON western_rey Cap")).toBe("Cap");
  });

  test("filters constellations.json down to the 88 primary constellations including all zodiac signs", () => {
    const primaryNames = constellationsData.constellations
      .filter(isPrimaryConstellation)
      .map((c) => c.common_name.english);

    expect(primaryNames).toHaveLength(88);

    const expectedZodiac = [
      "Aries",
      "Taurus",
      "Gemini",
      "Cancer",
      "Leo",
      "Virgo",
      "Libra",
      "Scorpius",
      "Sagittarius",
      "Capricornus",
      "Aquarius",
      "Pisces",
    ];
    for (const sign of expectedZodiac) {
      expect(primaryNames).toContain(sign);
    }

    expect(primaryNames).not.toContain("feet");
    expect(primaryNames).not.toContain("head");
    expect(primaryNames).not.toContain("Pointers");
    expect(primaryNames).not.toContain("Big Dipper");
    expect(primaryNames).not.toContain("Great Square");
  });

  test("computes spherical centroid positions at 0.992 * sphereRadius", () => {
    const hipToIndexMap = new Map();
    const sphereRadius = 10000;
    const positions = new Float32Array(bscSettings.length * 3);

    bscSettings.forEach((star, idx) => {
      if (star.HIP) {
        hipToIndexMap.set(parseInt(star.HIP, 10), idx);
      }
      // Distribute deterministic unit vectors across sphere
      const phi = (idx % 360) * (Math.PI / 180);
      const theta = ((idx % 160) - 80) * (Math.PI / 180);
      positions[idx * 3] = sphereRadius * Math.cos(theta) * Math.cos(phi);
      positions[idx * 3 + 1] = sphereRadius * Math.sin(theta);
      positions[idx * 3 + 2] = sphereRadius * Math.cos(theta) * Math.sin(phi);
    });

    const entries = computeConstellationLabelEntries(
      constellationsData.constellations,
      hipToIndexMap,
      positions,
      sphereRadius
    );

    expect(entries).toHaveLength(88);
    for (const entry of entries) {
      const [x, y, z] = entry.position;
      const dist = Math.hypot(x, y, z);
      expect(dist).toBeCloseTo(sphereRadius * 0.992, 1);
    }
  });
});
