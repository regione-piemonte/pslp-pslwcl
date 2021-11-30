/**
 * Slider event
 * interfaccia
 */
export interface SliderEvent {
  input?: any;
  slider?: any;
  min?: number;
  max?: number;
  from?: number;
  from_percent?: number;
  from_value?: number;
  to?: number;
  to_percent?: number;
  to_value?: number;
  min_pretty?: string;
  max_pretty?: string;
  from_pretty?: string;
  to_pretty?: string;
}

/**
 * Slider configuration
 * interfaccia configurazione slider
 */
export interface SliderConfiguration {
  type?: 'single' | 'double';
  min?: number;
  max?: number;
  from?: number;
  to?: number;
  step?: number;
  values?: any[];
  keyboard?: boolean;
  grid?: boolean;
  grid_margin?: boolean;
  grid_num?: number;
  grid_snap?: boolean;
  drag_interval?: boolean;
  min_interval?: number;
  max_interval?: number;
  from_fixed?: boolean;
  from_min?: number;
  from_max?: number;
  from_shadow?: number;
  to_fixed?: boolean;
  to_min?: number;
  to_max?: number;
  to_shadow?: number;
  skin?: string;
  hide_min_max?: boolean;
  hide_from_to?: boolean;
  force_edges?: boolean;
  extra_classes?: string;
  block?: boolean;
  prettify_enabled?: boolean;
  prettify_separator?: string;
  prettify?: (val: any) => any;
  prefix?: string;
  postfix?: string;
  max_postfix?: string;
  decorate_both?: boolean;
  values_separator?: string;
  input_values_separator?: string;
  disable?: boolean;
  onStart?: (e: SliderEvent) => void;
  onChange?: (e: SliderEvent) => void;
  onFinish?: (e: SliderEvent) => void;
  onUpdate?: (e: SliderEvent) => void;
}
