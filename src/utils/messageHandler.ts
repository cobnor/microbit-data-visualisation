import Plotly from "plotly.js-dist";

export interface GraphConfig {
  graphType: string;
  title: string;
  x: { label: string; min: number; max: number };
  y: { label: string; min: number; max: number };
  series: Array<{ x_column: string; y_column: string; displayName?: string; color?: number; icon?: string }>;
}

export interface PlotData {
  [key: string]: any;
}

// Convert integer to colour hex code
function numToColorCode(num: number): string {
  return "#" + num.toString(16).padStart(6, "0");
}

// Proxy patch for getting the live graph 

let lastGraphTraces: any[] = [];
let lastGraphLayout: any = {};

const _origNewPlot = Plotly.newPlot;
(Plotly as any).newPlot = function(div: any, data: any, layout: any, config: any) {
  lastGraphTraces = JSON.parse(JSON.stringify(data));
  lastGraphLayout = JSON.parse(JSON.stringify(layout));
  return _origNewPlot.call(this, div, data, layout, config);
};

const _origExtend = Plotly.extendTraces;
(Plotly as any).extendTraces = function(div: any, update: any, indices: number[], maxPoints?: number) {
  const result = _origExtend.call(this, div, update, indices, maxPoints);
  indices.forEach((traceIdx, uIdx) => {
    const trace = lastGraphTraces[traceIdx];
    if (!trace) return;
    if (update.x && update.x[uIdx]) trace.x = trace.x.concat(update.x[uIdx]);
    if (update.y && update.y[uIdx]) trace.y = trace.y.concat(update.y[uIdx]);
    if (maxPoints && Array.isArray(trace.x)) {
      trace.x = trace.x.slice(-maxPoints);
      trace.y = trace.y.slice(-maxPoints);
    }
  });
  return result;
};

const _origUpdate = Plotly.update;
(Plotly as any).update = function(div: any, dataUpdate: any, layoutUpdate: any, traceIndices: number[]) {
  const result = _origUpdate.call(this, div, dataUpdate, layoutUpdate, traceIndices);
  traceIndices.forEach((ti) => {
    const trace = lastGraphTraces[ti];
    if (!trace) return;
    if (dataUpdate.y)      trace.y      = dataUpdate.y[0];
    if (dataUpdate.values) trace.values = dataUpdate.values[0];
    if (dataUpdate.labels) trace.labels = dataUpdate.labels[0];
  });
  return result;
};


export function renderTable() {
  if (!lastGraphTraces.length) return;
  const type = lastGraphTraces[0].type;
  let header: string[] = [];
  let cells: any[][] = [];

  if (type === "line" || type === "scatter") {
    header = [lastGraphLayout.xaxis?.title?.text || "x", ...lastGraphTraces.map((t) => t.name)];
    cells = [lastGraphTraces[0].x, ...lastGraphTraces.map((t) => t.y)];

  } else if (type === "bar") {
    const t = lastGraphTraces[0];
    header = [lastGraphLayout.xaxis?.title?.text || "category", lastGraphLayout.yaxis?.title?.text || "value"];
    cells = [t.x, t.y];

  } else if (type === "pie") {
    const t = lastGraphTraces[0];
    header = [lastGraphLayout.title?.text || "slice", "value"];
    cells = [t.labels || [], t.values || []];
    
  } else {
    return;
  }

  Plotly.react("plot", [{ type: "table", header: { values: header }, cells: { values: cells } } as any], {});
}

// Restore graph when switching back from table mode
export function restoreGraph() {
  if (!lastGraphTraces.length) return;
  Plotly.react("plot", lastGraphTraces, lastGraphLayout);
}

// Render either table or graph based on whether the table class exists (bit hacky but it works)
function renderTableOrGraph() {
  const root = document.querySelector(".gradient-bg");
  if (!root) return;
  if (root.classList.contains("table")) renderTable();
  else restoreGraph();
}


