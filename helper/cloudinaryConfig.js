// const cloudinary = require('cloudinary').v2;

// cloudinary.config({ 
//   cloud_name: process.env.CLOUD_NAME, 
//   api_key: process.env.CLOUD_API_KEY, 
//   api_secret: process.env.CLOUD_API_SECRET_KEY
// });

// // ⬇️ Updated function
// const uploadFile = async (fileBuffer) => {
//   try {
//     const result = await cloudinary.uploader.upload(fileBuffer.tempFilePath, {
//       folder: 'Tasty-Treasure'  // ✅ Uploads to this folder in Cloudinary
//     });
//     return result; // You can return result.secure_url or full result as needed
//   } catch (err) {
//     console.error('Cloudinary Upload Error:', err);
//     throw err;
//   }
// };

// module.exports = uploadFile;


const cloudinary = require('cloudinary').v2;

cloudinary.config({ 
  cloud_name: process.env.CLOUD_NAME, 
  api_key: process.env.CLOUD_API_KEY, 
  api_secret: process.env.CLOUD_API_SECRET_KEY
});

// ✅ Upload using in-memory buffer
const uploadFile = async (file) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'Tasty-Treasure' },
      (error, result) => {
        if (error) {
          console.error('Cloudinary Upload Error:', error);
          return reject(error);
        }
        resolve(result);
      }
    );

    stream.end(file.data); // ⬅️ Use buffer instead of temp file
  });
};

module.exports = uploadFile;
