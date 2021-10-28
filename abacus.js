// Copyright (C) Thorsten Thormaehlen, Marburg, 2013, All rights reserved
// Contact: www.thormae.de

// This software is written for educational (non-commercial) purpose. 
// There is no warranty or other guarantee of fitness for this software, 
// it is provided solely "as is". 

let level = (new URLSearchParams(window.location.search)).get('level');

function UIElement(x, y, width, height, type, ref, subref, slotType) {
  this.x = x;
  this.y = y;
  this.x2 = x + width;
  this.y2 = y + height;
  this.type = type; // 0 = node, 1 = slot, 2 connection
  this.ref = ref;
}

class Bead {
  constructor(pos = [0.0, 0.0], val = 0, act = false, id = -1) {
    this.position = pos;
    this.value = val;
    this.active = act;
    this.uniqueID = id;
  }
}

function AbacusCtrl(type) {
  this.type = type; // 0 Japanese, 1 Chinese

  this.beadLines = (level === "Toddler" ? 5 : 13);
  this.beadPerLine = (this.type == 0) ? 5 : 7;
  this.beadSep = (this.type == 0) ? 3 : 4;
  this.beadHeight = 40;
  this.beadSpacing = 80;
  this.beadWidth = 60;
  this.nodes = new Array();

  this.init = function () {
    this.nodes.length = 0;
    var id = 0;
    for (var i = 0; i < this.beadLines; i++) {
      for (var j = 0; j < this.beadPerLine; j++) {
        var bead = new Bead();
        bead.position[0] = (level === "Toddler" ?  340 : 980) - i * this.beadSpacing;
        bead.position[1] = 60 + this.beadPerLine * this.beadHeight - j * this.beadHeight;
        bead.value = 1;
        if (j > this.beadSep) {
          bead.position[1] = 60 + this.beadPerLine * this.beadHeight - (j * this.beadHeight + 2 * this.beadHeight);
          bead.value = 5;
        }
        bead.uniqueID = id;
        this.nodes.push(bead);
        id++;
      }
    }
  };

  this.getBeadsCount = function () {
    return this.nodes.length;
  };

  this.getBeadPositionX = function (nodeId) {
    return this.nodes[nodeId].position[0];
  };

  this.getBeadPositionY = function (nodeId) {
    return this.nodes[nodeId].position[1];
  };

  this.activated = function (nodeId) {
    var line = Math.floor(nodeId / this.beadPerLine);
    var beadInLine = nodeId - line * this.beadPerLine;
    //console.log(nodeId +" " + line + " " + beadInLine);

    var active = this.nodes[nodeId].active;
    this.nodes[nodeId].active = !active;

    var dir = 1;
    if (beadInLine > this.beadSep) dir = -1;

    var offset = dir * (-1) * this.beadHeight;
    if (active) offset = dir * this.beadHeight;
    this.nodes[nodeId].position[1] += offset;

    if (beadInLine <= this.beadSep) {
      for (var j = 0; j < this.beadPerLine; j++) {
        var n = line * this.beadPerLine + j;
        if (j <= this.beadSep && j !== beadInLine) {
          if ((!active && j > beadInLine) || (active && j < beadInLine)) {
            if (this.nodes[n].active === active) {
              this.nodes[n].position[1] += offset;
              this.nodes[n].active = !this.nodes[n].active;
            }
          }

        }
      }
    } else {
      for (var j = 0; j < this.beadPerLine; j++) {
        var n = line * this.beadPerLine + j;
        if (j > this.beadSep && j !== beadInLine) {
          if ((!active && j < beadInLine) || (active && j > beadInLine)) {
            if (this.nodes[n].active === active) {
              this.nodes[n].position[1] += offset;
              this.nodes[n].active = !this.nodes[n].active;
            }
          }
        }
      }
    }
  };
}

class Abacus {
  constructor(parentDivId, type) {
    this.canvas = null;
    this.divId = parentDivId;
    this.beadColor = "rgba(120, 62, 48, 1.0)";
    this.hooveredBeadColor = "rgba(166, 128, 113, 1.0)";
    this.hooveredElement = -1;
    this.hooveredBead = -1;
    this.uiElements = new Array();
    this.abacusCtrl = new AbacusCtrl(type);
    this.control = true;
  }
  init() {

    this.abacusCtrl.init();

    this.canvas = document.createElement('canvas');
    if (!this.canvas) console.log("Abacus error: can not create a canvas element");
    this.canvas.id = this.divId + "_Abacus";
    this.canvas.width = this.abacusCtrl.beadLines * this.abacusCtrl.beadSpacing;
    this.canvas.height = 60 + (this.abacusCtrl.beadPerLine + 2) * this.abacusCtrl.beadHeight;
    document.body.appendChild(this.canvas);
    var parent = document.getElementById(this.divId);
    if (!parent) console.log("Abacus error: can not find an element with the given name: " + this.divId);
    parent.appendChild(this.canvas);
    var _that = this;
    this.canvas.onmousedown = function (event) {
      _that.canvasMouseDown(event);
    };
    this.canvas.onmousemove = function (event) {
      _that.canvasMouseMove(event);
    };
    this.canvas.onmouseup = function (event) {
      _that.canvasMouseUp(event);
    };
    this.canvas.onmouseup = function (event) {
      _that.canvasMouseUp(event);
    };

    this.update();
  };

