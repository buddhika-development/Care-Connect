import { createProxyMiddleware, fixRequestBody } from "http-proxy-middleware";
import { authenticate, authorize } from "../middleware/auth.middleware.js";

const createProxy = (target, pathRewrite = null) => {
  console.log(
    `Creating proxy for target: ${target} with pathRewrite:`,
    pathRewrite,
  );
  const options = {
    target,
    changeOrigin: true,
    on: {
      proxyReq: (proxyReq, req, res) => {
        fixRequestBody(proxyReq, req, res);

        if (req.user) {
          proxyReq.setHeader("x-user-id", req.user.userId);
          proxyReq.setHeader("x-user-email", req.user.email);
          proxyReq.setHeader("x-user-role", req.user.role);
          proxyReq.setHeader("x-gateway-secret", process.env.GATEWAY_SECRET);
        }
      },
      error: (err, req, res) => {
        console.error("Proxy error:", err.message);
        res.status(502).json({
          success: false,
          message: "Service temporarily unavailable. Please try again.",
        });
      },
    },
  };

  if (pathRewrite) {
    options.pathRewrite = pathRewrite;
  }

  return createProxyMiddleware(options);
};

const registerProxyRoutes = (app) => {
  console.log("Registering proxy routes...");
  const services = {
    PATIENT: process.env.PATIENT_SERVICE_URL,
    DOCTOR: process.env.DOCTOR_SERVICE_URL,
    APPOINTMENT: process.env.APPOINTMENT_SERVICE_URL,
    NOTIFICATION: process.env.NOTIFICATION_SERVICE_URL,
    PAYMENT: process.env.PAYMENT_SERVICE_URL,
    TELEMEDICINE: process.env.TELEMEDICINE_SERVICE_URL,
  };

  console.log("Registering proxy routes with targets:", services);
  // Patient service — patients and admins can access
  app.use(
    "/api/patients",
    authenticate,
    authorize("patient", "admin"),
    createProxy(services.PATIENT, (path) =>
      path === "/" ? "/api/patients" : "/api/patients" + path,
    ),
  );

  // Doctor service — doctors and admins can access
  app.use(
    "/api/doctors",
    authenticate,
    authorize("doctor", "admin"),
    createProxy(services.DOCTOR, (path) =>
      path === "/" ? "/api/doctors" : "/api/doctors" + path,
    ),
  );

  // Appointment service — all authenticated users
  app.use(
    "/api/appointments",
    authenticate,
    authorize("patient", "doctor", "admin"),
    createProxy(services.APPOINTMENT, (path) =>
      path === "/" ? "/api/appointments" : "/api/appointments" + path,
    ),
  );

  // Payment service — patients and admins
  app.use(
    "/api/payments",
    authenticate,
    authorize("patient", "admin"),
    createProxy(services.PAYMENT, (path) =>
      path === "/" ? "/api/payments" : "/api/payments" + path,
    ),
  );

  // Telemedicine service — patients and doctors
  app.use(
    "/api/telemedicine",
    authenticate,
    authorize("patient", "doctor", "admin"),
    createProxy(services.TELEMEDICINE, (path) =>
      path === "/" ? "/api/telemedicine" : "/api/telemedicine" + path,
    ),
  );

  // Notification service — internal/admin only
  app.use(
    "/api/notifications",
    authenticate,
    authorize("admin"),
    createProxy(services.NOTIFICATION, (path) =>
      path === "/" ? "/api/notifications" : "/api/notifications" + path,
    ),
  );
};

export default registerProxyRoutes;
