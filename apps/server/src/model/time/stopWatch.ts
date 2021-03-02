export class StopWatch {
  private begin: number;
  private point: number;
  private end: number;
  private splits: number[] = [];

  start(): void {
    this.begin = Date.now();
    this.point = this.begin;
  }

  split(): number {
    const current = Date.now();
    const split = current - this.point;
    this.point = current;
    return split;
  }

  total(): number {
    return this.stop();
  }

  stop(): number {
    this.end = Date.now();
    return this.end - this.begin;
  }
}
