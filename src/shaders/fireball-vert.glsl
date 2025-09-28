#version 300 es

uniform mat4 u_Model;
uniform mat4 u_ModelInvTr;
uniform mat4 u_ViewProj;


uniform float u_Time;
uniform float u_Amp;
uniform float u_Freq;
uniform float u_Speed;
uniform float u_Octaves;


in vec4 vs_Pos;
in vec4 vs_Nor;
in vec4 vs_Col;

out vec4 fs_Nor;
out vec4 fs_LightVec;
out vec4 fs_Col;

const vec4 lightPos = vec4(5, 5, 3, 1);

// noise/hash helper func
vec3 noise(vec3 p) {
    p = vec3(dot(p, vec3(123.4, 543.2,  55.5)),
             dot(p, vec3(235.7, 111.1, 246.8)),
             dot(p, vec3(120.5, 391.2, 138.1)));

    return -1.0 + 2.0 * fract(sin(p) * 5660.007);
}

// 3d perlin function that uses hash/noise func
float perlin3D(vec3 p) {
    vec3 pi = floor(p);
    // local pos
    vec3 pf = p - pi;
    // smooth fading
    vec3 fade = pf * pf * (3.0 - 2.0 * pf);

    // randomized gradient directions for each 8 cells
    vec3 g000 = normalize(noise(pi + vec3(0.0, 0.0, 0.0)));
    vec3 g100 = normalize(noise(pi + vec3(1.0, 0.0, 0.0)));
    vec3 g010 = normalize(noise(pi + vec3(0.0, 1.0, 0.0)));
    vec3 g110 = normalize(noise(pi + vec3(1.0, 1.0, 0.0)));
    vec3 g001 = normalize(noise(pi + vec3(0.0, 0.0, 1.0)));
    vec3 g101 = normalize(noise(pi + vec3(1.0, 0.0, 1.0)));
    vec3 g011 = normalize(noise(pi + vec3(0.0, 1.0, 1.0)));
    vec3 g111 = normalize(noise(pi + vec3(1.0, 1.0, 1.0)));

    // calculating surflets
    float s000 = dot(g000, pf - vec3(0.0, 0.0, 0.0));
    float s100 = dot(g100, pf - vec3(1.0, 0.0, 0.0));
    float s010 = dot(g010, pf - vec3(0.0, 1.0, 0.0));
    float s110 = dot(g110, pf - vec3(1.0, 1.0, 0.0));
    float s001 = dot(g001, pf - vec3(0.0, 0.0, 1.0));
    float s101 = dot(g101, pf - vec3(1.0, 0.0, 1.0));
    float s011 = dot(g011, pf - vec3(0.0, 1.0, 1.0));
    float s111 = dot(g111, pf - vec3(1.0, 1.0, 1.0));

    // 3 step interpolation
    float interp00 = mix(s000, s100, fade.x);
    float interp10 = mix(s010, s110, fade.x);
    float interp01 = mix(s001, s101, fade.x);
    float interp11 = mix(s011, s111, fade.x);

    float interp0 = mix(interp00, interp10, fade.y);
    float interp1 = mix(interp01, interp11, fade.y);

    return mix(interp0, interp1, fade.z);
}

// 3d rotation matrix
mat3 rot3(float a) {
  float c = cos(a), s = sin(a);
  return mat3(c, -s, 0.0,
              s, c, 0.0,
              0.0, 0.0, 1.0);
}

// fbm that overlays multiple perlins
float fbm(vec3 p) {
    float sum = 0.0;
    float amp = 4.0;
    float freq = 1.0;

    // rotation matrix
    float theta = 0.8 * u_Time;
    float c = cos(theta);
    float s = sin(theta);
    mat3 R = rot3(0.5);

    for (int i = 0; i < 5; ++i) {
        sum += amp * perlin3D(R * p * freq);
        freq *= 2.0;
        amp  *= 0.2;
    }
    return sum; // approx [-1,1]
}

// trig-based warping
vec3 warp(vec3 p, float t) {
    p.xy += vec2(sin(p.z + t), sin(p.z - t));
    p.yz += vec2(sin(p.x - t), sin(p.x + t));
    return p;
}

// triangle wave func
float triangle_wave(float x, float freq, float amp) {
    return abs(mod((x * freq), amp) - (0.5 * amp));
}

void main()
{
    fs_Col = vs_Col;
    
    vec4 objPos = vs_Pos;
    vec3 nObj = normalize(vs_Nor.xyz); // obtain normals

    float edge0 = 0.05;
    float edge1 = 0.55;

    // I want to apply some sort of a mask that will help keep the
    // "fireball" shape (displacement on the top, but rounder at the bottom)
    float r = max(length(objPos.xyz), 0.01);
    float cap = objPos.y / r; // normalize height on interval -1..1
    float lat = 0.5 * (cap + 1.0); // set interval from 0..1

    // this controls how much of the sphere the flame eats up (effect)
    float top = smoothstep(edge0, edge1, lat);
    top = pow(top, 1.5);

    // this applies a lower frequency waving effect
    float lowPhase = u_Freq * (objPos.y + objPos.x - objPos.z) - u_Speed * u_Time;
    float dispLow = u_Amp * top * sin(lowPhase);

    // this applies the faster flame flickering effect near the top
    vec3 domain = nObj * u_Freq + vec3(0.0, u_Speed * 4.0 * u_Time, 0.0);
    domain = warp(domain, u_Time);
    float dispHigh = u_Amp * top * fbm(domain);

    // apply displacements to position
    // multiply in some triangle wave displacement to make flame keep a better shape
    float disp = dispLow + dispHigh * triangle_wave(10.5, u_Freq, u_Amp) * 40.0;
    objPos.xyz += nObj * disp;

    // stretch position so it's more oval in shape
    objPos.xz *= 0.8;
    objPos.y *= 1.6;


    mat3 invTranspose = mat3(u_ModelInvTr);
    fs_Nor = vec4(normalize(invTranspose * nObj), 0.0);

    vec4 modelposition = u_Model * objPos;

    fs_LightVec = lightPos - modelposition;

    gl_Position = u_ViewProj * modelposition;
}
