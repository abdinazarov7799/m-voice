export class AudioLevelDetector {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array | null = null;
  private animationFrameId: number | null = null;

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

      const buffer = new ArrayBuffer(this.analyser.frequencyBinCount);
      this.dataArray = new Uint8Array(buffer);

      this.poll(callback);
    } catch (error) {
      console.error('[AudioLevelDetector] Error starting:', error);
      throw error;
    }
  }

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

  private poll(callback: (level: number) => void): void {
    if (!this.analyser || !this.dataArray) return;

    // @ts-expect-error - TypeScript's strict ArrayBuffer vs ArrayBufferLike distinction
    this.analyser.getByteFrequencyData(this.dataArray);

    const sum = this.dataArray.reduce((acc, val) => acc + val * val, 0);
    const rms = Math.sqrt(sum / this.dataArray.length);
    const normalized = Math.min(rms / 255, 1);

    callback(normalized);

    this.animationFrameId = requestAnimationFrame(() => this.poll(callback));
  }
}

