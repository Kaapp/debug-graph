type CssConfig = {
  className: string;
  cssString: string;
};

const containerCssClassName = "debug-graph-container";
const sectionCssClassName = "debug-graph-section";
const graphContainerCssClassName = "debug-graph-graph";
const graphContainerCollapsedCssClassName = "debug-graph-graph-collapsed";
const graphCanvasCssClassName = "debug-graph-canvas";

type CssKey =
  | "container"
  | "graphContainerCollapsed"
  | "section"
  | "graphContainer"
  | "graphCanvas";

export const css: { [k in CssKey]: CssConfig } = {
  container: {
    className: containerCssClassName,
    cssString: `.${containerCssClassName}{position:fixed;top:0;left:0;cursor:pointer;opacity:0.9;z-index:10000;font-size:12px;display:flex;flex-direction:column;width:min-content}`,
  },
  section: {
    className: sectionCssClassName,
    cssString: `.${sectionCssClassName}{background:blue}`,
  },
  graphCanvas: {
    className: graphCanvasCssClassName,
    cssString: `.${graphCanvasCssClassName}{display:block}`,
  },
  graphContainer: {
    className: graphContainerCssClassName,
    cssString: `.${graphContainerCssClassName}{overflow:hidden}`,
  },
  graphContainerCollapsed: {
    className: graphContainerCollapsedCssClassName,
    cssString: `.${graphContainerCollapsedCssClassName}{}`,
  },
} as const;
