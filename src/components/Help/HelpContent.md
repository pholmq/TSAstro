# Welcome to The Tychosium Astro

**The Tychosium Astro** (`tsastro.tychos.space`) is an interactive 3D astrology and celestial mechanics application built on **The Tychosium** 3D solar system simulator. Instead of flattening the sky onto a 2D paper wheel, it places you inside a real-time 3D Euclidean solar system so you can see how the **Tropical Zodiac**, **planetary aspects**, **star signs**, and **Earth-centered sky** align in space at your exact moment of birth—or at any moment in history or the future.

---

## How the App Works

### 1. Welcome Dialog & Birth Moment Initialization
When you open the app, the Welcome Dialog asks you to either **enter your birth date & time** or **log in** to a saved profile:
- **Birth Date & Local Time → UTC Epoch:** Your birth date, birth time (defaulting to `12:00` if unknown), and timezone offset are converted into **UTC** and mapped to the exact astronomical **Julian Day** (`JD`) in the simulator.
- **Instant Sky Alignment:** Submitting immediately sets the 3D solar system clock to your birth moment, activates the **3D Tropical Zodiac ring** around Earth, and pauses time so you can examine your natal sky.
- **Star-Sign Quote Intro:** As the camera flies in, a curated astrology quote tailored to your **Sun Sign** fades across the sky.
- **Local Accounts & Saved Profiles:** Profiles you create are saved locally in your browser (`localStorage`), allowing instant one-click login or optional passcode protection with no external account or server required.

