import { useCallback, useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { useStore } from "../../store";
import { useAstroStore } from "../../astroStore";
import { computeSceneAstrologyChart } from "../../utils/astrology";
import useFrameInterval from "../../utils/useFrameInterval";

/**
 * Headless R3F controller that periodically computes the astrological chart
 * snapshot from the live 3D scene and stores it in useAstroStore.
 */
const AstrologyController = () => {
  const { scene } = useThree();
  const posRef = useStore((s) => s.posRef);
  const updAC = useStore((s) => s.updAC);
  const welcomeOpen = useAstroStore((s) => s.welcomeOpen);
  const birthData = useAstroStore((s) => s.birthData);

  const recomputeChart = useCallback(() => {
    try {
      if (!scene) return;
      if (!scene.getObjectByName("Earth-Pivot") || !scene.getObjectByName("Sun")) {
        return;
      }

      const currentPos = posRef?.current;
      if (typeof currentPos !== "number" || !Number.isFinite(currentPos)) {
        return;
      }

      const currentBirthData = useAstroStore.getState().birthData;
      const birthLocation =
        currentBirthData?.birthLat != null && currentBirthData?.birthLon != null
          ? {
              lat: currentBirthData.birthLat,
              lon: currentBirthData.birthLon,
            }
          : null;

      const snapshot = computeSceneAstrologyChart(
        scene,
        currentPos,
        birthLocation
      );
      useAstroStore.getState().setChartSnapshot(snapshot);
    } catch (err) {
      console.warn("AstrologyController chart computation skipped:", err);
    }
  }, [scene, posRef]);

  useFrameInterval(() => {
    recomputeChart();
  }, 250);

  useEffect(() => {
    recomputeChart();
    // Re-sample on the next animation frame after planet transforms apply new posRef.current
    const rafId = requestAnimationFrame(() => {
      recomputeChart();
    });
    return () => cancelAnimationFrame(rafId);
  }, [updAC, welcomeOpen, birthData, recomputeChart]);

  return null;
};

export default AstrologyController;
