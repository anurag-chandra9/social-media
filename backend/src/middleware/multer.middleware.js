import multer from "multer";

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  console.log('Multer processing file:', {
    fieldname: file.fieldname,
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size
  });

  if (file.mimetype.startsWith("image/")) {
    console.log('File accepted: Valid image type');
    cb(null, true);
  } else {
    console.log('File rejected: Invalid file type');
    cb(new Error("Only images are allowed!"), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
}); 