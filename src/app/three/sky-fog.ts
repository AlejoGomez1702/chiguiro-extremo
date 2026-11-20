import { Material, Mesh, MeshStandardMaterial, Object3D, Texture, WebGLProgramParametersWithUniforms } from 'three';

/**
 * Perspectiva aérea: en vez de un color de niebla fijo, cada píxel se funde
 * con el color del cielo HDRI en su misma dirección. Así las montañas lejanas
 * desaparecen en el atardecer real en lugar de verse como recortes grises.
 */
const FOG = /* glsl */ `
#ifdef USE_FOG
  #ifdef FOG_EXP2
    float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
  #else
    float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
  #endif
  vec3 skyDir = normalize( transpose( mat3( viewMatrix ) ) * ( - vViewPosition ) );
  skyDir.y = max( skyDir.y, 0.015 );
  skyDir = normalize( skyDir );
  vec2 skyUv = vec2( atan( skyDir.z, skyDir.x ) * RECIPROCAL_PI2 + 0.5, asin( clamp( skyDir.y, -1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5 );
  vec3 skyCol = pow( texture2D( skyFogMap, skyUv, 4.0 ).rgb, vec3( 2.2 ) ) * skyFogGain;
  gl_FragColor.rgb = mix( gl_FragColor.rgb, mix( fogColor, skyCol, 0.85 ), fogFactor );
#endif
`;

export function applySkyFog(root: Object3D, sky: Texture, gain: number) {
  const patch = (shader: WebGLProgramParametersWithUniforms) => {
    shader.uniforms['skyFogMap'] = { value: sky };
    shader.uniforms['skyFogGain'] = { value: gain };
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <fog_pars_fragment>', '#include <fog_pars_fragment>\nuniform sampler2D skyFogMap;\nuniform float skyFogGain;')
      .replace('#include <fog_fragment>', FOG);
  };
  const seen = new Set<Material>();
  root.traverse((o) => {
    const m = o as Mesh;
    if (!m.isMesh) return;
    const mats = Array.isArray(m.material) ? m.material : [m.material];
    for (const mat of mats) {
      if (seen.has(mat) || !(mat as MeshStandardMaterial).isMeshStandardMaterial || !(mat as MeshStandardMaterial).fog) continue;
      seen.add(mat);
      // encadena con parches previos (p. ej. ventanas de fachada)
      const prev = mat.onBeforeCompile;
      const prevKey = mat.customProgramCacheKey();
      mat.onBeforeCompile = (sh, r) => {
        prev.call(mat, sh, r);
        patch(sh);
      };
      mat.customProgramCacheKey = () => `${prevKey}|skyfog`;
      mat.needsUpdate = true;
    }
  });
}
