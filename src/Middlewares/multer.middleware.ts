import multer from 'multer'
import path from 'path'
import { unlink } from 'fs/promises'
import { Request } from 'express'
import { BadRequestException } from '../Utils'

const allowedImageMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])
const allowedImageExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp'])

export const Multer = () => {
  return multer({
    storage: multer.diskStorage({}),
    limits: {
      fileSize: 5 * 1024 * 1024,
    },
    fileFilter: (_req, file, callback) => {
      const extension = path.extname(file.originalname).toLowerCase()

      if (!allowedImageMimeTypes.has(file.mimetype) || !allowedImageExtensions.has(extension)) {
        return callback(new BadRequestException('Only jpeg, png, and webp image files are allowed'))
      }

      return callback(null, true)
    },
  })
}

const flattenFiles = (files: Request['files']) => {
  if (!files) return []
  if (Array.isArray(files)) return files
  return Object.values(files).flat()
}

export const cleanupUploadedFiles = async (req: Request) => {
  const files = [req.file, ...flattenFiles(req.files)].filter(Boolean) as Express.Multer.File[]

  await Promise.all(
    files.map(async (file) => {
      if (!file.path) return

      try {
        await unlink(file.path)
      } catch {
        // The file may already have been removed after a successful S3 upload.
      }
    }),
  )
}
