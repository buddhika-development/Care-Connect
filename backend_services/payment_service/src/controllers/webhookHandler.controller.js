import { HandleWebhookUsecase } from "../usecases/handleWebhook.usecase.js";

export async function WebhookHandlerController(req, res) {
  // NOTE — no next() here, no error middleware
  // We ALWAYS return 200 to PayHere no matter what happens
  // If we return anything else, PayHere keeps retrying the webhook
  try {
    const result = await HandleWebhookUsecase(req.body);

    if (!result.verified) {
      // Signature failed — log it but still return 200
      console.error("Webhook rejected:", result.reason);
    }

    res.status(200).send("OK");
  } catch (error) {
    // Even if something crashes internally — still return 200
    console.error("Webhook handler crashed:", error.message);
    res.status(200).send("OK");
  }
}
