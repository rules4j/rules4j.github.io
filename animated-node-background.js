const SVG_NS = "http://www.w3.org/2000/svg";

class AnimatedNodeBackground extends HTMLElement {
  static get observedAttributes() {
    return [
      "node-count",
      "opacity",
      "pull-radius",
      "pull-strength",
      "interactive",
      "theme",
      "node-color",
      "line-start-color",
      "line-end-color",
      "background-color",
    ];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    this.nodes = [];
    this.lines = [];
    this.rendered = [];
    this.pointer = { x: 0, y: 0, active: false };
    this.frameId = 0;

    this.onResize = this.onResize.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerLeave = this.onPointerLeave.bind(this);
    this.onThemeMediaChange = this.onThemeMediaChange.bind(this);
    this.animate = this.animate.bind(this);

    this.uid = `anb-${Math.random().toString(36).slice(2, 11)}`;
    this.gradientIds = {
      nodeGlow: `${this.uid}-node-glow`,
      line: `${this.uid}-line-gradient`,
    };

    this.themeMedia = window.matchMedia("(prefers-color-scheme: dark)");
  }

  connectedCallback() {
    this.render();
    this.bindEvents();
    this.generateGraph();
    this.applyTheme();
    this.applyOpacity();
    this.start();
  }

  disconnectedCallback() {
    this.stop();
    this.unbindEvents();
  }

  attributeChangedCallback(name) {
    if (!this.isConnected || !this.bgLayer) return;

    if (name === "node-count") {
      this.generateGraph();
      return;
    }

    if (name === "opacity") {
      this.applyOpacity();
      return;
    }

    if (
      name === "theme" ||
      name === "node-color" ||
      name === "line-start-color" ||
      name === "line-end-color" ||
      name === "background-color"
    ) {
      this.applyTheme();
    }
  }

  render() {
    if (this.shadowRoot.children.length) return;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          position: fixed;
          inset: 0;
          display: block;
          overflow: hidden;
          pointer-events: none;
          z-index: 0;
        }

        .bg,
        .scene,
        .fade,
        .accent {
          position: absolute;
          inset: 0;
        }

        .scene {
          opacity: 0.4;
        }

        svg {
          width: 100%;
          height: 100%;
          overflow: visible;
        }

        .fade,
        .accent {
          z-index: 10;
        }
      </style>

