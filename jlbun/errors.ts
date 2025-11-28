export class InexactError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = "InexactError";
  }
}

export class MethodError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = "MethodError";
  }
}

export class UnknownJuliaError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = "UnknownJuliaError";
  }
}
