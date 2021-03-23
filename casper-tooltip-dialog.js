/**
 * `casper-tooltip-dialog`
 * Tooltipish dialog
 *
 * @customElement
 * @polymer
 */
import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
import { mixinBehaviors } from '@polymer/polymer/lib/legacy/class.js';
import { CasperOverlayBehavior } from '@cloudware-casper/casper-overlay-behavior/casper-overlay-behavior.js';

class CasperTooltipDialog extends mixinBehaviors(CasperOverlayBehavior, PolymerElement) {

  static get is () {
    return 'casper-tooltip-dialog';
  }

  static get template () {
    return html`<style>
        :host {
          position: absolute;
        }

        .canvas {
          position: absolute;
          width: 100%;
          height: 100%;
        }

        .content {
          position: absolute;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          padding: 0px 3px;
        }

        .body {
          display: flex;
          flex-direction: column;
          flex-weight: 2.0;
        }

        .buttons {
          padding: 6px 12px;
          display: flex;
          flex-direction: row;
          justify-content: space-evenly;
        }

      </style>
      <canvas id="canvas" class="canvas">
      </canvas>
      <div id="content" class="content">
        <div id="header" class="header">
          <slot name="header">
          </slot>
        </div>
        <div class="body">
          <slot name="body">
          </slot>
        </div>
        <div class="buttons">
          <slot name="buttons">
          </slot>
        </div>
      </div>`
  }

  static get properties () {
    return {
      title: String,
      radius: {
        type: Number,
        value: 8
      },
      tipHeight: {
        type: Number,
        value: 12
      },
      tipBase: {
        type: Number,
        value: 20
      },
      headerColor: {
        type: String,
        value: '#ccc'
      },
      bodyColor: {
        type: String,
        value: '#eee'
      },
      borderColor: {
        type: String,
        value: '#666'
      },
      shadowColor: {
        type: String,
        value: '#555'
      }
    }
  }

  get target () {
    return this.__target;
  }

  ready () {
    super.ready();
    this._canvas = this.$.canvas;
    this._content = this.$.content;
    this._header = this.$.header;
    this.__target = undefined;
    this._ctx = this._canvas.getContext('2d');
    this._content.style.paddingTop = '2px';
    this._content.style.paddingBottom = this.tipHeight + 'px';
    this.__setupPixelRatio();
  }

