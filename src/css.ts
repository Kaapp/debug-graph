type CssConfig = {
  className: string;
  cssString: string;
};

const containerCssClassName = "debug-graph-container";
const sectionCssClassName = "debug-graph-section";
const graphContainerCssClassName = "debug-graph-graph";
const graphTitleCssClassName = "debug-graph-title";
const graphValueCssClassName = "debug-graph-value";
const graphCanvasCssClassName = "debug-graph-canvas";

type CssKey =
  | "container"
  | "section"
  | "graphContainer"
  | "graphTitle"
  | "graphValue"
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
    cssString: `.${graphCanvasCssClassName}{}`,
  },
  graphContainer: {
    className: graphContainerCssClassName,
    cssString: `.${graphContainerCssClassName}{display:flex;flex:1;justify-content:space-between}`,
  },
  graphTitle: {
    className: graphTitleCssClassName,
    cssString: `.${graphTitleCssClassName}{flex:0 1 100px;min-width:0;text-overflow:ellipsis;overflow:hidden}`,
  },
  graphValue: {
    className: graphValueCssClassName,
    cssString: `.${graphValueCssClassName}{flex: 0 1 auto;text-align:center}`,
  },
} as const;
