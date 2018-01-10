import Pixi from 'pixi.js';
const {
  Application,
  Graphics,
  Container,
  } = Pixi;

const degToRad = Math.PI / 180;
const radToDeg = 180 / Math.PI;
import merge from 'merge';

export default class Minimap {
  constructor(data = {}, options = {}) {
    const application = this.application = new Application();
    const {stage} = application;

    const field = this.field = new Container();
    stage.addChild(field);

    const nodeStyle = {
      lineWidth = 3,
      lineColor = 0xffffff,
      lineAlpha = 0.8,
      fillColor = 0xffffff,
      fillAlpha = 0.5,
      circleRadius = 5,
      } = options.nodeStyle || {};
    this.nodeStyle = nodeStyle;
    const nodeContainer = this.nodeContainer = new Container();
    field.addChild(nodeContainer);

    const cornStyle = {
      lineWidth = 2,
      lineColor = 0xffffff,
      lineAlpha = 0.4,
      fillColor = 0xffffff,
      fillAlpha = 0.5,
      circleRadius = 5,
    }  = options.cornStyle || {};
    this.cornStyle = conrStyle;
    const corn = this.corn = new Corn(conrStyle);
    field.addChild(corn);

    application.start();
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

  setCornPosition({x = 0, y = 0}) {
    this.corn.position.set(x, y);
  }

  setMinimapData(minimapData = {}) {
    const {
      nodeContainer,
      nodeStyle,
      } = this;
    nodeContainer.removeChildren();

    const {nodes} = minimapData;
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

    const halfAngle = (45 * degToRad) / 2;
    const radius = 4096;
    const {cos, sin} = Math;

    const {style} = this;
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
