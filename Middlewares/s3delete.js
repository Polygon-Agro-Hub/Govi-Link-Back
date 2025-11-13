const { S3Client, DeleteObjectCommand } = require("@aws-sdk/client-s3");

const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true,
});

/**
 * Deletes a file from Cloudflare R2 using the file URL.
 * @param {string} imageUrl - The URL of the file to delete.
 * @returns {Promise<void>}
 */
const deleteFromR2 = async (imageUrl) => {
  console.log("Image URL to delete:", imageUrl);
  const extractFolderAndFileName = (url) => {
    const path = new URL(url).pathname; // e.g. "/users/profile-images/9fa31699-04b0-4638-9890-d5bb6f6fef88.jpg"
    const pathSegments = path.split('/');

    const folder = pathSegments.slice(1, -1).join('/');
    console.log("Folder Path:", folder);

    const fileName = pathSegments[pathSegments.length - 1]; // e.g. "9fa31699-04b0-4638-9890-d5bb6f6fef88.jpg"
    console.log("File Name:", fileName);

    return { folder, fileName };
  };

  const { folder, fileName } = extractFolderAndFileName(imageUrl);

  const deleteParams = {
    Bucket: process.env.R2_BUCKET_NAME,
    Key: `${folder}/${fileName}`
  };

  try {
    const command = new DeleteObjectCommand(deleteParams);
    await r2Client.send(command);
    console.log(`Deleted object from R2: ${folder}/${fileName}`);
  } catch (error) {
    console.error("Error deleting file from R2:", error);
    throw new Error("Failed to delete file from R2");
  }
};

module.exports = deleteFromR2;

