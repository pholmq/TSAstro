import {
  ZODIAC_SIGNS,
  ASTRO_PLANETS,
  ASPECT_DEFINITIONS,
  BIRTH_CITY_PRESETS,
  normalizeDegrees,
  getEclipticLongitudeFromEarthVector,
  getZodiacFromLongitude,
  getSunSignFromDate,
  localToUtcDateTime,
  calculateAscendant,
  getWholeSignHouse,
  computeAspects,
} from "./astrology";
import {
  SIGN_QUOTES,
  GENERAL_ASTROLOGY_QUOTES,
  getAstrologyQuote,
} from "../data/astrologyQuotes";

describe("astrology constants", () => {
  test("defines 12 zodiac signs from Aries (0°) to Pisces (330°)", () => {
    expect(ZODIAC_SIGNS).toHaveLength(12);
    expect(ZODIAC_SIGNS[0].id).toBe("aries");
    expect(ZODIAC_SIGNS[0].startLon).toBe(0);
    expect(ZODIAC_SIGNS[11].id).toBe("pisces");
    expect(ZODIAC_SIGNS[11].startLon).toBe(330);
  });

  test("defines 10 astrological planets, 5 aspects, and 12+ birth city presets", () => {
    expect(ASTRO_PLANETS).toHaveLength(10);
    expect(ASPECT_DEFINITIONS).toHaveLength(5);
    expect(BIRTH_CITY_PRESETS.length).toBeGreaterThanOrEqual(12);
  });
});

describe("getEclipticLongitudeFromEarthVector", () => {
  test("maps +Z, +X, -Z, -X to 0° Aries, 90° Cancer, 180° Libra, 270° Capricorn", () => {
    expect(getEclipticLongitudeFromEarthVector({ x: 0, y: 0, z: 1 })).toBeCloseTo(
      0,
      6
    );
    expect(getEclipticLongitudeFromEarthVector({ x: 1, y: 0, z: 0 })).toBeCloseTo(
      90,
      6
    );
    expect(
      getEclipticLongitudeFromEarthVector({ x: 0, y: 0, z: -1 })
    ).toBeCloseTo(180, 6);
    expect(
      getEclipticLongitudeFromEarthVector({ x: -1, y: 0, z: 0 })
    ).toBeCloseTo(270, 6);
  });

  test("handles intermediate vectors and normalizes to [0, 360)", () => {
    expect(getEclipticLongitudeFromEarthVector({ x: 1, y: 0, z: 1 })).toBeCloseTo(
      45,
      6
    );
    expect(
      getEclipticLongitudeFromEarthVector({ x: -1, y: 0, z: 1 })
    ).toBeCloseTo(315, 6);
    expect(normalizeDegrees(-90)).toBe(270);
    expect(normalizeDegrees(360)).toBe(0);
  });
});

describe("getZodiacFromLongitude and getSunSignFromDate", () => {
  test("converts ecliptic longitudes to sign, degree, minutes, and formatted string", () => {
    const cancer = getZodiacFromLongitude(90 + 14 + 22 / 60);
    expect(cancer.sign.id).toBe("cancer");
    expect(cancer.degreeInSign).toBe(14);
    expect(cancer.minutesInSign).toBe(22);
    expect(cancer.formatted).toBe("14°22' ♋");

    const ariesStart = getZodiacFromLongitude(360);
    expect(ariesStart.sign.id).toBe("aries");
    expect(ariesStart.degreeInSign).toBe(0);
    expect(ariesStart.minutesInSign).toBe(0);
    expect(ariesStart.formatted).toBe("0°00' ♈");

    const negative = getZodiacFromLongitude(-30);
    expect(negative.sign.id).toBe("pisces");
    expect(negative.degreeInSign).toBe(0);
  });

  test("looks up tropical Sun sign boundaries accurately", () => {
    expect(getSunSignFromDate(3, 21).id).toBe("aries");
    expect(getSunSignFromDate(4, 19).id).toBe("aries");
    expect(getSunSignFromDate(4, 20).id).toBe("taurus");
    expect(getSunSignFromDate(7, 4).id).toBe("cancer");
    expect(getSunSignFromDate(12, 22).id).toBe("capricorn");
    expect(getSunSignFromDate(1, 15).id).toBe("capricorn");
    expect(getSunSignFromDate(2, 18).id).toBe("aquarius");
    expect(getSunSignFromDate(3, 20).id).toBe("pisces");
  });
});

describe("localToUtcDateTime", () => {
  test("converts positive and negative timezone offsets including day rollover", () => {
    // CET (UTC+1) shortly after midnight rolls back to previous day
    expect(localToUtcDateTime("2000-01-01", "00:30", 60)).toEqual({
      utcDate: "1999-12-31",
      utcTime: "23:30:00",
    });

    // EST (UTC-5) late evening rolls forward to next day
    expect(localToUtcDateTime("1985-06-30", "21:15:30", -300)).toEqual({
      utcDate: "1985-07-01",
      utcTime: "02:15:30",
    });

    // Half-hour offset (IST UTC+5:30)
    expect(localToUtcDateTime("1950-01-26", "05:30", 330)).toEqual({
      utcDate: "1950-01-26",
      utcTime: "00:00:00",
    });
  });

  test("preserves historical years below 100 via setUTCFullYear", () => {
    expect(localToUtcDateTime("0050-03-15", "12:00:00", 0)).toEqual({
      utcDate: "0050-03-15",
      utcTime: "12:00:00",
    });
  });
});

