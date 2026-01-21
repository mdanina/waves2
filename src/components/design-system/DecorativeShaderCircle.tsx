import { useEffect, useRef, useState } from "react";
import { shaders, vertexShader } from "./util/shaders";

interface DecorativeShaderCircleProps {
  size?: number;
  shaderId?: number;
  className?: string;
  enableHoverEffect?: boolean;
  enableMouseInteraction?: boolean;
  customShader?: string; // Allow custom shader to be passed
}

// Beautiful iridescent shader with smooth color transitions
const iridiscentShader = `
precision mediump float;
uniform vec2 iResolution;
uniform float iTime;
uniform vec2 iMouse;
varying vec2 vTextureCoord;

// Hash function for noise
vec3 hash3(vec2 p) {
    vec3 q = vec3(dot(p, vec2(127.1, 311.7)),
                  dot(p, vec2(269.5, 183.3)),
                  dot(p, vec2(419.2, 371.9)));
    return fract(sin(q) * 43758.5453);
}

// Voronoi noise
float voronoi(vec2 x) {
    vec2 n = floor(x);
    vec2 f = fract(x);
    
    float minDist = 1.0;
    for(int j = -1; j <= 1; j++) {
        for(int i = -1; i <= 1; i++) {
            vec2 g = vec2(float(i), float(j));
            vec3 o = hash3(n + g);
            vec2 r = g - f + o.xy;
            float d = dot(r, r);
            minDist = min(minDist, d);
        }
    }
    return minDist;
}

// Improved noise function
float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float n = i.x + i.y * 57.0;
    return mix(mix(fract(sin(n) * 43758.5453), 
                   fract(sin(n + 1.0) * 43758.5453), f.x),
               mix(fract(sin(n + 57.0) * 43758.5453), 
                   fract(sin(n + 58.0) * 43758.5453), f.x), f.y);
}

// Fractal Brownian Motion
float fbm(vec2 p) {
    float sum = 0.0;
    float amp = 0.5;
    for(int i = 0; i < 5; i++) {
        sum += amp * noise(p);
        p *= 2.0;
        amp *= 0.5;
    }
    return sum;
}

void main() {
    vec2 fragCoord = vTextureCoord * iResolution;
    
    // Calculate distance from center for circular mask
    vec2 center = iResolution * 0.5;
    float dist = distance(fragCoord, center);
    float radius = min(iResolution.x, iResolution.y) * 0.5;
    
    // Разрешаем рендеринг для свечения за пределами круга
    // if (dist > radius) {
    //     discard;
    // }
    
    // Normalized coordinates
    vec2 uv = (fragCoord - iResolution.xy * 0.5) / min(iResolution.x, iResolution.y);
    
    // Mouse interaction
    vec2 mouse = iMouse;
    float mouseDist = length(uv - (mouse - 0.5) * 2.0);
    float mouseEffect = smoothstep(1.0, 0.0, mouseDist);
    
    // Time-based animation
    float t = iTime * 0.3;
    
    // Multiple layers of movement
    vec2 p1 = uv * 3.0 + vec2(t * 0.1, t * 0.15);
    vec2 p2 = uv * 2.0 - vec2(t * 0.12, -t * 0.08);
    vec2 p3 = uv * 4.0 + vec2(-t * 0.08, t * 0.1);
    
    // Combine different noise patterns
    float n1 = fbm(p1 + vec2(cos(t), sin(t)));
    float n2 = fbm(p2 - vec2(sin(t * 0.7), cos(t * 0.5)));
    float n3 = voronoi(p3 * 2.0 + iTime * 0.2);
    
    // Create flowing pattern
    float pattern = n1 * 0.5 + n2 * 0.3 + n3 * 0.2;
    
    // Distance from center for radial gradient
    float radialDist = length(uv);
    
    // Create color transitions
    vec3 color1 = vec3(0.5, 0.2, 0.9); // Purple
    vec3 color2 = vec3(0.2, 0.6, 1.0); // Cyan
    vec3 color3 = vec3(1.0, 0.3, 0.6); // Pink
    vec3 color4 = vec3(0.3, 0.9, 0.5); // Green
    
    // Animate color mixing
    float mixFactor1 = sin(t + pattern * 2.0) * 0.5 + 0.5;
    float mixFactor2 = cos(t * 0.7 + pattern * 3.0) * 0.5 + 0.5;
    
    vec3 mixedColor1 = mix(color1, color2, mixFactor1);
    vec3 mixedColor2 = mix(color3, color4, mixFactor2);
    vec3 finalColor = mix(mixedColor1, mixedColor2, pattern);
    
    // Add radial gradient for depth
    finalColor *= (1.0 - radialDist * 0.3);
    
    // Add highlights based on pattern
    float highlight = smoothstep(0.6, 0.8, pattern);
    finalColor += vec3(1.0, 1.0, 1.0) * highlight * 0.3;
    
    // Mouse interaction adds brightness and color shift
    finalColor += vec3(0.8, 0.5, 1.0) * mouseEffect * 0.4;
    
    // Edge glow
    float edgeGlow = smoothstep(0.95, 0.85, radialDist);
    finalColor += vec3(0.3, 0.7, 1.0) * (1.0 - edgeGlow) * 0.5;
    
    // Внешнее свечение под цвет внутреннего круга
    float glowDist = dist - radius;
    float outerGlow = 0.0;
    if (dist > radius) {
        // Свечение за пределами круга
        outerGlow = exp(-glowDist * 0.1) * smoothstep(radius + 50.0, radius, dist);
    }
    
    vec3 glowColor = mix(mixedColor1, mixedColor2, pattern * 0.5 + 0.5);
    finalColor = mix(finalColor, glowColor, outerGlow * 0.8);
    finalColor += glowColor * outerGlow * 0.5;
    
    // Smooth edge fade for antialiasing
    float alpha = 0.0;
    if (dist <= radius) {
        alpha = smoothstep(radius, radius - 2.0, dist);
    } else {
        // Альфа для свечения за пределами круга
        alpha = outerGlow * 0.6;
    }
    
    // Увеличиваем прозрачность (уменьшаем непрозрачность)
    alpha *= 0.7;
    
    gl_FragColor = vec4(finalColor, alpha);
}
`;

