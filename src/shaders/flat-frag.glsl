#version 300 es
precision highp float;

uniform vec3 u_Eye, u_Ref, u_Up;
uniform vec2 u_Dimensions;
uniform float u_Time;

in vec2 fs_Pos;
out vec4 out_Col;

// noise generator helper func
vec3 noise(vec2 p) {
    p = vec3(dot(p, vec3(123.4, 543.2,  55.5)),
             dot(p, vec3(235.7, 111.1, 246.8)));

    return -1.0 + 2.0 * fract(sin(p) * 42000.007);
}

// 2d perlin function
float perlin2D(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);

    // gradient
    float n00 = dot(normalize(noise(i + vec2(0.0, 0.0))), f - vec2(0.0, 0.0));
    float n10 = dot(normalize(noise(i + vec2(1.0, 0.0))), f - vec2(1.0, 0.0));
    float n01 = dot(normalize(noise(i + vec2(0.0, 1.0))), f - vec2(0.0, 1.0));
    float n11 = dot(normalize(noise(i + vec2(1.0, 1.0))), f - vec2(1.0, 1.0));

    float nx0 = mix(n00, n10, u.x);
    float nx1 = mix(n01, n11, u.x);

    return mix(nx0, nx1, u.y);
}

// sum a bunch of perlins
float fbm(vec2 p) {
    float s = 0.0;
    float a = 0.5;

    for (int i = 0; i < 5; ++i) {
        s += a * perlin2D(p);
        p = p * 2.0 + vec2(100.0);
        a *= 0.5;
    }
    return s;
}

void main() {
  //out_Col = vec4(0.5 * (fs_Pos + vec2(1.0)), 0.5 * (sin(u_Time * 3.14159 * 0.01) + 1.0), 1.0);
  vec2 uv = fs_Pos * 5.0;
  vec2 wave = vec2(0.5 * u_Time, -0.5 * u_Time);
  uv = uv + wave;

  float f = fbm(uv);
  f = 0.5 + 0.5 * f;

  vec3 colA = (0.5, 0.5, 0.5);
  vec3 colB = (0.2, 0.2, 0.2);

  vec3 col = mix(colA, colB, f);
    
  out_Col = vec4(col, 1.0);
}
