# Skoolit Katie Campaign

Reusable source project for a 12-video Instagram Reels pilot aimed at mothers managing school and activity logistics.

## Content rotation

Every publishing day contains three distinct posts:

1. **Product explainer** — a short, benefit-led explanation of what gets easier with Skoolit.
2. **Katie story / UGC** — a first-person mom-blogger dramatization.
3. **Mom problem** — heightened problem, consequence, and Skoolit resolution.

The campaign includes four days of content: 12 scripts total, four per format.

Katie and every family scenario are dramatizations. Unshipped capabilities must be labeled `PRODUCT VISION` in rendered frames. No script represents a verified customer testimonial.

## Project structure

```text
campaigns/skoolit-katie/
├── README.md
├── BRAND-SOURCE.md
├── campaign.json
├── scripts.md
└── assets/brand/logomark.svg
pipeline/
└── validate_skoolit_campaign.py
```

Binary identity references, generated Katie scenes, paid voice output, intermediate frames, and MP4s intentionally remain local and are excluded by `.gitignore`.

## Required local assets

Before full rendering, add campaign-owned files locally:

```text
campaigns/skoolit-katie/assets/character/katie-reference-sheet.png
campaigns/skoolit-katie/assets/scenes/katie-explainer-phone.png
campaigns/skoolit-katie/assets/scenes/katie-ugc-table.png
campaigns/skoolit-katie/assets/scenes/katie-chaos-table.png
```

The scene files must preserve the approved Katie identity and use synthetic family, school, inbox, and calendar information.

## Validate the source campaign

```bash
python3 pipeline/validate_skoolit_campaign.py
```

The check confirms:

- exactly 12 videos;
- a 4/4/4 split across the three content formats;
- four beats per video;
- preview labeling for unshipped capabilities;
- UGC dramatization disclosure;
- scene-path and official-logo declarations.

## Local review artifacts

The first locally rendered review set is deliberately static-motion: voiceover, changing story cards, fades, and branded frames. Katie does not yet physically move or lip-sync. A later production phase can replace the source scenes with true generated-video/avatar clips after creative review.
