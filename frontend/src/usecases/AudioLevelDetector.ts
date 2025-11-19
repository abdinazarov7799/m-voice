/**
 * Use Case: Audio Level Detector
 * 
 * Detects audio levels from a MediaStream using Web Audio API.
 * This is a reusable utility that can be tested independently.
 * 
 * SOLID Principle Applied: Single Responsibility
 * This class has one job: detect audio levels from a stream.
 */

export class AudioLevelDetector {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array | null = null;
  private animationFrameId: number | null = null;

  /**
   * Start detecting audio levels from a stream.
   * @param stream The MediaStream to monitor
   * @param callback Called with the audio level (0-1) on each frame
   */
  start(stream: MediaStream, callback: (level: number) => void): void {
    if (this.audioContext) {
      console.warn('[AudioLevelDetector] Already started');
      return;
    }

    try {
      this.audioContext = new AudioContext();
      const source = this.audioContext.createMediaStreamSource(stream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.8;
      source.connect(this.analyser);

      // Create array with explicit ArrayBuffer to satisfy TypeScript strict checks
      const buffer = new ArrayBuffer(this.analyser.frequencyBinCount);
      this.dataArray = new Uint8Array(buffer);

      this.poll(callback);
    } catch (error) {
      console.error('[AudioLevelDetector] Error starting:', error);
      throw error;
    }
  }

  /**
   * Stop detecting audio levels.
   */
  stop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.analyser = null;
    this.dataArray = null;
  }

  /**
   * Poll audio level using requestAnimationFrame.
   */
  private poll(callback: (level: number) => void): void {
    if (!this.analyser || !this.dataArray) return;

    // TypeScript strict mode: getByteFrequencyData expects Uint8Array<ArrayBuffer>
    // but our array is inferred as Uint8Array<ArrayBufferLike>
    // This is a TypeScript limitation - runtime behavior is correct
    // We create with ArrayBuffer (line 37), so this is safe
    // @ts-expect-error - TypeScript's strict ArrayBuffer vs ArrayBufferLike distinction
    // is overly strict here. The array is created with ArrayBuffer and works correctly at runtime.
    this.analyser.getByteFrequencyData(this.dataArray);

    // Calculate RMS (root mean square) for more accurate volume
    const sum = this.dataArray.reduce((acc, val) => acc + val * val, 0);
    const rms = Math.sqrt(sum / this.dataArray.length);
    const normalized = Math.min(rms / 255, 1);

    callback(normalized);

    this.animationFrameId = requestAnimationFrame(() => this.poll(callback));
  }
}

