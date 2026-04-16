import fetch from "node-fetch";
import { AppError } from "./errors.utils.js";

const httpClient = {
  async get(baseUrl, path, serviceName) {
    try {
      const response = await fetch(`${baseUrl}${path}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-internal-secret": process.env.INTERNAL_SECRET,
          "x-service-name": serviceName,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new AppError(
          data.message || "External service error",
          response.status
        );
      }

      return data;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(`Service call failed: ${error.message}`, 503);
    }
  },

  async post(baseUrl, path, serviceName, body) {
    try {
      const response = await fetch(`${baseUrl}${path}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal-secret": process.env.INTERNAL_SECRET,
          "x-service-name": serviceName,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new AppError(
          data.message || "External service error",
          response.status
        );
      }

      return data;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(`Service call failed: ${error.message}`, 503);
    }
  },

  async patch(baseUrl, path, serviceName, body) {
    try {
      const response = await fetch(`${baseUrl}${path}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-internal-secret": process.env.INTERNAL_SECRET,
          "x-service-name": serviceName,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new AppError(
          data.message || "External service error",
          response.status
        );
      }

      return data;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(`Service call failed: ${error.message}`, 503);
    }
  },
};

export default httpClient;