export const DecorativeShaderCircle = ({ 
  size = 200, 
  shaderId,
  className = "",
  enableHoverEffect = true,
  enableMouseInteraction = true,
  customShader
}: DecorativeShaderCircleProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const mousePositionRef = useRef<[number, number]>([0.5, 0.5]);
  const programInfoRef = useRef<any>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Use iridescent shader by default if no shaderId or customShader is provided
  const useIridescent = !customShader && !shaderId;
  
  // Get the selected shader
  const selectedShader = shaders.find(s => s.id === shaderId) || shaders[0];

  // Track mouse position relative to the canvas without causing re-renders
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!enableMouseInteraction) return;
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    mousePositionRef.current = [x, y];
  };

  // Separate effect to handle canvas size updates - only when size prop changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", { 
      preserveDrawingBuffer: true,
      alpha: true,
      antialias: true,
      premultipliedAlpha: false
    });
    if (!gl) return;

    // Set canvas size directly from prop - no ResizeObserver needed
    if (size > 0 && (canvas.width !== size || canvas.height !== size)) {
      canvas.width = size;
      canvas.height = size;
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
  }, [size]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", { 
      preserveDrawingBuffer: true,
      alpha: true,
      antialias: true,
      premultipliedAlpha: false
    });
    if (!gl) {
      console.error("WebGL not supported");
      return;
    }

    // Use the vertex shader and selected fragment shader
    const vsSource = vertexShader;
    const fsSource = customShader || (useIridescent ? iridiscentShader : selectedShader.fragmentShader);

    // Initialize shader program
    const shaderProgram = initShaderProgram(gl, vsSource, fsSource);
    if (!shaderProgram) return;

    programInfoRef.current = {
      program: shaderProgram,
      attribLocations: {
        vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
        textureCoord: gl.getAttribLocation(shaderProgram, 'aTextureCoord'),
      },
      uniformLocations: {
        iResolution: gl.getUniformLocation(shaderProgram, 'iResolution'),
        iTime: gl.getUniformLocation(shaderProgram, 'iTime'),
        iMouse: gl.getUniformLocation(shaderProgram, 'iMouse'),
        hasActiveReminders: gl.getUniformLocation(shaderProgram, 'hasActiveReminders'),
        hasUpcomingReminders: gl.getUniformLocation(shaderProgram, 'hasUpcomingReminders'),
        disableCenterDimming: gl.getUniformLocation(shaderProgram, 'disableCenterDimming'),
      },
    };

    // Create buffers
    const buffers = initBuffers(gl);
    let startTime = Date.now();
    let lastTime = startTime;

    // Set initial canvas size from prop
    canvas.width = size;
    canvas.height = size;
    gl.viewport(0, 0, canvas.width, canvas.height);

    // Render function with smoother time interpolation
    const render = (timestamp?: number) => {
      const now = timestamp || Date.now();
      // Используем более плавное обновление времени с интерполяцией
      const deltaTime = (now - lastTime) / 1000;
      lastTime = now;
      const currentTime = (now - startTime) / 1000;
      
      // Get the current mouse position from ref
      const mousePos = mousePositionRef.current;
      
      drawScene(
        gl!, 
        programInfoRef.current, 
        buffers, 
        currentTime, 
        canvas.width, 
        canvas.height, 
        mousePos
      );
      animationRef.current = requestAnimationFrame((timestamp) => render(timestamp));
    };

    render();

    return () => {
      cancelAnimationFrame(animationRef.current);
      // Clean up WebGL resources
      if (gl && shaderProgram) {
        gl.deleteProgram(shaderProgram);
      }
    };
  }, [size, shaderId, selectedShader.fragmentShader, customShader, useIridescent]);

  // Initialize shader program
  function initShaderProgram(gl: WebGLRenderingContext, vsSource: string, fsSource: string) {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

    if (!vertexShader || !fragmentShader) return null;

    // Create the shader program
    const shaderProgram = gl.createProgram();
    if (!shaderProgram) return null;

    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    // Check if it linked successfully
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
      console.error('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
      return null;
    }

    return shaderProgram;
  }

  // Load shader
  function loadShader(gl: WebGLRenderingContext, type: number, source: string) {
    const shader = gl.createShader(type);
    if (!shader) return null;

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    // Check if compilation succeeded
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }

    return shader;
  }

  // Initialize buffers
  function initBuffers(gl: WebGLRenderingContext) {
    // Create a buffer for positions
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const positions = [
      -1.0, -1.0,
       1.0, -1.0,
       1.0,  1.0,
      -1.0,  1.0,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    // Create a buffer for texture coordinates
    const textureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);
    const textureCoordinates = [
      0.0, 0.0,
      1.0, 0.0,
      1.0, 1.0,
      0.0, 1.0,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates), gl.STATIC_DRAW);

    // Create a buffer for indices
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    const indices = [
      0, 1, 2,
      0, 2, 3,
    ];
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

    return {
      position: positionBuffer,
      textureCoord: textureCoordBuffer,
      indices: indexBuffer,
    };
  }

  // Draw the scene
  function drawScene(
    gl: WebGLRenderingContext, 
    programInfo: any, 
    buffers: any, 
    currentTime: number, 
    width: number, 
    height: number,
    mousePos: [number, number]
  ) {
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.enable(gl.BLEND);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Tell WebGL to use our program when drawing
    gl.useProgram(programInfo.program);

    // Set shader uniforms
    gl.uniform2f(programInfo.uniformLocations.iResolution, width, height);
    gl.uniform1f(programInfo.uniformLocations.iTime, currentTime);
    gl.uniform2f(programInfo.uniformLocations.iMouse, mousePos[0], mousePos[1]);
    // No reminders for decorative circle
    gl.uniform1i(programInfo.uniformLocations.hasActiveReminders, 0);
    gl.uniform1i(programInfo.uniformLocations.hasUpcomingReminders, 0);
    // Disable center dimming for pure decorative effect
    gl.uniform1i(programInfo.uniformLocations.disableCenterDimming, 1);

    // Set vertex position attribute
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.vertexAttribPointer(
      programInfo.attribLocations.vertexPosition,
      2,        // 2 components per vertex
      gl.FLOAT, // the data is 32-bit floats
      false,    // don't normalize
      0,        // stride
      0         // offset
    );
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);

    // Set texture coordinate attribute
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.textureCoord);
    gl.vertexAttribPointer(
      programInfo.attribLocations.textureCoord,
      2,        // 2 components per vertex
      gl.FLOAT, // the data is 32-bit floats
      false,    // don't normalize
      0,        // stride
      0         // offset
    );
    gl.enableVertexAttribArray(programInfo.attribLocations.textureCoord);

    // Draw
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);
    gl.drawElements(
      gl.TRIANGLES,
      6,                // vertex count
      gl.UNSIGNED_SHORT,// type
      0                 // offset
    );
  }

  // Handle mouse leave - reset mouse position to center when cursor leaves canvas
  const handleMouseLeave = () => {
    setIsHovered(false);
    mousePositionRef.current = [0.5, 0.5];
  };

  return (
    <div
      ref={containerRef}
      className={`rounded-full ${className}`}
      style={{
        width: size,
        height: size,
        position: 'relative',
        overflow: 'hidden',
        margin: 0,
        padding: 0
      }}
    >
      <canvas 
        ref={canvasRef} 
        className={`rounded-full ${enableHoverEffect ? 'transition-transform duration-300' : ''}`}
        style={{ 
          width: size,
          height: size,
          transform: (enableHoverEffect && isHovered) ? 'scale(1.05)' : 'scale(1)',
          boxShadow: 'none',
          outline: 'none',
          border: 'none',
          display: 'block',
          margin: 0,
          padding: 0,
          verticalAlign: 'top',
          imageRendering: 'auto',
          WebkitBackfaceVisibility: 'hidden',
          backfaceVisibility: 'hidden'
        }}
        onMouseEnter={() => enableHoverEffect && setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
      />
    </div>
  );
};

