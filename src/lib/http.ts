export class HttpResponse {
  static badRequest(message = "Bad request") {
    return new Response(message, { status: 400 });
  }
  static unauthorized(message = "Unauthorized") {
    return new Response(message, { status: 400 });
  }
  static notFound(message = "Not found") {
    return new Response(message, { status: 404 });
  }
  static internalServerError(message = "Internal server error") {
    return new Response(message, { status: 500 });
  }
  static serviceUnavailable(message = "Service unavailable") {
    return new Response(message, { status: 503 });
  }

  // Add http messages as needed
}
