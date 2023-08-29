import type { MatchImageSnapshotOptions } from "jest-image-snapshot";
declare module 'jest-snapshot' {
    interface SnapshotMatchers<R extends void | Promise<void>, T> {
        toMatchImageSnapshot(this: SnapshotMatchers<R, T>, options?: MatchImageSnapshotOptions): R;
    }
}
