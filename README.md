[![make.fun · threejs-fps-01](https://make.fun/badge/threejs-fps-01.svg)](https://make.fun/bounty/threejs-fps-01?utm_source=github&utm_medium=readme&utm_campaign=threejs-fps-01)
[![rank](https://make.fun/badge/threejs-fps-01/Sipalingtesnet/threejs-fps-01-entry-v2/rank.svg)](https://make.fun/bounty/threejs-fps-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=threejs-fps-01)
[![reward](https://make.fun/badge/threejs-fps-01/Sipalingtesnet/threejs-fps-01-entry-v2/reward.svg)](https://make.fun/bounty/threejs-fps-01/reward?utm_source=github&utm_medium=readme&utm_campaign=threejs-fps-01)

# TIDEWATCH Tactical FPS

TideWatch Harbour is a tactical first-person shooter set in a dark industrial port facility. Attackers must plant and detonate the tactical charge at Site A or Site B, while defenders hold perimeter choke points and retake sites.

## Controls
- **WASD**: Move
- **Mouse**: Look / Aim
- **Left Click**: Fire weapon
- **R**: Reload
- **B**: Open Buy Menu
- **Keys 1-4**: Select Weapons (KR-12, Stingray-9, Deadeye-50, P12)
- **G**: Throw Tideburst HE Grenade

## Features
- Fully synthesized WebAudio soundscape (gunshots, reloads, explosions, foghorns)
- 4 Enemy bots and 2 Friendly AI escort bots with waypoint patrol, vision cones, and engagement states
- 15s Buy Phase economy system (+300 kill, +3250 win bonus)
- AABB collision maps and realistic first-person weapon spread

## How to Run
1. Install dependencies and run the development server:
   ```bash
   node serve.ts --port 8080
   ```
2. Open `http://localhost:8080` in your browser.

## How to Build Dossier
```bash
MAKEFUN_OUTPUT_DIR=out node main.ts
```
