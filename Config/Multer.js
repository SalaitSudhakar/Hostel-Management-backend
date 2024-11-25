import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "./Cloudinary.js";

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "BlogApp",
        allowedFormats: ["jpg", "png", "jpeg"],
    },
})

const upload = multer({ storage: storage });

export default upload;