  async connectedCallback () {
    super.connectedCallback();
    this._resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        this.__positionTooltip();
      }
    });
    this.addEventListener('opened-changed', e => this.__onOpenedChanged(e));
    this._resizeObserver.observe(this._content);
  }

  disconnectedCallback () {
    super.disconnectedCallback();
    if (this._resizeObserver) {
      this._resizeObserver.unobserve(this._content);
    }
  }

  /**
   * Determine the device pixel ratio: 1 on classical displays 2 on retina/UHD displays
   */
  __setupPixelRatio () {
    let devicePixelRatio = window.devicePixelRatio || 1;
    if (devicePixelRatio > 1.6) {
      devicePixelRatio = 2;
    } else {
      devicePixelRatio = 1;
    }
    let backingStoreRatio = this._ctx.webkitBackingStorePixelRatio ||
      this._ctx.mozBackingStorePixelRatio ||
      this._ctx.msBackingStorePixelRatio ||
      this._ctx.oBackingStorePixelRatio ||
      this._ctx.backingStorePixelRatio || 1;
    this._ratio = devicePixelRatio / backingStoreRatio;
  }

  /**
   * Make path for rectangle, rounded at the top, flat at bottom
   *
   * @param {number} x upper left corner
   * @param {number} y upper left corner
   * @param {number} w width of the round rectangle
   * @param {number} h height of the round rectangle
   * @param {number} r corner radius
   */
  __makeTopRoundRectPath (x, y, w, h, r) {
    this._ctx.beginPath();
    this._ctx.moveTo(x + r, y);
    this._ctx.arcTo(x + w, y, x + w, y + r, r);
    this._ctx.lineTo(x + w, y + h);
    this._ctx.lineTo(x, y + h);
    this._ctx.arcTo(x, y, x + r, y, r);
    this._ctx.closePath();
  }

  /**
   * Make path for rectangle, rounded at the top, flat at bottom with a protuding tip arrow
   *
   * @param {number} tx x coordinate of arrow tip
   * @param {number} tw width of the tip
   * @param {number} th tip height in pixels
   * @param {number} x top left
   * @param {number} y top left
   * @param {number} w width of the rectangle
   * @param {number} h height of the rectangle
   * @param {number} r radius of the rounded coords
   */
  __makeTopArrowedRectPath (tx, tw, th, x, y, w, h, r) {
    this._ctx.beginPath();
    this._ctx.moveTo(tx - tw / 2, th);
    this._ctx.lineTo(tx, 0);
    this._ctx.lineTo(tx + tw / 2, th);
    this._ctx.arcTo(x + w, y, x + w, y + r, r);
    this._ctx.lineTo(x + w, y + h);
    this._ctx.lineTo(x, y + h);
    this._ctx.arcTo(x, y, x + r, y, r);
    this._ctx.closePath();
  }

  /**
   * Make path for rectangle, flat at the top, rounded at the bottom
   *
   * @param {number} x upper left corner
   * @param {number} y upper left corner
   * @param {number} w width of the round rectangle
   * @param {number} h height of the round rectangle
   * @param {number} r corner radius
   */
  __makeBottomRoundRectPath (x, y, w, h, r) {
    this._ctx.beginPath();
    this._ctx.moveTo(x, y);
    this._ctx.lineTo(x + w, y);
    this._ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    this._ctx.arcTo(x, y + h, x, y + h - r, r);
    this._ctx.closePath();
  }

  /**
   * Make path for rectangle, flat at the top, rounded at bottom with a protuding tip arrow
   *
   * @param {number} tx x coordinate of arrow tip
   * @param {number} tw width of the tip
   * @param {number} th tip height in pixels
   * @param {number} x top left
   * @param {number} y top left
   * @param {number} w width of the rectangle
   * @param {number} h height of the rectangle
   * @param {number} r radius of the rounded coords
   */
  __makeBottomArrowedRectPath (tx, tw, th, x, y, w, h, r) {
    this._ctx.beginPath();
    this._ctx.moveTo(tx - tw / 2, y + h);
    this._ctx.lineTo(tx, y + h + th);
    this._ctx.lineTo(tx + tw / 2, y + h);
    this._ctx.arcTo(x + w, y + h, x + w, y + h - r, r);
    this._ctx.lineTo(x + w, y);
    this._ctx.lineTo(x, y);
    this._ctx.arcTo(x, y + h, x + w + r, y + h, r);
    this._ctx.closePath();
  }

  /**
   * Paints and strole the canvas current path, to crop blurry shadows defines a clip region
   *
   * @param {String} fillColor background color to fill the path
   * @param {String} shadowColor color of the shadow
   * @param {Number} verticalClip if positive clip Y bellow this coordinate, if negative clip Y above
   */
  __paintAndStroke (fillColor, shadowColor, verticalClip) {
    const clip = new Path2D();
    this._ctx.save();
    if (verticalClip > 0) {
      clip.rect(0, 0, this._canvas.width, verticalClip);
    } else {
      clip.rect(0, -verticalClip, this._canvas.width, this._canvas.height - verticalClip);
    }
    this._ctx.clip(clip);
    this._ctx.fillStyle = fillColor;
    this._ctx.shadowBlur = 5 * this._ratio;
    this._ctx.shadowOffsetX = 0;
    this._ctx.shadowOffsetY = 1 * this._ratio;
    this._ctx.shadowColor = shadowColor;
    this._ctx.fill();
    this._ctx.shadowBlur = 0;
    this._ctx.shadowOffsetX = 0;
    this._ctx.shadowOffsetY = 0;
    this._ctx.shadowBlur = 0;
    // this._ctx.stroke();
    this._ctx.restore();
  }

  /**
   * Resize the canvas to match the new width and then repaints the ballonish background
   *
   * @param {number} width
   * @param {number} height
   */
  __updateBalloon (width, height) {
    this._canvas.width = width * this._ratio;
    this._canvas.height = height * this._ratio;
    this._canvas.style.width = width + 'px';
    this._canvas.style.height = height + 'px';

    // calculate and transform to canvas coordinates
    const sm = 7; // shadow margin
    const headerHeight = this._headerHeight * this._ratio; // TODO hardcoded
    const radius = this.radius * this._ratio;
    const tipHeight = this.tipHeight * this._ratio;
    const tipBase = this.tipBase * this._ratio;
    const tipLocation = Math.round(0 + width * this._arrowLoc * this._ratio);
    width = (width - 2 * sm) * this._ratio;

    this._ctx.strokeStyle = this.borderColor;
    this._ctx.lineWidth = this._ratio;
    this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
    switch (this._tipEdge) {
      case 'N':
      default:
        height = (height - 6) * this._ratio;
        this.__makeTopArrowedRectPath(tipLocation, tipBase, tipHeight, sm * this._ratio, tipHeight, width, headerHeight, radius);
        this.__paintAndStroke(this.headerColor, this.shadowColor, headerHeight + tipHeight + this._ratio);
        this.__makeBottomRoundRectPath(sm * this._ratio, headerHeight + tipHeight, width, height - headerHeight - tipHeight, radius);
        this.__paintAndStroke(this.bodyColor, this.shadowColor, - (headerHeight + tipHeight));
        break;
      case 'S':
        height = (height - 1) * this._ratio;
        this.__makeTopRoundRectPath(sm * this._ratio, this._ratio, width, headerHeight, radius);
        this.__paintAndStroke(this.headerColor, this.shadowColor, headerHeight + tipHeight + this._ratio);
        this.__makeBottomArrowedRectPath(tipLocation, tipBase, tipHeight, sm * this._ratio, headerHeight, width, height - headerHeight - tipHeight, radius);
        this.__paintAndStroke(this.bodyColor, this.shadowColor, - headerHeight);
        break;
    }
  }

  open (target) {
    if (this.opened) {
      if (this.__target !== target) {
        this.__target = target;
        this.__positionTooltip();
        // hack for safari
        setTimeout(() => this.__positionTooltip(), 20);
        setTimeout(() => this.__positionTooltip(), 150);
      }
    } else {
      this.__target = target;
      super.open();
    }
  }

  __positionTooltip () {

    if (this.__target === undefined) {
      super.close();
      return;
    }

    let tipEdge;
    // .. grab the fitinto, target and content rects
    const crect = this._content.getBoundingClientRect();
    const hrect = this._header.getBoundingClientRect();
    const trect = this.__target.getBoundingClientRect();
    const frect = document.body.getBoundingClientRect();
    const width = crect.width;
    const height = crect.height;

    // ... vertical layout fit above ou bellow position target ...
    if (frect.bottom < trect.bottom + height) {
      this.style.top = trect.top - height + 'px';
      tipEdge = 'S';
      this._content.style.paddingTop = '2px';
      this._content.style.paddingBottom = this.tipHeight + 'px';
    } else {
      this.style.top = trect.bottom + 'px';
      tipEdge = 'N';
      this._content.style.paddingTop = this.tipHeight + 'px';
      this._content.style.paddingBottom = '2px';
    }

    // ... horizontal layout so that it's stays inside the page ...
    const tooltipArrowX = trect.left + trect.width / 2;
    let tooltipLeft = tooltipArrowX - width / 2;
    let arrowLoc = 0.5;

    if (tooltipLeft < frect.left) {
      tooltipLeft = frect.left;
      arrowLoc = (tooltipArrowX - tooltipLeft) / width;
    } else if (tooltipLeft + width > frect.left + frect.width) {
      tooltipLeft = frect.left + frect.width - width;
      arrowLoc = (tooltipArrowX - tooltipLeft) / width;
    }
    // ... position relative to fitInto and show the tooltip ...
    this.style.left = tooltipLeft + 'px';

    // ... save
    this._arrowLoc = arrowLoc;
    this._tipEdge = tipEdge;
    this._headerHeight = hrect.height ? hrect.height : 40;
    this.__updateBalloon(width, height);
  }

  __onOpenedChanged (event) {
    if (event.detail.value === false) {
      this.__target = undefined;
      this.withBackdrop = undefined;
    } else {
      this.__positionTooltip();
      // hack for safari
      setTimeout(() => this.__positionTooltip(), 20);
      setTimeout(() => this.__positionTooltip(), 150);
    }
  }
}

customElements.define(CasperTooltipDialog.is, CasperTooltipDialog);