      <div class="bg"></div>
      <div class="scene">
        <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <defs>
            <radialGradient id="${this.gradientIds.nodeGlow}" cx="50%" cy="50%" r="50%">
              <stop class="node-stop-0" offset="0%" stop-opacity="0.5"></stop>
              <stop class="node-stop-1" offset="100%" stop-opacity="0"></stop>
            </radialGradient>
            <linearGradient id="${this.gradientIds.line}" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop class="line-stop-0" offset="0%"></stop>
              <stop class="line-stop-1" offset="100%"></stop>
            </linearGradient>
          </defs>
          <g class="line-layer"></g>
          <g class="node-layer"></g>
        </svg>
      </div>
      <div class="fade"></div>
      <div class="accent"></div>
    `;

    this.bgLayer = this.shadowRoot.querySelector(".bg");
    this.sceneLayer = this.shadowRoot.querySelector(".scene");
    this.fadeLayer = this.shadowRoot.querySelector(".fade");
    this.accentLayer = this.shadowRoot.querySelector(".accent");
    this.lineLayer = this.shadowRoot.querySelector(".line-layer");
    this.nodeLayer = this.shadowRoot.querySelector(".node-layer");
    this.nodeStop0 = this.shadowRoot.querySelector(".node-stop-0");
    this.nodeStop1 = this.shadowRoot.querySelector(".node-stop-1");
    this.lineStop0 = this.shadowRoot.querySelector(".line-stop-0");
    this.lineStop1 = this.shadowRoot.querySelector(".line-stop-1");
  }

  bindEvents() {
    window.addEventListener("resize", this.onResize, { passive: true });
    window.addEventListener("pointermove", this.onPointerMove, { passive: true });
    window.addEventListener("pointerleave", this.onPointerLeave, { passive: true });
    this.themeMedia.addEventListener("change", this.onThemeMediaChange);
  }

  unbindEvents() {
    window.removeEventListener("resize", this.onResize);
    window.removeEventListener("pointermove", this.onPointerMove);
    window.removeEventListener("pointerleave", this.onPointerLeave);
    this.themeMedia.removeEventListener("change", this.onThemeMediaChange);
  }

  onResize() {
    if (!this.frameId) this.start();
  }

  onPointerMove(event) {
    this.pointer.x = event.clientX;
    this.pointer.y = event.clientY;
    this.pointer.active = true;
  }

  onPointerLeave() {
    this.pointer.active = false;
  }

  onThemeMediaChange() {
    if (this.getThemeMode() === "auto") this.applyTheme();
  }

  start() {
    if (this.frameId) return;
    this.frameId = requestAnimationFrame(this.animate);
  }

  stop() {
    if (!this.frameId) return;
    cancelAnimationFrame(this.frameId);
    this.frameId = 0;
  }

  animate(now) {
    const config = this.getConfig();
    const time = now / 1000;
    const width = this.clientWidth || window.innerWidth;
    const height = this.clientHeight || window.innerHeight;

    this.rendered.length = this.nodes.length;

    for (let i = 0; i < this.nodes.length; i += 1) {
      const node = this.nodes[i];
      const fastX = Math.sin(time * node.fastSpeed + node.fastPhase) * node.fastAmpX;
      const fastY = Math.cos(time * node.fastSpeed + node.fastPhase) * node.fastAmpY;
      const slowX = Math.sin(time * node.slowSpeed + node.slowPhase) * node.slowAmpX;
      const slowY = Math.cos(time * node.slowSpeed + node.slowPhase) * node.slowAmpY;

      const basePxX = (node.baseX / 100) * width + fastX + slowX;
      const basePxY = (node.baseY / 100) * height + fastY + slowY;

      let pullX = 0;
      let pullY = 0;
      let influence = 0;

      if (config.interactive && this.pointer.active) {
        const dx = this.pointer.x - basePxX;
        const dy = this.pointer.y - basePxY;
        const distance = Math.hypot(dx, dy);

        if (distance > 1 && distance < config.pullRadius) {
          influence = Math.pow(1 - distance / config.pullRadius, 1.6);
          const pull = influence * config.pullStrength;
          pullX = (dx / distance) * pull;
          pullY = (dy / distance) * pull;
        }
      }

      const nearCursorDamp = 1 - influence * 0.55;
      const finalPxX = (node.baseX / 100) * width + (fastX + slowX) * nearCursorDamp + pullX;
      const finalPxY = (node.baseY / 100) * height + (fastY + slowY) * nearCursorDamp + pullY;

      const x = (finalPxX / width) * 100;
      const y = (finalPxY / height) * 100;

      this.rendered[i] = { x, y };
      node.glowEl.setAttribute("cx", `${x}%`);
      node.glowEl.setAttribute("cy", `${y}%`);
      node.coreEl.setAttribute("cx", `${x}%`);
      node.coreEl.setAttribute("cy", `${y}%`);
      node.coreEl.setAttribute("fill", this.colors.node);
    }

    for (let i = 0; i < this.lines.length; i += 1) {
      const line = this.lines[i];
      const n1 = this.rendered[line.a];
      const n2 = this.rendered[line.b];
      if (!n1 || !n2) continue;

      const dx = n1.x - n2.x;
      const dy = n1.y - n2.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const dynamicOpacity = Math.pow(Math.max(0, 1 - distance / 24), 1.3);

      line.el.setAttribute("x1", `${n1.x}%`);
      line.el.setAttribute("y1", `${n1.y}%`);
      line.el.setAttribute("x2", `${n2.x}%`);
      line.el.setAttribute("y2", `${n2.y}%`);
      line.el.setAttribute("stroke-opacity", `${Math.min(line.opacity, dynamicOpacity) * 0.7}`);
    }

    this.frameId = requestAnimationFrame(this.animate);
  }

  generateGraph() {
    const nodeCount = this.getNumberAttr("node-count", 80, 8, 300);

    const cols = Math.ceil(Math.sqrt(nodeCount));
    const rows = Math.ceil(nodeCount / cols);
    const cellW = 100 / cols;
    const cellH = 100 / rows;

    const cellPoints = Array.from({ length: cols * rows }, (_, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const jitterX = (Math.random() - 0.5) * cellW * 1.15;
      const jitterY = (Math.random() - 0.5) * cellH * 1.15;
      const baseX = (col + 0.5) * cellW + jitterX;
      const baseY = (row + 0.5) * cellH + jitterY;

      return {
        baseX: Math.min(98.5, Math.max(1.5, baseX)),
        baseY: Math.min(98.5, Math.max(1.5, baseY)),
      };
    });

    for (let i = cellPoints.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [cellPoints[i], cellPoints[j]] = [cellPoints[j], cellPoints[i]];
    }

    const randomPointCount = Math.floor(nodeCount * 0.25);
    const stratifiedCount = nodeCount - randomPointCount;
    const mixedPoints = [
      ...cellPoints.slice(0, stratifiedCount),
      ...Array.from({ length: randomPointCount }, () => ({
        baseX: 2 + Math.random() * 96,
        baseY: 2 + Math.random() * 96,
      })),
    ];

    this.nodes = mixedPoints.map((point, i) => ({
      id: i,
      baseX: point.baseX,
      baseY: point.baseY,
      size: Math.random() * 2 + 1,
      fastAmpX: (Math.random() - 0.5) * 26,
      fastAmpY: (Math.random() - 0.5) * 26,
      slowAmpX: (Math.random() - 0.5) * 16,
      slowAmpY: (Math.random() - 0.5) * 16,
      fastPhase: Math.random() * Math.PI * 2,
      slowPhase: Math.random() * Math.PI * 2,
      fastSpeed: 0.5 + Math.random() * 0.35,
      slowSpeed: 0.12 + Math.random() * 0.08,
    }));

    this.assignDagRanks();
    this.lines = this.buildDagLines();

    this.mountShapes();
  }

  assignDagRanks() {
    const layerCount = Math.max(3, Math.min(10, Math.round(Math.sqrt(this.nodes.length) * 0.8)));
    const sorted = [...this.nodes].sort((a, b) => {
      if (a.baseY !== b.baseY) return a.baseY - b.baseY;
      if (a.baseX !== b.baseX) return a.baseX - b.baseX;
      return a.id - b.id;
    });
    const nodesPerLayer = Math.ceil(this.nodes.length / layerCount);

    for (let i = 0; i < sorted.length; i += 1) {
      sorted[i].rank = Math.min(layerCount - 1, Math.floor(i / nodesPerLayer));
    }
  }

  buildDagLines() {
    const lines = [];
    const edgeSet = new Set();
    const incomingCount = Array(this.nodes.length).fill(0);

    const maxRank = this.nodes.reduce((acc, node) => Math.max(acc, node.rank), 0);
    const nodesByRank = Array.from({ length: maxRank + 1 }, () => []);
    for (let i = 0; i < this.nodes.length; i += 1) {
      nodesByRank[this.nodes[i].rank].push(this.nodes[i].id);
    }

    const addEdge = (fromId, toId) => {
      const from = this.nodes[fromId];
      const to = this.nodes[toId];
      if (!from || !to || from.rank >= to.rank) return false;

      const edgeId = `${fromId}->${toId}`;
      if (edgeSet.has(edgeId)) return false;

      const dx = from.baseX - to.baseX;
      const dy = from.baseY - to.baseY;
      const distance = Math.hypot(dx, dy);
      const opacity = Math.pow(Math.max(0.18, 1 - distance / 32), 1.35);

      lines.push({
        id: edgeId,
        a: fromId,
        b: toId,
        opacity,
      });
      edgeSet.add(edgeId);
      incomingCount[toId] += 1;
      return true;
    };

    for (let rank = 0; rank < nodesByRank.length - 1; rank += 1) {
      const sources = nodesByRank[rank];
      for (let s = 0; s < sources.length; s += 1) {
        const sourceId = sources[s];
        const source = this.nodes[sourceId];
        const candidates = [];
        const maxTargetRank = Math.min(rank + 2, nodesByRank.length - 1);

        for (let targetRank = rank + 1; targetRank <= maxTargetRank; targetRank += 1) {
          const targets = nodesByRank[targetRank];
          for (let t = 0; t < targets.length; t += 1) {
            const targetId = targets[t];
            const target = this.nodes[targetId];
            const dx = source.baseX - target.baseX;
            const dy = source.baseY - target.baseY;
            const distance = Math.hypot(dx, dy);
            const rankPenalty = (targetRank - rank - 1) * 5;
            candidates.push({ targetId, score: distance + rankPenalty });
          }
        }

        candidates.sort((a, b) => a.score - b.score);
        const outDegree = 1 + Math.floor(Math.random() * 2);
        for (let i = 0; i < outDegree && i < candidates.length; i += 1) {
          addEdge(sourceId, candidates[i].targetId);
        }
      }
    }

    for (let rank = 1; rank < nodesByRank.length; rank += 1) {
      for (let i = 0; i < nodesByRank[rank].length; i += 1) {
        const targetId = nodesByRank[rank][i];
        if (incomingCount[targetId] > 0) continue;

        const target = this.nodes[targetId];
        let bestSourceId = -1;
        let bestDistance = Number.POSITIVE_INFINITY;
        const minSourceRank = Math.max(0, rank - 2);
        for (let sourceRank = minSourceRank; sourceRank < rank; sourceRank += 1) {
          for (let j = 0; j < nodesByRank[sourceRank].length; j += 1) {
            const sourceId = nodesByRank[sourceRank][j];
            const source = this.nodes[sourceId];
            const distance = Math.hypot(source.baseX - target.baseX, source.baseY - target.baseY);
            if (distance < bestDistance) {
              bestDistance = distance;
              bestSourceId = sourceId;
            }
          }
        }

        if (bestSourceId !== -1) addEdge(bestSourceId, targetId);
      }
    }

    return lines;
  }

  mountShapes() {
    this.lineLayer.textContent = "";
    this.nodeLayer.textContent = "";

    for (let i = 0; i < this.lines.length; i += 1) {
      const line = this.lines[i];
      const el = document.createElementNS(SVG_NS, "line");
      el.setAttribute("stroke", `url(#${this.gradientIds.line})`);
      el.setAttribute("stroke-width", "1");
      el.setAttribute("stroke-opacity", "0");
      this.lineLayer.appendChild(el);
      line.el = el;
    }

