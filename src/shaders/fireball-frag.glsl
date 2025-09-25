#version 300 es

precision highp float;

uniform vec4 u_Color;
uniform vec4 u_ColorGradient;
uniform float u_UseRainbow;
uniform float u_Time;
uniform float u_NoiseScale;
uniform float u_NoiseStrength;
uniform float u_NoiseSpeed;

in vec4 fs_Nor;
in vec4 fs_LightVec;
in vec4 fs_Col;

out vec4 out_Col;

// noise generator helper func
vec3 noise(vec3 p) {
    p = vec3(dot(p, vec3(123.4, 543.2,  55.5)),
             dot(p, vec3(235.7, 111.1, 246.8)),
             dot(p, vec3(120.5, 391.2, 138.1)));

    return -1.0 + 2.0 * fract(sin(p) * 42000.007);
}

// 3d perlin function
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

// sum a bunch of perlins
float fbm(vec3 p) {
    float amp = 0.3;
    float freq = 0.8;
    float sum = 0.0;

    for (int i = 0; i < 5; ++i) {
        sum += amp * perlin3D(p * freq);
        freq *= 2.0;
        amp *= 0.5;
    }

    return sum;
}

// this will induce the rainbow color shifting
vec3 rainbow(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
    return a + b * cos(6.28318531 * (c * t + d));
}

void main()
{
    vec4 diffuseColor = u_Color;

    float diffuseTerm = dot(normalize(fs_Nor), normalize(fs_LightVec));

    float ambientTerm = 0.2;

    float lightIntensity = diffuseTerm + ambientTerm;
   
    vec3 p = fs_Col.xyz * u_NoiseScale + vec3(0.0, 0.0, u_Time * u_NoiseSpeed);
    float mask = 0.5 + 0.5 * fbm(p);

    float t = fract(mask + 0.2 * u_Time);

    vec3 albedo = rainbow(
        t,
        vec3(0.5, 0.5, 0.5),
        vec3(0.4, 0.4, 0.4),  // amp
        vec3(1.1, 1.1, 1.1),  // freq
        vec3(0.0, 0.33, 0.67) // phasing
    );

    if (u_UseRainbow == 0.0) { // User can set gradient color
        vec3 base = diffuseColor.rgb * (diffuseTerm + 0.2);
        out_Col = vec4(base, u_Color.a);
    } else if (u_UseRainbow == 1.0) { // Yser can use epic rainbow
        vec3 base = albedo * (diffuseTerm + 0.2);
        out_Col = vec4(clamp(base, 0.0, 1.0), u_Color.a);
    }
}
