import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useStore } from "../../store";
import { useAstroStore } from "../../astroStore";
import { BIRTH_CITY_PRESETS, getSunSignFromDate } from "../../utils/astrology";
import { isValidDate } from "../../utils/time-date-functions";
import TychosLogoIcon from "../../utils/TychosLogoIcon";
import SegmentedBirthDateInput from "./SegmentedBirthDateInput";

const BASE_UTC_OFFSETS = [
  -720, -660, -600, -570, -540, -480, -420, -360, -300, -240, -210, -180, -120,
  -60, 0, 60, 120, 180, 210, 240, 270, 300, 330, 345, 360, 390, 420, 480, 525,
  540, 570, 600, 630, 660, 720, 765, 780, 840,
];

function formatUtcOffset(minutes) {
  const m = Number(minutes) || 0;
  if (m === 0) return "UTC+0";
  const sign = m >= 0 ? "+" : "-";
  const abs = Math.abs(m);
  const hrs = Math.floor(abs / 60);
  const mins = abs % 60;
  return mins === 0
    ? `UTC${sign}${hrs}`
    : `UTC${sign}${hrs}:${String(mins).padStart(2, "0")}`;
}

function getBrowserTzOffsetMinutes() {
  return -(new Date().getTimezoneOffset() || 0);
}

