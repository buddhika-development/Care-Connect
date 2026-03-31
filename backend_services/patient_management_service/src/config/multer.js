import multer from "multer";

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedProfileImageTypes = ["image/jpeg", "image/png", "image/webp"];
  const allowedDocumentTypes = ["application/pdf", "image/jpeg", "image/png"];

  if (file.fieldname === "profileImage") {
    if (!allowedProfileImageTypes.includes(file.mimetype)) {
      return cb(
        new Error(
          "Invalid file type for profile image. Only JPEG, PNG, and WEBP are allowed.",
        ),
        false,
      );
    }
  } else if (file.fieldname === "medicalDocuments") {
    if (!allowedDocumentTypes.includes(file.mimetype)) {
      return cb(
        new Error(
          "Invalid file type for medical documents. Only PDF, JPEG, and PNG are allowed.",
        ),
        false,
      );
    }
  }

  cb(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 6,
  },
});
