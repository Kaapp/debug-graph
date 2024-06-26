import { css } from "./css";

export type MinimalDebugGraphOptions = {
  width?: number;
  height?: number;
  fontHeight?: number;
  titleToValueRatio?: number;
  rangeDecayFactor?: number;
};

export type MinimalGraphSettings = {
  title?: string;
  section?: string;
  foreground?: string;
  background?: string;
  style?: "line" | "fill";
};

type Graph = {
  settings: MinimalGraphSettings;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  min?: number;
  max?: number;
};

const defaultOptions: MinimalDebugGraphOptions = {
  height: 25,
  width: 75,
  fontHeight: 5,
  titleToValueRatio: 0.6,
  rangeDecayFactor: 1 / 128,
};

const defaultSettings: MinimalGraphSettings = {
  title: "Graph",
  foreground: "#0000FF",
  background: "#FF0000",
  style: "line",
};

export class MinimalDebugGraph {
  constructor(options?: MinimalDebugGraphOptions) {
    this.options = {
      ...defaultOptions,
      ...options,
    };
  }

  private graphs: { [key: string]: Graph } = {};

  private readonly options: MinimalDebugGraphOptions;

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
    ].join("\n");
    document.head.appendChild(style);
  }

  public add(key: string, userSettings: MinimalGraphSettings): void {
    if (this.graphs[key]) {
      // ignore duplicate keys
      return;
    }

    const settings = {
      ...defaultSettings,
      ...userSettings,
    };

    const pixelRatio = window.devicePixelRatio;
    const padding = pixelRatio;
    const fontHeight = this.options.fontHeight * pixelRatio;
    const container = document.createElement("div");
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.className = css.graphCanvas.className;
    canvas.width = this.options.width * pixelRatio;
    canvas.height = this.options.height * pixelRatio;

    // TODO: make this cleaner, use proper css like container
    canvas.addEventListener("click", () => {
      container.style.overflow = "hidden";
      if (container.style.height) {
        container.style.height = "";
      } else {
        container.style.height = `${fontHeight + 2 * padding}px`;
      }
    });
    container.appendChild(canvas);

    // init canvas to bg
    ctx.fillStyle = settings.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // draw label
    ctx.fillStyle = settings.foreground;
    ctx.font = `${fontHeight}px sans-serif`;
    ctx.fillText(
      settings.title,
      pixelRatio,
      fontHeight
      // this.options.width * this.options.titleToValueRatio
    );

    // draw separator
    ctx.fillStyle = settings.foreground;
    ctx.fillRect(0, fontHeight + padding, canvas.width, padding);

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
    };
  }

  public update(key: string, value: number): void {
    const graph = this.graphs[key];
    if (!graph) {
      return; // unknown graph key
    }

    // find new max/min
    // TODO: allow configurable delta in this case
    let min = graph.min ? Math.min(graph.min, value) : value - 1;
    let max = graph.max ? Math.max(graph.max, value) : value + 1;

    // TODO: auto-scale axes
    const expectedGraphRange = max - min;

    // try to move min or max closer to original value to maintain useful scale
    // const valueRatio = (value - min) / expectedGraphRange;
    // if (valueRatio > 0.75) {
    //   // we're near the top of the graph, bring the min up slightly to compensate
    //   min += expectedGraphRange * this.options.rangeDecayFactor;
    // } else if (valueRatio < 0.25) {
    //   // we're near the bottom of the graph, bring the max down slightly to compensate
    //   max -= expectedGraphRange * this.options.rangeDecayFactor;
    // }

    const pixelRatio = window.devicePixelRatio;
    const padding = pixelRatio;
    // include padding for underline
    const fontHeight = this.options.fontHeight * pixelRatio + 2 * padding;
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
      `${value}`, // todo: prefix/suffix option
      graph.canvas.width,
      fontHeight - 2 * padding,
      graph.canvas.width * (1 - this.options.titleToValueRatio)
    );

    // draw original graph 1 pixel over
    // TODO: re-scale graph by repositioning/stretching y if min/max changed
    const graphStartY = fontHeight + padding;
    let destY = graphStartY;
    let srcHeight = graphHeight + padding;
    let dstHeight = graphHeight + padding;
    if (graph.max !== undefined && value > graph.max) {
      // new value exceeds previous max so need to rescale upward
      const deltaRatio = (value - graph.max) / (graph.max - graph.min);
      destY += deltaRatio * graphHeight;
      dstHeight -= deltaRatio * graphHeight;
    }
    if (graph.min !== undefined && graph.min > value) {
      // new value below previous min so need to rescale downward
      const deltaRatio = (graph.min - value) / (graph.max - graph.min);
      dstHeight -= deltaRatio * graphHeight;
    }

    // if we adjusted before, new min > old min or new max < old max
    // if (graph.max !== undefined && graph.max > max) {
    //   dstHeight -= this.options.rangeDecayFactor * graphHeight;
    // }
    // if (graph.min !== undefined && min > graph.min) {
    //   dstHeight += this.options.rangeDecayFactor * graphHeight;
    // }

    graph.ctx.drawImage(
      graph.canvas,
      0,
      graphStartY,
      graph.canvas.width,
      srcHeight,
      -pixelRatio,
      destY,
      graph.canvas.width,
      dstHeight
    );

    // fill new background on right edge
    graph.ctx.fillStyle = graph.settings.background;
    graph.ctx.fillRect(
      graph.canvas.width - pixelRatio,
      fontHeight,
      pixelRatio,
      graph.canvas.height
    );

    // fill new foreground on right edge
    // TODO: support fill-to-zero so graph is inverted below zero
    graph.ctx.fillStyle = graph.settings.foreground;
    const fillHeight =
      graph.settings.style === "line" ? pixelRatio : graph.canvas.height;
    graph.ctx.fillRect(
      graph.canvas.width - pixelRatio,
      (1 - (value - min) / (max - min)) * graphHeight + graphStartY,
      pixelRatio,
      fillHeight
    );

    // update max/min
    graph.min = min;
    graph.max = max;
  }

  private createSection(sectionName: string): HTMLDivElement {
    const section = document.createElement("div");

    section.textContent = sectionName;
    section.className = css.section.className;

    return section;
  }
}
