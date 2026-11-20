export type SlugSeparator = '-' | '_' | '.';

export interface ToolState {
  /** Raw input text. In batch mode this may contain multiple lines. */
  input: string;
  /** Configured word separator for the generated slug. */
  separator: SlugSeparator;
  /** Transliterate accented characters (é -> e, ü -> ue). */
  transliterate: boolean;
  /** Remove common English stop words before slugifying. */
  removeStopWords: boolean;
  /** Optional maximum slug length (0 = unlimited). */
  maxLength: number;
  /** Batch mode: one slug per input line. */
  batchMode: boolean;
  /** Last generated slug preview (single line result). */
  output: string;
}
