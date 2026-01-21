// Vertex shader - простой шейдер для отрисовки полноэкранного квада
export const vertexShader = `
  attribute vec4 aVertexPosition;
  attribute vec2 aTextureCoord;

  varying vec2 vTextureCoord;

  void main() {
    gl_Position = aVertexPosition;
    vTextureCoord = aTextureCoord;
  }
`;

// Fragment shaders - различные декоративные эффекты
export const shaders = [
  {
    id: 1,
    name: 'Gradient Wave',
    fragmentShader: `
      precision mediump float;
      uniform vec2 iResolution;
      uniform float iTime;
      uniform vec2 iMouse;

      varying vec2 vTextureCoord;

      void main() {
        vec2 uv = vTextureCoord;
        vec2 center = vec2(0.5, 0.5);
        float dist = distance(uv, center);
        
        // Волновой эффект
        float wave = sin(dist * 10.0 - iTime * 2.0) * 0.5 + 0.5;
        
        // Градиент от центра
        float gradient = 1.0 - dist * 1.5;
        
        // Комбинированный цвет
        vec3 color1 = vec3(1.0, 0.55, 0.4); // Coral
        vec3 color2 = vec3(0.72, 0.63, 0.84); // Lavender
        vec3 color = mix(color1, color2, wave * gradient);
        
        // Добавляем свечение
        float glow = pow(1.0 - dist, 2.0);
        color += vec3(glow * 0.3);
        
        gl_FragColor = vec4(color, 1.0);
      }
    `
  },
  {
    id: 2,
    name: 'Spiral',
    fragmentShader: `
      precision mediump float;
      uniform vec2 iResolution;
      uniform float iTime;
      uniform vec2 iMouse;

      varying vec2 vTextureCoord;

      void main() {
        vec2 uv = vTextureCoord - 0.5;
        float angle = atan(uv.y, uv.x);
        float radius = length(uv);
        
        // Спиральный паттерн
        float spiral = sin(angle * 3.0 + radius * 8.0 - iTime * 2.0) * 0.5 + 0.5;
        
        vec3 color1 = vec3(0.72, 0.63, 0.84); // Lavender
        vec3 color2 = vec3(0.66, 0.89, 0.92); // Sky Blue
        vec3 color = mix(color1, color2, spiral);
        
        // Мягкие края
        float edge = smoothstep(0.5, 0.45, radius);
        color *= edge;
        
        gl_FragColor = vec4(color, 1.0);
      }
    `
  },
  {
    id: 3,
    name: 'Pulsing Rings',
    fragmentShader: `
      precision mediump float;
      uniform vec2 iResolution;
      uniform float iTime;
      uniform vec2 iMouse;

      varying vec2 vTextureCoord;

      void main() {
        vec2 uv = vTextureCoord;
        vec2 center = vec2(0.5, 0.5);
        float dist = distance(uv, center);
        
        // Концентрические кольца
        float rings = sin(dist * 15.0 - iTime * 3.0) * 0.5 + 0.5;
        rings = pow(rings, 3.0);
        
        vec3 color1 = vec3(1.0, 0.71, 0.77); // Pink
        vec3 color2 = vec3(1.0, 0.55, 0.4); // Coral
        vec3 color = mix(color1, color2, rings);
        
        // Внешнее свечение
        float outerGlow = smoothstep(0.5, 0.3, dist);
        color += vec3(outerGlow * 0.2);
        
        gl_FragColor = vec4(color, 1.0);
      }
    `
  },
  {
    id: 4,
    name: 'Swirling Colors',
    fragmentShader: `
      precision mediump float;
      uniform vec2 iResolution;
      uniform float iTime;
      uniform vec2 iMouse;

      varying vec2 vTextureCoord;

      void main() {
        vec2 uv = vTextureCoord - 0.5;
        float angle = atan(uv.y, uv.x);
        float radius = length(uv);
        
        // Вращающийся градиент
        float rotation = angle + iTime + radius * 2.0;
        float pattern = sin(rotation * 4.0) * 0.5 + 0.5;
        
        vec3 color1 = vec3(0.66, 0.89, 0.92); // Sky Blue
        vec3 color2 = vec3(0.72, 0.63, 0.84); // Lavender
        vec3 color3 = vec3(1.0, 0.71, 0.77); // Pink
        vec3 color = mix(color1, color2, pattern);
        color = mix(color, color3, pattern * 0.5);
        
        // Радиальный градиент
        float radial = 1.0 - radius * 1.8;
        color *= radial;
        
        gl_FragColor = vec4(color, 1.0);
      }
    `
  }
];

