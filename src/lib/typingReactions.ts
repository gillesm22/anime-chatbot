"use client";

export interface TypingMetrics {
  avgSpeed: number;
  pauses: number;
  totalTime: number;
  messageLength: number;
}

export class TypingTracker {
  private startTime: number | null = null;
  private lastKeystrokeTime: number | null = null;
  private keystrokeCount: number = 0;
  private pauseCount: number = 0;
  private readonly PAUSE_THRESHOLD_MS = 5000; // 5 seconds = long pause

  startTracking(): void {
    this.startTime = Date.now();
    this.lastKeystrokeTime = null;
    this.keystrokeCount = 0;
    this.pauseCount = 0;
  }

  recordKeystroke(): void {
    const now = Date.now();

    if (this.startTime === null) {
      this.startTime = now;
    }

    if (
      this.lastKeystrokeTime !== null &&
      now - this.lastKeystrokeTime >= this.PAUSE_THRESHOLD_MS
    ) {
      this.pauseCount += 1;
    }

    this.lastKeystrokeTime = now;
    this.keystrokeCount += 1;
  }

  getMetrics(): TypingMetrics {
    const now = Date.now();
    const totalTime =
      this.startTime !== null ? (now - this.startTime) / 1000 : 0; // seconds
    const avgSpeed =
      totalTime > 0 ? this.keystrokeCount / totalTime : 0; // chars/sec

    return {
      avgSpeed,
      pauses: this.pauseCount,
      totalTime,
      messageLength: this.keystrokeCount,
    };
  }

  getReactionHint(): string | null {
    const metrics = this.getMetrics();

    // Long pause detected mid-message
    if (metrics.pauses > 0) {
      return "The user paused for a while mid-message, they might be thinking carefully or hesitating";
    }

    // Very short message
    if (metrics.messageLength < 10) {
      return "The user sent a very brief message, they might be distracted or giving a quick response";
    }

    // Very long message
    if (metrics.messageLength > 200) {
      return "The user wrote a long detailed message, they're really engaged and sharing a lot";
    }

    // Very fast typing
    if (metrics.avgSpeed > 8) {
      return "The user is typing very fast and excitedly, they seem eager";
    }

    // Very slow typing (only meaningful if they actually typed for a while)
    if (metrics.avgSpeed < 2 && metrics.totalTime > 5) {
      return "The user is typing slowly and thoughtfully, taking their time";
    }

    return null;
  }
}
