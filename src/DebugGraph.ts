import { css } from "./css";

export type DebugGraphOptions = {
  graphHeight?: number;
  graphWidth?: number;
  width?: number;
  height?: number;
  fontSize?: number;
  titleToValueRatio?: number;
  rangeDecayFactor?: number;
  roundingFactor?: number;
};

export type GraphSettings = {
  title?: string;
  section?: string;
  foreground?: string;
  background?: string;
  showRange?: boolean;
  style?: "line" | "fill";
  minGraphRange?: number;
  collapse?: boolean;
  valuePrefix?: string;
  valueSuffix?: string;
};

type Graph = {
  settings: GraphSettings;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  values: number[];
  nextIndex: number; // so we know which value to swap without reallocating memory
};

const defaultOptions: DebugGraphOptions = {
  graphHeight: 25,
  graphWidth: 75,
  fontSize: 5,
  height: 25,
  width: 75,
  titleToValueRatio: 0.6,
  roundingFactor: 100,
};

const defaultGraphSettings: GraphSettings = {
  foreground: "#FF00FF",
  background: "#220022",
  showRange: true,
  title: "Graph",
  style: "line",
  minGraphRange: 1.5,
  collapse: false,
  valuePrefix: "",
  valueSuffix: "",
};

export class DebugGraph {
  constructor(options?: DebugGraphOptions) {
    this.options = {
      ...defaultOptions,
      ...options,
    };
  }

  private graphs: { [key: string]: Graph } = {};

  private readonly options: DebugGraphOptions;

  private sections: { [sectionName: string]: HTMLDivElement };

  private rootElement: HTMLDivElement = document.createElement("div");

  public attach(target?: HTMLElement): void {
    this.rootElement.classList.add(css.container.className);

    if (target) {
      target.appendChild(this.rootElement);
    } else {
      document.body.appendChild(this.rootElement);
    }

    const style = document.createElement("style");
    style.innerHTML = [
      css.container.cssString,
      css.section.cssString,
      css.graphCanvas.cssString,
      css.graphContainer.cssString,
      css.graphContainerCollapsed.cssString,
    ].join("\n");
    document.head.appendChild(style);
  }

  public add(key: string, userSettings: GraphSettings): void {
    if (this.graphs[key]) {
      // ignore duplicate keys
      return;
    }

    const settings = {
      ...defaultGraphSettings,
      ...userSettings,
    };

    const pixelRatio = window.devicePixelRatio;
    const padding = pixelRatio;
    const fontSize = this.options.fontSize * pixelRatio;
    const container = document.createElement("div");
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.className = css.graphCanvas.className;
    canvas.width = this.options.graphWidth * pixelRatio;
    canvas.height = this.options.graphHeight * pixelRatio;

    const collapseSize = `${fontSize + 2 * padding}px`;
    container.className = css.graphContainer.className;
    if (settings.collapse) {
      container.classList.add(css.graphContainerCollapsed.className);
      container.style.height = collapseSize;
    }
    canvas.addEventListener("click", () => {
      const nowCollapsed = container.classList.toggle(
        css.graphContainerCollapsed.className
      );
      settings.collapse = nowCollapsed;
      container.style.height = nowCollapsed ? collapseSize : "";
    });
    container.appendChild(canvas);

    // init canvas to bg
    ctx.fillStyle = settings.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // draw label
    ctx.fillStyle = settings.foreground;
    ctx.font = `${fontSize}px sans-serif`;
    ctx.fillText(
      settings.title,
      pixelRatio,
      fontSize
      // this.options.width * this.options.titleToValueRatio
    );

    // draw separator
    ctx.fillStyle = settings.foreground;
    ctx.fillRect(0, fontSize + padding, canvas.width, padding);

    const sectionName = settings.section;

    if (sectionName) {
      // create section if needed
      if (!this.sections[sectionName]) {
        this.sections[sectionName] = this.createSection(settings.section);
        this.rootElement.appendChild(this.sections[sectionName]);
      }

      // then append to section
      this.sections[sectionName].appendChild(container);
    } else {
      // just append to root
      this.rootElement.appendChild(container);
    }

    this.graphs[key] = {
      settings,
      canvas,
      ctx,
      nextIndex: 0,
      values: [],
    };
  }

