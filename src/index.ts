import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { userRouter } from './router/userRouter'
import { playlistRouter } from './router/playlistRouter'
import { multerUpload } from './multer'
import { Request, Response } from "express"
import { bucketName, s3 } from './s3'
import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

dotenv.config()

const app = express()

app.use(cors())
app.use(express.json())

app.listen(Number(process.env.PORT), () => {
    console.log(`Servidor rodando na porta ${Number(process.env.PORT)}`)
})

app.use("/users", userRouter)
app.use("/playlists", playlistRouter)
app.post("/file", multerUpload.single('file'), async (req: Request, res: Response) => {
    try {
        const uploadedFile = req.file

        if (uploadedFile == undefined) {
            throw new Error("'uploadedFile' e obrigatorio")
        }

        const uploadedFileKey = `${Math.ceil(Math.random() * 20)}-${uploadedFile.originalname}`

        await s3.send(new PutObjectCommand({
            Bucket: bucketName,
            Body: uploadedFile.buffer,
            Key: uploadedFileKey,
            ContentType: uploadedFile.mimetype
        }))

        const url = await getSignedUrl(s3, new GetObjectCommand({
            Bucket: bucketName,
            Key: uploadedFileKey
          }), { expiresIn: 120 })


        res.send(uploadedFile)
    } catch (error) {
        if (error instanceof Error) {
            res.send(error.message)
        }
    }
})