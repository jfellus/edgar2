

class Shape {
  constructor(x,y) {
    this.x = x;
    this.y = y;
    this.texture = createTexture(3,3, this.data = new Uint8Array([
      255,0,0,255,  0,255,0,255,  255,0,0,255,
      0,255,0,255,  255,0,0,255,  0,255,0,255,
      255,0,0,255,  0,255,0,255,  255,0,0,255,
    ]));
    this.texCoords = gl.createCoordsBuffer([
      1,1,
      0,1,
      1,0,
      0,0,
    ]);
    this.verticesBuffer = gl.createCoordsBuffer([
      10.0,  10.0,
      -10.0,  10.0,
      10.0, -10.0,
      -10.0, -10.0,
    ]);
  }

  render() {
    gl.pushMatrix()
    this.transform();
    this.texturate();
    gl.setTexCoords(this.texCoords, 4);
    gl.drawVertices(this.verticesBuffer, 4);
    gl.popMatrix();
  }

  texturate() {
    gl.setTexture(this.texture);
  }

  transform() {
    gl.translate(this.x, this.y, 0);
  }

  animate() {
    this.data[0] = 255-this.data[0];
    this.texture.update();
    redrawMe(this);
  }

}
