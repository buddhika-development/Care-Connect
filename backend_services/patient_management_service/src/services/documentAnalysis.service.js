import axios from "axios";

/**
 * Analyze medical documents via external document service
 * Sends all documents in a single request as an array
 *
 * @param {string} userId - User ID for document identification
 * @param {string[]} medicalReportPaths - Array of document URLs to analyze
 * @returns {Promise<Object>} Analysis response from document service
 *
 * @throws {Error} Logs warning on failure but doesn't break the flow
 */
export async function analyzePatientMedicalDocuments(
  userId,
  medicalReportPaths,
) {
  // Early return if no documents to analyze
  if (!medicalReportPaths || medicalReportPaths.length === 0) {
    return null;
  }

  try {
    const documentsArray = medicalReportPaths.map((docUrl, index) => ({
      document_id: `${userId}_${Date.now()}_${index}`,
      document_url: docUrl,
    }));

    console.log(
      `Sending ${documentsArray.length} medical documents for analysis...`,
    );

    const response = await axios.patch(
      "http://localhost:8002/api/document/analyze",
      {
        documents: documentsArray,
        userId: userId,
      },
      {
        timeout: 10000, // 10 second timeout for batch processing
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    console.log("Medical documents analyzed successfully:", response.data);
    return response.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Unknown error during document analysis";

    console.warn(
      "⚠️ Warning: Failed to analyze medical documents:",
      errorMessage,
    );
    console.warn(
      "Document service may be unavailable. Continuing without analysis...",
    );
    // Continue execution - don't break the flow
    return null;
  }
}