(function initModeObserver() {
  function tryInit() {
    const root = document.querySelector(".gradient-bg");
    if (!root) {
      requestAnimationFrame(tryInit);
      return;
    }
    // initial render
    renderTableOrGraph();
    // observe future class changes
    const mo = new MutationObserver(renderTableOrGraph);
    mo.observe(root, { attributes: true, attributeFilter: ["class"] });
  }
  tryInit();
})();

export function handleConfig(
  config: GraphConfig,
  graphConfig: GraphConfig | null,
  plotData: PlotData
): GraphConfig {
  console.log("Received new graph configuration:", config);
  if (graphConfig && JSON.stringify(graphConfig) === JSON.stringify(config)) return graphConfig;
  graphConfig = config;

  if (config.graphType === "bar") {
    plotData.x = config.series.map((s) => s.y_column);
    plotData.y = config.series.map(() => 0);
    plotData.type = "bar";
    plotData.marker = { color: config.series.map((s) => numToColorCode(s.color || 0x0000ff)) };
    Plotly.newPlot("plot", [plotData], {
      title: { text: config.title },
      xaxis: { title: { text: config.x?.label || "Category" }, type: "category" },
      yaxis: { title: { text: config.y.label }, range: [config.y.min, config.y.max] },
    });

  } else if (config.graphType === "pie") {
    plotData.labels = config.series.map((s) => s.y_column);
    plotData.values = config.series.map(() => 0);
    plotData.type = "pie";
    plotData.marker = { colors: config.series.map((s) => numToColorCode(s.color || 0x0000ff)) };
    Plotly.newPlot("plot", [plotData], { title: { text: config.title } });

  } else if (config.graphType === "line" || config.graphType === "scatter") {
    Object.keys(plotData).forEach((k) => delete plotData[k]);
    const traces = config.series.map((sensor) => {
      const id = sensor.y_column;
      plotData[id] = {
        x: [], y: [], name: sensor.displayName || id,
        type: config.graphType === "scatter" ? "scatter" : "line",
        mode: config.graphType === "scatter" ? "markers" : "lines",
        line: { color: numToColorCode(sensor.color || 0x0000ff) },
        marker: { symbol: sensor.icon || "circle", size: 6, color: numToColorCode(sensor.color || 0x0000ff) },
      };
      return plotData[id];
    });
    Plotly.newPlot("plot", traces, {
      title: { text: config.title },
      xaxis: { title: { text: config.x.label }, range: config.x.label === "time (seconds)" ? undefined : [config.x.min, config.x.max] },
      yaxis: { title: { text: config.y.label }, range: [config.y.min, config.y.max] },
    });
  }

  return graphConfig;
}

export function handleData(data: any, graphConfig: GraphConfig | null): void {
  if (!graphConfig) return;
  console.log(`Timestamp: ${data.timestamp}, Values:`, data.values);

  if (graphConfig.graphType === "line" || graphConfig.graphType === "scatter") {
    const update = { x: [] as any[], y: [] as any[] };
    const traceIndices: number[] = [];
    graphConfig.series.forEach((s, idx) => {
      const yCol = s.y_column;
      if (data.values[yCol] !== undefined) {
        update.x.push([data.timestamp / 1000]);
        update.y.push([data.values[yCol]]);
        traceIndices.push(idx);
      }
    });
    if (update.x.length) {
      if (graphConfig.x.label === "time (seconds)") {
        Plotly.extendTraces("plot", update, traceIndices, 30);
      }
      else {
        Plotly.extendTraces("plot", update, traceIndices);
      }
    }
  } else if (graphConfig.graphType === "bar") {

    const newY = graphConfig.series.map((s) => data.values[s.y_column] ?? 0);

    if (newY.length) {
      Plotly.update("plot", { y: [newY] }, {}, [0]);
    }

  } else if (graphConfig.graphType === "pie") {

    const newVals = graphConfig.series.map((s) => data.values[s.y_column] ?? 0);

    if (newVals.length) {
      Plotly.update("plot", { values: [newVals] } as any, {}, [0]);
    }

  }

  // Rerender table or graph after updating data
  renderTableOrGraph();
}
