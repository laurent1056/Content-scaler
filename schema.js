// schema.js — Default values, validation rules, and project.json structure

const SCHEMA = {
  voices: [
    { id: "WzSkyne6fIohJ1t1qnJC", name: "Laurent C", description: "Deep, authoritative male" },
    { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel",    description: "Clear, warm female" },
    { id: "ErXwobaYiN019PkySvjV", name: "Antoni",    description: "Young, energetic male" },
    { id: "EXAVITQu4vr4xnSDxMaL", name: "Bella",     description: "Soft, calming female" },
    { id: "TxGEqnHWrfWFTfGW9XjX", name: "Josh",      description: "Resonant storytelling male" },
  ],

  formats: [
    { id: "tiktok",    label: "TikTok / Shorts",    ratio: "9:16",  width: 1080, height: 1920, default: true },
    { id: "youtube",   label: "YouTube",             ratio: "16:9",  width: 1920, height: 1080 },
    { id: "square",    label: "Instagram Square",    ratio: "1:1",   width: 1080, height: 1080 },
    { id: "portrait",  label: "Instagram Portrait",  ratio: "4:5",   width: 1080, height: 1350 },
    { id: "custom",    label: "Custom",              ratio: "custom", width: 1080, height: 1920 },
  ],

  imageProviders: [
    { id: "gemini", label: "Gemini (Google)", note: "Free tier available" },
    { id: "fal",    label: "Fal.ai Flux Pro", note: "Highest quality" },
    { id: "openai", label: "OpenAI DALL-E 3", note: "" },
  ],

  timezones: [
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "America/Toronto",
    "Europe/London",
    "Europe/Paris",
    "Asia/Tokyo",
    "Australia/Sydney",
  ],

  defaults: {
    project: {
      slug: "",
      display_name: "DAILY BIBLE STUDY SERIES",
      handle: "@BibleStudyDaily",
    },
    branding: {
      series_label: "DAILY BIBLE STUDY",
      notes_prefix: "CCC",
      divider_symbol: "◆",
      end_symbol: "✝",
    },
    colors: {
      accent_bright: "#ffd264",
      panel_bg: "#05030c",
    },
    audio: {
      voice_id: "WzSkyne6fIohJ1t1qnJC",
      voice_name: "Laurent C",
      music_enabled: true,
      music_prompt: "Gregorian chant, sacred choir, soft organ, peaceful and reverent, instrumental only, no lyrics, ambient background music",
    },
    scheduling: {
      timezone: "America/New_York",
      morning: "07:00",
      midday: "12:00",
      evening: "20:00",
    },
  },

  requiredColumns: ["day", "post_num", "slot", "topic", "hook", "teaching", "image_prompt"],
  optionalColumns: ["notes", "hashtags", "group_level1", "group_level2"],

  validation: {
    slug: /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/,
  },
};

/**
 * Build the final project.json from wizard state.
 * @param {object} state — collected form values
 * @returns {object} — the complete project config
 */
function buildProjectJson(state) {
  const fmt = SCHEMA.formats.find(f => f.id === state.formatId) || SCHEMA.formats[0];
  const imgW = state.formatId === "custom" ? (parseInt(state.customWidth) || 1080) : fmt.width;
  const imgH = state.formatId === "custom" ? (parseInt(state.customHeight) || 1920) : fmt.height;

  const accentHex = state.accentBright || SCHEMA.defaults.colors.accent_bright;
  const panelHex  = state.panelBg     || SCHEMA.defaults.colors.panel_bg;

  function hexToRgb(hex) {
    const clean = hex.replace("#", "");
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return [r, g, b];
  }

  const accentRgb = hexToRgb(accentHex);
  const panelRgb  = hexToRgb(panelHex);

  // Build column index mapping
  const columns = {};
  const columnLabels = {};
  const allCols = [...SCHEMA.requiredColumns, ...SCHEMA.optionalColumns];
  allCols.forEach(field => {
    const val = state.columnMapping?.[field];
    if (val !== undefined && val !== "" && val !== "skip") {
      const idx = parseInt(val);
      if (!isNaN(idx)) columns[field] = idx;
    }
  });

  // Parse slot times
  function parseTime(t) {
    const [h, m] = (t || "07:00").split(":").map(Number);
    return [h || 0, m || 0];
  }

  const slotTimes = {
    morning: parseTime(state.morning || SCHEMA.defaults.scheduling.morning),
    midday:  parseTime(state.midday  || SCHEMA.defaults.scheduling.midday),
    evening: parseTime(state.evening || SCHEMA.defaults.scheduling.evening),
  };

  return {
    project: {
      name:        state.slug         || "",
      display_name: state.displayName || "",
      total_posts: 0,
      total_days:  0,
    },
    spreadsheet: {
      path:          state.fileName   || "<filename.xlsx>",
      sheet_name:    state.sheetName  || "",
      columns,
      column_labels: columnLabels,
    },
    branding: {
      series_label:   state.seriesLabel   || SCHEMA.defaults.branding.series_label,
      notes_prefix:   state.notesPrefix   || SCHEMA.defaults.branding.notes_prefix,
      handle:         state.handle        || SCHEMA.defaults.project.handle,
      divider_symbol: state.dividerSymbol || SCHEMA.defaults.branding.divider_symbol,
      end_symbol:     state.endSymbol     || SCHEMA.defaults.branding.end_symbol,
    },
    visual: {
      image_width:  imgW,
      image_height: imgH,
      colors: {
        accent_bright:  accentRgb,
        accent_mid:     [Math.round(accentRgb[0]*0.78), Math.round(accentRgb[1]*0.74), Math.round(accentRgb[2]*0.24)],
        body_text:      [248, 238, 200],
        title_text:     [255, 255, 255],
        secondary_text: [220, 210, 190],
        panel_bg:       panelRgb,
      },
      font_sizes: {
        title_large:   68,
        body_bold:     42,
        body_regular:  30,
        label:         26,
        small:         22,
      },
      layout: {
        top_bar_height:          155,
        panel_start_fraction:    0.48,
        gradient_start_fraction: 0.45,
        gradient_end_fraction:   0.60,
        gradient_alpha:          230,
        vignette_margin_px:      200,
        vignette_max_alpha:      110,
        text_margin_px:          80,
        bottom_chrome_offset:    90,
      },
    },
    audio: {
      voice_id:        state.voiceId        || SCHEMA.defaults.audio.voice_id,
      voice_name:      state.voiceName      || SCHEMA.defaults.audio.voice_name,
      model_id:        "eleven_turbo_v2",
      output_format:   "mp3_44100_128",
      music_enabled:   state.musicEnabled   ?? SCHEMA.defaults.audio.music_enabled,
      music_prompt:    state.musicPrompt    || SCHEMA.defaults.audio.music_prompt,
      music_duration_ms: 90000,
      music_volume_db: -18,
      script_template: "{topic}. {hook}. {teaching}",
    },
    image: {
      provider: state.imageProvider || "gemini",
      fal: {
        model:            "fal-ai/flux-pro/v1.1",
        safety_tolerance: "5",
      },
      openai: {
        model:   "dall-e-3",
        quality: "standard",
      },
      gemini: {
        model: "gemini-3.1-flash-image-preview",
      },
    },
    output: {
      base_dir:            "output",
      bg_cache_subdir:     "_bg_cache",
      flat_videos_subdir:  "videos",
      compiled_subdir:     "compiled",
    },
    video: {
      framerate:      30,
      video_codec:    "libx264",
      preset:         "fast",
      audio_codec:    "aac",
      audio_bitrate:  "128k",
      pix_fmt:        "yuv420p",
      spacer_duration_s: 1,
    },
    scheduling: {
      timezone:   state.timezone || SCHEMA.defaults.scheduling.timezone,
      slot_times: slotTimes,
    },
  };
}

/**
 * Validate the project slug.
 */
function validateSlug(slug) {
  if (!slug) return "Slug is required.";
  if (!SCHEMA.validation.slug.test(slug)) {
    return "Slug must be lowercase letters, numbers, and hyphens only (no leading/trailing hyphens).";
  }
  return null;
}