  drawBead(nodeId, ctx) {

    var nodePosX = this.abacusCtrl.getBeadPositionX(nodeId);
    var nodePosY = this.abacusCtrl.getBeadPositionY(nodeId);

    var dn = new UIElement(nodePosX, nodePosY + 2, this.abacusCtrl.beadWidth, this.abacusCtrl.beadHeight - 4, 0, nodeId, 0, 0);

    ctx.fillStyle = "rgba(60, 60, 60, 0.3)";
    this.drawRoundRectFilled(ctx, dn.x + 4, dn.y + 4, dn.x2 - dn.x, dn.y2 - dn.y, 15);
    ctx.fillStyle = this.beadColor;

    if (nodeId === this.hooveredBead) {
      ctx.fillStyle = this.hooveredBeadColor;
    }
    this.drawRoundRectFilled(ctx, dn.x, dn.y, dn.x2 - dn.x, dn.y2 - dn.y, 15);
    ctx.fillStyle = "rgba(255, 255, 255, 1.0)";

    this.uiElements.push(dn);
    if (false) {
      ctx.fillStyle = "rgba(0, 0, 0, 1.0)";
      ctx.textAlign = 'left';
      ctx.font = '10pt sans-serif';
      ctx.fillText("ID: " + nodeId, dn.x + 4, dn.y2 - 13);
      ctx.lineWidth = 1;
    }
  }

  drawBeads(ctx) {
    var count = this.abacusCtrl.getBeadsCount();
    for (var i = 0; i < count; i++) {
      this.drawBead(i, ctx);
    }
  }

