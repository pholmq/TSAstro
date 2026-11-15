import { Vector3 } from "three";
import { getPhysicalPosition } from "./physicalPosition";
import { posToJulianDay } from "./time-date-functions";

export const ZODIAC_SIGNS = [
  {
    id: "aries",
    name: "Aries",
    symbol: "♈",
    element: "Fire",
    modality: "Cardinal",
    ruler: "Mars",
    startLon: 0,
    dateRange: "Mar 21 – Apr 19",
    keywords: ["Initiative", "Courage", "Pioneering"],
  },
  {
    id: "taurus",
    name: "Taurus",
    symbol: "♉",
    element: "Earth",
    modality: "Fixed",
    ruler: "Venus",
    startLon: 30,
    dateRange: "Apr 20 – May 20",
    keywords: ["Steadfast", "Sensory", "Grounded"],
  },
  {
    id: "gemini",
    name: "Gemini",
    symbol: "♊",
    element: "Air",
    modality: "Mutable",
    ruler: "Mercury",
    startLon: 60,
    dateRange: "May 21 – Jun 20",
    keywords: ["Curiosity", "Duality", "Expression"],
  },
  {
    id: "cancer",
    name: "Cancer",
    symbol: "♋",
    element: "Water",
    modality: "Cardinal",
    ruler: "Moon",
    startLon: 90,
    dateRange: "Jun 21 – Jul 22",
    keywords: ["Intuition", "Nurturing", "Memory"],
  },
  {
    id: "leo",
    name: "Leo",
    symbol: "♌",
    element: "Fire",
    modality: "Fixed",
    ruler: "Sun",
    startLon: 120,
    dateRange: "Jul 23 – Aug 22",
    keywords: ["Radiance", "Creativity", "Heart"],
  },
  {
    id: "virgo",
    name: "Virgo",
    symbol: "♍",
    element: "Earth",
    modality: "Mutable",
    ruler: "Mercury",
    startLon: 150,
    dateRange: "Aug 23 – Sep 22",
    keywords: ["Discernment", "Craft", "Service"],
  },
  {
    id: "libra",
    name: "Libra",
    symbol: "♎",
    element: "Air",
    modality: "Cardinal",
    ruler: "Venus",
    startLon: 180,
    dateRange: "Sep 23 – Oct 22",
    keywords: ["Harmony", "Balance", "Connection"],
  },
  {
    id: "scorpio",
    name: "Scorpio",
    symbol: "♏",
    element: "Water",
    modality: "Fixed",
    ruler: "Pluto",
    startLon: 210,
    dateRange: "Oct 23 – Nov 21",
    keywords: ["Depth", "Transformation", "Truth"],
  },
  {
    id: "sagittarius",
    name: "Sagittarius",
    symbol: "♐",
    element: "Fire",
    modality: "Mutable",
    ruler: "Jupiter",
    startLon: 240,
    dateRange: "Nov 22 – Dec 21",
    keywords: ["Exploration", "Wisdom", "Horizon"],
  },
  {
    id: "capricorn",
    name: "Capricorn",
    symbol: "♑",
    element: "Earth",
    modality: "Cardinal",
    ruler: "Saturn",
    startLon: 270,
    dateRange: "Dec 22 – Jan 19",
    keywords: ["Mastery", "Endurance", "Structure"],
  },
  {
    id: "aquarius",
    name: "Aquarius",
    symbol: "♒",
    element: "Air",
    modality: "Fixed",
    ruler: "Uranus",
    startLon: 300,
    dateRange: "Jan 20 – Feb 18",
    keywords: ["Vision", "Originality", "Collective"],
  },
  {
    id: "pisces",
    name: "Pisces",
    symbol: "♓",
    element: "Water",
    modality: "Mutable",
    ruler: "Neptune",
    startLon: 330,
    dateRange: "Feb 19 – Mar 20",
    keywords: ["Empathy", "Dream", "Transcendence"],
  },
];

export const ASTRO_PLANETS = [
  { name: "Sun", symbol: "☉", color: "#FBBF24" },
  { name: "Moon", symbol: "☽", color: "#E2E8F0" },
  { name: "Mercury", symbol: "☿", color: "#94A3B8" },
  { name: "Venus", symbol: "♀", color: "#F472B6" },
  { name: "Mars", symbol: "♂", color: "#EF4444" },
  { name: "Jupiter", symbol: "♃", color: "#F59E0B" },
  { name: "Saturn", symbol: "♄", color: "#CBD5E1" },
  { name: "Uranus", symbol: "♅", color: "#38BDF8" },
  { name: "Neptune", symbol: "♆", color: "#818CF8" },
  { name: "Pluto", symbol: "♇", color: "#A78BFA" },
];

