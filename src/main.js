import Pixi from 'pixi.js';
const {
  Application,
  Graphics,
  Container,
  Sprite,
  } = Pixi;

const degToRad = Math.PI / 180;
const radToDeg = 180 / Math.PI;
import merge from 'merge';

export default class Minimap {
  static get baseDir() {
    if (typeof Minimap._baseDir === 'undefined') {
      Minimap._baseDir = '';
    }
    return Minimap._baseDir;
  }
  static set baseDir(baseDir) {
    Minimap._baseDir = baseDir;
  }

  static normalizePath(path) {
    let baseDir = Minimap.baseDir;
    if (path.charAt(0) === '/' || path.slice(0, 4) === 'http') {
      return path;
    }
    return (baseDir ? baseDir + '/' : '') + path;
  }

  static applyPositionDatum(order, container) {
    const {
      x = null,
      y = null,
      width = null,
      height = null,
      scaleX = null,
      scaleY = null,
      pivotX = null,
      pivotY = null,
      rotation = null,
      rotationRad = null,
      path,
      } = order;

    if (x) container.x = x;
    if (y) container.y = y;
    if (width) container.width = width;
    if (height) container.height = height;
    if (pivotX) container.pivot.x = pivotX;
    if (pivotY) container.pivot.y = pivotY;
    if (rotation) container.rotation = rotation * degToRad;
    if (rotationRad) container.rotation = rotationRad;
    if (scaleX) container.scale.x = scaleX;
    if (scaleY) container.scale.y = scaleY;
  }

  constructor(data = {}, options = {}) {
    const {
      width = 400,
      height = 300,
      } = data;
    this.width = width;
    this.height = height;

    const application = this.application = new Application(width, height, {
      transparent: true,
    });
    const {stage} = application;

    this.background = new Graphics();
    stage.addChild(this.background);

    const centering = this.centering = new Container();
    stage.addChild(centering);

    const field = this.field = new Container();
    centering.addChild(field);

    const imageContainer = this.imageContainer = new Container();
    field.addChild(imageContainer);

    const nodeStyle = this.nodeStyle = merge.recursive(true, {
      lineWidth: 1,
      lineColor: 0xffffff,
      lineAlpha: 0.8,
      fillColor: 0xffffff,
      fillAlpha: 0.5,
      circleRadius: 5,
      }, options.nodeStyle || {});
    const nodeContainer = this.nodeContainer = new Container();
    field.addChild(nodeContainer);

    const cornStyle = this.cornStyle = merge.recursive(true, {
      lineWidth: 2,
      lineColor: 0xffffff,
      lineAlpha: 0.4,
      fillColor: 0xffffff,
      fillAlpha: 0.5,
      circleRadius: 5,
      }, options.cornStyle || {});
    this.cornStyle = cornStyle;
    const corn = this.corn = new Corn(cornStyle);
    field.addChild(corn);

    if ('baseDir' in options) {
      Minimap.baseDir = options.baseDir;
    }

    application.start();

    this.setMinimapData(data);
  }

  getView() {
    return this.application.view;
  }

  get cornAngle() {
    return this.corn.rotation * radToDeg;
  }
  set cornAngle(value) {
    this.corn.rotation = value * degToRad;
  }

  get activeNodeName() {
    return this._activeNodeName || null;
  }
  set activeNodeName(name) {
    if (this._activeNodeName === name) return;
    this._activeNodeName = name;

    const {nodeContainer} = this;
    const {children} = nodeContainer;
    for (let i = 0; i < children.length; i ++) {
      const node = children[i];

      if (node.names instanceof Array && node.names.includes(name)) {
        node.scale.set(1.5, 1.5);
        continue;
      }

      if (!node.name || node.name !== name) {
        node.scale.set(1, 1);
        continue;
      } else {
        node.scale.set(1.5, 1.5);
        continue;
      }
    }
  }

  setAdjustmentPositionForField() {
    const {nodeContainer} = this;
    const {children} = nodeContainer;
    const cushion = 20;

    const {min, max} = Math;
    let minX = 0xffffff;
    let minY = 0xffffff;
    let maxX = -0xffffff;
    let maxY = -0xffffff;

    children.forEach((node) => {
      const {x, y} = node.position;
      minX = min(minX, x);
      minY = min(minY, y);
      maxX = max(maxX, x);
      maxY = max(maxY, y);
    });

    minX -= cushion;
    minY -= cushion;
    maxX += cushion;
    maxY += cushion;

    const {
      field,
      centering,
      width,
      height,
      } = this;
    centering.x = width / 2;
    centering.y = height / 2;
    field.x = -minX - (maxX - minX) / 2;
    field.y = -minY - (maxY - minY) / 2;

    const scaleX = width / (maxX - minX);
    const scaleY = height / (maxY - minY);
    const scale = min(scaleX, scaleY);

    centering.scale.set(scale, scale);
  }

