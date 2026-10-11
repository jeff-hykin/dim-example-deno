import * as THREE from "three";
/** A depth image's raw pixels: 16UC1 (millimeters) or 32FC1 (meters), row-major, one value per pixel. */
export type DepthPixels = Uint16Array | Float32Array;
/** A depth image as camera streams deliver it. */
export interface DepthImage {
    width: number;
    height: number;
    encoding: string;
    data: DepthPixels;
}
/** How depth is colored: a colormap name and a fixed range in meters (null = automatic). */
export interface DepthLook {
    colormap: string;
    near: number | null;
    far: number | null;
}
/** Tracks the automatic range (2nd–98th percentile of valid depth, eased) so it doesn't flicker frame to frame. */
export declare class DepthRange {
    #private;
    near: number;
    far: number;
    /** @param look fixed range (meters), null = automatic */
    update(image: {
        width: number;
        height: number;
        encoding: string;
        data: ArrayLike<number>;
    }, look: {
        near: number | null;
        far: number | null;
    }): [number, number];
}
/** A depth texture colored the same way, as a three.js material (`.material`); `update(image, look)` per image. */
export declare class DepthMaterial {
    #private;
    material: THREE.ShaderMaterial;
    constructor();
    update(image: DepthImage, look?: DepthLook): void;
    dispose(): void;
}
