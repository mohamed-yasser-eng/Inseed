import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  PutObjectCommand,
  PutObjectCommandInput,
  S3Client,
} from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import fs, { ReadStream } from 'fs'

interface IPutObjectCommandInput extends PutObjectCommandInput {
  Body: string | Buffer | ReadStream
}

export class S3ClientServicce {
  private s3Client = new S3Client({
    region: process.env.AWS_REGION as string,
    endpoint: process.env.S3_ENDPOINT, // ✅ use LocalStack
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
    },
    forcePathStyle: true, // ✅ CRITICAL for localhost
  })

  private key_folder = process.env.AWS_KEY_FOLDER as string

  async getFileWithSignedUrl(key: string, expiresIn: number = 60) {
    const getCommand = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME as string,
      Key: key,
    })

    return await getSignedUrl(this.s3Client, getCommand, { expiresIn })
  }

  async uploadFileOnS3(file: Express.Multer.File, key: string) {
    const keyName = `${this.key_folder}/${key}/${Date.now()}-${file.originalname}`
    // console.log(`the keyname is `, keyName)
    // console.log(`the file into`, file)

    const params: IPutObjectCommandInput = {
      Bucket: process.env.AWS_S3_BUCKET_NAME as string,
      Key: keyName,
      Body: fs.createReadStream(file.path),
      ContentType: file.mimetype,
    }

    const putCommand = new PutObjectCommand(params)

    await this.s3Client.send(putCommand)
    const signedUrl = await this.getFileWithSignedUrl(keyName)
    return { key: keyName, url: signedUrl }
  }


  async uploadFilesOnS3(files: Express.Multer.File[], key: string) {
    const keys = files.map(file => this.uploadFileOnS3(file, key))
    return await Promise.all(keys)
  }

  async deleteFileFromS3(key: string) {
    const deleteCommand = new DeleteObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME as string,
      Key: key,
    })
    return await this.s3Client.send(deleteCommand)
  }

  async deleteBulkFromS3(keys: string[]) {
    const deleteCommand = new DeleteObjectsCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME as string,
      Delete: {
        Objects: keys.map((key) => ({ Key: key })),
      },
    })
    return await this.s3Client.send(deleteCommand)
  }

  async uploadLargeFileOnS3(file: Express.Multer.File, key: string) {
    const keyName = `${this.key_folder}/${key}/${Date.now()}-${file.originalname}`

    const params: IPutObjectCommandInput = {
      Bucket: process.env.AWS_S3_BUCKET_NAME as string,
      Key: keyName,
      Body: fs.createReadStream(file.path),
      ContentType: file.mimetype,
    }

    const upload = new Upload({
      client: this.s3Client,
      params,
      queueSize: 4, // how many parts to upload in parallel
      partSize: 5 * 1024 * 1024, // each part = 5 MB
      leavePartsOnError: false, // auto-cleanup failed parts
    })

    upload.on('httpUploadProgress', (progress) => {
      console.log(`Uploaded ${progress.loaded} bytes of ${progress.total}`)
    })

    return await upload.done()
  }
}
