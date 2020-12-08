export class TatumError extends Error {
    constructor(message, code) {
      super(message);
      this.name = code;
    }
  }