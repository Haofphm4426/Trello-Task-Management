import { StatusCodes } from 'http-status-codes';
import { userModel } from '~/models/userModel';
import ApiError from '~/utils/ApiError';
import bcryptjs from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { pickUser } from '~/utils/formatters';
import { WEBSITE_DOMAIN } from '~/utils/constants';
import { BrevoProvider } from '~/providers/BrevoProvider';
import { env } from '~/config/environment';
import { JwtProvider } from '~/providers/JwtProvider';
import { CloudinaryProvider } from '~/providers/CloudinaryProvider';
import { cardModel } from '~/models/cardModel';

const createNew = async (reqBody) => {
  try {
    // Kiểm tra xem email đã tồn tại chưa
    const existUser = await userModel.findOneByEmail(reqBody.email);
    if (existUser) {
      throw new ApiError(StatusCodes.CONFLICT, 'Email already exists!');
    }

    // Tạo data để lưu vào Database
    // nameFromEmail: haofphm@gmail.com => "haofphm"
    const nameFromEmail = reqBody.email.split('@')[0];
    const newUser = {
      email: reqBody.email,
      // Tham số thứ hai là độ phức tạp, giá trị càng cao thì băm càng lâu
      password: bcryptjs.hashSync(reqBody.password, 8),
      username: nameFromEmail,
      displayName: nameFromEmail, // mặc định để giống username khi user đăng ký mới, về sau làm tính năng update cho user
      // isActive: true, // Mặc định bên userModel khi không khai báo sẽ là false, để true ở đây trong trường hợp bạn không muốn gửi mail xác nhận tài khoản hoặc gặp lỗi trong quá trình tạo tài khoản Brevo. Và nhớ comment dòng code số 50 sendEmail phía dưới lại.
      verifyToken: uuidv4()
    };

    // Lưu thông tin user vào Database
    const createdUser = await userModel.createNew(newUser);
    const getNewUser = await userModel.findOneById(createdUser.insertedId);

    //Gửi mail cho user
    const verificationLink = `${WEBSITE_DOMAIN}/account/verification?email=${getNewUser.email}&token=${getNewUser.verifyToken}`;
    const customSubject = 'TO DO LIST App: Please verify your email before using our services';
    const htmlContent = `
      <h3>Here is your verification link:</h3>
      <h3>${verificationLink}</h3>
      <h3>Sincerely,<br/> - To Do List - Haofphm - </h3>
    `;
    await BrevoProvider.sendEmail(getNewUser.email, customSubject, htmlContent);

    return pickUser(getNewUser);
  } catch (error) {
    console.log(error);
    throw error;
  }
};

const verifyAccount = async (reqBody) => {
  try {
    const existUser = await userModel.findOneByEmail(reqBody.email);

    if (!existUser) throw new ApiError(StatusCodes.NOT_FOUND, 'Account not found!');

    if (existUser.isActive) throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Your account is already active!');

    if (reqBody.token !== existUser.verifyToken) {
      throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Token is invalid!');
    }

    const updateData = {
      isActive: true,
      verifyToken: null
    };
    const updatedUser = await userModel.update(existUser._id, updateData);

    return pickUser(updatedUser);
  } catch (error) { throw error; }
};

const login = async (reqBody) => {
  try {
    const existUser = await userModel.findOneByEmail(reqBody.email);

    if (!existUser) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Your email or password is incorrect!');
    }

    if (!bcryptjs.compareSync(reqBody.password, existUser.password)) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Your email or password is incorrect!');
    }

    if (!existUser.isActive) throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Your account is not  active!');

    const userInfo = {
      _id: existUser._id,
      email: existUser.email
    };

    const accessToken = await JwtProvider.generateToken(
      userInfo,
      env.ACCESS_TOKEN_SECRET_SIGNATURE,
      // 5
      env.ACCESS_TOKEN_LIFE
    );
    const refreshToken = await JwtProvider.generateToken(
      userInfo,
      env.REFRESH_TOKEN_SECRET_SIGNATURE,
      // 15
      env.REFRESH_TOKEN_LIFE
    );

    return { accessToken, refreshToken, ...pickUser(existUser) };
  } catch (error) { throw error; }
};

const refreshToken = async (clientRefreshToken) => {
  try {
    const refreshTokenDecoded = await JwtProvider.verifyToken(
      clientRefreshToken,
      env.REFRESH_TOKEN_SECRET_SIGNATURE
    );

    const userInfo = { _id: refreshTokenDecoded._id, email: refreshTokenDecoded.email };

    const accessToken = await JwtProvider.generateToken(
      userInfo,
      env.ACCESS_TOKEN_SECRET_SIGNATURE,
      // 5 // 5 giây
      env.ACCESS_TOKEN_LIFE
    );

    return { accessToken };
  } catch (error) { throw error; }
};

const update = async (userId, reqBody, userAvatarFile) => {
  try {
    const existUser = await userModel.findOneById(userId);
    if (!existUser) throw new ApiError(StatusCodes.NOT_FOUND, 'Account not found!');
    if (!existUser.isActive) throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Your account is not active!');

    let updatedUser = {};
    let shouldUpdateCardsComments = false;

    if (reqBody.current_password && reqBody.new_password) {
      if (!bcryptjs.compareSync(reqBody.current_password, existUser.password)) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Your current password is incorrect!');
      }
      updatedUser = await userModel.update(existUser._id, {
        password: bcryptjs.hashSync(reqBody.new_password, 8)
      });
    } else if (userAvatarFile) {
      const uploadResult = await CloudinaryProvider.upload(userAvatarFile.buffer, 'users');
      console.log({uploadResult});
      updatedUser = await userModel.update(existUser._id, {
        avatar: uploadResult
      });
      shouldUpdateCardsComments = true;
    } else {
      // Update thông tin còn lại
      updatedUser = await userModel.update(existUser._id, reqBody);
      if (reqBody.displayName) {
        shouldUpdateCardsComments = true;
      }
    }

    if (shouldUpdateCardsComments) {
      await cardModel.updateManyComments(updatedUser._id.toString(), updatedUser);
    }

    return pickUser(updatedUser);
  } catch (error) { throw error; }
};

export const userService = {
  createNew,
  verifyAccount,
  login,
  refreshToken,
  update
};