import { StatusCodes } from 'http-status-codes';
import { JwtProvider } from '~/providers/JwtProvider';
import { env } from '~/config/environment';
import ApiError from '~/utils/ApiError';

const isAuthorized = async (req, res, next) => {
  const clientAccessToken = req.cookies?.accessToken;

  if (!clientAccessToken) {
    next(new ApiError(StatusCodes.UNAUTHORIZED, 'Unauthorized! (token not found)'));
    return;
  }

  try {
    const accessTokenDecoded = await JwtProvider.verifyToken(
      clientAccessToken,
      env.ACCESS_TOKEN_SECRET_SIGNATURE
    );

    req.jwtDecoded = accessTokenDecoded;

    next();
  } catch (error) {
    // Nếu cái accessToken nó bị hết hạn (expired) thì trả về một cái mã lỗi GONE - 410 cho phía FE biết để gọi api refreshToken
    if (error?.message?.includes('jwt expired')) {
      next(new ApiError(StatusCodes.GONE, 'Need to refresh token.'));
      return;
    }

    // Nếu như cái accessToken nó không lợp lệ do bất kỳ điều gì khác vụ hết hạn thì chúng ta cứ thẳng tay trả về mã 401 cho phía FE gọi api sign_out luôn
    next(new ApiError(StatusCodes.UNAUTHORIZED, 'Unauthorized!'));
  }
};

export const authMiddleware = { isAuthorized };