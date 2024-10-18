class ApiResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: any;

  constructor(statusCode: number, data: any, message = "Success") {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
  }
}

export { ApiResponse };
