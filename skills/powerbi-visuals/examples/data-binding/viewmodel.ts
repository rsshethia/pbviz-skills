import powerbi from "powerbi-visuals-api";
import { valueFormatter } from "powerbi-visuals-utils-formattingutils";

type DataView = powerbi.DataView;
type DataViewCategoryColumn = powerbi.DataViewCategoryColumn;
type DataViewValueColumn = powerbi.DataViewValueColumn;
type PrimitiveValue = powerbi.PrimitiveValue;
type IVisualHost = powerbi.extensibility.visual.IVisualHost;
type ISelectionId = powerbi.visuals.ISelectionId;

export interface DataPoint {
  label: string;
  value: number;
  selectionId: ISelectionId;
  /** null when the visual does not support highlights, true/false otherwise */
  highlighted: boolean | null;
  displayValue: string;
}

export interface ViewModel {
  points: DataPoint[];
  max: number;
  status: "no-fields" | "no-data" | "ok";
}

const EMPTY: ViewModel = { points: [], max: 0, status: "no-fields" };

/**
 * DataView -> ViewModel. This is the ONLY place that knows about Power BI
 * data shapes. Rendering code receives this plain model, never a DataView.
 */
export function transformCategorical(
  dataView: DataView | undefined,
  host: IVisualHost
): ViewModel {
  if (!dataView || !dataView.categorical) {
    return EMPTY;
  }

  const categorical = dataView.categorical;
  if (!categorical.categories || !categorical.categories[0] ||
      !categorical.values || !categorical.values[0] ||
      categorical.categories[0].values.length === 0) {
    return { points: [], max: 0, status: "no-fields" };
  }

  const categories: DataViewCategoryColumn = categorical.categories[0];
  const values: DataViewValueColumn = categorical.values[0];
  const highlights: PrimitiveValue[] | undefined = values.highlights;
  const objects = values.objects; // dynamic format strings (API 4.2+)
  const points: DataPoint[] = [];

  for (let i = 0; i < categories.values.length; i++) {
    const raw = values.values[i];

    // Never coerce null to zero: zero is data, null is missing.
    if (raw === null || raw === undefined || typeof raw !== "number") {
      continue;
    }

    const formatObjects: any = objects && objects[i];
    const formatString = formatObjects && formatObjects.general
      ? formatObjects.general.formatString as string
      : undefined;

    const highlight = highlights ? highlights[i] : undefined;

    points.push({
      label: String(categories.values[i]),
      value: raw,
      selectionId: host.createSelectionIdBuilder()
        .withCategory(categories, i)
        .createSelectionId(),
      highlighted: highlights
        ? highlight !== null && highlight !== undefined
        : null,
      displayValue: formatString
        ? valueFormatter.format(raw, formatString)
        : valueFormatter.format(raw, "#,0.00")
    });
  }

  return {
    points,
    max: points.reduce((m, p) => Math.max(m, p.value), 0) || 1,
    status: points.length === 0 ? "no-data" : "ok"
  };
}

/** Render helper: dim cross-filtered points, never delete them. */
export function isDimmed(point: DataPoint): boolean {
  return point.highlighted === false;
}