describe("calculateAscendant and getWholeSignHouse", () => {
  test("calculates Ascendant in [0, 360) with zodiac placement", () => {
    const jdJ2000 = 2451545.0; // 2000-01-01 12:00:00 UT
    const asc = calculateAscendant(jdJ2000, 59.3293, 18.0686);
    expect(asc.longitude).toBeGreaterThanOrEqual(0);
    expect(asc.longitude).toBeLessThan(360);
    expect(asc.sign).toBeDefined();
    expect(asc.formatted).toContain(asc.sign.symbol);
  });

  test("computes Whole Sign Houses 1..12 relative to Ascendant sign", () => {
    // Ascendant in Leo (135°), Sun in Leo (122°) -> House 1
    expect(getWholeSignHouse(122, 135)).toBe(1);
    // Planet in Virgo (160°) -> House 2
    expect(getWholeSignHouse(160, 135)).toBe(2);
    // Planet in Cancer (105°) -> House 12
    expect(getWholeSignHouse(105, 135)).toBe(12);
    // Ascendant in Pisces (345°), planet in Aries (10°) -> House 2
    expect(getWholeSignHouse(10, 345)).toBe(2);
  });
});

describe("computeAspects", () => {
  test("detects conjunction, sextile, square, trine, opposition within orb", () => {
    const placements = [
      { name: "Sun", symbol: "☉", color: "#FBBF24", longitude: 10 },
      { name: "Moon", symbol: "☽", color: "#E2E8F0", longitude: 14 }, // 4° -> conjunction (orb 8)
      { name: "Mercury", symbol: "☿", color: "#94A3B8", longitude: 72 }, // 62° from Sun -> sextile (orb 6)
      { name: "Mars", symbol: "♂", color: "#EF4444", longitude: 103 }, // 93° from Sun -> square (orb 7)
      { name: "Jupiter", symbol: "♃", color: "#F59E0B", longitude: 132 }, // 122° from Sun -> trine (orb 7)
      { name: "Saturn", symbol: "♄", color: "#CBD5E1", longitude: 193 }, // 183° from Sun -> opposition (orb 8)
      { name: "Pluto", symbol: "♇", color: "#A78BFA", longitude: 40 }, // 30° from Sun -> no major aspect
    ];

    const aspects = computeAspects(placements);
    const findPair = (a, b) =>
      aspects.find(
        (asp) =>
          (asp.bodyA === a && asp.bodyB === b) ||
          (asp.bodyA === b && asp.bodyB === a)
      );

    expect(findPair("Sun", "Moon")?.type).toBe("conjunction");
    expect(findPair("Sun", "Moon")?.orb).toBeCloseTo(4, 2);

    expect(findPair("Sun", "Mercury")?.type).toBe("sextile");
    expect(findPair("Sun", "Mercury")?.orb).toBeCloseTo(2, 2);

    expect(findPair("Sun", "Mars")?.type).toBe("square");
    expect(findPair("Sun", "Mars")?.orb).toBeCloseTo(3, 2);

    expect(findPair("Sun", "Jupiter")?.type).toBe("trine");
    expect(findPair("Sun", "Jupiter")?.orb).toBeCloseTo(2, 2);

    expect(findPair("Sun", "Saturn")?.type).toBe("opposition");
    expect(findPair("Sun", "Saturn")?.orb).toBeCloseTo(3, 2);

    expect(findPair("Sun", "Pluto")).toBeUndefined();
  });

  test("handles aspects wrapping across 360°/0° Aries", () => {
    const placements = [
      { name: "Sun", symbol: "☉", color: "#FBBF24", longitude: 358 },
      { name: "Venus", symbol: "♀", color: "#F472B6", longitude: 3 },
    ];
    const aspects = computeAspects(placements);
    expect(aspects).toHaveLength(1);
    expect(aspects[0].type).toBe("conjunction");
    expect(aspects[0].separation).toBeCloseTo(5, 2);
  });
});

describe("getAstrologyQuote", () => {
  test("has quotes for all 12 signs and general quotes including Brahe/Longomontanus without Kepler", () => {
    expect(Object.keys(SIGN_QUOTES)).toHaveLength(12);
    expect(GENERAL_ASTROLOGY_QUOTES.length).toBeGreaterThanOrEqual(29);

    const allTexts = [
      ...Object.values(SIGN_QUOTES).flat(),
      ...GENERAL_ASTROLOGY_QUOTES,
    ];
    for (const text of allTexts) {
      expect(text).not.toMatch(/kepler/i);
    }
    expect(
      GENERAL_ASTROLOGY_QUOTES.some((t) => /Tycho Brahe/.test(t))
    ).toBe(true);
    expect(
      GENERAL_ASTROLOGY_QUOTES.some((t) =>
        /Christen Sørensen Longomontanus/.test(t)
      )
    ).toBe(true);
  });

  test("returns a sign-specific quote for the user's star sign and avoids excluded text", () => {
    for (const sign of ZODIAC_SIGNS) {
      const first = getAstrologyQuote(sign.id);
      expect(first.signId).toBe(sign.id);
      expect(first.isSignSpecific).toBe(true);
      expect(SIGN_QUOTES[sign.id]).toContain(first.text);
      expect(first.text).not.toMatch(/kepler/i);

      const second = getAstrologyQuote(sign.id, first.text);
      expect(second.text).not.toBe(first.text);
      expect(second.text).not.toMatch(/kepler/i);
    }
  });
});
