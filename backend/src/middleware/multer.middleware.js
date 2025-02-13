import multer from "multer";

// Configure multer storage
const storage = multer.memoryStorage();

// File filter function
const fileFilter = (req, file, cb) => {
  console.log('Multer processing file:', {
    fieldname: file.fieldname,
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    encoding: file.encoding
  });

  // Check file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/jpg'];
  if (!allowedTypes.includes(file.mimetype)) {
    console.error('Invalid file type rejected:', file.mimetype);
    return cb(new Error(`Invalid file type. Allowed types are: ${allowedTypes.join(', ')}`), false);
  }

  // Accept the file
  console.log('File accepted by multer');
  cb(null, true);
};

// Configure multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1 // Only allow 1 file per request
  }
});

// Custom error handling middleware
const handleMulterError = (err, req, res, next) => {
  console.error('Multer error:', {
    name: err.name,
    message: err.message,
    code: err.code,
    field: err.field,
    stack: err.stack
  });

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        message: 'File size too large. Maximum size is 5MB',
        error: err.message,
        code: err.code
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        message: 'Unexpected field name for file upload. Use "image" as the field name.',
        error: err.message,
        code: err.code
      });
    }
    return res.status(400).json({
      message: 'Error uploading file',
      error: err.message,
      code: err.code
    });
  }

  if (err.message.includes('Invalid file type')) {
    return res.status(400).json({
      message: err.message,
      error: 'Invalid file type'
    });
  }

  next(err);
};

export { upload, handleMulterError }; 