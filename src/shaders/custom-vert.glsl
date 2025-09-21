#version 300 es

uniform mat4 u_Model;
uniform mat4 u_ModelInvTr;
uniform mat4 u_ViewProj;


uniform float u_Time;
uniform float u_Amp;
uniform float u_Freq;
uniform float u_Speed;


in vec4 vs_Pos;
in vec4 vs_Nor;
in vec4 vs_Col;

out vec4 fs_Nor;
out vec4 fs_LightVec;
out vec4 fs_Col;

const vec4 lightPos = vec4(5, 5, 3, 1);

void main()
{
    fs_Col = vs_Col;

    vec4 objPos = vs_Pos;
    float phase = u_Freq * objPos.x + 0.7 * u_Freq * objPos.z - u_Speed * u_Time;
    float displace = u_Amp * sin(phase);

    // this will deform the vertices based on the sin function
    objPos.y += displace;

    // rotation matrix
    float theta = 0.8 * u_Time;
    float c = cos(theta);
    float s = sin(theta);
    mat2 R = mat2(c, -s, s, c);

    // rotate position over time
    objPos.yz = R * objPos.yz;


    mat3 invTranspose = mat3(u_ModelInvTr);
    fs_Nor = vec4(invTranspose * vec3(vs_Nor), 0);

    vec4 modelposition = u_Model * objPos;

    fs_LightVec = lightPos - modelposition;

    gl_Position = u_ViewProj * modelposition;
}
