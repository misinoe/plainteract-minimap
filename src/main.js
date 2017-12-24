const degToRad = Math.PI / 180;

export default class Minimap {
  constructor(options) {

    this.style = {
      background: {
        fillStyle: 'rgba(0, 255, 0, 0.5)',
        strokeStyle: 'rgba(0, 0, 0, 0.9)',
        lineWidth: 1,
      },
      node: {
        radius: 5,
        fillStyle: 'rgba(255, 255, 255, 0.2)',
        strokeStyle: 'rgba(255, 255, 255, 0.5)',
        lineWidth: 1,
      },
      corn: {
      },
    };

    const canvas = this.canvas = document.createElement('canvas');

    this.direction = 0;
    this.perspective = 90;
    this.activeName = 'position001';

    this.data = {
      width: 400,
      height: 300,
      nodes: [
        {
          name: 'position001',
          position: {
            x: 150,
            y: 100,
          },
        },
        {
          name: 'position002',
          position: {
            x: 150,
            y: 130,
          },
        },
      ],
    };
  }

  update() {
    const {canvas, data} = this;
    const context = canvas.getContext('2d');

    const {width, height} = data;
    context.fillStyle = this.style.background.fillStyle;
    context.fillRect(1, 1, width, height);

    const {style} = this;
    const {radius} = style.node;

    const {nodes} = data;
    for (let node of nodes) {
      const {
        name = null,
        position,
        } = node;

      const {
        x,
        y,
        } = position;

      if (this.activeName === name) {
        this.drawCorn({x, y, context,});
      }

      context.beginPath();
      context.ellipse(
        x,
        y,
        radius,
        radius,
        0,
        0,
        Math.PI * 2,
        );
      context.stroke();
    }
  }

  drawCorn({x, y, context}) {
    const radius = 100;

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
    gradient.addColorStop(0, 'rgba(128, 128, 255, 1.0)');
    gradient.addColorStop(0.5, 'rgba(128, 128, 255, 0.0)');
    context.fillStyle = gradient;
    context.moveTo(x, y);
    context.lineTo(x + lx, y + ly);
    context.quadraticCurveTo(x + dx * 1.3, y + dy * 1.3, x + rx, y + ry);
    context.fill();
  }
}
