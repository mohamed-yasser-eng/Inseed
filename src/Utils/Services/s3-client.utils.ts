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
import { unlink } from 'fs/promises'

interface IPutObjectCommandInput extends PutObjectCommandInput {
  Body: string | Buffer | ReadStream
}

export class S3ClientService {
  private s3Client = new S3Client({
    region: process.env.AWS_REGION as string,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
    },
  })

  private key_folder = process.env.AWS_KEY_FOLDER as string

  private async deleteLocalFile(filePath?: string) {
    if (!filePath) return

    try {
      await unlink(filePath)
    } catch (error) {
      console.warn('Failed to delete local upload file', error)
    }
  }

  async getFileWithSignedUrl(key: string, expiresIn: number = 300) {
    const getCommand = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME as string,
      Key: key,
    })

    return await getSignedUrl(this.s3Client, getCommand, { expiresIn })
  }

  async uploadFileOnS3(file: Express.Multer.File, key: string) {
    const keyName = `${this.key_folder}/${key}/${Date.now()}-${file.originalname}`

    const params: IPutObjectCommandInput = {
      Bucket: process.env.AWS_S3_BUCKET_NAME as string,
      Key: keyName,
      Body: fs.createReadStream(file.path),
      ContentType: file.mimetype,
    }

    const putCommand = new PutObjectCommand(params)

    try {
      await this.s3Client.send(putCommand)
      const signedUrl = await this.getFileWithSignedUrl(keyName)
      return { key: keyName, url: signedUrl }
    } finally {
      await this.deleteLocalFile(file.path)
    }
  }

  async uploadFilesOnS3(files: Express.Multer.File[], key: string) {
    const uploadedFiles: { key: string; url: string }[] = []

    try {
      for (const file of files) {
        uploadedFiles.push(await this.uploadFileOnS3(file, key))
      }

      return uploadedFiles
    } catch (error) {
      try {
        await this.deleteBulkFromS3(uploadedFiles.map((file) => file.key))
        await Promise.all(files.map((file) => this.deleteLocalFile(file.path)))
      } catch (cleanupError) {
        console.warn('Failed to clean up files after S3 upload failure', cleanupError)
      }
      throw error
    }
  }

  async deleteFileFromS3(key: string) {
    const deleteCommand = new DeleteObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME as string,
      Key: key,
    })
    return await this.s3Client.send(deleteCommand)
  }

  async deleteBulkFromS3(keys: string[]) {
    if (!keys.length) return

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
      queueSize: 4,
      partSize: 5 * 1024 * 1024,
      leavePartsOnError: false,
    })

    try {
      return await upload.done()
    } finally {
      await this.deleteLocalFile(file.path)
    }
  }
}
