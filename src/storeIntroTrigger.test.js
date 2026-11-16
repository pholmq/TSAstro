import { useStore } from "./store";

describe("Intro completion toggles Celestial sphere and Constellations", () => {
  beforeEach(() => {
    useStore.setState({
      runIntro: true,
      officialStarDistances: true,
      showConstellations: false,
    });
  });

  test("turns on Celestial sphere (officialStarDistances=false) and Constellations when runIntro finishes", () => {
    expect(useStore.getState().runIntro).toBe(true);
    expect(useStore.getState().officialStarDistances).toBe(true);
    expect(useStore.getState().showConstellations).toBe(false);

    useStore.getState().setRunIntro(false);

    expect(useStore.getState().runIntro).toBe(false);
    expect(useStore.getState().officialStarDistances).toBe(false);
    expect(useStore.getState().showConstellations).toBe(true);
  });

  test("does not override manual toggles when setRunIntro(false) is called after intro already ended", () => {
    useStore.getState().setRunIntro(false);
    useStore.getState().setOfficialStarDistances(true);
    useStore.getState().setShowConstellations(false);

    useStore.getState().setRunIntro(false);

    expect(useStore.getState().officialStarDistances).toBe(true);
    expect(useStore.getState().showConstellations).toBe(false);
  });

  test("resets flight mode on setRunIntro(true) and turns sphere & constellations back on when finished", () => {
    useStore.getState().setRunIntro(false);
    useStore.getState().setRunIntro(true);

    expect(useStore.getState().runIntro).toBe(true);
    expect(useStore.getState().officialStarDistances).toBe(true);
    expect(useStore.getState().showConstellations).toBe(false);

    useStore.getState().setRunIntro(false);

    expect(useStore.getState().officialStarDistances).toBe(false);
    expect(useStore.getState().showConstellations).toBe(true);
  });
});
