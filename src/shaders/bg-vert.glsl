#version 300 es

out vec2 vUV;

void main()
{
	const vec2 verts[3] = vec2[3](
	  vec2(-1.0, -1.0),
	  vec2( 3.0, -1.0),
	  vec2(-1.0,  3.0)
	);

	vec2 p = verts[gl_VertexID];

	gl_Position = vec4(p, 0.0, 1.0);

	vUV = 0.5 * (p + 1.0);
}
