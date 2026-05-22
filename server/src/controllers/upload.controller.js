import { uploadBase64 } from "../services/cloudinary.service.js";
import { z } from "zod";

const uploadSchema = z.object({
  image: z.string().min(10),
  listingId: z.string().optional(),
});

export async function uploadImage(req, res, next) {
  try {
    const parsed = uploadSchema.safeParse(req.body);
    if (!parsed.success) {
      const firstError = Object.values(
        parsed.error.flatten().fieldErrors,
      )[0]?.[0];
      return res.status(400).json({
        message: firstError || "Invalid image payload",
        errors: parsed.error.flatten(),
      });
    }

    const { image } = parsed.data;
    // image expected as data URL or remote URL
    const result = await uploadBase64(image);
    return res.json({ url: result.secure_url, raw: result });
  } catch (err) {
    next(err);
  }
}
