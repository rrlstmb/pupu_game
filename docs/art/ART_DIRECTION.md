# Art Direction

## Visual Position

`Shiming Bida` uses an urban comic look: bold silhouettes, exaggerated posture, dry black humor, and toy-like props. Excrement is graphic and cartoony, never wet, realistic, or anatomically detailed. Phase 22 assets are `polished_prototype`, not final production art.

## Characters

- Proportion: large readable heads, compact torsos, long gesture-driven limbs. Player and pedestrians use roughly 1:3 head-to-body proportions; the Boss is larger and staged with a wider umbrella/aura.
- Silhouette: ordinary workers are upright; phone users lean into a phone; runners have stretched limbs; umbrella users have a wide canopy; cleaners carry a broom; photographers carry a camera; streamers carry a portrait phone; guards have a cap/light; the Boss combines oversized umbrella, jewelry, and aura.
- Expression: two or three large marks, readable at gameplay distance. Anger, capture, warning, cleaning, and vulnerability add pose/icon changes rather than relying on hue alone.
- Contrast: characters use dark outlines against quieter street values. Player uses warm yellow plus blue trim; hazards use icon, motion, label, and shape in addition to color.
- Bounds: visual scale and pivot are presentation data. Authoritative NPC/player/Boss bounds remain domain-owned.

## Environments

Every level shares skyline, wall/storefront, three street lanes, and rooftop layers. Data-driven profiles vary time, weather, road/roof values, accent signs, and atmosphere. Windows, signs, drains, rooftop masonry, cover, rain, wind, market, cleanup, live-event, security, and Boss-stage elements create depth. Interactive bounce, cover, concealment, and blockade objects use stronger outlines and explicit labels; decoration must not resemble an interaction surface.

## Color And Danger Language

- Neutral world: charcoal, concrete blue/gray, brick, warm shop light.
- Interaction: cyan/cream for readable feedback; green plus cloud shape for stink/slow.
- Warning: amber plus icon/countdown; danger: red plus text/ring; camera: magenta/REC frame; security: yellow beam/eye; counterattack: red target and source cue; Boss: pink/white protection and gold vulnerability.
- Never communicate state by color alone. Use silhouette, prop, text/icon, animation, and timing.

## Poop Language

Normal is compact; sticky is stretched; jumbo is heavy; splash has satellite droplets; bouncy has elastic rings; stink carries cloud motes; split has a seam; golden has a bright rim and sparkle. Projectile scale never changes collision. Trails and impact intensity are capped and token-deduplicated.

## VFX Intensity

1. Routine: small impact/miss ring and compact popup.
2. Tactical: sticky, splash, bounce, zone, block cues.
3. Gate: umbrella/Boss gate break and short finite impact emphasis.
4. Finale: final vulnerability and one latched final-hit title card.

VFX must not cover ChargeMeter, Timer, Alert, Wind, camera/security warnings, or Boss status. No rapid flashing.

## UI

Use 8px spacing, 24px safe margins, 6px panel radius, compact monospace telemetry, and readable sans-serif commands. Panels are opaque enough to read but do not hide lanes. ChargeMeter stays right-aligned and vertical. Icons pair with text for inventory, warnings, and objectives.

## Asset Status

- `placeholder`: engineering geometry used only where a polished view is not yet built.
- `polished_prototype`: repository-owned generated vector/Graphics texture suitable for vertical-slice review.
- `final`: approved production asset with rights record. Phase 22 contains no final assets.

Unknown-source assets are forbidden from runtime. External fonts, images, video, music, and recordings are not imported.

## Prohibited

- Realistic excrement texture or gore.
- Color-only identification.
- Visual scale influencing gameplay bounds.
- VFX hiding hazards or HUD.
- Debug bounds, throw guides, prediction lines, or auto-aim in formal play.
- Rights-unknown runtime assets.
