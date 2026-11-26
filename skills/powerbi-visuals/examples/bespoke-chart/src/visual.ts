import powerbi from "powerbi-visuals-api";
import { pie, arc } from "d3-shape";
import "./../style/visual.less";

type VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
type VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
type IVisual = powerbi.extensibility.visual.IVisual;
type IVisualHost = powerbi.extensibility.visual.IVisualHost;
type DataView = powerbi.DataView;
type ISelectionId = powerbi.visuals.ISelectionId;

interface Slice {
  label: string;
  value: number;
  color: string;
  selectionId: ISelectionId;
}

interface ViewModel {
  slices: Slice[];
  total: number;
}

export class Visual implements IVisual {
  private host: IVisualHost;
  private selectionManager: powerbi.extensibility.visual.ISelectionManager;
  private svg: SVGSVGElement;
  private model: ViewModel = { slices: [], total: 0 };

  constructor(options: VisualConstructorOptions) {
    this.host = options.host;
    this.selectionManager = this.host.createSelectionManager();
    this.svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    this.svg.setAttribute("class", "donut-chart");
    this.svg.setAttribute("role", "img");
    this.svg.setAttribute("aria-label", "Donut chart with center total");
    options.element.appendChild(this.svg);
  }

  public update(options: VisualUpdateOptions): void {
    const dataView: DataView | undefined = options.dataViews && options.dataViews[0];
    if (!dataView) { this.svg.textContent = ""; return; }

    this.model = this.transform(dataView);
    this.render(options.viewport.width, options.viewport.height);
  }

  private transform(dataView: DataView): ViewModel {
    const empty: ViewModel = { slices: [], total: 0 };
    const categorical = dataView.categorical;
    if (!categorical || !categorical.categories || !categorical.categories[0] ||
        !categorical.values || !categorical.values[0]) {
      return empty;
    }

    const categories = categorical.categories[0];
    const values = categorical.values[0];
    const palette = this.host.colorPalette as powerbi.extensibility.ISandboxExtendedColorPalette;
    const slices: Slice[] = [];

    for (let i = 0; i < categories.values.length; i++) {
      const raw = values.values[i];
      if (raw === null || raw === undefined || typeof raw !== "number" || raw <= 0) {
        continue;
      }
      slices.push({
        label: String(categories.values[i]),
        value: raw,
        color: palette.isHighContrast ? palette.foreground.value : palette.getColor(String(categories.values[i])).value,
        selectionId: this.host.createSelectionIdBuilder()
          .withCategory(categories, i)
          .createSelectionId()
      });
    }

    return { slices, total: slices.reduce((sum, s) => sum + s.value, 0) };
  }

  private render(width: number, height: number): void {
    this.svg.setAttribute("viewBox", `0 0 ${Math.max(width, 0)} ${Math.max(height, 0)}`);
    this.svg.textContent = "";

    if (!this.model.slices.length) {
      const message = document.createElementNS("http://www.w3.org/2000/svg", "text");
      message.setAttribute("class", "empty-state");
      message.setAttribute("x", String(width / 2));
      message.setAttribute("y", String(height / 2));
      message.setAttribute("text-anchor", "middle");
      message.textContent = "Add a category and a positive value";
      this.svg.appendChild(message);
      return;
    }

    const radius = Math.max(Math.min(width, height) / 2 - 12, 1);
    const inner = radius * 0.6;
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.setAttribute("transform", `translate(${width / 2},${height / 2})`);

    const layout = pie<Slice>().sort(null).value((d: Slice) => d.value);
    const arcGen = arc<any>().innerRadius(inner).outerRadius(radius).cornerRadius(2);

    layout(this.model.slices).forEach((datum) => {
      const slice = datum.data;
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("class", "slice");
      path.setAttribute("d", arcGen(datum) || "");
      path.setAttribute("tabindex", "0");
      path.setAttribute("role", "button");
      path.setAttribute("aria-label", `${slice.label}: ${slice.value}`);
      path.style.fill = slice.color;

      const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
      title.textContent = `${slice.label}: ${slice.value}`;
      path.appendChild(title);

      path.addEventListener("click", () => this.selectionManager.select(slice.selectionId, false));
      path.addEventListener("keydown", (event: KeyboardEvent) => {
        if (event.key === "Enter" || event.key === " ") {
          this.selectionManager.select(slice.selectionId, false);
          event.preventDefault();
        }
      });
      path.addEventListener("mousemove", (event: MouseEvent) => {
        if (!this.host.tooltipService.enabled()) { return; }
        this.host.tooltipService.show({
          coordinates: { x: event.clientX, y: event.clientY },
          isTouchEvent: false,
          dataItems: [{ displayName: slice.label, value: String(slice.value), color: slice.color, header: "Value" }],
          identities: [slice.selectionId]
        });
      });
      path.addEventListener("mouseleave", () => this.host.tooltipService.hide({ immediate: true }));

      group.appendChild(path);
    });

    const center = document.createElementNS("http://www.w3.org/2000/svg", "text");
    center.setAttribute("class", "center-value");
    center.setAttribute("text-anchor", "middle");
    center.setAttribute("y", "5");
    center.textContent = this.model.total.toLocaleString();
    group.appendChild(center);

    this.svg.appendChild(group);
  }
}
