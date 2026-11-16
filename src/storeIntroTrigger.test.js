import { useStore } from "./store";

describe("Intro completion keeps Celestial sphere off by default and turns Constellations on", () => {
  beforeEach(() => {
    useStore.setState({
      runIntro: true,
      officialStarDistances: true,
      showConstellations: false,
    });
  });

  test("keeps Celestial sphere off (officialStarDistances=true) and turns Constellations on when runIntro finishes", () => {
    expect(useStore.getState().runIntro).toBe(true);
    expect(useStore.getState().officialStarDistances).toBe(true);
    expect(useStore.getState().showConstellations).toBe(false);

    useStore.getState().setRunIntro(false);

    expect(useStore.getState().runIntro).toBe(false);
    expect(useStore.getState().officialStarDistances).toBe(true);
    expect(useStore.getState().showConstellations).toBe(true);
  });

  test("does not override manual toggles when setRunIntro(false) is called after intro already ended", () => {
    useStore.getState().setRunIntro(false);
    useStore.getState().setOfficialStarDistances(false);
    useStore.getState().setShowConstellations(false);

    useStore.getState().setRunIntro(false);

    expect(useStore.getState().officialStarDistances).toBe(false);
    expect(useStore.getState().showConstellations).toBe(false);
  });

  test("hides Constellations during replay and turns them back on when finished without enabling Celestial sphere", () => {
    useStore.getState().setRunIntro(false);
    useStore.getState().setRunIntro(true);

    expect(useStore.getState().runIntro).toBe(true);
    expect(useStore.getState().officialStarDistances).toBe(true);
    expect(useStore.getState().showConstellations).toBe(false);

    useStore.getState().setRunIntro(false);

    expect(useStore.getState().officialStarDistances).toBe(true);
    expect(useStore.getState().showConstellations).toBe(true);
  });
});
