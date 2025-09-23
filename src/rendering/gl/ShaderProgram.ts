import { vec4, mat4 } from 'gl-matrix';
import Drawable from './Drawable';
import { gl } from '../../globals';

var activeProgram: WebGLProgram = null;

export class Shader {
    shader: WebGLShader;

    constructor(type: number, source: string) {
        this.shader = gl.createShader(type);
        gl.shaderSource(this.shader, source);
        gl.compileShader(this.shader);

        if (!gl.getShaderParameter(this.shader, gl.COMPILE_STATUS)) {
            throw gl.getShaderInfoLog(this.shader);
        }
    }
};

class ShaderProgram {
    prog: WebGLProgram;

    attrPos: number;
    attrNor: number;
    attrCol: number;

    unifModel: WebGLUniformLocation;
    unifModelInvTr: WebGLUniformLocation;
    unifViewProj: WebGLUniformLocation;
    unifColor: WebGLUniformLocation;
    unifTime: WebGLUniformLocation;
    unifAmp: WebGLUniformLocation;
    unifFreq: WebGLUniformLocation;
    unifSpeed: WebGLUniformLocation;
    unifNoiseScale: WebGLUniformLocation;
    unifNoiseStrength: WebGLUniformLocation;
    unifNoiseSpeed: WebGLUniformLocation;
    unifColorGradient: WebGLUniformLocation;
    unifUseGradient: WebGLUniformLocation;

    constructor(shaders: Array<Shader>) {
        this.prog = gl.createProgram();

        for (let shader of shaders) {
            gl.attachShader(this.prog, shader.shader);
        }
        gl.linkProgram(this.prog);
        if (!gl.getProgramParameter(this.prog, gl.LINK_STATUS)) {
            throw gl.getProgramInfoLog(this.prog);
        }

        this.attrPos = gl.getAttribLocation(this.prog, "vs_Pos");
        this.attrNor = gl.getAttribLocation(this.prog, "vs_Nor");
        this.attrCol = gl.getAttribLocation(this.prog, "vs_Col");
        this.unifModel = gl.getUniformLocation(this.prog, "u_Model");
        this.unifModelInvTr = gl.getUniformLocation(this.prog, "u_ModelInvTr");
        this.unifViewProj = gl.getUniformLocation(this.prog, "u_ViewProj");
        this.unifColor = gl.getUniformLocation(this.prog, "u_Color");
        this.unifTime = gl.getUniformLocation(this.prog, "u_Time");
        this.unifAmp = gl.getUniformLocation(this.prog, "u_Amp");
        this.unifFreq = gl.getUniformLocation(this.prog, "u_Freq");
        this.unifSpeed = gl.getUniformLocation(this.prog, "u_Speed");
        this.unifNoiseScale = gl.getUniformLocation(this.prog, "u_NoiseScale");
        this.unifNoiseStrength = gl.getUniformLocation(this.prog, "u_NoiseStrength");
        this.unifNoiseSpeed = gl.getUniformLocation(this.prog, "u_NoiseSpeed");
        this.unifColorGradient = gl.getUniformLocation(this.prog, "u_ColorGradient");
        this.unifUseGradient = gl.getUniformLocation(this.prog, "u_UseGradient");
    }

    setUseGradient(useGradient: number) {
        this.use();
        if (this.unifUseGradient !== -1) gl.uniform1i(this.unifUseGradient as WebGLUniformLocation, useGradient);
    }

    setNoise(amp: number, freq: number, speed: number) { // sets amp, freq, speed
        this.use();
        if (this.unifAmp !== -1) gl.uniform1f(this.unifAmp as WebGLUniformLocation, amp);
        if (this.unifFreq !== -1) gl.uniform1f(this.unifFreq as WebGLUniformLocation, freq);
        if (this.unifSpeed !== -1) gl.uniform1f(this.unifSpeed as WebGLUniformLocation, speed);
    }

    setNoiseFrag(scale: number, strength: number, speed: number) { // sets attributes for perlin
        this.use();
        if (this.unifNoiseScale !== -1) gl.uniform1f(this.unifNoiseScale as WebGLUniformLocation, scale);
        if (this.unifNoiseStrength !== -1) gl.uniform1f(this.unifNoiseStrength as WebGLUniformLocation, strength);
        if (this.unifNoiseSpeed !== -1) gl.uniform1f(this.unifNoiseSpeed as WebGLUniformLocation, speed);
    }

    setColorGradient(colorGradient: vec4) {
        this.use();
        if (this.unifColorGradient !== -1) {
            gl.uniform4fv(this.unifColorGradient, colorGradient);
        }
    }

    setTime(t: number) {
        this.use();
        if (this.unifTime !== -1) {
            gl.uniform1f(this.unifTime as WebGLUniformLocation, t);
        }
    }

    use() {
        if (activeProgram !== this.prog) {
            gl.useProgram(this.prog);
            activeProgram = this.prog;
        }
    }

    setModelMatrix(model: mat4) {
        this.use();
        if (this.unifModel !== -1) {
            gl.uniformMatrix4fv(this.unifModel, false, model);
        }

        if (this.unifModelInvTr !== -1) {
            let modelinvtr: mat4 = mat4.create();
            mat4.transpose(modelinvtr, model);
            mat4.invert(modelinvtr, modelinvtr);
            gl.uniformMatrix4fv(this.unifModelInvTr, false, modelinvtr);
        }
    }

    setViewProjMatrix(vp: mat4) {
        this.use();
        if (this.unifViewProj !== -1) {
            gl.uniformMatrix4fv(this.unifViewProj, false, vp);
        }
    }

    setGeometryColor(color: vec4) {
        this.use();
        if (this.unifColor !== -1) {
            gl.uniform4fv(this.unifColor, color);
        }
    }

    draw(d: Drawable) {
        this.use();

        if (this.attrPos != -1 && d.bindPos()) {
            gl.enableVertexAttribArray(this.attrPos);
            gl.vertexAttribPointer(this.attrPos, 4, gl.FLOAT, false, 0, 0);
        }

        if (this.attrNor != -1 && d.bindNor()) {
            gl.enableVertexAttribArray(this.attrNor);
            gl.vertexAttribPointer(this.attrNor, 4, gl.FLOAT, false, 0, 0);
        }

        d.bindIdx();
        gl.drawElements(d.drawMode(), d.elemCount(), gl.UNSIGNED_INT, 0);

        if (this.attrPos != -1) gl.disableVertexAttribArray(this.attrPos);
        if (this.attrNor != -1) gl.disableVertexAttribArray(this.attrNor);
    }
};

export default ShaderProgram;