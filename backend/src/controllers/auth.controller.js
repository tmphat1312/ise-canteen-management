const jwt = require("jsonwebtoken");
const { promisify } = require("util");
const AppError = require("../utils/appError");
const {
	createAccessToken,
	createRefreshToken,
	signToken,
} = require("../utils/generateToken");

const User = require("../models/user.model");

exports.signup = async (req, res, next) => {
	const { name, email, password, passwordConfirm } = req.body;

	const query = User.findOne({ email }).select("+active");
	query.includeInactive = true;
	const existUser = await query;

	if (existUser && !existUser.active) {
		throw new AppError(
			400,
			"BAD_REQUEST",
			`Người dùng với email ${email} đã bị khóa.`,
			{ email }
		);
	}

	if (existUser) {
		throw new AppError(400, "DUPLICATE_KEYS", "Email đã tồn tại.", { email });
	}

	// Check if password and passwordConfirm are the same
	if (password !== passwordConfirm) {
		throw new AppError(
			400,
			"INVALID_ARGUMENTS",
			"Mật khẩu nhập lại không khớp.",
			{
				passwordConfirm,
			}
		);
	}

	const user = await User.create({
		name,
		email,
		password,
	});
	// Remove password and active from user object
	user.password = undefined;
	user.active = undefined;

	const { accessToken, accessTokenOptions } = createAccessToken(user, req);
	const { refreshToken, refreshTokenOptions } = createRefreshToken(user, req);

	res.cookie("accessToken", accessToken, accessTokenOptions);
	res.cookie("refreshToken", refreshToken, refreshTokenOptions);

	res.status(201).json({
		status: "success",
		accessToken: accessToken,
		refreshToken: refreshToken,
		data: {
			user: user,
		},
	});
};

exports.login = async (req, res, next) => {
	const { email, password } = req.body;

	// 2) Check if user exists && password is correct
	const user = await User.findOne({ email }, "+password +active");
	if (!user || !(await user.isCorrectPassword(password)))
		throw new AppError(
			401,
			"INVALID_CREDENTIALS",
			"Email hoặc mật khẩu không đúng."
		);

	if (!user.active)
		throw new AppError(
			401,
			"ACCOUNT_DISABLED",
			"Tài khoản của bạn đã bị khóa. Vui lòng liên hệ với quản trị viên để mở lại."
		);

	// 3) If everything ok, send tokens to client
	const { accessToken, accessTokenOptions } = createAccessToken(user, req);
	const { refreshToken, refreshTokenOptions } = createRefreshToken(user, req);

	res.cookie("accessToken", accessToken, accessTokenOptions);
	res.cookie("refreshToken", refreshToken, refreshTokenOptions);

	res.status(200).json({
		status: "success",
		accessToken,
		refreshToken,
	});
};

exports.logout = (req, res, next) => {
	res.cookie("accessToken", "", {
		expires: new Date(Date.now()),
		httpOnly: true,
	});

	res.cookie("refreshToken", "", {
		expires: new Date(Date.now()),
		httpOnly: true,
	});

	res.status(200).json({ status: "success" });
};

exports.updatePassword = async (req, res, next) => {
	const { oldPassword, newPassword, newPasswordConfirm } = req.body;

	// 1) Get user from collection
	const user = await User.findById(req.user.id).select("+password");

	// 2) Check if POSTed current password is correct
	if (!(await user.isCorrectPassword(oldPassword))) {
		throw new AppError(
			401,
			"INVALID_CREDENTIALS",
			"Mật khẩu hiện tại không đúng."
		);
	}

	// 3) Check if new password and confirm password are the same
	if (newPassword !== newPasswordConfirm) {
		throw new AppError(
			400,
			"INVALID_ARGUMENTS",
			"Mật khẩu nhập lại không khớp.",
			{
				newPasswordConfirm,
			}
		);
	}

	// 3) If so, update password
	user.password = newPassword;
	await user.save();

	// 4) Log user in, send JWT
	const { accessToken, accessTokenOptions } = createAccessToken(user, req);
	const { refreshToken, refreshTokenOptions } = createRefreshToken(user, req);

	res.cookie("accessToken", accessToken, accessTokenOptions);
	res.cookie("refreshToken", refreshToken, refreshTokenOptions);

	res.status(200).json({
		status: "success",
		accessToken,
		refreshToken,
	});
};