export const ASPECT_DEFINITIONS = [
  {
    type: "conjunction",
    name: "Conjunction",
    angle: 0,
    orb: 8,
    symbol: "☌",
    color: "#D4AF37",
    harmony: "major",
  },
  {
    type: "sextile",
    name: "Sextile",
    angle: 60,
    orb: 6,
    symbol: "⚹",
    color: "#60A5FA",
    harmony: "harmonious",
  },
  {
    type: "square",
    name: "Square",
    angle: 90,
    orb: 7,
    symbol: "□",
    color: "#F87171",
    harmony: "challenging",
  },
  {
    type: "trine",
    name: "Trine",
    angle: 120,
    orb: 7,
    symbol: "△",
    color: "#34D399",
    harmony: "harmonious",
  },
  {
    type: "opposition",
    name: "Opposition",
    angle: 180,
    orb: 8,
    symbol: "☍",
    color: "#FB923C",
    harmony: "challenging",
  },
];

export const BIRTH_CITY_PRESETS = [
  {
    label: "UTC (Greenwich, 00:00)",
    city: "UTC",
    lat: 51.4779,
    lon: 0.0,
    tzOffsetMinutes: 0,
  },
  {
    label: "Stockholm, Sweden (UTC+1)",
    city: "Stockholm",
    lat: 59.3293,
    lon: 18.0686,
    tzOffsetMinutes: 60,
  },
  {
    label: "London, UK (UTC+0)",
    city: "London",
    lat: 51.5074,
    lon: -0.1278,
    tzOffsetMinutes: 0,
  },
  {
    label: "Paris, France (UTC+1)",
    city: "Paris",
    lat: 48.8566,
    lon: 2.3522,
    tzOffsetMinutes: 60,
  },
  {
    label: "Berlin, Germany (UTC+1)",
    city: "Berlin",
    lat: 52.52,
    lon: 13.405,
    tzOffsetMinutes: 60,
  },
  {
    label: "Cairo, Egypt (UTC+2)",
    city: "Cairo",
    lat: 30.0444,
    lon: 31.2357,
    tzOffsetMinutes: 120,
  },
  {
    label: "Mumbai, India (UTC+5:30)",
    city: "Mumbai",
    lat: 19.076,
    lon: 72.8777,
    tzOffsetMinutes: 330,
  },
  {
    label: "Tokyo, Japan (UTC+9)",
    city: "Tokyo",
    lat: 35.6762,
    lon: 139.6503,
    tzOffsetMinutes: 540,
  },
  {
    label: "Sydney, Australia (UTC+10)",
    city: "Sydney",
    lat: -33.8688,
    lon: 151.2093,
    tzOffsetMinutes: 600,
  },
  {
    label: "New York, USA (UTC-5)",
    city: "New York",
    lat: 40.7128,
    lon: -74.006,
    tzOffsetMinutes: -300,
  },
  {
    label: "Chicago, USA (UTC-6)",
    city: "Chicago",
    lat: 41.8781,
    lon: -87.6298,
    tzOffsetMinutes: -360,
  },
  {
    label: "Los Angeles, USA (UTC-8)",
    city: "Los Angeles",
    lat: 34.0522,
    lon: -118.2437,
    tzOffsetMinutes: -480,
  },
  {
    label: "São Paulo, Brazil (UTC-3)",
    city: "São Paulo",
    lat: -23.5505,
    lon: -46.6333,
    tzOffsetMinutes: -180,
  },
  {
    label: "Toronto, Canada (UTC-5)",
    city: "Toronto",
    lat: 43.6532,
    lon: -79.3832,
    tzOffsetMinutes: -300,
  },
];

const OBLIQUITY_DEG = 23.4392911;
const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

/** Normalize an angle in degrees into [0, 360). */
export function normalizeDegrees(deg) {
  const n = ((deg % 360) + 360) % 360;
  return n === 0 ? 0 : n;
}

/** Convert ecliptic longitude in degrees to zodiac sign, degree, arcminutes, and formatted label. */
export function getZodiacFromLongitude(lonDeg) {
  const lon = normalizeDegrees(lonDeg);
  let signIndex = Math.floor(lon / 30) % 12;
  const lonInSign = lon - signIndex * 30;
  let degreeInSign = Math.floor(lonInSign);
  let minutesInSign = Math.round((lonInSign - degreeInSign) * 60);

  if (minutesInSign >= 60) {
    minutesInSign = 0;
    degreeInSign += 1;
  }
  if (degreeInSign >= 30) {
    degreeInSign = 0;
    signIndex = (signIndex + 1) % 12;
  }

  const sign = ZODIAC_SIGNS[signIndex];
  const formatted = `${degreeInSign}°${String(minutesInSign).padStart(
    2,
    "0"
  )}' ${sign.symbol}`;

  return {
    sign,
    degreeInSign,
    minutesInSign,
    formatted,
  };
}

