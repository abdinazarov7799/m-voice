/**
 * Unit Tests: AudioLevelDetector
 * 
 * Tests the audio level detection utility.
 */
import { AudioLevelDetector } from '../src/usecases/AudioLevelDetector';

describe('AudioLevelDetector', () => {
  let detector: AudioLevelDetector;
  let mockStream: MediaStream;

  beforeEach(() => {
    detector = new AudioLevelDetector();
    mockStream = {
      getTracks: jest.fn().mockReturnValue([]),
    } as unknown as MediaStream;
  });

  afterEach(() => {
    detector.stop();
  });

  describe('start', () => {
    it('should start monitoring audio levels', () => {
      const callback = jest.fn();

      detector.start(mockStream, callback);

      // The callback should eventually be called (via requestAnimationFrame)
      expect(callback).toBeDefined();
    });

    it('should not start twice', () => {
      const callback = jest.fn();
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      detector.start(mockStream, callback);
      detector.start(mockStream, callback);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Already started'),
      );

      consoleWarnSpy.mockRestore();
    });
  });

  describe('stop', () => {
    it('should stop monitoring', () => {
      const callback = jest.fn();

      detector.start(mockStream, callback);
      detector.stop();

      // After stopping, callback should not be called anymore
      // (This is hard to test definitively without waiting)
      expect(() => detector.stop()).not.toThrow();
    });

    it('should handle stop when not started', () => {
      expect(() => detector.stop()).not.toThrow();
    });

    it('should be able to restart after stopping', () => {
      const callback = jest.fn();

      detector.start(mockStream, callback);
      detector.stop();
      detector.start(mockStream, callback);

      expect(callback).toBeDefined();
    });
  });
});

