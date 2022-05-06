import config from '$config';
import aws from 'aws-sdk';
import Sharp from 'sharp';

const s3 = new aws.S3({
  secretAccessKey: config.AWSUpload.secretAccessKey,
  accessKeyId: config.AWSUpload.accessKeyId,
  region: config.AWSUpload.region,
});

export async function putImageToS3(image: Express.Multer.File, fileName: string) {
  await s3
    .putObject({
      ACL: 'public-read',
      Body: image.buffer,
      Bucket: config.AWSUpload.bucket,
      ContentType: image.mimetype,
      Key: fileName,
    })
    .promise();

  if (image.originalname.search(/\.(gif|jpe?g|tiff|png|webp|bmp|svg|HEIC)$/gi) !== -1) {
    await generateThumb(image, fileName);
    const putObjects = image['thumbs'].map((item) => {
      return s3
        .putObject({
          ACL: 'public-read',
          Body: item.bufferData,
          Bucket: config.AWSUpload.bucket,
          ContentType: image.mimetype,
          Key: item.fileName,
        })
        .promise();
    });

    await Promise.all(putObjects);
  }
}

export async function generateThumb(image: Express.Multer.File, fileName: string) {
  const thumbs = config.AWSUpload.thumbs;

  for (let thumb of thumbs) {
    const [w, h] = thumb.split('x');
    let bufferData = image.buffer;

    if (w && h) {
      bufferData = await Sharp(image.buffer)
        .resize(Number(w), Number(h), {
          withoutEnlargement: true,
          fit: 'inside',
        })
        .toBuffer();

      if (!image['thumbs'] || !Array.isArray(image['thumbs'])) image['thumbs'] = [];

      image['thumbs'].push({
        fileName: `${w}x${h}/${fileName}`,
        bufferData,
      });
    }
  }
}
