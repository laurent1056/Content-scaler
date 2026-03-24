// preview.js — Live canvas rendering of the video frame

const PREVIEW = (() => {
  // Canvas dimensions (scaled-down 1080×1920)
  const CANVAS_W = 270;
  const CANVAS_H = 480;
  const SCALE = CANVAS_W / 1080;

  // Full-scale layout constants (matched to schema.js layout)
  const FULL = {
    topBarH:       155,
    textMargin:     80,
    bottomChromeOffset: 90,
    dividerGap:     28,
  };

  let canvas, ctx, debounceTimer;

  function hexToRgb(hex) {
    const clean = (hex || "#05030c").replace("#", "");
    return {
      r: parseInt(clean.substring(0, 2), 16) || 0,
      g: parseInt(clean.substring(2, 4), 16) || 0,
      b: parseInt(clean.substring(4, 6), 16) || 0,
    };
  }

  function rgbStr(r, g, b, a = 1) {
    return a < 1 ? `rgba(${r},${g},${b},${a})` : `rgb(${r},${g},${b})`;
  }

  function scaleFont(fullPx) {
    return Math.round(fullPx * SCALE);
  }

  function wrapText(ctx, text, x, maxWidth, lineHeight) {
    const words = text.split(" ");
    const lines = [];
    let line = "";
    for (const word of words) {
      const test = line ? line + " " + word : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  function render(state) {
    if (!canvas || !ctx) return;

    const panelRgb = hexToRgb(state.panelBg || "#05030c");
    const accentRgb = hexToRgb(state.accentBright || "#ffd264");

    const s = SCALE;
    const margin = FULL.textMargin * s;
    const usableW = CANVAS_W - margin * 2;

    // ── Background ──────────────────────────────────────────────
    const bgGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
    bgGrad.addColorStop(0, rgbStr(panelRgb.r + 12, panelRgb.g + 8, panelRgb.b + 22));
    bgGrad.addColorStop(0.5, rgbStr(panelRgb.r, panelRgb.g, panelRgb.b));
    bgGrad.addColorStop(1, rgbStr(Math.max(0, panelRgb.r - 4), Math.max(0, panelRgb.g - 2), Math.max(0, panelRgb.b - 4)));
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Subtle vignette
    const vignetteR = Math.max(CANVAS_W, CANVAS_H) * 0.8;
    const vignette = ctx.createRadialGradient(
      CANVAS_W / 2, CANVAS_H / 2, vignetteR * 0.3,
      CANVAS_W / 2, CANVAS_H / 2, vignetteR
    );
    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(1, "rgba(0,0,0,0.45)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // ── Top bar ──────────────────────────────────────────────────
    const topBarH = FULL.topBarH * s;
    const topBarBg = ctx.createLinearGradient(0, 0, 0, topBarH);
    topBarBg.addColorStop(0, `rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},0.12)`);
    topBarBg.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = topBarBg;
    ctx.fillRect(0, 0, CANVAS_W, topBarH);

    // Series label (left)
    const seriesLabel = state.seriesLabel || "DAILY BIBLE STUDY";
    ctx.font = `700 ${scaleFont(22)}px 'Segoe UI', system-ui, sans-serif`;
    ctx.fillStyle = rgbStr(accentRgb.r, accentRgb.g, accentRgb.b);
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(seriesLabel.toUpperCase(), margin, topBarH * 0.4);

    // Post counter (right)
    ctx.font = `400 ${scaleFont(20)}px 'Segoe UI', system-ui, sans-serif`;
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.textAlign = "right";
    ctx.fillText("Post 1 of N", CANVAS_W - margin, topBarH * 0.4);

    // Handle (bottom of top bar)
    const handle = state.handle || "@YourHandle";
    ctx.font = `400 ${scaleFont(18)}px 'Segoe UI', system-ui, sans-serif`;
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.textAlign = "left";
    ctx.fillText(handle, margin, topBarH * 0.72);

    // Gold accent line
    ctx.fillStyle = rgbStr(accentRgb.r, accentRgb.g, accentRgb.b);
    ctx.fillRect(0, topBarH - 1.5 * s, CANVAS_W, 1.5 * s);

    // ── Notes reference ─────────────────────────────────────────
    let cursorY = topBarH + 14 * s;
    const notesCol = state.columnMapping?.notes;
    const hasNotes = notesCol && notesCol !== "" && notesCol !== "skip";
    if (hasNotes) {
      const prefix = state.notesPrefix || "CCC";
      ctx.font = `600 ${scaleFont(20)}px 'Segoe UI', system-ui, sans-serif`;
      ctx.fillStyle = rgbStr(accentRgb.r, accentRgb.g, accentRgb.b, 0.8);
      ctx.textAlign = "center";
      ctx.fillText(`${prefix} 26`, CANVAS_W / 2, cursorY + scaleFont(10));
      cursorY += 26 * s;
    }

    // ── Day / slot badge ────────────────────────────────────────
    cursorY += 6 * s;
    ctx.font = `400 ${scaleFont(18)}px 'Segoe UI', system-ui, sans-serif`;
    ctx.fillStyle = "rgba(255,255,255,0.38)";
    ctx.textAlign = "center";
    ctx.fillText("DAY 1  ·  MORNING", CANVAS_W / 2, cursorY);
    cursorY += 22 * s;

    // ── Topic title ──────────────────────────────────────────────
    cursorY += 8 * s;
    const topic = state.sampleTopic || "Your Topic Title";
    ctx.font = `700 ${scaleFont(54)}px Georgia, 'Times New Roman', serif`;
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    const topicLines = wrapText(ctx, topic, CANVAS_W / 2, usableW, scaleFont(58));
    topicLines.forEach(line => {
      ctx.fillText(line, CANVAS_W / 2, cursorY);
      cursorY += scaleFont(58);
    });

    // ── Divider ──────────────────────────────────────────────────
    cursorY += 8 * s;
    const divider = state.dividerSymbol || "◆";
    ctx.font = `400 ${scaleFont(22)}px 'Segoe UI', sans-serif`;
    ctx.fillStyle = rgbStr(accentRgb.r, accentRgb.g, accentRgb.b);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(divider, CANVAS_W / 2, cursorY);
    cursorY += 18 * s;

    // Thin gold lines flanking divider
    ctx.strokeStyle = rgbStr(accentRgb.r, accentRgb.g, accentRgb.b, 0.4);
    ctx.lineWidth = 0.8;
    const divLineY = cursorY - 9 * s;
    ctx.beginPath();
    ctx.moveTo(margin, divLineY);
    ctx.lineTo(CANVAS_W / 2 - 14 * s, divLineY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(CANVAS_W / 2 + 14 * s, divLineY);
    ctx.lineTo(CANVAS_W - margin, divLineY);
    ctx.stroke();

    // ── Hook text ────────────────────────────────────────────────
    cursorY += 6 * s;
    const hook = state.sampleHook || "Your hook line here";
    ctx.font = `400 italic ${scaleFont(28)}px Georgia, serif`;
    ctx.fillStyle = "rgb(248,238,200)";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    const hookLines = wrapText(ctx, `"${hook}"`, CANVAS_W / 2, usableW, scaleFont(34));
    hookLines.forEach(line => {
      ctx.fillText(line, CANVAS_W / 2, cursorY);
      cursorY += scaleFont(34);
    });

    // ── Teaching text ────────────────────────────────────────────
    cursorY += 8 * s;
    const teaching = state.sampleTeaching || "Teaching points appear here";
    ctx.font = `400 ${scaleFont(22)}px 'Segoe UI', system-ui, sans-serif`;
    ctx.fillStyle = "rgba(220,210,190,0.85)";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    const teachLines = wrapText(ctx, teaching, CANVAS_W / 2, usableW, scaleFont(28));
    teachLines.slice(0, 4).forEach(line => {
      if (cursorY + scaleFont(28) < CANVAS_H - 40 * s) {
        ctx.fillText(line, CANVAS_W / 2, cursorY);
        cursorY += scaleFont(28);
      }
    });

    // ── Bottom bar ───────────────────────────────────────────────
    const bottomY = CANVAS_H - FULL.bottomChromeOffset * s;

    // Fade line
    ctx.strokeStyle = rgbStr(accentRgb.r, accentRgb.g, accentRgb.b, 0.25);
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(margin, bottomY);
    ctx.lineTo(CANVAS_W - margin, bottomY);
    ctx.stroke();

    ctx.font = `400 ${scaleFont(18)}px 'Segoe UI', system-ui, sans-serif`;
    ctx.textBaseline = "middle";

    // Handle left
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.textAlign = "left";
    ctx.fillText(handle, margin, bottomY + 16 * s);

    // End symbol right
    const endSymbol = state.endSymbol || "✝";
    ctx.fillStyle = rgbStr(accentRgb.r, accentRgb.g, accentRgb.b, 0.7);
    ctx.textAlign = "right";
    ctx.fillText(endSymbol, CANVAS_W - margin, bottomY + 16 * s);
  }

  function init(canvasEl) {
    canvas = canvasEl;
    ctx = canvas.getContext("2d");
    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;
  }

  function update(state) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => render(state), 300);
  }

  function renderNow(state) {
    render(state);
  }

  return { init, update, renderNow, CANVAS_W, CANVAS_H };
})();
