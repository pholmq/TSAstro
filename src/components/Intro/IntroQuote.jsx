import { Html } from "@react-three/drei";
import { useRef, useState, useEffect } from "react";
import { useStore } from "../../store";
import { useAstroStore } from "../../astroStore";
import { getAstrologyQuote } from "../../data/astrologyQuotes";

const IntroQuote = ({ duration = 10000, fade = 2000 }) => {
  const runIntro = useStore((s) => s.runIntro);
  const welcomeOpen = useAstroStore((s) => s.welcomeOpen);
  const quoteTrigger = useAstroStore((s) => s.quoteTrigger);
  const birthData = useAstroStore((s) => s.birthData);
  const activeQuote = useAstroStore((s) => s.activeQuote);
  const refreshQuote = useAstroStore((s) => s.refreshQuote);

  const portalRef = useRef(document.body);
  const [currentQuote, setCurrentQuote] = useState("");
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (welcomeOpen || !runIntro) {
      setIsVisible(false);
      return;
    }

    if (!activeQuote?.text) {
      refreshQuote(birthData?.sunSignId ?? null);
    }

    const quoteText =
      activeQuote?.text || getAstrologyQuote(birthData?.sunSignId).text;
    setCurrentQuote(quoteText);
    setIsVisible(false);

    const fadeInTimer = setTimeout(() => setIsVisible(true), 100);
    const fadeOutTimer = setTimeout(
      () => setIsVisible(false),
      Math.max(100, duration - fade)
    );

    return () => {
      clearTimeout(fadeInTimer);
      clearTimeout(fadeOutTimer);
    };
  }, [
    welcomeOpen,
    runIntro,
    quoteTrigger,
    birthData?.sunSignId,
    activeQuote?.text,
    refreshQuote,
    duration,
    fade,
  ]);

  if (welcomeOpen || !runIntro) {
    return null;
  }

  return (
    <Html
      portal={{ current: portalRef.current }}
      style={{ pointerEvents: "none" }}
    >
      <div
        className="name-label"
        style={{
          transform: "translateX(-50%) translateY(-40vh)",
          opacity: isVisible ? 1 : 0,
          transition: `opacity ${fade}ms ease-in-out`,
          fontFamily: "'Times New Roman', serif",
          // Lowered the min font size from 2.5rem to 1.5rem for better narrow mobile fit
          fontSize: "clamp(1.5rem, 6vw, 3rem)",
          fontWeight: "400",
          textAlign: "center",
          color: "grey",
          textShadow: "2px 2px 6px rgba(0,0,0,0.7)",
          width: "90vw",
          maxWidth: "900px",
          boxSizing: "border-box", // Prevents padding from blowing out the viewport width
          padding: "0 20px",
          whiteSpace: "normal",
          wordWrap: "break-word",
          lineHeight: "1.4",
        }}
      >
        {currentQuote}
      </div>
    </Html>
  );
};

export default IntroQuote;
