import {vec3, vec4} from 'gl-matrix';
import Drawable from '../rendering/gl/Drawable';
import { gl } from '../globals';

class Cube extends Drawable {
    indices: Uint32Array;
    positions: Float32Array;
    normals: Float32Array;
    center: vec4;
    constructor(center: vec3) {
        super();
        this.center = vec4.fromValues(center[0], center[1], center[2], 1);
    }

    create() {
        this.normals = new Float32Array(
            [
                // front
                0, 0, 1, 0,
                0, 0, 1, 0,
                0, 0, 1, 0,
                0, 0, 1, 0,

                // back
                0, 0, -1, 0,
                0, 0, -1, 0,
                0, 0, -1, 0,
                0, 0, -1, 0,

                // right
                1, 0, 0, 0,
                1, 0, 0, 0,
                1, 0, 0, 0,
                1, 0, 0, 0,

                // left
                -1, 0, 0, 0,
                -1, 0, 0, 0,
                -1, 0, 0, 0,
                -1, 0, 0, 0,

                // top
                0, 1, 0, 0,
                0, 1, 0, 0,
                0, 1, 0, 0,
                0, 1, 0, 0,

                // bottom
                0, -1, 0, 0,
                0, -1, 0, 0,
                0, -1, 0, 0,
                0, -1, 0, 0,
            ]);

        this.positions = new Float32Array(
            [   // front
                -1, -1, 1, 1,
                1, -1, 1, 1,
                1, 1, 1, 1,
                -1, 1, 1, 1,

                // back
                -1, -1, -1, 1,
                1, -1, -1, 1,
                1, 1, -1, 1,
                -1, 1, -1, 1,

                // right
                1, -1, -1, 1,
                1, -1, 1, 1,
                1, 1, 1, 1,
                1, 1, -1, 1,

                // left
                -1, -1, -1, 1,
                -1, 1, -1, 1,
                -1, 1, 1, 1,
                -1, -1, 1, 1,

                // top
                -1, 1, -1, 1,
                -1, 1, 1, 1,
                1, 1, 1, 1,
                1, 1, -1, 1,

                // bottom
                -1, -1, -1, 1,
                1, -1, -1, 1,
                1, -1, 1, 1,
                -1, -1, 1, 1
            ]);

        const index: number[] = [];
        for (let f = 0; f < 6; f++) {
            const i = f * 4;
            index.push(i, i + 1, i + 2, i, i + 2, i + 3);
        }
        this.indices = new Uint32Array(index);

        this.generateIdx();
        this.generatePos();
        this.generateNor();

        this.count = this.indices.length;
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.bufIdx);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufNor);
        gl.bufferData(gl.ARRAY_BUFFER, this.normals, gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufPos);
        gl.bufferData(gl.ARRAY_BUFFER, this.positions, gl.STATIC_DRAW);

        console.log(`Created cube`);
    }
};

export default Cube;