### 2. How Planetary Placements & Zodiac Signs Are Calculated
- **Geocentric Ecliptic Frame:** Every planet's position (`Sun`, `Moon`, `Mercury`, `Venus`, `Mars`, `Jupiter`, `Saturn`, `Uranus`, `Neptune`, `Pluto`) is read from its true physical 3D position relative to **Earth's un-tilted ecliptic plane** (unscaling any visual display multipliers such as the Moon's orbit scale).
- **Exact Cardinal Alignment:** The 3D **Tropical Zodiac** ring aligns degree-for-degree with the equinoxes and solstices:
  - **0° Aries (♈):** Vernal Equinox (`+Z`)
  - **0° Cancer (♋):** Summer Solstice (`+X`)
  - **0° Libra (♎):** Autumnal Equinox (`-Z`)
  - **0° Capricorn (♑):** Winter Solstice (`-X`)
- **Degrees & Signs:** Each 30° sector corresponds to one of the 12 Tropical Zodiac signs (`0°00'` to `29°59'`), updated live as you step or play through time.

### 3. What Are the Colored Lines in 3D? (Planetary Aspects)
The colored lines connecting planets in 3D are **Planetary Aspect Lines**—they highlight exact geometric angles between pairs of planets **as viewed from Earth** (geocentric longitude separation). Because inner planets (`Sun`, `Mercury`, `Venus`, `Mars`) sit close to Earth at the center of the view, multiple aspect lines connecting to outer planets naturally converge toward the inner solar system.

Each line carries a floating pill badge at its midpoint (e.g., `△ Trine 120° · Sun–Jupiter`) and is color-coded by aspect type:
- **Gold (`☌` Conjunction, 0° ± 8°):** Two bodies aligned in the same direction from Earth — unified, concentrated energy.
- **Sky Blue (`⚹` Sextile, 60° ± 6°):** Cooperative angle — creative opportunity and flow.
- **Crimson (`□` Square, 90° ± 7°):** Right-angle tension — dynamic friction and catalytic action.
- **Emerald (`△` Trine, 120° ± 7°):** Harmonious triangle angle — effortless resonance and support.
- **Amber-Orange (`☍` Opposition, 180° ± 8°):** Opposite sides of Earth — polarity, awareness, and balance.

**Inspecting or hiding 3D lines:**
- Use the **3D Lines: Planetary Aspects** key in the top-left **Birth Chart HUD** to toggle lines/labels on or off, or click any `☌ 0°`, `⚹ 60°`, `□ 90°`, `△ 120°`, `☍ 180°` chip to filter individual aspect colors.
- Open the **Aspects** tab and **hover or click** any aspect row to highlight that line and reveal its **Earth-centered sightlines** (showing the exact angle radiating from Earth).
- You can also toggle **3D Aspect Lines** and **Aspect Line Labels** anytime in the top-right menu under **Stars & Helpers**.

### 4. Rising Sign (Ascendant) & Whole-Sign Houses
If you provide an optional **Birth Location** (via the city presets or custom Latitude/Longitude under *More options* in the Welcome Dialog):
- The app computes **Greenwich Mean Sidereal Time (GMST)** and **Local Sidereal Time (LST)** from your Julian Day and longitude, then derives your **Ascendant (Rising Sign)** ecliptic longitude.
- Each planet is assigned to its **Whole-Sign House (`H1`–`H12`)** relative to your Rising Sign.

---

## Using the Interface

### Natal Chart Panel (Top-Left)
- **Big Three Header:** Displays your **Sun Sign**, **Moon Sign**, and **Rising Sign** (when location is provided), plus whether you are viewing your **Natal Chart** or **Live / Transit Sky**.
- **My Birth Chart:** Instantly jumps the 3D simulator back to your exact birth date and time.
- **Live Now:** Jumps to the current UTC date and time so you can compare live transits against the zodiac.
- **Switch / Edit:** Re-opens the Welcome Dialog to edit your birth data, add a location, or switch profiles.
- **Planets Tab:** Lists all 10 bodies with their sign glyph, degree, and house. **Click any planet** to focus the 3D camera on it.
- **Aspects Tab & 3D Lines Key:** Lists every active aspect with its exact orb, provides clickable color filters (`☌ 0°`, `⚹ 60°`, `□ 90°`, `△ 120°`, `☍ 180°`) plus **Lines On/Off** and **Labels On/Off** toggles, and lets you hover or click any aspect to highlight its 3D line and Earth-centered angle rays.
- **Star Sign Wisdom:** Displays your star sign's quote with a **New quote** button to cycle through astrology wisdom.
- **Collapse / Expand:** Collapse into the compact **`✦ Birth Chart`** pill whenever you want an unobstructed 3D view.

### Time & Simulation Controls (Top-Right)
- **Reset:** Restores the simulator to the J2000 Summer Solstice epoch (`2000-06-21`).
- **Now:** Jumps to the current UTC date and time.
- **Play / Pause (`▶` / `⏸`) & Step (`⏮` / `⏭`):** Animate or step smoothly forward and backward through time to watch transits, retrogrades, and aspect formations unfold in 3D.
- **Date, Time (UTC), & Julian Day:** Enter any date or time manually and press `Enter` to jump directly to it.

### Main Menu Folders (Top-Right)
- **Controls:** Toggle `Actual planet sizes`, `Planet camera` (view the sky from Earth's surface or another planet), `Camera follow`, `Labels`, `Search` (find any of 9,000+ stars or planets), `Positions` (RA/Dec/Distance/Elongation), and `Ephemerides`.
- **Trace:** Draw 3D orbital paths and retrograde loops over time.
- **Planets & Orbits:** Adjust planet scaling, orbit visibility, line width, directional arrows, and polar axes.
- **Stars & Helpers:** Toggle `Stars` (Bright Star Catalogue), `Constellations` (H.A. Rey patterns), `Equinoxes & Solstices`, `Sidereal Zodiac`, `Tropical Zodiac`, `3D Aspect Lines`, `Aspect Line Labels`, and `Sphere & Zodiac size`.

---

## Mouse & Keyboard Navigation
- **Rotate Camera:** Left-Click + Drag
- **Zoom:** Mouse Scroll Wheel
- **Pan:** Right-Click + Drag
- **Focus Planet:** Double-click a planet in 3D or click it in the **Planets** tab
- **Inspect Body:** Hover over any celestial body to see its live coordinates
- **Help (`?`):** Re-open this guide anytime from the top-right menu
