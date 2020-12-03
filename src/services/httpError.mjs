export class HttpError extends Error {
  constructor(statusCode, message, code, previous) {
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.previous = previous
  }
}

export class HttpInternalServerError extends HttpError {
  constructor(message, code, previous) {
    super(500, message, code, previous)
  }
}

export class HttpUnauthorizedError extends HttpError {
  constructor(message, code, previous) {
    super(401, message, code, previous)
  }
}

export class HttpPaymentRequiredError extends HttpError {
  constructor(message, code, previous) {
    super(402, message, code, previous)
  }
}

export class HttpForbiddenError extends HttpError {
  constructor(message, code, previous) {
    super(403, message, code, previous)
  }
}

export class HttpNotFoundError extends HttpError {
  constructor(message, code, previous) {
    super(404, message, code, previous)
  }
}

export class HttpNotAcceptableError extends HttpError {
  constructor(message, code, previous) {
    super(406, message, code, previous)
  }
}
