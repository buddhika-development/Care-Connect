export class ApiResponse {
  static success(res, { statusCode = 200, message, data, meta }) {
    const response = {
      success: true,
      message: message || "Request successful",
    };

    // Add data if provided
    if (data !== undefined) {
      response.data = data;
    }

    // Add metadata if provided (for pagination, etc.)
    if (meta) {
      response.meta = meta;
    }

    return res.status(statusCode).json(response);
  }

  static created(res, { message, data, meta }) {
    return this.success(res, {
      statusCode: 201,
      message: message || "Resource created successfully",
      data,
      meta,
    });
  }

  static noContent(res) {
    return res.status(204).send();
  }
}

export const sendSuccess = (res, data, message = "Success") => {
  return ApiResponse.success(res, { data, message });
};

export const sendCreated = (res, data, message = "Created successfully") => {
  return ApiResponse.created(res, { data, message });
};

export const sendNoContent = (res) => {
  return ApiResponse.noContent(res);
};

export const sendPaginated = (res, options) => {
  return ApiResponse.paginated(res, options);
};