function parseYearMonthDay(dateStr) {
  const trimmed = String(dateStr || "").trim();
  if (!trimmed) return null;
  const match = trimmed.match(/^(-?\d{1,6})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
}

function stopInputKeyPropagation(e) {
  e.stopPropagation();
}

const ELEMENT_COLORS = {
  Fire: {
    bg: "rgba(245, 158, 11, 0.14)",
    border: "rgba(251, 191, 36, 0.4)",
    text: "#FCD34D",
  },
  Earth: {
    bg: "rgba(52, 211, 153, 0.14)",
    border: "rgba(52, 211, 153, 0.4)",
    text: "#6EE7B7",
  },
  Air: {
    bg: "rgba(96, 165, 250, 0.14)",
    border: "rgba(96, 165, 250, 0.4)",
    text: "#93C5FD",
  },
  Water: {
    bg: "rgba(167, 139, 250, 0.14)",
    border: "rgba(167, 139, 250, 0.4)",
    text: "#C4B5FD",
  },
};

const STYLES = {
  backdrop: {
    position: "fixed",
    inset: 0,
    zIndex: 2147483647,
    background: "rgba(0, 0, 0, 0.72)",
    backdropFilter: "blur(3px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "16px",
    boxSizing: "border-box",
    fontFamily: "Arial, Helvetica, sans-serif",
  },
  card: {
    width: "100%",
    maxWidth: "420px",
    maxHeight: "calc(100vh - 32px)",
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#111827",
    color: "#ffffff",
    borderRadius: "6px",
    border: "1px solid #374151",
    boxShadow: "0 4px 14px rgba(0, 0, 0, 0.55)",
    overflow: "hidden",
  },
  header: {
    padding: "10px 14px",
    borderBottom: "1px solid #1f2937",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#181c20",
    flexShrink: 0,
  },
  body: {
    padding: "14px 16px 16px",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  label: {
    display: "block",
    fontSize: "11px",
    fontWeight: 600,
    color: "#d1d5db",
    marginBottom: "4px",
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "7px 9px",
    borderRadius: "4px",
    border: "1px solid #4b5563",
    backgroundColor: "#374151",
    color: "#ffffff",
    fontSize: "13px",
    outline: "none",
    colorScheme: "dark",
  },
  compactInput: {
    width: "100%",
    boxSizing: "border-box",
    padding: "6px 8px",
    borderRadius: "4px",
    border: "1px solid #4b5563",
    backgroundColor: "#374151",
    color: "#ffffff",
    fontSize: "12px",
    outline: "none",
    colorScheme: "dark",
  },
  goldBtn: {
    width: "100%",
    padding: "9px 14px",
    borderRadius: "4px",
    border: "1px solid #3b82f6",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    fontSize: "13px",
    fontWeight: 700,
    cursor: "pointer",
  },
  subtleBtn: {
    padding: "4px 9px",
    borderRadius: "4px",
    border: "none",
    backgroundColor: "#374151",
    color: "#ffffff",
    fontSize: "11px",
    fontWeight: 600,
    cursor: "pointer",
  },
};

function activateNatalChartScene(natalPos) {
  const store = useStore.getState();
  store.posRef.current = natalPos;
  if (typeof store.setRun === "function") {
    store.setRun(false);
  } else {
    useStore.setState({ run: false });
  }
  store.updateAC();
  store.setTropicalZodiac(true);
  store.setRunIntro(true);

  const astro = useAstroStore.getState();
  astro.setWelcomeOpen(false);
  astro.setShowNatalPanel(true);
  astro.bumpQuoteTrigger();
}

/**
 * Uncluttered Welcome modal for entering birth date & time, with optional
 * profile saving, birth place, and timezone inside a collapsible section.
 */
const WelcomeDialog = () => {
  const welcomeOpen = useAstroStore((s) => s.welcomeOpen);
  const profiles = useAstroStore((s) => s.profiles);
  const birthData = useAstroStore((s) => s.birthData);
  const setWelcomeOpen = useAstroStore((s) => s.setWelcomeOpen);
  const loginOrCreateProfile = useAstroStore((s) => s.loginOrCreateProfile);
  const deleteProfile = useAstroStore((s) => s.deleteProfile);

  // Essential inputs (always visible)
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("12:00");

  // Extra options (collapsed by default)
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [name, setName] = useState("");
  const [tzOffsetMinutes, setTzOffsetMinutes] = useState(() =>
    getBrowserTzOffsetMinutes()
  );
  const [selectedCityPreset, setSelectedCityPreset] = useState("");
  const [birthCity, setBirthCity] = useState("");
  const [birthLat, setBirthLat] = useState("");
  const [birthLon, setBirthLon] = useState("");
  const [saveProfile, setSaveProfile] = useState(true);
  const [email, setEmail] = useState("");
  const [passcode, setPasscode] = useState("");
  const [selectedSavedProfileId, setSelectedSavedProfileId] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!welcomeOpen) return;
    setFormError("");
    setSelectedSavedProfileId("");

    if (birthData) {
      setName(
        birthData.name && birthData.name !== "Tychosium Astro"
          ? birthData.name
          : ""
      );
      setBirthDate(birthData.birthDate || "");
      setBirthTime(birthData.birthTime || "12:00");
      setTzOffsetMinutes(
        birthData.tzOffsetMinutes ?? getBrowserTzOffsetMinutes()
      );
      const hasCoords =
        birthData.birthLat != null && birthData.birthLon != null;
      setBirthCity(hasCoords ? birthData.birthCity || "" : "");
      setBirthLat(hasCoords ? String(birthData.birthLat) : "");
      setBirthLon(hasCoords ? String(birthData.birthLon) : "");
      setSelectedCityPreset("");
    }
  }, [welcomeOpen, birthData]);

  const offsetOptions = useMemo(() => {
    const set = new Set(BASE_UTC_OFFSETS);
    set.add(Number(tzOffsetMinutes) || 0);
    return Array.from(set).sort((a, b) => a - b);
  }, [tzOffsetMinutes]);

  const previewSunSign = useMemo(() => {
    const parsed = parseYearMonthDay(birthDate);
    if (!parsed || !isValidDate(birthDate)) return null;
    return getSunSignFromDate(parsed.month, parsed.day);
  }, [birthDate]);

  if (!welcomeOpen) return null;

  const handleLoadSavedProfile = (e) => {
    const id = e.target.value;
    setSelectedSavedProfileId(id);
    const profile = profiles.find((p) => p.id === id);
    if (!profile) return;

    setName(
      profile.name && profile.name !== "Tychosium Astro" ? profile.name : ""
    );
    setBirthDate(profile.birthDate || "");
    setBirthTime(profile.birthTime || "12:00");
    setTzOffsetMinutes(
      profile.tzOffsetMinutes ?? getBrowserTzOffsetMinutes()
    );
    const hasCoords = profile.birthLat != null && profile.birthLon != null;
    setBirthCity(hasCoords ? profile.birthCity || "" : "");
    setBirthLat(hasCoords ? String(profile.birthLat) : "");
    setBirthLon(hasCoords ? String(profile.birthLon) : "");
    setEmail(profile.email || "");
    setSelectedCityPreset("");
  };

  const handleCityPresetChange = (e) => {
    const cityVal = e.target.value;
    setSelectedCityPreset(cityVal);
    if (!cityVal) return;
    const preset = BIRTH_CITY_PRESETS.find((c) => c.city === cityVal);
    if (preset) {
      setBirthCity(preset.city);
      setBirthLat(String(preset.lat));
      setBirthLon(String(preset.lon));
      setTzOffsetMinutes(preset.tzOffsetMinutes);
    }
  };

  const handleClearLocation = () => {
    setSelectedCityPreset("");
    setBirthCity("");
    setBirthLat("");
    setBirthLon("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError("");

    const trimmedDate = String(birthDate || "").trim();
    if (!trimmedDate || !isValidDate(trimmedDate)) {
      setFormError("Please enter a valid birth date.");
      return;
    }

    const latTrim = String(birthLat).trim();
    const lonTrim = String(birthLon).trim();
    if ((latTrim !== "" && lonTrim === "") || (latTrim === "" && lonTrim !== "")) {
      setFormError("Please provide both Latitude and Longitude, or clear location.");
      return;
    }
    if (latTrim !== "") {
      const latNum = Number(latTrim);
      const lonNum = Number(lonTrim);
      if (!Number.isFinite(latNum) || latNum < -90 || latNum > 90) {
        setFormError("Latitude must be between -90 and 90.");
        return;
      }
      if (!Number.isFinite(lonNum) || lonNum < -180 || lonNum > 180) {
        setFormError("Longitude must be between -180 and 180.");
        return;
      }
    }

    const effectiveTime = birthTime && birthTime.trim() ? birthTime : "12:00";
    const { natalPos } = loginOrCreateProfile({
      mode: "create",
      name,
      email: saveProfile ? email : "",
      passcode: saveProfile ? passcode : "",
      birthDate: trimmedDate,
      birthTime: effectiveTime,
      tzOffsetMinutes: Number(tzOffsetMinutes),
      birthCity: latTrim !== "" ? birthCity || "Custom Location" : "",
      birthLat: latTrim !== "" ? Number(latTrim) : null,
      birthLon: lonTrim !== "" ? Number(lonTrim) : null,
      saveProfile,
    });

    activateNatalChartScene(natalPos);
  };

  return createPortal(
    <div
      className="astro-welcome-modal"
      style={STYLES.backdrop}
      onMouseDown={(e) => e.stopPropagation()}
      onKeyDown={stopInputKeyPropagation}
      onKeyUp={stopInputKeyPropagation}
    >
      <div
        style={STYLES.card}
        role="dialog"
        aria-modal="true"
        aria-label="The Tychosium Astro Welcome"
      >
        {/* Header */}
        <div style={STYLES.header}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <TychosLogoIcon size={24} />
            <div>
              <div
                style={{
                  fontFamily: "Cambria, Georgia, serif",
                  fontSize: "17px",
                  fontWeight: "bold",
                  color: "#ffffff",
                  lineHeight: 1.15,
                }}
              >
                The Tychosium Astro
              </div>
              <div
                style={{
                  fontSize: "11px",
                  color: "#9ca3af",
                }}
              >
                3D Astrology &amp; Birth Chart Explorer
              </div>
            </div>
          </div>

          {birthData && (
            <button
              type="button"
              onClick={() => setWelcomeOpen(false)}
              title="Return to active chart"
              style={{
                backgroundColor: "#374151",
                border: "none",
                color: "#ffffff",
                borderRadius: "4px",
                width: "26px",
                height: "26px",
                cursor: "pointer",
                fontSize: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ✕
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} style={STYLES.body}>
          {/* Core: Birth Date & Time */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.3fr 1fr",
              gap: "10px",
            }}
          >
            <div>
              <label htmlFor="astro-birth-date-year" style={STYLES.label}>
                Birth Date
              </label>
              <SegmentedBirthDateInput
                idPrefix="astro-birth-date"
                autoFocus
                value={birthDate}
                onChange={setBirthDate}
              />
            </div>

            <div>
              <label style={STYLES.label}>Birth Time</label>
              <input
                type="time"
                value={birthTime}
                onChange={(e) => setBirthTime(e.target.value)}
                onKeyDown={stopInputKeyPropagation}
                style={STYLES.input}
              />
            </div>
          </div>

          <div
            style={{
              fontSize: "11px",
              color: "#9ca3af",
              marginTop: "-6px",
              display: "flex",
              justifyContent: "space-between",
              gap: "8px",
            }}
          >
            <span>Local time ({formatUtcOffset(tzOffsetMinutes)})</span>
            <span>Leave 12:00 if unknown</span>
          </div>

          {/* Live Sun Sign Preview */}
          {previewSunSign && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 10px",
                borderRadius: "4px",
                backgroundColor: "#181c20",
                border: "1px solid #374151",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                <span style={{ fontSize: "19px", lineHeight: 1 }}>
                  {previewSunSign.symbol}
                </span>
                <div>
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: 700,
                      color: "#ffffff",
                    }}
                  >
                    {previewSunSign.name}
                  </div>
                  <div style={{ fontSize: "11px", color: "#9ca3af" }}>
                    {previewSunSign.dateRange} · {previewSunSign.ruler}
                  </div>
                </div>
              </div>
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  padding: "3px 8px",
                  borderRadius: "4px",
                  backgroundColor: "#374151",
                  color:
                    ELEMENT_COLORS[previewSunSign.element]?.text || "#e5e7eb",
                }}
              >
                {previewSunSign.element}
              </span>
            </div>
          )}

          {profiles.length > 0 && (
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <label htmlFor="astro-saved-profile-select" style={STYLES.label}>
                  Load Profile
                </label>
                {selectedSavedProfileId && (
                  <button
                    type="button"
                    onClick={() => {
                      deleteProfile(selectedSavedProfileId);
                      setSelectedSavedProfileId("");
                    }}
                    style={{
                      ...STYLES.subtleBtn,
                      padding: "1px 6px",
                      fontSize: "10px",
                      marginBottom: "4px",
                    }}
                  >
                    Delete
                  </button>
                )}
              </div>
              <select
                id="astro-saved-profile-select"
                value={selectedSavedProfileId}
                onChange={handleLoadSavedProfile}
                onKeyDown={stopInputKeyPropagation}
                style={STYLES.input}
              >
                <option value="">Load a saved profile...</option>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {p.birthDate} {p.birthTime || "12:00"}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Collapsible Extra Options (Profile, Birth Place, Timezone) */}
          <div>
            <button
              type="button"
              onClick={() => setShowMoreOptions((v) => !v)}
              style={{
                background: "transparent",
                border: "none",
                padding: "2px 0",
                color: "#9ca3af",
                fontSize: "12px",
                fontWeight: 500,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span>{showMoreOptions ? "▾" : "▸"}</span>
              <span>
                More options (name, birth place, timezone &amp; save profile)
              </span>
            </button>

            {showMoreOptions && (
              <div
                style={{
                  marginTop: "8px",
                  padding: "10px",
                  borderRadius: "4px",
                  border: "1px solid #374151",
                  backgroundColor: "#181c20",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "8px",
                  }}
                >
                  <div>
                    <label style={STYLES.label}>Name (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Patrik"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onKeyDown={stopInputKeyPropagation}
                      style={STYLES.compactInput}
                    />
                  </div>
                  <div>
                    <label style={STYLES.label}>Timezone</label>
                    <select
                      value={Number(tzOffsetMinutes)}
                      onChange={(e) =>
                        setTzOffsetMinutes(Number(e.target.value))
                      }
                      onKeyDown={stopInputKeyPropagation}
                      style={STYLES.compactInput}
                    >
                      {offsetOptions.map((off) => (
                        <option key={off} value={off}>
                          {formatUtcOffset(off)}
                          {off === getBrowserTzOffsetMinutes() ? " (Local)" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <label style={STYLES.label}>
                      Birth Place (for Rising Sign &amp; Houses)
                    </label>
                    {(birthLat !== "" || birthLon !== "" || birthCity !== "") && (
                      <button
                        type="button"
                        onClick={handleClearLocation}
                        style={{
                          ...STYLES.subtleBtn,
                          padding: "1px 6px",
                          fontSize: "10px",
                          marginBottom: "4px",
                        }}
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <select
                    value={selectedCityPreset}
                    onChange={handleCityPresetChange}
                    onKeyDown={stopInputKeyPropagation}
                    style={STYLES.compactInput}
                  >
                    <option value="">Optional: select a city...</option>
                    {BIRTH_CITY_PRESETS.map((preset) => (
                      <option key={preset.city} value={preset.city}>
                        {preset.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "8px",
                  }}
                >
                  <div>
                    <label style={STYLES.label}>Latitude (°N)</label>
                    <input
                      type="number"
                      step="any"
                      min="-90"
                      max="90"
                      placeholder="59.33"
                      value={birthLat}
                      onChange={(e) => setBirthLat(e.target.value)}
                      onKeyDown={stopInputKeyPropagation}
                      style={STYLES.compactInput}
                    />
                  </div>
                  <div>
                    <label style={STYLES.label}>Longitude (°E)</label>
                    <input
                      type="number"
                      step="any"
                      min="-180"
                      max="180"
                      placeholder="18.07"
                      value={birthLon}
                      onChange={(e) => setBirthLon(e.target.value)}
                      onKeyDown={stopInputKeyPropagation}
                      style={STYLES.compactInput}
                    />
                  </div>
                </div>

                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "7px",
                    fontSize: "12px",
                    color: "#CBD5E1",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={saveProfile}
                    onChange={(e) => setSaveProfile(e.target.checked)}
                  />
                  Save profile in this browser
                </label>

                {saveProfile && (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "8px",
                    }}
                  >
                    <div>
                      <label style={STYLES.label}>Email (Optional)</label>
                      <input
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onKeyDown={stopInputKeyPropagation}
                        style={STYLES.compactInput}
                      />
                    </div>
                    <div>
                      <label style={STYLES.label}>Passcode (Optional)</label>
                      <input
                        type="password"
                        placeholder="PIN"
                        value={passcode}
                        onChange={(e) => setPasscode(e.target.value)}
                        onKeyDown={stopInputKeyPropagation}
                        style={STYLES.compactInput}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {formError && (
            <div
              style={{
                padding: "8px 10px",
                borderRadius: "8px",
                background: "rgba(239, 68, 68, 0.16)",
                border: "1px solid rgba(248, 113, 113, 0.45)",
                color: "#FCA5A5",
                fontSize: "12px",
              }}
            >
              {formError}
            </div>
          )}

          <button type="submit" style={STYLES.goldBtn}>
            Enter
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default WelcomeDialog;