  public update(key: string, value: number): void {
    const graph = this.graphs[key];
    if (!graph) {
      return; // unknown graph key
    }

    if (graph.values.length >= this.options.graphWidth) {
      graph.values[graph.nextIndex] = value;
    } else {
      graph.values.push(value);
    }
    graph.nextIndex = ++graph.nextIndex % this.options.graphWidth;

    const [valueMin, valueMax] = graph.values.reduce(
      (prev, curr) => [Math.min(prev[0], curr), Math.max(prev[1], curr)],
      [Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]
    );

    const rangeTooSmall = valueMax - valueMin < graph.settings.minGraphRange;
    const min = rangeTooSmall
      ? valueMin - graph.settings.minGraphRange / 2
      : valueMin;
    const max = rangeTooSmall
      ? valueMax + graph.settings.minGraphRange / 2
      : valueMax;

    const pixelRatio = window.devicePixelRatio;
    const padding = pixelRatio;
    // include padding for underline
    const fontHeight = this.options.fontSize * pixelRatio + 2 * padding;
    const graphHeight = graph.canvas.height - fontHeight - 3 * padding;

    // clear and redraw value
    graph.ctx.fillStyle = graph.settings.background;
    graph.ctx.fillRect(
      graph.canvas.width * this.options.titleToValueRatio,
      0,
      graph.canvas.width,
      fontHeight - padding // don't clear underline
    );
    graph.ctx.fillStyle = graph.settings.foreground;
    graph.ctx.textAlign = "right";
    graph.ctx.fillText(
      `${graph.settings.valuePrefix}${
        Math.round(value * this.options.roundingFactor) /
        this.options.roundingFactor
      }${graph.settings.valueSuffix}`,
      graph.canvas.width,
      fontHeight - 2 * padding,
      graph.canvas.width * (1 - this.options.titleToValueRatio)
    );

    if (!graph.settings.collapse) {
      const graphStartY = graph.canvas.height - graphHeight - padding;
      // fill graph background
      graph.ctx.fillStyle = graph.settings.background;
      graph.ctx.fillRect(
        0,
        graphStartY - padding,
        graph.canvas.width,
        graphHeight + 2 * padding
      );

      // draw graph path
      graph.ctx.strokeStyle = graph.settings.foreground;
      graph.ctx.lineWidth = pixelRatio; // todo: maybe 1?
      graph.ctx.beginPath();

      const range = max - min;
      for (let i = 0, len = graph.values.length; i < len; i++) {
        // starting from the oldest value
        const valueIndex = (i + graph.nextIndex) % len;
        const x = pixelRatio * i;
        const y =
          (1 - (graph.values[valueIndex] - min) / range) * graphHeight +
          graphStartY;

        if (i === 0) {
          graph.ctx.moveTo(x, y);
        } else {
          graph.ctx.lineTo(x, y);
        }
      }

      // draw the path from before
      graph.ctx.stroke();

      if (graph.settings.showRange) {
        graph.ctx.fillStyle = graph.settings.foreground;
        graph.ctx.strokeStyle = graph.settings.background;
        graph.ctx.textAlign = "left";
        const minText = `${
          Math.round(min * this.options.roundingFactor) /
          this.options.roundingFactor
        }`;
        const maxText = `${
          Math.round(max * this.options.roundingFactor) /
          this.options.roundingFactor
        }`;
        const textX = padding;
        const minTextY = graph.canvas.height - padding;
        const maxTextY = graphStartY + fontHeight / 2;
        const textMaxWidth = graph.canvas.width / 2;
        // draw min text
        graph.ctx.strokeText(minText, textX, minTextY, textMaxWidth);
        graph.ctx.fillText(minText, textX, minTextY, textMaxWidth);
        // draw max text
        graph.ctx.strokeText(maxText, textX, maxTextY, textMaxWidth);
        graph.ctx.fillText(maxText, textX, maxTextY, textMaxWidth);
      }
    }
  }

  private createSection(sectionName: string): HTMLDivElement {
    const section = document.createElement("div");

    section.textContent = sectionName;
    section.className = css.section.className;

    return section;
  }
}
