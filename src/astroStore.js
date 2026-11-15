import { create } from "zustand";
import { persist } from "zustand/middleware";
import { dateTimeToPos } from "./utils/time-date-functions";
import { getSunSignFromDate, localToUtcDateTime } from "./utils/astrology";
import { getAstrologyQuote } from "./data/astrologyQuotes";

function toOptionalNumber(val) {
  if (val === "" || val === null || val === undefined) return null;
  const n = Number(val);
  return Number.isFinite(n) ? n : null;
}

function extractMonthDay(birthDate) {
  const str = String(birthDate || "").trim();
  const parts = str.startsWith("-") ? str.slice(1).split("-") : str.split("-");
  return {
    month: Number(parts[1] || 1),
    day: Number(parts[2] || 1),
  };
}

function computeNatalSession(birthDate, birthTime, tzOffsetMinutes) {
  const safeTime = birthTime && String(birthTime).trim() ? birthTime : "12:00:00";
  const offset = Number(tzOffsetMinutes ?? 0);
  const { utcDate, utcTime } = localToUtcDateTime(birthDate, safeTime, offset);
  const natalPos = dateTimeToPos(utcDate, utcTime);
  const { month, day } = extractMonthDay(birthDate);
  const sunSign = getSunSignFromDate(month, day);
  return {
    natalPos,
    sunSignId: sunSign ? sunSign.id : null,
  };
}

function createProfileId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `profile-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const useAstroStore = create(
  persist(
    (set, get) => ({
      profiles: [],
      activeProfileId: null,
      welcomeOpen: true,
      natalPos: null,
      birthData: null,
      chartSnapshot: null,
      showNatalPanel: false,
      quoteTrigger: 0,
      activeQuote: null,
      visibleAspectTypes: {
        conjunction: true,
        sextile: true,
        square: true,
        trine: true,
        opposition: true,
      },
      highlightedAspectKey: null,

      setWelcomeOpen: (v) => set({ welcomeOpen: Boolean(v) }),
      setShowNatalPanel: (v) => set({ showNatalPanel: Boolean(v) }),
      setChartSnapshot: (snapshot) => set({ chartSnapshot: snapshot }),
      setHighlightedAspectKey: (key) => set({ highlightedAspectKey: key }),
      toggleAspectType: (type) =>
        set((state) => ({
          visibleAspectTypes: {
            ...state.visibleAspectTypes,
            [type]: !state.visibleAspectTypes[type],
          },
        })),
      bumpQuoteTrigger: () =>
        set((state) => ({ quoteTrigger: state.quoteTrigger + 1 })),

      refreshQuote: (signId) =>
        set((state) => {
          const targetSignId = signId ?? state.birthData?.sunSignId ?? null;
          return {
            activeQuote: getAstrologyQuote(
              targetSignId,
              state.activeQuote?.text ?? null
            ),
          };
        }),

      loginOrCreateProfile: ({
        mode = "create",
        name = "",
        email = "",
        passcode = "",
        birthDate,
        birthTime = "12:00",
        tzOffsetMinutes = 0,
        birthCity = "UTC",
        birthLat = null,
        birthLon = null,
        saveProfile = false,
      }) => {
        const cleanTime =
          birthTime && String(birthTime).trim() ? String(birthTime).trim() : "12:00";
        const cleanOffset = Number(tzOffsetMinutes ?? 0);
        const cleanLat = toOptionalNumber(birthLat);
        const cleanLon = toOptionalNumber(birthLon);
        const cleanName = String(name || "").trim() || "Tychosium Astro";
        const cleanEmail = String(email || "").trim();
        const cleanPasscode = String(passcode || "");
        const cleanCity = String(birthCity || "").trim() || "UTC";

        const { natalPos, sunSignId } = computeNatalSession(
          birthDate,
          cleanTime,
          cleanOffset
        );

        const nextBirthData = {
          name: cleanName,
          birthDate,
          birthTime: cleanTime,
          tzOffsetMinutes: cleanOffset,
          birthCity: cleanCity,
          birthLat: cleanLat,
          birthLon: cleanLon,
          sunSignId,
        };

        let savedProfile = null;
        const shouldPersistProfile =
          saveProfile === true || (saveProfile !== false && mode === "create");

        if (shouldPersistProfile) {
          const now = new Date().toISOString();
          const existingProfiles = get().profiles;
          const existingIndex = cleanEmail
            ? existingProfiles.findIndex(
                (p) =>
                  p.email &&
                  p.email.toLowerCase() === cleanEmail.toLowerCase()
              )
            : -1;

          if (existingIndex >= 0) {
            const existing = existingProfiles[existingIndex];
            savedProfile = {
              ...existing,
              name: cleanName,
              email: cleanEmail,
              passcode: cleanPasscode || existing.passcode || "",
              birthDate,
              birthTime: cleanTime,
              tzOffsetMinutes: cleanOffset,
              birthCity: cleanCity,
              birthLat: cleanLat,
              birthLon: cleanLon,
              sunSignId,
              updatedAt: now,
            };
            const nextProfiles = [...existingProfiles];
            nextProfiles[existingIndex] = savedProfile;
            set({
              profiles: nextProfiles,
              activeProfileId: savedProfile.id,
            });
          } else {
            savedProfile = {
              id: createProfileId(),
              name: cleanName,
              email: cleanEmail,
              passcode: cleanPasscode,
              birthDate,
              birthTime: cleanTime,
              tzOffsetMinutes: cleanOffset,
              birthCity: cleanCity,
              birthLat: cleanLat,
              birthLon: cleanLon,
              sunSignId,
              createdAt: now,
              updatedAt: now,
            };
            set({
              profiles: [savedProfile, ...existingProfiles],
              activeProfileId: savedProfile.id,
            });
          }
        } else {
          set({ activeProfileId: null });
        }

        const nextQuote = getAstrologyQuote(sunSignId);

        set({
          birthData: nextBirthData,
          natalPos,
          activeQuote: nextQuote,
          welcomeOpen: false,
          showNatalPanel: true,
        });

        return {
          natalPos,
          sunSignId,
          profile: savedProfile,
        };
      },

      loginExistingProfile: (profileId, passcode = "") => {
        const profile = get().profiles.find((p) => p.id === profileId);
        if (!profile) {
          return { ok: false, error: "Profile not found." };
        }

        if (profile.passcode && profile.passcode !== String(passcode ?? "")) {
          return { ok: false, error: "Incorrect passcode." };
        }

        const { natalPos, sunSignId } = computeNatalSession(
          profile.birthDate,
          profile.birthTime,
          profile.tzOffsetMinutes
        );

        const nextBirthData = {
          name: profile.name,
          birthDate: profile.birthDate,
          birthTime: profile.birthTime,
          tzOffsetMinutes: profile.tzOffsetMinutes,
          birthCity: profile.birthCity,
          birthLat: profile.birthLat,
          birthLon: profile.birthLon,
          sunSignId,
        };

        set({
          activeProfileId: profile.id,
          birthData: nextBirthData,
          natalPos,
          activeQuote: getAstrologyQuote(sunSignId),
          welcomeOpen: false,
          showNatalPanel: true,
        });

        return { ok: true, natalPos, sunSignId };
      },

      deleteProfile: (profileId) =>
        set((state) => ({
          profiles: state.profiles.filter((p) => p.id !== profileId),
          activeProfileId:
            state.activeProfileId === profileId ? null : state.activeProfileId,
        })),
    }),
    {
      name: "tsastro-profiles-v1",
      partialize: (state) => ({
        profiles: state.profiles,
      }),
    }
  )
);