exports.protect = async (req, res, next) => {
	// 1) Getting tokens
	let accessToken;
	let refreshToken;
	if (
		req.headers.authorization &&
		req.headers.authorization.startsWith("Bearer")
	) {
		accessToken = req.headers.authorization.split(" ")[1];
	} else if (req.cookies.accessToken) {
		accessToken = req.cookies.accessToken;
	}
	refreshToken = req.cookies.refreshToken;

	// If there is no accessToken and no refreshToken, throw error
	if (!accessToken && !refreshToken) {
		throw new AppError(
			401,
			"SESSION_EXPIRED",
			"Phiên đăng nhập của bạn đã hết hạn. Vui lòng đăng nhập lại."
		);
	}

	// 2) Verify Tokens
	let decoded;
	let sendNewAccessToken = false;

	if (accessToken) {
		// 2.1) Verify accessToken
		try {
			decoded = await verifyToken(accessToken, process.env.ACCESS_SECRET);
		} catch (err) {
			if (err instanceof jwt.TokenExpiredError) {
				accessTokenExpired = true;
			} else {
				throw err;
			}
		}
	}

	// If accessToken is expired
	if (!decoded) {
		if (!refreshToken) {
			throw new AppError(
				401,
				"SESSION_EXPIRED",
				"Phiên đăng nhập của bạn đã hết hạn. Vui lòng đăng nhập lại."
			);
		}

		// 2.2) Verify refreshToken
		try {
			decoded = await verifyToken(refreshToken, process.env.REFRESH_SECRET);

			// If refreshToken is valid, send new accessToken
			const { accessToken, accessTokenOptions } = createAccessToken(
				{
					_id: decoded.id,
				},
				req
			);
			res.cookie("accessToken", accessToken, accessTokenOptions);
		} catch (err) {
			if (err instanceof jwt.TokenExpiredError) {
				throw new AppError(
					401,
					"SESSION_EXPIRED",
					"Phiên đăng nhập của bạn đã hết hạn. Vui lòng đăng nhập lại."
				);
			} else {
				throw err;
			}
		}
	}

	// Check if decode is undefined
	if (!decoded) {
		throw new AppError(
			401,
			"INVALID_TOKENS",
			"Phiên đăng nhập có vấn đề. Vui lòng đăng nhập lại."
		);
	}

	// 3) Check if user still exists

	// Find user by id and include inactive users
	const query = User.findById(
		decoded.id,
		"+password +passwordChangedAt +active"
	).lean({ virtuals: true });
	query.includeInactive = true;
	const currentUser = await query;

	if (!currentUser)
		throw new AppError(404, "NOT_FOUND", "Người dùng không tồn tại.");

	if (!currentUser.active)
		throw new AppError(
			401,
			"ACCOUNT_DISABLED",
			"Tài khoản của bạn đã bị khóa. Vui lòng liên hệ với quản trị viên để mở lại."
		);

	// 4) Check if user changed password after the token was issued
	if (isChangedPasswordAfter(currentUser.passwordChangedAt, decoded.iat))
		throw new AppError(
			401,
			"SESSION_EXPIRED",
			"Người dùng đã thay đổi mật khẩu. Vui lòng đăng nhập lại."
		);

	// GRANT ACCESS TO PROTECTED ROUTE
	req.user = currentUser;

	return next();
};

exports.restrictTo = (...roles) => {
	return (req, res, next) => {
		// Admin have access to all routes
		if (req.user.role === "admin") return next();

		// roles ['admin', 'cashier', 'staff', 'customer']
		if (!roles.includes(req.user.role)) {
			throw new AppError(
				403,
				"ACCESS_DENIED",
				"Người dùng không có quyền truy cập vào tài nguyên này."
			);
		}

		next();
	};
};

exports.passwordConfirm = async (req, res, next) => {
	const { passwordConfirm } = req.body;

	if (!passwordConfirm) {
		throw new AppError(400, "INVALID_ARGUMENTS", "Phải có mật khẩu xác nhận.", {
			passwordConfirm,
		});
	}

	const user = await User.findById(req.user.id).select("+password");
	const isCorrectPassword = await user.isCorrectPassword(passwordConfirm);

	if (!isCorrectPassword) {
		throw new AppError(
			400,
			"INVALID_CREDENTIALS",
			"Mật khẩu xác nhận không khớp.",
			{
				passwordConfirm,
			}
		);
	}

	next();
};

async function verifyToken(token, tokenSecret) {
	try {
		decoded = await promisify(jwt.verify)(token, tokenSecret);

		return decoded;
	} catch (err) {
		if (err instanceof jwt.TokenExpiredError) {
			throw err;
		} else if (
			err instanceof jwt.JsonWebTokenError ||
			err instanceof jwt.NotBeforeError
		) {
			throw new AppError(
				401,
				"INVALID_TOKENS",
				"Phiên đăng nhập có vấn đề. Vui lòng đăng nhập lại."
			);
		} else {
			throw err;
		}
	}
}

function isChangedPasswordAfter(passwordChangedAt, JWTTimestamp) {
	// Password has been changed after user being created
	if (passwordChangedAt) {
		const passwordChangeTime = parseInt(passwordChangedAt.getTime() / 1000, 10);
		return JWTTimestamp < passwordChangeTime;
	}

	// False: token was issued before password change time
	return false;
}
