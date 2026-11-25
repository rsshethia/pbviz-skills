import powerbi from "powerbi-visuals-api";
import "./../style/visual.less";

type VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
type VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
type IVisual = powerbi.extensibility.visual.IVisual;
type IVisualHost = powerbi.extensibility.visual.IVisualHost;
type ISelectionManager = powerbi.extensibility.visual.ISelectionManager;
type ISelectionId = powerbi.visuals.ISelectionId;
type DataView = powerbi.DataView;
type PrimitiveValue = powerbi.PrimitiveValue;

interface DataPoint {
  label: string;
  value: number;
  color: string;
  selectionId: ISelectionId;
  highlights?: number;
}

interface ViewModel {
  points: DataPoint[];
  max: number;
}

const SVG_NS = "http://www.w3.org/2000/svg";

export class Visual implements IVisual {
  private host: IVisualHost;
  private root: HTMLElement;
  private svg: SVGSVGElement;
  private selectionManager: ISelectionManager;
  private model: ViewModel = { points: [], max: 0 };

  constructor(options: VisualConstructorOptions) {
    this.host = options.host;
    this.selectionManager = this.host.createSelectionManager();
    this.root = options.element;

    this.svg = document.createElementNS(SVG_NS, "svg");
    this.svg.setAttribute("class", "bar-chart");
    this.svg.setAttribute("role", "img");
    this.svg.setAttribute("aria-label", "Bar chart of selected categories and values");
    this.root.appendChild(this.svg);

    // Right-click / long-press: basic context menu on the whole visual.
    this.root.addEventListener("contextmenu", (event: MouseEvent) => {
      this.selectionManager.showContextMenu({}, { x: event.clientX, y: event.clientY });
      event.preventDefault();
    });
  }

  public update(options: VisualUpdateOptions): void {
    const resizeFlags = powerbi.VisualUpdateType.Resize | powerbi.VisualUpdateType.ResizeEnd;
    const isResize = (options.type & powerbi.VisualUpdateType.Resize) !== 0;
    const isResizeEnd = (options.type & powerbi.VisualUpdateType.ResizeEnd) !== 0;
    const onlyResize = (options.type & ~resizeFlags) === 0;

    if (onlyResize) {
      // No data/style change: reuse the cached view model.
      if (isResizeEnd || !isResize) {
        this.render(options);
      }
      return;
    }

    const dataView: DataView = options.dataViews && options.dataViews[0];
    this.model = this.transform(dataView);
    this.render(options);
  }

  /** DataView -> view model. Keep all data-shape assumptions here. */
  private transform(dataView: DataView): ViewModel {
    const empty: ViewModel = { points: [], max: 0 };
    if (!dataView || !dataView.categorical || !dataView.categorical.categories ||
        !dataView.categorical.categories[0] || !dataView.categorical.values ||
        !dataView.categorical.values[0]) {
      return empty;
    }

    const categories = dataView.categorical.categories[0];
    const values = dataView.categorical.values[0];
    const palette = this.host.colorPalette;
    const extended = palette as powerbi.extensibility.ISandboxExtendedColorPalette;
    const points: DataPoint[] = [];

    for (let i = 0; i < categories.values.length; i++) {
      const raw: PrimitiveValue = values.values[i];
      if (raw === null || raw === undefined || typeof raw !== "number") {
        continue;
      }
      const label = String(categories.values[i]);

      // User-set fill > theme color > fallback. High contrast uses fixed colors.
      let color: string = extended.isHighContrast
        ? extended.foreground.value
        : palette.getColor(label).value;

      const selectionId = this.host.createSelectionIdBuilder()
        .withCategory(categories, i)
        .createSelectionId();

      const highlight = values.highlights && values.highlights[i];
      points.push({
        label,
        value: raw,
        color,
        selectionId,
        highlights: typeof highlight === "number" ? highlight : undefined
      });
    }

    return {
      points,
      max: points.reduce((m, p) => Math.max(m, p.value), 0) || 1
    };
  }

  /** View model -> DOM. Cheap enough to re-run on ResizeEnd. */
  private render(options: VisualUpdateOptions): void {
    const width = Math.max(options.viewport.width, 0);
    const height = Math.max(options.viewport.height, 0);
    this.svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    this.svg.textContent = "";

    if (!this.model.points.length) {
      const message = document.createElementNS(SVG_NS, "text");
      message.setAttribute("class", "empty-state");
      message.setAttribute("x", String(width / 2));
      message.setAttribute("y", String(height / 2));
      message.setAttribute("text-anchor", "middle");
      message.textContent = "Add a category and a value to see the chart";
      this.svg.appendChild(message);
      return;
    }

    const padding = { top: 8, right: 8, bottom: 24, left: 8 };
    const plotHeight = Math.max(height - padding.top - padding.bottom, 1);
    const slot = (width - padding.left - padding.right) / this.model.points.length;
    const barWidth = Math.max(slot * 0.7, 1);

    this.model.points.forEach((point, index) => {
      const barHeight = Math.max((point.value / this.model.max) * plotHeight, 0);
      const x = padding.left + index * slot + (slot - barWidth) / 2;
      const y = padding.top + plotHeight - barHeight;
      const dimmed = point.highlights !== undefined && point.highlights < point.value;

      const rect = document.createElementNS(SVG_NS, "rect");
      rect.setAttribute("class", "bar");
      rect.setAttribute("x", String(x));
      rect.setAttribute("y", String(y));
      rect.setAttribute("width", String(barWidth));
      rect.setAttribute("height", String(barHeight));
      rect.setAttribute("tabindex", "0");
      rect.setAttribute("role", "button");
      rect.setAttribute("aria-label", `${point.label}: ${point.value}`);
      rect.style.fill = point.color;
      rect.style.opacity = dimmed ? "0.4" : "1";

      // Safe: textContent, never innerHTML.
      const title = document.createElementNS(SVG_NS, "title");
      title.textContent = `${point.label}: ${point.value}`;
      rect.appendChild(title);

      rect.addEventListener("click", () => {
        this.selectionManager.select(point.selectionId, false);
      });
      rect.addEventListener("keydown", (event: KeyboardEvent) => {
        if (event.key === "Enter" || event.key === " ") {
          this.selectionManager.select(point.selectionId, false);
          event.preventDefault();
        }
      });
      rect.addEventListener("mousemove", (event: MouseEvent) => {
        if (!this.host.tooltipService.enabled()) { return; }
        this.host.tooltipService.show({
          coordinates: { x: event.clientX, y: event.clientY },
          isTouchEvent: false,
          dataItems: [{
            displayName: point.label,
            value: String(point.value),
            color: point.color,
            header: "Value"
          }],
          identities: [point.selectionId]
        });
      });
      rect.addEventListener("mouseleave", () => this.host.tooltipService.hide({ immediate: true }));
      rect.addEventListener("contextmenu", (event: MouseEvent) => {
        this.selectionManager.showContextMenu(point.selectionId, {
          x: event.clientX,
          y: event.clientY
        });
        event.preventDefault();
      });

      this.svg.appendChild(rect);
    });
  }
}