    for (let i = 0; i < this.nodes.length; i += 1) {
      const node = this.nodes[i];

      const g = document.createElementNS(SVG_NS, "g");
      const glow = document.createElementNS(SVG_NS, "circle");
      const core = document.createElementNS(SVG_NS, "circle");

      glow.setAttribute("r", `${node.size * 4}`);
      glow.setAttribute("fill", `url(#${this.gradientIds.nodeGlow})`);

      core.setAttribute("r", `${node.size / 2}`);
      core.setAttribute("fill-opacity", "0.9");

      g.appendChild(glow);
      g.appendChild(core);
      this.nodeLayer.appendChild(g);

      node.glowEl = glow;
      node.coreEl = core;
    }
  }

  applyTheme() {
    const mode = this.getThemeMode();
    const resolved = mode === "auto" ? (this.themeMedia.matches ? "dark" : "light") : mode;

    const palettes = {
      light: {
        background: "#f5f9ff",
        node: "#0f766e",
        lineStart: "#0891b2",
        lineEnd: "#2563eb",
        accent: "rgba(14, 165, 233, 0.12)",
        fadeStart: "rgba(245, 249, 255, 0)",
      },
      dark: {
        background: "#050816",
        node: "#93c5fd",
        lineStart: "#38bdf8",
        lineEnd: "#818cf8",
        accent: "rgba(56, 189, 248, 0.14)",
        fadeStart: "rgba(5, 8, 22, 0)",
      },
    };

    const palette = palettes[resolved];

    this.colors = {
      background: this.getAttribute("background-color") || palette.background,
      node: this.getAttribute("node-color") || palette.node,
      lineStart: this.getAttribute("line-start-color") || palette.lineStart,
      lineEnd: this.getAttribute("line-end-color") || palette.lineEnd,
      accent: palette.accent,
      fadeStart: palette.fadeStart,
    };

    this.bgLayer.style.background = this.colors.background;
    this.fadeLayer.style.background = `linear-gradient(to bottom, ${this.colors.fadeStart} 0%, ${this.colors.background} 100%)`;
    this.accentLayer.style.background = `radial-gradient(ellipse at top, ${this.colors.accent} 0%, transparent 60%)`;

    this.nodeStop0.setAttribute("stop-color", this.colors.node);
    this.nodeStop1.setAttribute("stop-color", this.colors.node);
    this.lineStop0.setAttribute("stop-color", this.colors.lineStart);
    this.lineStop1.setAttribute("stop-color", this.colors.lineEnd);

    this.setAttribute("resolved-theme", resolved);
  }

  applyOpacity() {
    const opacity = this.getNumberAttr("opacity", 0.4, 0, 1);
    this.sceneLayer.style.opacity = `${opacity}`;
  }

  getThemeMode() {
    const value = (this.getAttribute("theme") || "auto").toLowerCase();
    if (value === "light" || value === "dark" || value === "auto") return value;
    return "auto";
  }

  getConfig() {
    return {
      pullRadius: this.getNumberAttr("pull-radius", 260, 30, 1000),
      pullStrength: this.getNumberAttr("pull-strength", 58, 0, 300),
      interactive: this.getBooleanAttr("interactive", true),
    };
  }

  getNumberAttr(name, fallback, min, max) {
    const rawValue = this.getAttribute(name);
    if (rawValue === null) return fallback;

    const normalizedValue = rawValue.trim();
    if (normalizedValue === "") return fallback;

    const value = Number(normalizedValue);
    if (!Number.isFinite(value)) return fallback;
    return Math.max(min, Math.min(max, value));
  }

  getBooleanAttr(name, fallback) {
    const value = this.getAttribute(name);
    if (value === null) return fallback;
    if (value === "" || value.toLowerCase() === "true") return true;
    if (value.toLowerCase() === "false") return false;
    return fallback;
  }
}

customElements.define("animated-node-background", AnimatedNodeBackground);
