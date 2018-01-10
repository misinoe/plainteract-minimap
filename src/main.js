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
      path,
      } = order;

    if (x) container.x = x;
    if (y) container.y = y;
    if (width) container.width = width;
    if (height) container.height = height;
    if (pivotX) container.pivot.x = pivotX;
    if (pivotY) container.pivot.y = pivotY;
    if (rotation) container.rotation = rotation;
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

    const field = this.field = new Container();
    stage.addChild(field);

    const imageContainer = this.imageContainer = new Container();
    field.addChild(imageContainer);

    const nodeStyle = this.nodeStyle = merge.recursive(true, {
      lineWidth: 3,
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
      node.scale.set(1, 1);
      if (node.name !== name) continue;
      node.scale.set(1.5, 1.5);
    }
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
      nodeStyle,
      imageContainer,
      } = this;

    nodeContainer.removeChildren();

    const {
      nodes = [],
      images = [],
      } = minimapData;

    const {background = null} = minimapData;
    if (background) {
      const {
        color = 0x000000,
        alpha = 0.7,
        } = background;

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
        } = nodeData;

      const node = new Node(nodeStyle);
      node.name = name;
      node.position = position;
      nodeContainer.addChild(node);
    });

    const {field} = this;
    const {
      field: fieldOrder = null,
      } = minimapData;
    if (fieldOrder) Minimap.applyPositionDatum(fieldOrder, field);
  }
}

class Node extends Container {
  constructor(style = {}) {
    super();
    const graphics = this.graphics = new Graphics();
    this.style = {};
    this.addChild(graphics);

    this.draw();
  }
  draw() {
    const {
      graphics,
      style = {},
      } = this;

    const {
      lineWidth = 3,
      lineColor = 0xffffff,
      lineAlpha = 0.8,
      fillColor = 0xffffff,
      fillAlpha = 0.5,
      circleRadius = 5,
      } = style;

    graphics.clear();
    graphics.lineStyle(lineWidth, lineColor, lineAlpha);
    graphics.beginFill(fillColor, fillAlpha);
    graphics.drawCircle(0, 0, circleRadius);
    graphics.endFill();
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
      lineWidth = 2,
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
