import {vec3, vec4} from 'gl-matrix';
const Stats = require('stats-js');
import * as DAT from 'dat.gui';
import Icosphere from './geometry/Icosphere';
import Square from './geometry/Square';
import Cube from './geometry/Cube';
import OpenGLRenderer from './rendering/gl/OpenGLRenderer';
import Camera from './Camera';
import {setGL} from './globals';
import ShaderProgram, {Shader} from './rendering/gl/ShaderProgram';

// Define an object with application parameters and button callbacks
// This will be referred to by dat.GUI's functions that add GUI elements.
const controls = {
  tesselations: 5,
  color: '#ff0000',
  colorGradient: '#fff000',
  useRainbow: false, 
  setFreq: 2.25,
  reset: () => {}, 
  'Load Scene': loadScene, // A function pointer, essentially
};

let icosphere: Icosphere;
let square: Square;
let cube: Cube;
let prevTesselations: number = 5;
let sceneReady = false;
// this is used by useDefault so nothing breaks before scene is loaded

function loadScene() {
  icosphere = new Icosphere(vec3.fromValues(0, 0, 0), 1, controls.tesselations);
  icosphere.create();
  square = new Square(vec3.fromValues(0, 0, 0));
  square.create();
  cube = new Cube(vec3.fromValues(0, 0, 0));
  cube.create();
}

// change hex from dat.GUI to a vec4 color
function hexToVec(c: any): vec4 {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(c);
  return vec4.fromValues(
      parseInt(m[1], 16) / 255,
      parseInt(m[2], 16) / 255,
      parseInt(m[3], 16) / 255,
      1.0
  );
}

function main() {
   window.addEventListener('keypress', function (e) {
       // console.log(e.key);
       switch (e.key) {
           // Use this if you wish
       }
   }, false);

   window.addEventListener('keyup', function (e) {
       switch (e.key) {
           // Use this if you wish
       }
   }, false);

  // Initial display for framerate
  const stats = Stats();
  stats.setMode(0);
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.left = '0px';
  stats.domElement.style.top = '0px';
  document.body.appendChild(stats.domElement);

  // Add controls to the gui
  const gui = new DAT.GUI();
  const tess = gui.add(controls, 'tesselations', 0, 8).step(1);
  // add a color picker
  // additionally add a second color for gradient option
  const col1 = gui.addColor(controls, 'color');
  const col2 = gui.addColor(controls, 'colorGradient');
  const rb = gui.add(controls, 'useRainbow');
  const setf = gui.add(controls, 'setFreq');
  gui.add(controls, 'reset');
  gui.add(controls, 'Load Scene');

  // get canvas and webgl context
  const canvas = <HTMLCanvasElement> document.getElementById('canvas');
  const gl = <WebGL2RenderingContext> canvas.getContext('webgl2');
  if (!gl) {
    alert('WebGL 2 not supported!');
  }
  // `setGL` is a function imported above which sets the value of `gl` in the `globals.ts` module.
  // Later, we can import `gl` from `globals.ts` to access it
  setGL(gl);

  // Initial call to load scene
  loadScene();

  const camera = new Camera(vec3.fromValues(0, 0, 5), vec3.fromValues(0, 0, 0));

  const lambert = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/lambert-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/lambert-frag.glsl')),
  ]);

  const custom = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/custom-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/custom-frag.glsl'))
  ]);

  const fireball = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/fireball-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/fireball-frag.glsl'))
  ]);

  // gonna try and get this to work later
  //const flat = new ShaderProgram([
  //  new Shader(gl.VERTEX_SHADER, require('./shaders/flat-vert.glsl')),
  //  new Shader(gl.FRAGMENT_SHADER, require('./shaders/flat-frag.glsl')),
  //]);

  const renderer = new OpenGLRenderer(canvas);
  renderer.setClearColor(0.0, 0.0, 0.0, 1);
  gl.enable(gl.DEPTH_TEST);

  let t0 = performance.now();
  // This function will be called every frame
    function tick() {
    const now = performance.now();
    const tSec = (now - t0) * 0.001; // seconds since start

    camera.update();
    stats.begin();
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.clear();

    if(controls.tesselations != prevTesselations)
    {
      prevTesselations = controls.tesselations;
      icosphere = new Icosphere(vec3.fromValues(0, 0, 0), 1, prevTesselations);
      icosphere.create();
    }

    lambert.setGeometryColor(hexToVec(controls.color));
    custom.setGeometryColor(hexToVec(controls.color));
    // flat.setTime(tSec);

    fireball.setGeometryColor(hexToVec(controls.color));
    fireball.setColorGradient(hexToVec(controls.colorGradient));
    fireball.setFrequency(controls.setFreq);

    if (controls.useRainbow == false) {
        fireball.setUseRainbow(0.0);
    } else {
        fireball.setUseRainbow(1.0);
    }

    custom.setTime(tSec);
    custom.setNoise(0.25, 8.0, 2.0);
    custom.setNoiseFrag(2.5, 0.8, 2.0);

    fireball.setTime(tSec);
    fireball.setNoise(0.16, controls.setFreq, 1.3);
    fireball.setNoiseFrag(2.5, 0.8, 2.0);

    // Reset button function
    const useDefault = () => {
        controls.tesselations = 5;
        controls.color = '#ff0000';
        controls.colorGradient = '#fff000';
        controls.useRainbow = false;
        controls.setFreq = 2.25;

        this.setGeometryColor(hexToVec(controls.color));
        this.setUseRainbow(controls.useRainbow ? 1.0 : 0.0);
        this.setColorGradient(hexToVec(controls.colorGradient));
        this.setFrequency(controls.setFreq);
        this.setNoise(0.16, controls.setFreq, 1.3);
        this.setNoiseFrag(2.5, 0.8, 2.0);
    }
    tess.updateDisplay();
    col1.updateDisplay();
    col2.updateDisplay();
    rb.updateDisplay();
    setf.updateDisplay();

    controls.reset = useDefault;

    renderer.render(camera, fireball, [
      icosphere
      //square,
      //cube
    ]);
    stats.end();

    // Tell the browser to call `tick` again whenever it renders a new frame
    requestAnimationFrame(tick);
    }

  window.addEventListener('resize', function() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.setAspectRatio(window.innerWidth / window.innerHeight);
    camera.updateProjectionMatrix();
  }, false);

  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.setAspectRatio(window.innerWidth / window.innerHeight);
  camera.updateProjectionMatrix();

  sceneReady = true;

  // Start the render loop
  tick();
}

main();
