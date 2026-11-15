import React, { useRef, useState, useEffect, useLayoutEffect } from "react";
import { Text3D } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useStore } from "../../store";
import { useAstroStore } from "../../astroStore";
import TychosLogo3D from "./TychosLogo3D";

// --- STRICT TIMING CONSTANTS ---
const TYCHOSIUM_DURATION = 2.0; // Seconds before main title starts fading
const WARNING_DURATION = 8.0; // Seconds before warning text starts fading
const FADE_SPEED = 0.05; // Consistent slow fade speed
const LOGO_HALF_WIDTH = 27; // TychosLogo3D radius ~179 * 0.15 scale
const LOGO_TO_TEXT_GAP = 8; // Visual gap between logo ring and first letter

export default function IntroText() {
  const runIntro = useStore((s) => s.runIntro);
  const setRunIntro = useStore((s) => s.setRunIntro);
  const welcomeOpen = useAstroStore((s) => s.welcomeOpen);

  const materialRef = useRef();
  const warningMaterialRef = useRef();
  const logoMaterialRef = useRef();
  const logoGroupRef = useRef();
  const textRef = useRef();
  const hasCenteredRef = useRef(false);

  // This timer runs independently of the global runIntro state
  const holdTimer = useRef(0);

  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [isFinished, setIsFinished] = useState(!runIntro);

  useEffect(() => {
    const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
    const hasTouchEvents = "ontouchstart" in window;

    if (isCoarsePointer || hasTouchEvents) {
      setIsTouchDevice(true);
    }
  }, []);

  const centerTitleAndLogo = () => {
    const textMesh = textRef.current;
    const logoGroup = logoGroupRef.current;
    if (!textMesh?.geometry || !logoGroup) return false;

    if (!textMesh.geometry.boundingBox) {
      textMesh.geometry.computeBoundingBox();
    }
    const bbox = textMesh.geometry.boundingBox;
    if (!bbox) return false;

    const textWidth = bbox.max.x - bbox.min.x;
    if (!Number.isFinite(textWidth) || textWidth <= 0) return false;

    const totalWidth = LOGO_HALF_WIDTH * 2 + LOGO_TO_TEXT_GAP + textWidth;
    const logoCenterZ = -totalWidth / 2 + LOGO_HALF_WIDTH;
    const titleStartZ =
      logoCenterZ + LOGO_HALF_WIDTH + LOGO_TO_TEXT_GAP - bbox.min.x;

    logoGroup.position.z = logoCenterZ;
    textMesh.position.z = titleStartZ;
    hasCenteredRef.current = true;
    return true;
  };

  useEffect(() => {
    if (runIntro && !welcomeOpen) {
      holdTimer.current = 0;
      hasCenteredRef.current = false;
      setIsFinished(false);
      if (materialRef.current) materialRef.current.opacity = 1;
      if (logoMaterialRef.current) logoMaterialRef.current.opacity = 1;
      if (warningMaterialRef.current) warningMaterialRef.current.opacity = 1;
    }
  }, [runIntro, welcomeOpen]);

  useLayoutEffect(() => {
    if (welcomeOpen || isFinished) return;
    hasCenteredRef.current = false;
    centerTitleAndLogo();
  }, [welcomeOpen, isFinished, isTouchDevice]);

  useFrame((state, delta) => {
    if (welcomeOpen || isFinished) return;

    if (!hasCenteredRef.current) {
      centerTitleAndLogo();
    }

    // 1. Advance the text's internal timer regardless of what the intro sequence is doing
    holdTimer.current += delta;

    let mainDone = false;
    let warningDone = false;

    // 2. Fade Main Title and Logo purely based on time
    if (holdTimer.current > TYCHOSIUM_DURATION) {
      if (materialRef.current) {
        let currentOp = materialRef.current.opacity;
        if (currentOp === undefined) currentOp = 1; // Failsafe for R3F first-frame render

        if (currentOp > 0.01) {
          const newOp = Math.max(0, currentOp - delta * FADE_SPEED);
          materialRef.current.opacity = newOp;
          if (logoMaterialRef.current) logoMaterialRef.current.opacity = newOp;
        } else {
          mainDone = true;
        }
      }
    }

    // 3. Fade Warning Text purely based on time
    if (!isTouchDevice) {
      warningDone = true;
    } else if (holdTimer.current > WARNING_DURATION) {
      if (warningMaterialRef.current) {
        let currentOp = warningMaterialRef.current.opacity;
        if (currentOp === undefined) currentOp = 1;

        if (currentOp > 0.01) {
          const newOp = Math.max(0, currentOp - delta * FADE_SPEED);
          warningMaterialRef.current.opacity = newOp;
        } else {
          warningDone = true;
        }
      }
    }

    // 4. Cleanup: Only unmount text when both are fully transparent
    if (mainDone && warningDone) {
      setIsFinished(true);
      // Just in case the camera animation hasn't already unlocked the UI, ensure it does here
      if (runIntro) {
        setRunIntro(false);
      }
    }
  });

  if (welcomeOpen || isFinished) return null;

  const titleSize = isTouchDevice ? 15 : 30;
  const fallbackTextWidth = isTouchDevice ? 200 : 400;
  const fallbackTotalWidth =
    LOGO_HALF_WIDTH * 2 + LOGO_TO_TEXT_GAP + fallbackTextWidth;
  const fallbackLogoZ = -fallbackTotalWidth / 2 + LOGO_HALF_WIDTH;
  const fallbackTitleZ = fallbackLogoZ + LOGO_HALF_WIDTH + LOGO_TO_TEXT_GAP;

  const titlePosition = [-140, 0, fallbackTitleZ];
  const warningPos = [-180, 0, -130];
  const logoPosition = [-125, 0, fallbackLogoZ];

  return (
    <>
      <group ref={logoGroupRef} position={logoPosition}>
        <TychosLogo3D
          materialRef={logoMaterialRef}
          rotation={[-Math.PI / 2, 0, -Math.PI / 2]}
        />
      </group>

      <Text3D
        ref={textRef}
        font={process.env.PUBLIC_URL + "/fonts/Cambria_Regular.json"}
        position={titlePosition}
        rotation={[-Math.PI / 2, 0, -Math.PI / 2]}
        size={titleSize}
        height={8}
        curveSegments={12}
        bevelEnabled
        bevelThickness={5}
        bevelSize={0.3}
        bevelOffset={0}
        bevelSegments={8}
      >
        The Tychosium Astro
        <meshStandardMaterial
          ref={materialRef}
          color="white"
          emissive="white"
          emissiveIntensity={0.2} // Slight glow to ensure it isn't grey
          metalness={0.2}
          roughness={0.5}
          transparent={true}
          opacity={1}
        />
      </Text3D>

      {isTouchDevice && (
        <Text3D
          font={process.env.PUBLIC_URL + "/fonts/Cambria_Regular.json"}
          position={warningPos}
          rotation={[-Math.PI / 2, 0, -Math.PI / 2]}
          size={12}
          height={3}
          curveSegments={12}
          bevelEnabled
          bevelThickness={1}
          bevelSize={0.1}
          bevelOffset={0}
          bevelSegments={4}
        >
          Keyboard and mouse recommended
          <meshStandardMaterial
            ref={warningMaterialRef}
            color="white"
            emissive="white"
            emissiveIntensity={0.8} // High intensity so it pops
            metalness={0.2}
            roughness={0.5}
            transparent={true}
            opacity={1}
          />
        </Text3D>
      )}
    </>
  );
}
