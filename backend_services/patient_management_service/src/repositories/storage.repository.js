import { v4 as uuidv4 } from "uuid";
import supabase from "../config/supabase.js";
import { DatabaseError } from "../utils/errors.utils.js";

const PROFILE_IMAGES_BUCKET = "profile-images";
const MEDICAL_DOCUMENTS_BUCKET = "medical-documents";

export async function uploadProfileImage(userId, file) {
  const extension = file.originalname.split(".").pop();
  const filePath = `${userId}/${uuidv4()}.${extension}`;

  const { error } = await supabase.storage
    .from(PROFILE_IMAGES_BUCKET)
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (error) {
    throw new DatabaseError("Failed to upload profile image: " + error.message);
  }

  const { data } = supabase.storage
    .from(PROFILE_IMAGES_BUCKET)
    .getPublicUrl(filePath);

  return data.publicUrl;
}

export async function deleteProfileImage(publicUrl) {
  const path = publicUrl.split("/profile-images/")[1];

  if (!path) return;

  const { error } = await supabase.storage
    .from(PROFILE_IMAGES_BUCKET)
    .remove([path]);

  if (error)
    console.error("Failed to delete old profile image: " + error.message);
}

export async function uploadMedicalDocument(userId, file) {
  const extension = file.originalname.split(".").pop();
  const filePath = `${userId}/${uuidv4()}.${extension}`;

  const { error } = await supabase.storage
    .from(MEDICAL_DOCUMENTS_BUCKET)
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (error) {
    throw new DatabaseError(
      "Failed to upload medical document: " + error.message,
    );
  }

  return filePath;
}

export async function deleteMedicalDocuments(filePaths) {
  if (!filePaths || filePaths.length === 0) return;

  const { error } = await supabase.storage
    .from(MEDICAL_DOCUMENTS_BUCKET)
    .remove(filePaths);

  if (error)
    console.log("Failed to delete medical documents: " + error.message);
}

export async function getSignedDocumentUrl(filePath) {
  const { data, error } = await supabase.storage
    .from(MEDICAL_DOCUMENTS_BUCKET)
    .createSignedUrl(filePath, 3600); // URL valid for 1 hour

  if (error) {
    throw new DatabaseError("Failed to generate signed URL: " + error.message);
  }

  return data.signedUrl;
}

export async function getSignedDocumentUrls(filePaths) {
  if (!filePaths || filePaths.length === 0) return [];

  const signedUrls = await Promise.all(
    filePaths.map(async (filePath) => {
      const { data, error } = await supabase.storage
        .from(MEDICAL_DOCUMENTS_BUCKET)
        .createSignedUrl(filePath, 3600);

      if (error) {
        console.error(
          `Failed to sign URL for path ${filePath}:`,
          error.message,
        );
        return { path: filePath, signedUrl: null };
      }

      return {
        path: filePath,
        signedUrl: data.signedUrl,
      };
    }),
  );

  return signedUrls;
}
