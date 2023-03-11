import cliProgress, { SingleBar } from "cli-progress";
import * as colors from "ansi-colors";

export class ProgressBar {
  private bar: SingleBar;
  private currentValue: number;

  constructor(private options?: cliProgress.Options) {
    const bar = colors.cyan("{bar}");
    const format = `${bar} {percentage}% | ETA: {eta_formatted} | {value}/{total}\n`;
    this.bar = new cliProgress.SingleBar(
      {
        ...(options || {}),
        format: options?.format || format
      },
      cliProgress.Presets.shades_classic
    );
    this.currentValue = 0;
  }

  public start(total: number, current: number = 0): void {
    this.bar.start(total, current);
  }

  public update(value: number): void {
    this.currentValue = value;
    this.bar.update(this.currentValue);
  }

  public stop(): void {
    this.bar.stop();
  }

  public increment(value: number = 1): void {
    this.currentValue += value;
    this.bar.update(this.currentValue);
  }

  public decrement(value: number = 1): void {
    this.currentValue -= value;
    this.bar.update(this.currentValue);
  }
}
