export namespace Errors {
  export class Base extends Error {
    constructor(message: string, cause?: unknown) {
      super(message, { cause });
      this.name = "CrimsonError.Base";
    }
  }

  export class AI extends Base {
    constructor(message: string, cause?: unknown) {
      super(message, cause);
      this.name = "CrimsonError.AI";
    }
  }

  export class Cosmos extends Base {
    constructor(message: string, cause?: unknown) {
      super(message, cause);
      this.name = "CrimsonError.Cosmos";
    }
  }

  export class Notifications extends Base {
    constructor(message: string, cause?: unknown) {
      super(message, cause);
      this.name = "CrimsonError.Notifications";
    }
  }
}
