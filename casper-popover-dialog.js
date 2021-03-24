import './casper-tooltip-dialog.js';
import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
import { afterNextRender } from '@polymer/polymer/lib/utils/render-status.js';

class CasperPopoverDialog extends PolymerElement {
  static get properties () {
    return {
      inputLabel: {
        type: String,
        value: 'Descrição'
      },
      inputValue: {
        type: String,
        value: ''
      },
      headerText: {
        type: String,
        value: 'Criar'
      },
      hideDelete: {
        type: String,
        value: false
      },
      responseObject: {
        type: Object,
        value: {}
      },
      _dialog: {
        type: Element
      }
    };
  }

  static get template () {
    return html`
      <style>
        .header {
          color: white;
          padding: 7px 0;
          width: 90%;
          display: flex;
          margin: auto;
          justify-content: space-between;
        }

        .close {
          width: 20px;
          height: 20px;
          cursor: pointer;
        }

        #descriptionInput {
          width: 90%;
          margin: auto;
        }

        .buttons-container {
          display: flex;
          width: 280px;
          justify-content: flex-end;
          margin-top: 10px;
          padding-bottom: 7px;
        }

        .buttons-container:focus {
          outline: none;
        }

        .button {
          padding: 4px 14px 4px 14px;
          border-radius: 15px;
          cursor: pointer;
          border: 1.5px solid var(--primary-color);
        }

        .delete-button {
          color: var(--primary-color);
          margin-right: 10px;
        }

        .accept-button {
          color: white;
          background: var(--primary-color);
        }
      </style>

      <casper-tooltip-dialog id="ctd">
        <div slot="header" class="header">
          <span>[[headerText]]</span>
          <casper-icon class="close" icon="fa-light:times-circle" on-click="close"></casper-icon>
        </div>
        <paper-input slot="body" id="descriptionInput" width="300px" label="[[inputLabel]]" value="{{inputValue}}"></paper-input>
        <div slot="buttons" class="buttons-container">
          <template is="dom-if" if="[[!hideDelete]]">
            <casper-icon icon="fa-light:trash-alt" class="button delete-button" on-click="_deletePressed"></casper-icon>
          </template>
          <casper-icon icon="fa-light:check" class="button accept-button" on-click="_acceptPressed"></casper-icon>
        </div>
      </casper-tooltip-dialog>
    `;
  }

  static get is () {
    return 'casper-popover-dialog';
  }

  ready () {
    super.ready();

    this._dialog = this.$.ctd;
    this._dialog.horizontalAlign = 'auto';
    this._dialog.headerColor = getComputedStyle(document.body).getPropertyValue('--primary-color').trim();
    this._dialog.bodyColor = 'white';

    this.addEventListener('resolve-popover-dialog', (event) => this._resolve && this._resolve({ detail: event.detail }) );
    this.addEventListener('close-popover-dialog', () => this._reject && this._reject() );

    this._dialog.addEventListener('opened-changed', (event) => {
      if (event && event.detail && event.detail.value === true) {
        afterNextRender(this, () => {
          this.$.descriptionInput.focus();
        });
      } else if (event && event.detail && event.detail.value === false) {
        // Clears error message when the user closes the popover
        this.$.descriptionInput.invalid = false;
        this.$.descriptionInput.errorMessage = '';

        this.dispatchEvent(new CustomEvent('close-popover-dialog', { bubbles: true, composed: true }));
      }
    });

    this.$.descriptionInput.addEventListener('keypress', (event) => {this._keyPressed(event)});
  }

  connection (target) {
    if (!target) {
      console.error('connections needs target!');
      return;
    }

    return new Promise(
      function (resolve, reject) {
        this.open(target);
        this._resolve = resolve;
        this._reject = reject;
      }.bind(this)
    );
  }

  open (target) {
    // Mini martelada to prevent tooltip dialog from closing itself...
    if (this._dialog.opened) this.close();

    afterNextRender(this._dialog, () => {
      this._dialog.open(target);
    });
  }

  close () {
    this._dialog.close();
  }

  _deletePressed () {
    this.dispatchEvent(new CustomEvent('resolve-popover-dialog', {
      bubbles: true,
      composed: true,
      detail: { response: this.responseObject, delete: true }
    }));

    this.close()
  }

  _acceptPressed () {
    if (!!this.inputValue === false) {
      const input = this.$.descriptionInput;
      input.invalid = true;
      input.errorMessage = 'Este campo não pode estar em branco.';
      return;
    }

    this.responseObject.inputValue = this.inputValue;

    this.dispatchEvent(new CustomEvent('resolve-popover-dialog', {
      bubbles: true,
      composed: true,
      detail: { response: this.responseObject, accept: true }
    }));

    this.close()
  }

  _keyPressed (event) {
    if (event && event.key === 'Enter' && event.currentTarget && event.currentTarget.id === 'descriptionInput') {
      this._acceptPressed();
    }

    // Clears error message when the user presses any key other than Enter
    if (event && event.key !== 'Enter' && event.currentTarget && event.currentTarget.id === 'descriptionInput') {
      this.$.descriptionInput.invalid = false;
      this.$.descriptionInput.errorMessage = '';
    }
  }

}

customElements.define(CasperPopoverDialog.is, CasperPopoverDialog);