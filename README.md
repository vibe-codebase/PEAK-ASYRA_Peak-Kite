# Peak Kite

By **PEAK ASYRA** · package `com.peakasyra.peakkite` · Expo owner `899-903`.

A two-handed flying game for Android: a stunt kite on two lines, flown through a festival sky to ring every wind bell.

**How it plays.**
- Hold the left side of the screen to pull the left line, and the kite turns left. Hold the right side and it turns right. Let go and it flies straight.
- The kite always flies forward, on the end of its lines, inside the wind window: a half-dome of sky in front of the flyer. It is fastest in the middle, where the wind pulls hardest, and slows toward the edge, where it slides along the rim.
- Touch the ground, a crow or a rival kite and the kite falls. You have three.
- Ring every glass wind bell (fūrin). Numbered bells ring a tune and must be taken in order.

**Content.**
- 24 skies in three chapters:
  - **Spring Fields:** a soft wind over rice terraces, pines on the hills, swaying bells and a first tune.
  - **Festival Day:** crows, rival kites circling on their own lines, and gusts over the tiled roofs.
  - **Lantern Night:** rain clouds that steal the wind, owls, and lantern bells above the harbour.
- Par is the time of a steady built-in pilot. Every sky is flown by it in the tests.
- **Stars are kites:** three within half again par, two within 2.2 times, and a fall costs one.

**Look and sound.**
- Visuals:
  - Three skies with drifting clouds, the sun or moon, and stars at night.
  - Rice terraces with a pagoda, festival rooftops with banners, and the harbour with lantern boats.
  - A painted delta kite whose two lines sag as it slows, with a ribbon tail that streams behind it.
  - Glass bells with paper strips that fly off when they ring.
- Sound:
  - A festival flute and a koto, with larks, taiko drums or crickets.
  - Wind in the lines that rises with the kite's speed.
  - Bells that play each sky's tune.

## Structure

| Path | What it is |
| --- | --- |
| `web/src/game/sim.ts` | The wind window, the kite's flight, bells, crows, rival kites, rain clouds, and the steady pilot |
| `web/src/game/levels.ts` | The 24 skies and their par times |
| `web/tools/par.ts` | Flies every sky with the pilot and prints par |
| `src/native/` | Expo WebView shell |

```bash
npm install && npm run web:install
npm run web:test     # 34 tests
npm run build:game && npm run validate:assets && npm run android
```

## Release builds

The Android release is configured for Google Play: target and compile SDK 36, R8 minification and resource shrinking, a non-debuggable release build, no Internet permission, and the game served offline from the app's own assets. Builds run on EAS; `eas.json` has two profiles:

```bash
npm install -g eas-cli && eas login
eas init                     # once: links this folder to your Expo project
npm run eas:apk              # preview profile: a signed APK for testing on devices
npm run eas:aab              # production profile: an AAB for Google Play (versionCode auto-increments)
```
