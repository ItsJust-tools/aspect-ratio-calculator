export type FitMode = 'fit' | 'cover';
export type Orientation = 'landscape' | 'portrait';

export interface ToolState {
  /** Ratio numerator (e.g. 16) */
  ratioW: number;
  /** Ratio denominator (e.g. 9) */
  ratioH: number;
  /** Known width input, empty string when solving for width */
  width: string;
  /** Known height input, empty string when solving for height */
  height: string;
  /** Fit (contain) / cover mode for bounding-box resizing */
  fitMode: FitMode;
  /** Bounding box width for fit/cover */
  boxWidth: string;
  /** Bounding box height for fit/cover */
  boxHeight: string;
  /** Round results to the nearest valid integer dimensions */
  integerMode: boolean;
  /** Current ratio orientation label */
  orientation: Orientation;
}

export interface Dimensions {
  width: number;
  height: number;
}

export interface RatioResult {
  ratioW: number;
  ratioH: number;
}