/** Standard tropical Sun sign lookup from calendar month (1-12) and day (1-31). */
export function getSunSignFromDate(month, day) {
  const m = Number(month);
  const d = Number(day);

  const findSign = (id) => ZODIAC_SIGNS.find((s) => s.id === id);

  if ((m === 3 && d >= 21) || (m === 4 && d <= 19)) return findSign("aries");
  if ((m === 4 && d >= 20) || (m === 5 && d <= 20)) return findSign("taurus");
  if ((m === 5 && d >= 21) || (m === 6 && d <= 20)) return findSign("gemini");
  if ((m === 6 && d >= 21) || (m === 7 && d <= 22)) return findSign("cancer");
  if ((m === 7 && d >= 23) || (m === 8 && d <= 22)) return findSign("leo");
  if ((m === 8 && d >= 23) || (m === 9 && d <= 22)) return findSign("virgo");
  if ((m === 9 && d >= 23) || (m === 10 && d <= 22)) return findSign("libra");
  if ((m === 10 && d >= 23) || (m === 11 && d <= 21))
    return findSign("scorpio");
  if ((m === 11 && d >= 22) || (m === 12 && d <= 21))
    return findSign("sagittarius");
  if ((m === 12 && d >= 22) || (m === 1 && d <= 19))
    return findSign("capricorn");
  if ((m === 1 && d >= 20) || (m === 2 && d <= 18))
    return findSign("aquarius");
  return findSign("pisces");
}

function parseIsoDate(dateStr) {
  const trimmed = String(dateStr).trim();
  if (trimmed.startsWith("-")) {
    const [, y, m, d] = trimmed.split("-");
    return { year: -Number(y), month: Number(m), day: Number(d) };
  }
  const [y, m, d] = trimmed.split("-");
  return { year: Number(y), month: Number(m), day: Number(d) };
}

/**
 * Convert local YYYY-MM-DD and HH:MM[:SS] plus tzOffsetMinutes (minutes east of UTC)
 * into { utcDate: "YYYY-MM-DD", utcTime: "HH:MM:SS" }.
 */
export function localToUtcDateTime(
  dateStr,
  timeStr = "12:00:00",
  tzOffsetMinutes = 0
) {
  const { year, month, day } = parseIsoDate(dateStr);
  const timeParts = String(timeStr || "12:00:00")
    .trim()
    .split(":");
  const h = Number(timeParts[0] || 0);
  const m = Number(timeParts[1] || 0);
  const s = Number(timeParts[2] || 0);

  // Use Date.UTC + setUTCFullYear so years in 0..99 or historical eras are preserved.
  const localRef = new Date(Date.UTC(2000, month - 1, day, h, m, s));
  localRef.setUTCFullYear(year, month - 1, day);

  const utcMs = localRef.getTime() - Number(tzOffsetMinutes || 0) * 60 * 1000;
  const utc = new Date(utcMs);

  const uy = utc.getUTCFullYear();
  const um = String(utc.getUTCMonth() + 1).padStart(2, "0");
  const ud = String(utc.getUTCDate()).padStart(2, "0");
  const yearStr =
    uy < 0
      ? `-${String(Math.abs(uy)).padStart(4, "0")}`
      : String(uy).padStart(4, "0");

  const uh = String(utc.getUTCHours()).padStart(2, "0");
  const umin = String(utc.getUTCMinutes()).padStart(2, "0");
  const us = String(utc.getUTCSeconds()).padStart(2, "0");

  return {
    utcDate: `${yearStr}-${um}-${ud}`,
    utcTime: `${uh}:${umin}:${us}`,
  };
}

/**
 * Compute ecliptic longitude in [0, 360) from a vector in Earth-Pivot local space,
 * where +Z is Vernal Equinox (0° Aries) and +X is Summer Solstice (90° Cancer).
 */
export function getEclipticLongitudeFromEarthVector(localVec) {
  return normalizeDegrees(Math.atan2(localVec.x, localVec.z) * RAD_TO_DEG);
}

/**
 * Compute the Ascendant ecliptic longitude and zodiac placement for a Julian Day
 * and geographic latitude/longitude (degrees, north/east positive).
 */
