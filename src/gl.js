
var shapes = [];
var vx = 0;
var vy = 0;
var vs = 1;


const canvas = document.querySelector('canvas');
const gl = canvas.getContext('webgl',  { antialias: false, preserveDrawingBuffer: true});

window.addEventListener("load", () =>{
  initShaders();
  initNav();
});


function initShaders() {
  // Vertex shader program
  const vsSource = `
  attribute vec4 aVertexPosition;
  uniform mat4 uModelViewMatrix;
  attribute vec2 aTextureCoord;
  varying highp vec2 vTextureCoord;

  void main() {
    gl_Position = uModelViewMatrix * aVertexPosition;
    vTextureCoord = aTextureCoord;
  }
  `;

  // Fragment shader program
  const fsSource = `
  varying highp vec2 vTextureCoord;
  uniform sampler2D uSampler;
  void main() {
    gl_FragColor = texture2D(uSampler, vTextureCoord);
  }
  `;

  const vertexShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertexShader, vsSource);
  gl.compileShader(vertexShader);

  const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragmentShader, fsSource);
  gl.compileShader(fragmentShader);

  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
    return null;
  }

  const iModelViewMatrix = gl.getUniformLocation(shaderProgram, 'uModelViewMatrix')
  gl.setModelViewMatrix = function(m) { gl.uniformMatrix4fv(iModelViewMatrix,false,m); };

  const iVertices = gl.getAttribLocation(shaderProgram, 'aVertexPosition');
  gl.drawVertices = function(vertices, count) {
    gl.bindBuffer(gl.ARRAY_BUFFER, vertices);
    gl.vertexAttribPointer(iVertices, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(iVertices);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, count);
  }

  const iTextureCoords = gl.getAttribLocation(shaderProgram, 'aTextureCoord');
  gl.setTexCoords = function(coords, count) {
    gl.bindBuffer(gl.ARRAY_BUFFER, coords);
    gl.vertexAttribPointer(iTextureCoords, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(iTextureCoords);
  }

  gl.createCoordsBuffer = function(array) {
    const b = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(array), gl.STATIC_DRAW);
    return b;
  };

  var iSampler = gl.getUniformLocation(shaderProgram, 'uSampler');
  gl.setTexture = function(texture) {
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(iSampler, 0);
  }
  var matrixStack = [];
  const modelViewMatrix = mat4.create();

  gl.resetMatrices = function() {
    matrixStack = [];
    mat4.identity(modelViewMatrix);
  }

  gl.pushMatrix = function() {
    const m = mat4.create(); mat4.copy(m, modelViewMatrix);
    matrixStack.push(m);
  }

  gl.popMatrix = function() {
    const m = matrixStack.pop();
    mat4.copy(modelViewMatrix, m);
  }

  gl.translate = function(x,y,z) {
    mat4.translate(modelViewMatrix, modelViewMatrix, [x,y,z]);
    gl.setModelViewMatrix(modelViewMatrix);
  }

  gl.scale = function(x,y,z) {
    mat4.scale(modelViewMatrix, modelViewMatrix, [x,y,z]);
    gl.setModelViewMatrix(modelViewMatrix);
  }

  gl.useProgram(shaderProgram);
}

function initNav() {
  canvas.setAttribute("width", canvas.parentNode.clientWidth);
  canvas.setAttribute("height", canvas.parentNode.clientHeight);
  gl.viewport(0, 0, canvas.width, canvas.height);

  // Drag & Zoom
  d3.select(canvas).call(d3.drag().on("drag", () => {vx += d3.event.dx; vy += d3.event.dy;  redraw(); }));
  canvas.addEventListener("wheel", (e)=>{ var a = -e.deltaY * 0.001; vx += (vx-e.x)*a; vy += (vy-e.y)*a; vs *= 1+a; redraw(); });
}

/** RGBA bytes */
function createTexture(w,h, pixels) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  texture.update = function() { gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixels); }
  return texture;
}

function createTextureFromImage(url) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  const width = 1;
  const height = 1;
  const pixel = new Uint8Array([0, 0, 255, 255]);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixel);

  const image = new Image();
  image.onload = function() {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  };
  image.src = url;

  return texture;
}


function redraw() {
  gl.clearColor(1.0, 1.0, 1.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.resetMatrices();

  gl.translate(-1,1,0);
  gl.scale(1.0/canvas.width*2, -1.0/canvas.height*2,1);
  gl.translate(vx,vy,0);
  gl.scale(vs,vs,1);

  shapes.forEach((s) => s.render());
}

function redrawMe(shape) {
  gl.resetMatrices();

  gl.translate(-1,1,0);
  gl.scale(1.0/canvas.width*2, -1.0/canvas.height*2,1);
  gl.translate(vx,vy,0);
  gl.scale(vs,vs,1);

  shape.render();
}
