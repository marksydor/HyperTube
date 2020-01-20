const mutler	= require('multer')
const uniqid	= require('uniqid')
const path		= require('path')

const obj = {
	storageConfig: mutler.diskStorage({
		destination: (req, file, cb) => {
			cb(null, path.join('public/uploads'))
		},
		filename: (req, file, cb) => {
			cb(null, req.session.passport.user + uniqid() + '.' + file.mimetype.substring(6));
		}
	}),
	fileFilter: (req, file, cb) => {
		if (file.mimetype === "image/png" || file.mimetype === "image/jpg" || file.mimetype === "image/jpeg")
			cb(null, true);
		else
			cb(null, false);
	}
}

module.exports = obj