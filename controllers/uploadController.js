import AWS from "aws-sdk";
import { v4 as uuid } from "uuid";

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

export const presign = async (req, res) => {
  try {
    const { filename, contentType } = req.body;
    const key = `uploads/${uuid()}-${filename}`;

    const params = {
      Bucket: process.env.S3_BUCKET,
      Key: key,
      ContentType: contentType,
      Expires: 60
    };

    const url = await s3.getSignedUrlPromise("putObject", params);
    const publicUrl = `https://${process.env.S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    res.json({ url, key, publicUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
