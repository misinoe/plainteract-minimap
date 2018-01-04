const degToRad = Math.PI / 180;
import merge from 'merge';

export default class Minimap {
  constructor(data = {}, options = {}) {

    const style = merge.recursive(true, {
      background: {
        fillStyle: 'rgba(0, 0, 0, 0.5)',
        strokeStyle: 'rgba(0, 0, 0, 0.9)',
        lineWidth: 1,
      },
      node: {
        radius: 5,
        fillStyle: 'rgba(255, 255, 255, 0.2)',
        strokeStyle: 'rgba(255, 255, 255, 0.5)',
        lineWidth: 1,
      },
      nodeActive: {
        radius: 5,
        fillStyle: 'rgba(255, 255, 255, 0.5)',
        strokeStyle: 'rgba(255, 255, 255, 0.8)',
        lineWidth: 4,
      },
      nodeHighlight: {
        radius: 5,
        fillStyle: 'rgba(200, 240, 255, 0.7)',
        strokeStyle: 'rgba(64, 128, 255, 0.9)',
        lineWidth: 3,
      },
      corn: {
      },
    }, options.style || {});
    this.style = style;

    const canvas = this.canvas = document.createElement('canvas');

    this.setMinimapData(data);

    this.direction = 0;
    this.perspective = 90;
    this.activeName = '';
    this.highlightName = '';
  }

  setMinimapData(data = {}) {
    this.data = merge.recursive(true, {
      viewRect: {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      },
      fieldRect: 'auto',
      nodes: [
      ],
    }, data);

    if (this.data.fieldRect === 'auto') {
      let x = 0xffffff, y = 0xffffff, right = 0, bottom = 0;
      this.data.nodes.forEach((node) => {
        const {position} = node;
        x = Math.min(position.x, x);
        y = Math.min(position.y, y);
        right = Math.max(position.x, right);
        bottom = Math.max(position.y, bottom);
      });
      this.data.fieldRect = {
        x: x - 10,
        y: y - 10,
        width: right - x + 20,
        height: bottom - y + 20,
      };
    }

    const {canvas} = this;
    const {viewRect} = this.data;

    canvas.width = viewRect.width;
    canvas.height = viewRect.height;

    this.update();
  }

  update() {
    const {canvas, data} = this;
    const context = canvas.getContext('2d');

    const {viewRect: rect, fieldRect: field} = data;
    const fieldBottom = field.y + field.height;
    const fieldRight = field.x + field.width;

    context.clearRect(1, 1, rect.width, rect.height);
    context.fillStyle = this.style.background.fillStyle;
    context.fillRect(1, 1, rect.width, rect.height);

    const {style} = this;
    const {radius} = style.node;

    const {nodes} = data;
    for (let node of nodes) {
      const {
        name = null,
        position,
        } = node;

      const {
        x: nodeX,
        y: nodeY,
        } = position;

      // if (nodeX > field.x && nodeX < fieldRight && nodeY > field.y && nodeY < fieldBottom) {
      // }

      const normalX = (position.x - field.x) / field.width;
      const normalY = (position.y - field.y) / field.height;

      const scale = Math.min(rect.width / field.width, rect.height / field.height);

      const x = normalX * field.width * scale;
      const y = normalY * field.height * scale;

      let nodeStyle;
      if (this.activeName === name) {
        this.drawCorn({x, y, context,});
        nodeStyle = this.style.nodeActive;
      } else if (this.highlightName === name) {
        nodeStyle = this.style.nodeHighlight;
      } else {
        nodeStyle = this.style.node;
      }

      context.beginPath();
      context.fillStyle = nodeStyle.fillStyle;
      context.strokeStyle = nodeStyle.strokeStyle;
      context.lineWidth = nodeStyle.lineWidth;
      context.ellipse(
        x,
        y,
        radius,
        radius,
        0,
        0,
        Math.PI * 2,
        );
      context.fill();
      context.stroke();
    }
  }

  drawCorn({x, y, context}) {
    const {data} = this;
    const radius = (data.viewRect.width + data.viewRect.height) / 2;

    const {direction} = this;
    const directionRad = direction * degToRad;

    const perspective = this.perspective / 2;
    const perspectiveRad = perspective * degToRad;

    const dx = Math.cos(directionRad) * radius;
    const dy = Math.sin(directionRad) * radius;

    const lx = Math.cos(directionRad - perspectiveRad) * radius;
    const ly = Math.sin(directionRad - perspectiveRad) * radius;

    const rx = Math.cos(directionRad + perspectiveRad) * radius;
    const ry = Math.sin(directionRad + perspectiveRad) * radius;

    context.beginPath();
    const gradient = context.createRadialGradient(x, y, 0, x + dx, y + dy, radius);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.0)');
    context.fillStyle = gradient;
    context.moveTo(x, y);
    context.lineTo(x + lx, y + ly);
    context.quadraticCurveTo(x + dx * 1.3, y + dy * 1.3, x + rx, y + ry);
    context.fill();
  }
}
