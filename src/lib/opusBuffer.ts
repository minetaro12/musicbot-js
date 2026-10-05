import { Duplex, type TransformCallback } from "node:stream";

// FFmpeg emits 20 ms Opus packets. Keep a bounded queue and refill after starvation.
export class OpusBuffer extends Duplex {
  private packets: Buffer[] = [];
  private buffering = true;
  private demand = false;
  private finished = false;
  private pendingWrite?: TransformCallback;
  private pumping = false;
  private readonly startPackets: number;
  private readonly maxPackets: number;

  constructor(startPackets = 150, maxPackets = 500) {
    super({ objectMode: true, readableHighWaterMark: 1, writableHighWaterMark: 1 });
    if (!Number.isInteger(startPackets) || !Number.isInteger(maxPackets) || startPackets < 1 || maxPackets < startPackets) {
      throw new RangeError("Invalid Opus buffer limits");
    }
    this.startPackets = startPackets;
    this.maxPackets = maxPackets;
  }

  override _read() {
    this.demand = true;
    this.pump();
  }

  override _write(packet: Buffer, _encoding: BufferEncoding, callback: TransformCallback) {
    this.packets.push(packet);
    this.pendingWrite = callback;
    this.pump();
  }

  override _final(callback: TransformCallback) {
    this.finished = true;
    this.pump();
    callback();
  }

  override _destroy(error: Error | null, callback: (error?: Error | null) => void) {
    this.packets = [];
    const pending = this.pendingWrite;
    this.pendingWrite = undefined;
    pending?.(error ?? new Error("Opus buffer destroyed"));
    callback(error);
  }

  private pump() {
    if (this.pumping || this.destroyed) return;
    this.pumping = true;
    try {
      do {
        if (this.buffering && (this.packets.length >= this.startPackets || this.finished)) {
          this.buffering = false;
        }
        while (this.demand && !this.buffering && this.packets.length > 0) {
          this.demand = this.push(this.packets.shift()!);
        }
        if (this.packets.length === 0) {
          if (this.finished) this.push(null);
          else this.buffering = true;
        }
        if (!this.pendingWrite || this.packets.length >= this.maxPackets) break;
        const pending = this.pendingWrite;
        this.pendingWrite = undefined;
        pending();
        // The callback may synchronously supply the next packet.
      } while (!this.destroyed);
    } finally {
      this.pumping = false;
    }
  }
}
