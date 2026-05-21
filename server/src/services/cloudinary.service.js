import { v2 as cloudinary } from "cloudinary";

cloudinary.config(
  process.env.CLOUDINARY_URL
    ? undefined
    : {
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      },
);

export async function uploadBase64(dataUri, options = {}) {
  // dataUri: data:image/png;base64,.... or a remote URL
  const result = await cloudinary.uploader.upload(dataUri, {
    folder: process.env.CLOUDINARY_FOLDER || "marketiq",
    resource_type: options.resource_type || "image",
    transformation: options.transformation,
  });
  return result;
}

export default cloudinary;