  setCornPositionByNodeName(name) {
    const {nodeContainer} = this;
    const {children} = nodeContainer;

    let match;
    for (let i = 0; i < children.length; i ++) {
      const child = children[i];
      if (child.name === name) {
        match = child;
        break;
      }

      if (child.names instanceof Array && child.names.includes(name)) {
        match = child;
        break;
      }
    }
    if (!match) return;

    const position = match.position;
    this.setCornPosition(position);
  }

  setCornFov(fov) {
    this.corn.style.fov = fov;
    this.corn.draw();
  }

  setCornPosition({x = 0, y = 0}) {
    this.corn.position.set(x, y);
  }

  setMinimapData(minimapData = {}) {
    const {
      nodeContainer,
      imageContainer,
      nodeStyle,
      } = this;

    nodeContainer.removeChildren();

    const {
      nodes = [],
      images = [],
      } = minimapData;

    const {background} = minimapData;
    const {
      color = 0x000000,
      alpha = 0.6,
      } = background || {};

    if (background !== null) {
      const {
        background: graphics,
        } = this;

      const {
        width,
        height
        } = this;

      graphics.clear();
      graphics.beginFill(color, alpha);
      graphics.drawRect(0, 0, width, height);
    }

    imageContainer.removeChildren();
    images.forEach((imageData) => {
      const {path} = imageData;
      const sprite = Sprite.fromImage(Minimap.normalizePath(path), 'auto');
      imageContainer.addChild(sprite);

      Minimap.applyPositionDatum(imageData, sprite);
    });

    nodes.forEach((nodeData) => {
      const {
        position = {
          x: 0,
          y: 0,
          },
        name = null,
        style = null,
        type = 'node',
        } = nodeData;

      const graphicsStyle = style ? merge.recursive(true, nodeStyle, style) : nodeStyle;

      let node;
      switch (type) {
        case 'arrow':
          node = new Arrow(graphicsStyle);
          node.name = name;
          Minimap.applyPositionDatum(position, node);
          nodeContainer.addChild(node);
          break;
        case 'node':
        default :
          node = new Node(graphicsStyle);
          node.name = name;
          Minimap.applyPositionDatum(position, node);
          nodeContainer.addChild(node);
          break;
      }
    });

    const {field} = this;
    const {
      field: fieldOrder = null,
      } = minimapData;
    if (fieldOrder) Minimap.applyPositionDatum(fieldOrder, field);

    this.setAdjustmentPositionForField();
  }
}

class Node extends Container {
  constructor(style = {}) {
    super();
    const graphics = this.graphics = new Graphics();
    this.style = style;
    this.addChild(graphics);

    this.draw();
  }
  draw() {
    const {
      graphics,
      style = {},
      } = this;

    const {
      lineWidth = 2,
      lineColor = 0xffffff,
      lineAlpha = 0.8,
      fillColor = 0xffffff,
      fillAlpha = 0.6,
      size = 5,
      } = style;

    graphics.clear();
    graphics.lineStyle(lineWidth, lineColor, lineAlpha);
    graphics.beginFill(fillColor, fillAlpha);
    graphics.drawCircle(0, 0, size);
    graphics.endFill();
  }
}

class Arrow extends Container {
  constructor(style = {}) {
    super();
    const graphics = this.graphics = new Graphics();
    this.style = style;
    this.addChild(graphics);

    this.draw();
  }
  draw() {
    const {
      graphics,
      style = {},
      } = this;

    const {
      lineWidth = 2,
      lineColor = 0xffffff,
      lineAlpha = 0.8,
      fillColor = 0xffffff,
      fillAlpha = 0.6,
      size = 5,
      } = style;

    graphics.clear();
    graphics.lineStyle(lineWidth, lineColor, lineAlpha);

    const radius = size / 2;
    graphics.moveTo(-size, 0);
    graphics.lineTo(size, 0);
    graphics.moveTo(0, -size);
    graphics.lineTo(size, 0);
    graphics.lineTo(0, size);
  }
}

class Corn extends Container {
  constructor(style = {}) {
    super();
    const graphics = this.graphics = new Graphics();
    this.addChild(graphics);

    this.style = style;
    this.draw();
  }

  draw() {
    const {graphics} = this;

    const radius = 4096;
    const {cos, sin} = Math;

    const {style} = this;
    const {
      fov = 65,
      } = style;
    const halfAngle = (fov * degToRad) / 2;
    const {
      lineWidth = 1,
      lineColor = 0xffffff,
      lineAlpha = 0.4,
      fillColor = 0xffffff,
      fillAlpha = 0.5,
      circleRadius = 5,
      } = style;

    graphics.clear();
    graphics.moveTo(0, 0);
    graphics.lineStyle(lineWidth, lineColor, lineAlpha);
    graphics.beginFill(fillColor, fillAlpha);
    graphics.lineTo(cos(-halfAngle) * radius, sin(-halfAngle) * radius);
    graphics.lineTo(cos(halfAngle) * radius, sin(halfAngle) * radius);
    graphics.lineTo(0, 0);
    graphics.endFill();
  }
}
