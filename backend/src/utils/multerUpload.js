const multer = require("multer");
const AppError = require("./appError");

const multerStorage = multer.memoryStorage();

// Check if uploaded file is image
const multerFilter = (req, file, cb) => {
	if (file.mimetype.startsWith("image")) {
		cb(null, true);
	} else {
		cb(new AppError("Not an image! Please upload only image", 400), false);
	}
};

exports.upload = multer({
	storage: multerStorage,
	fileFilter: multerFilter,
});
