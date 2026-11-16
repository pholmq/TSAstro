import {
  GENERAL_ASTROLOGY_QUOTES,
  SIGN_QUOTES,
  getAstrologyQuote,
} from "./astrologyQuotes";

describe("astrologyQuotes", () => {
  test("contains no quotes by Kepler", () => {
    const allSignQuotes = Object.values(SIGN_QUOTES).flat();
    const allQuotes = [...allSignQuotes, ...GENERAL_ASTROLOGY_QUOTES];
    for (const quote of allQuotes) {
      expect(quote.toLowerCase()).not.toContain("kepler");
    }
  });

  test("keeps general astrology quotes and includes Tycho Brahe and Christen Sørensen Longomontanus quotes", () => {
    const braheCount = GENERAL_ASTROLOGY_QUOTES.filter((q) =>
      q.includes("— Tycho Brahe")
    ).length;
    const longomontanusCount = GENERAL_ASTROLOGY_QUOTES.filter((q) =>
      q.includes("— Christen Sørensen Longomontanus")
    ).length;

    expect(braheCount).toBe(9);
    expect(longomontanusCount).toBe(7);
    expect(
      GENERAL_ASTROLOGY_QUOTES.some((q) => q.includes("— Carl Jung"))
    ).toBe(true);
    expect(
      GENERAL_ASTROLOGY_QUOTES.some((q) => q.includes("— Claudius Ptolemy"))
    ).toBe(true);
  });

  test("getAstrologyQuote prioritizes sign quotes initially and excludes current quote on refresh", () => {
    const initial = getAstrologyQuote("taurus");
    expect(initial.isSignSpecific).toBe(true);
    expect(SIGN_QUOTES.taurus).toContain(initial.text);

    for (let i = 0; i < 10; i++) {
      const next = getAstrologyQuote("taurus", initial.text);
      expect(next.text).not.toBe(initial.text);
    }
  });
});
