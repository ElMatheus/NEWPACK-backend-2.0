import axios from "axios";
import fileType from "file-type";

const allowedMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/webp"
];

export const verifyValidImage = async (url: string): Promise<boolean> => {
  try {
    const response = await axios.get(url, { responseType: "arraybuffer" });
    const buffer = Buffer.from(response.data, "binary");

    const archieveType = await fileType.fromBuffer(buffer);
    if (!archieveType) return false;

    return allowedMimeTypes.includes(archieveType.mime);
  } catch (error) {
    console.error("Error verifying image:", error);
    return false;
  }
};
