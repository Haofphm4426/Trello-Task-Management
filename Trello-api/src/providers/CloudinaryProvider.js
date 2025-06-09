import { async } from '@babel/runtime/helpers/regeneratorRuntime';
import cloudinary from 'cloudinary';
import streamifier from 'streamifier';
import { env } from '~/config/environment';

/**
 * Tài liệu tham khảo
 * https://cloudinary.com/blog/node_js_file_upload_to_a_local_server_or_to_the_cloud
 */

// Bước cấu hình cloudinary, sử dụng v2 - version 2
const cloudinaryV2 = cloudinary.v2;
cloudinaryV2.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

// Khởi tạo một cái function để thực hiện upload file lên Cloudinary
const streamUpload = (fileBuffer, folderName) => {
  return new Promise((resolve, reject) => {
    // Tạo một cái luồng stream upload lên cloudinary
    const stream = cloudinaryV2.uploader.upload_stream(
      { folder: folderName },
      (err, result) => {
        if (err) reject(err);
        else resolve(result);
      }
    );
    // Thực hiện upload cái luồng trên bằng lib streamifier
    streamifier.createReadStream(fileBuffer).pipe(stream);
  });
};

const upload = async (fileBuffer, folderName) => {
  const result = await streamUpload(fileBuffer, folderName);
  const baseTransformations = [
    {
      quality: 'auto',
      fetch_format: 'auto'
    }
  ];

  // Nếu là ảnh user thì thêm resize + crop
  if (folderName === 'users') {
    baseTransformations.push({
      width: 200,
      height: 200,
      crop: 'fill',
      gravity: 'auto'
    });
  } else {
    baseTransformations.push({
      width: 1720,
      height: 640,
      crop: 'fill',
      gravity: 'auto'
    });
  }
  // return cloudinary.url(result.public_id);

  return cloudinary.url(result.public_id, {
    transformation: baseTransformations
  });
};

export const CloudinaryProvider = { streamUpload, upload };