  update() {

    this.canvas.width = this.canvas.width;

    this.uiElements.length = 0;
    var ctx = this.canvas.getContext('2d');
    ctx.strokeStyle = '#000000';


    // draw grid
    if (false) {
      ctx.strokeStyle = '#808080';
      var stepsX = 20.0 - 0.0;
      var stepsY = 20.0 - 0.0;

      var lx = 0 % stepsX;
      var ly = 0 % stepsY;
      var Lx = 0 % (stepsX * 5.0);
      if (Lx < 0.0)
        Lx += (stepsX * 5.0);
      var Ly = 0 % (stepsY * 5.0);
      if (Ly < 0.0)
        Ly += (stepsY * 5.0);

      while (lx < canvas.width) {
        if (Math.abs(Lx - lx) < 0.001) {
          ctx.strokeStyle = '#404040';
          Lx += (stepsX * 5.0);
        } else {
          ctx.strokeStyle = '#808080';
        }
        ctx.beginPath();
        ctx.moveTo(lx, 0);
        ctx.lineTo(lx, canvas.height);
        ctx.stroke();
        lx += stepsX;
      }

      while (ly < canvas.height) {
        if (Math.abs(Ly - ly) < 0.001) {
          ctx.strokeStyle = '#404040';
          Ly += (stepsY * 5.0);
        } else {
          ctx.strokeStyle = '#808080';
        }
        ctx.beginPath();
        ctx.moveTo(0, ly);
        ctx.lineTo(canvas.width, ly);
        ctx.stroke();
        ly += stepsY;
      }
    }
    // draw frame
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 5;
    for (var i = 0; i < this.abacusCtrl.beadLines; i++) {
      var x = -30 + this.abacusCtrl.beadLines * this.abacusCtrl.beadSpacing - i * this.abacusCtrl.beadSpacing;
      var y = 20 + (this.abacusCtrl.beadPerLine + 2) * this.abacusCtrl.beadHeight
      ctx.beginPath();
      ctx.moveTo(x, 20);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
    for (var j = 0; j < 3; j++) {
      var y = 20;
      if (j === 1) y = 20 + (this.abacusCtrl.beadPerLine - this.abacusCtrl.beadSep) * this.abacusCtrl.beadHeight;
      if (j === 2) y = 20 + (this.abacusCtrl.beadPerLine + 2) * this.abacusCtrl.beadHeight;
      ctx.beginPath();
      ctx.moveTo(20, y);
      ctx.lineTo(1040, y);
      ctx.stroke();
    }
    ctx.lineWidth = 1;

    // draws all nodes
    this.drawBeads(ctx);

    // draw value
    ctx.fillStyle = "rgba(0, 0, 0, 1.0)";
    ctx.textAlign = 'center';
    ctx.font = '20pt sans-serif';
    var textY = 50 + (this.abacusCtrl.beadPerLine + 2) * this.abacusCtrl.beadHeight;
    for (var i = 0; i < this.abacusCtrl.beadLines; i++) {
      var textX = -30 + this.abacusCtrl.beadLines * this.abacusCtrl.beadSpacing - i * this.abacusCtrl.beadSpacing;
      var valueSum = 0;
      for (var j = 0; j < this.abacusCtrl.beadPerLine; j++) {
        var n = i * this.abacusCtrl.beadPerLine + j;
        if (this.abacusCtrl.nodes[n].active) {
          valueSum += this.abacusCtrl.nodes[n].value;
        }
      }

      var valueSting;
      if (this.abacusCtrl.type === 0) {
        valueSting = valueSum.toString(10);
      } else {
        valueSting = valueSum.toString(16);
      }
      //Sum numbers here
      //ctx.fillText(valueSting, textX, textY);
      
   
      // setup pen
      // ctx.strokeStyle = "rgb(0,200,127)";
      // ctx.lineWidth = 16;
      // ctx.lineCap = "round";
      // ctx.stroke
      
    }
       ctx.fillStyle = "#fff"
      ctx.beginPath();
      if (level === "Toddler") {
        ctx.arc(210, 100, 4, 0, 2 * Math.PI, true);
      } else {
        ctx.arc(290, 100, 4, 0, 2 * Math.PI, true);
        ctx.arc(530, 100, 4, 0, 2 * Math.PI, true);
        ctx.arc(770, 100, 4, 0, 2 * Math.PI, true);
      }
      ctx.closePath();
      ctx.fill();
  };
  drawPixel(x, y, r, g, b, a,canvasData) {
    var index = (x + y * 10) * 4;

    canvasData.data[index + 0] = r;
    canvasData.data[index + 1] = g;
    canvasData.data[index + 2] = b;
    canvasData.data[index + 3] = a;
  }

  mouseOverElement(pos) {
    var selectedElement = -1;
    for (var n in this.uiElements) {
      if (this.uiElements[n].type !== 2) {
        // not of type "connection"
        if (this.uiElements[n].x - 1 < pos.x &&
          this.uiElements[n].x2 + 1 > pos.x &&
          this.uiElements[n].y - 1 < pos.y &&
          this.uiElements[n].y2 + 1 > pos.y) {
          selectedElement = n;
        }
      }
    }
    return selectedElement;
  }

  canvasMouseDown(event) {
    var pos = this.getMouse(event);

    // handle selection
    if (this.control) {
      if (!event.altKey && event.which === 1) {
        var selectedElement = this.mouseOverElement(pos);
        if (selectedElement !== -1) {
          // handle node selection
          if (this.uiElements[selectedElement].type === 0) {
            var newSelectedBead = this.uiElements[selectedElement].ref;
            this.abacusCtrl.activated(newSelectedBead);
            let event = new CustomEvent('updateNode', { detail: selectedElement });
            this.canvas.dispatchEvent(event);
          }
        }
        this.update();
      }
    }
    event.preventDefault();
  }
  reset() {
    let event = new CustomEvent('resetNode');
    this.canvas.dispatchEvent(event);
  }
  canvasMouseUp(event) {
  }
  on(name, callback) {
    this.canvas.addEventListener(name, callback);
  }
  canvasMouseMove(event) {
    var pos = this.getMouse(event);

    this.hooveredBead = -1;
    var oldHooveredElement = this.hooveredElement;
    this.hooveredElement = this.mouseOverElement(pos);

    if (this.hooveredElement !== -1) {
      this.hooveredBead = this.uiElements[this.hooveredElement].ref;
    }
    if (oldHooveredElement !== this.hooveredElement) this.update();
    event.preventDefault();
  }

  getMouse(e) {
    var element = this.canvas;
    var offsetX = 0, offsetY = 0, mx, my;

    // compute the total offset
    if (element.offsetParent !== undefined) {
      do {
        offsetX += element.offsetLeft;
        offsetY += element.offsetTop;
      } while ((element = element.offsetParent));
    }

    mx = e.pageX - offsetX;
    my = e.pageY - offsetY;

    return { x: mx, y: my };
  }

  drawRoundRectFilled(ctx, x, y, width, height, radius) {
    var lineWidthBackup = ctx.lineWidth;
    var strokeStyleBackup = ctx.strokeStyle;
    ctx.strokeStyle = ctx.fillStyle;
    ctx.lineJoin = "round";
    ctx.lineWidth = radius;
    ctx.strokeRect(x + (radius / 2), y + (radius / 2), width - radius, height - radius);
    ctx.fillRect(x + (radius / 2), y + (radius / 2), width - radius, height - radius);
    ctx.lineWidth = lineWidthBackup;
    ctx.strokeStyle = strokeStyleBackup;
  }
}

