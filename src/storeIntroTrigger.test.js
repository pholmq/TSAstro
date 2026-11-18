import { useStore } from "./store";
import { usePlanetCameraStore } from "./components/PlanetCamera/planetCameraStore";

describe("Intro completion toggles Constellations and Earth PlanetCamera", () => {
  beforeEach(() => {
    useStore.setState({
      runIntro: true,
      officialStarDistances: true,
      showConstellations: false,
      planetCamera: false,
      cameraTransitioning: false,
    });
    usePlanetCameraStore.setState({
      planetCameraTarget: "Earth",
      planCamLat: 0,
      planCamLong: 0,
    });
  });

  test("turns on Constellations and Earth PlanetCamera while keeping Celestial sphere off when runIntro finishes", () => {
    usePlanetCameraStore.getState().setPlanCamLat(59.33);
    usePlanetCameraStore.getState().setPlanCamLong(18.07);

    useStore.getState().setRunIntro(false);

    expect(useStore.getState().runIntro).toBe(false);
    expect(useStore.getState().officialStarDistances).toBe(true);
    expect(useStore.getState().showConstellations).toBe(true);
    expect(useStore.getState().planetCamera).toBe(true);
    expect(usePlanetCameraStore.getState().planetCameraTarget).toBe("Earth");
    expect(usePlanetCameraStore.getState().planCamLat).toBe(59.33);
    expect(usePlanetCameraStore.getState().planCamLong).toBe(18.07);
  });

  test("does not override manual toggles when setRunIntro(false) is called after intro already ended", () => {
    useStore.getState().setRunIntro(false);
    useStore.getState().setOfficialStarDistances(false);
    useStore.getState().setShowConstellations(false);
    useStore.getState().setPlanetCamera(false);

    useStore.getState().setRunIntro(false);

    expect(useStore.getState().officialStarDistances).toBe(false);
    expect(useStore.getState().showConstellations).toBe(false);
    expect(useStore.getState().planetCamera).toBe(false);
  });

  test("resets PlanetCamera & Constellations for replay on setRunIntro(true) and activates them on completion", () => {
    useStore.getState().setRunIntro(false);
    useStore.getState().setRunIntro(true);

    expect(useStore.getState().runIntro).toBe(true);
    expect(useStore.getState().planetCamera).toBe(false);
    expect(useStore.getState().cameraTransitioning).toBe(false);
    expect(useStore.getState().showConstellations).toBe(false);

    useStore.getState().setRunIntro(false);

    expect(useStore.getState().officialStarDistances).toBe(true);
    expect(useStore.getState().showConstellations).toBe(true);
    expect(useStore.getState().planetCamera).toBe(true);
  });
});