export function calculateAscendant(jd, latDeg, lonDeg) {
  const daysSinceJ2000 = jd - 2451545.0;
  const T = daysSinceJ2000 / 36525.0;

  const gmstDeg = normalizeDegrees(
    280.46061837 +
      360.98564736629 * daysSinceJ2000 +
      0.000387933 * T * T -
      (T * T * T) / 38710000.0
  );
  const lstDeg = normalizeDegrees(gmstDeg + Number(lonDeg));

  const clampedLat = Math.max(-89.99, Math.min(89.99, Number(latDeg)));
  const lstRad = lstDeg * DEG_TO_RAD;
  const latRad = clampedLat * DEG_TO_RAD;
  const epsRad = OBLIQUITY_DEG * DEG_TO_RAD;

  const ascRad = Math.atan2(
    Math.cos(lstRad),
    -(
      Math.sin(lstRad) * Math.cos(epsRad) +
      Math.tan(latRad) * Math.sin(epsRad)
    )
  );
  const longitude = normalizeDegrees(ascRad * RAD_TO_DEG);

  return {
    longitude,
    ...getZodiacFromLongitude(longitude),
  };
}

/** Compute Whole Sign House number (1..12) from planet longitude and Ascendant longitude. */
export function getWholeSignHouse(planetLonDeg, ascLonDeg) {
  const planetSignIndex = Math.floor(normalizeDegrees(planetLonDeg) / 30);
  const ascSignIndex = Math.floor(normalizeDegrees(ascLonDeg) / 30);
  return ((planetSignIndex - ascSignIndex + 12) % 12) + 1;
}

/** Detect major Ptolemaic aspects among an array of planetary placements. */
export function computeAspects(placements) {
  const aspects = [];

  for (let i = 0; i < placements.length; i++) {
    for (let j = i + 1; j < placements.length; j++) {
      const bodyA = placements[i];
      const bodyB = placements[j];
      const diff = Math.abs(
        normalizeDegrees(bodyA.longitude) - normalizeDegrees(bodyB.longitude)
      );
      const separation = diff > 180 ? 360 - diff : diff;

      for (const def of ASPECT_DEFINITIONS) {
        const orb = Math.abs(separation - def.angle);
        if (orb <= def.orb) {
          aspects.push({
            bodyA: bodyA.name,
            bodyB: bodyB.name,
            symbolA: bodyA.symbol,
            symbolB: bodyB.symbol,
            type: def.type,
            symbol: def.symbol,
            color: def.color,
            harmony: def.harmony,
            exactAngle: def.angle,
            orb: Number(orb.toFixed(2)),
            separation: Number(separation.toFixed(2)),
          });
          break;
        }
      }
    }
  }

  aspects.sort((a, b) => a.orb - b.orb);
  return aspects;
}

/**
 * Compute full astrological chart snapshot from the live Three.js scene and simulation pos.
 */
export function computeSceneAstrologyChart(scene, pos, birthLocation = null) {
  const jd = typeof pos === "number" ? posToJulianDay(pos) : null;

  if (!scene) {
    return {
      placements: [],
      aspects: [],
      sunPlacement: null,
      moonPlacement: null,
      ascendant: null,
      jd,
    };
  }

  const earthPivot = scene.getObjectByName("Earth-Pivot");
  if (!earthPivot) {
    return {
      placements: [],
      aspects: [],
      sunPlacement: null,
      moonPlacement: null,
      ascendant: null,
      jd,
    };
  }

  earthPivot.updateWorldMatrix(true, false);

  const ascendant =
    jd != null &&
    birthLocation?.lat != null &&
    birthLocation?.lon != null
      ? calculateAscendant(
          jd,
          Number(birthLocation.lat),
          Number(birthLocation.lon)
        )
      : null;

  const worldVec = new Vector3();
  const placements = [];

  for (const planet of ASTRO_PLANETS) {
    const posVec = getPhysicalPosition(planet.name, scene, worldVec);
    if (!posVec) continue;

    const localVec = earthPivot.worldToLocal(posVec.clone());
    const longitude = getEclipticLongitudeFromEarthVector(localVec);
    const zodiac = getZodiacFromLongitude(longitude);
    const house = ascendant
      ? getWholeSignHouse(longitude, ascendant.longitude)
      : null;

    placements.push({
      name: planet.name,
      symbol: planet.symbol,
      color: planet.color,
      longitude,
      ...zodiac,
      house,
    });
  }

  const aspects = computeAspects(placements);
  const sunPlacement = placements.find((p) => p.name === "Sun") || null;
  const moonPlacement = placements.find((p) => p.name === "Moon") || null;

  return {
    placements,
    aspects,
    sunPlacement,
    moonPlacement,
    ascendant,
    jd,
  };
}
