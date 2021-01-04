import express from 'express'
import puppeteer from 'puppeteer'
import Zip from 'jszip'
import { pdf, pdfMobile, image } from '../services/download.mjs'
import { HttpInternalServerError, HttpNotAcceptableError } from '../services/httpError.mjs'

const router = express.Router()

router.post('/pdf', async (req, res, next) => {

  let { pages, width, height, bleed, mark } = req.body

  if (pages instanceof Array === false)
    return next(new HttpNotAcceptableError("Param pages must be array"))

  if (typeof width !== 'number')
    return next(new HttpNotAcceptableError("Param width must be number"))

  if (0 > width || width > 5000)
    return next(new HttpNotAcceptableError("Param width must be > 0 and <= 5000"))

  if (typeof height !== 'number')
    return next(new HttpNotAcceptableError("Param height must be number"))

  if (0 > height || height > 5000)
    return next(new HttpNotAcceptableError("Param height must be > 0 and <= 5000"))

  if (typeof bleed !== 'number')
    return next(new HttpNotAcceptableError("Param bleed must be number"))

  if (0 > bleed)
    return next(new HttpNotAcceptableError("Param bleed must be > 0"))

  try {
    const data = await pdf(pages, width, height, bleed, mark)
    res.type('pdf')
    res.send(data)
  } catch(e) {
    return next(new HttpInternalServerError(e.message, null, e))
  }
})

router.post('/mobile', async (req, res, next) => {

  let { pages, width, height, mark } = req.body

  if (pages instanceof Array === false)
    return next(new HttpNotAcceptableError("Param pages must be array"))

  if (typeof width !== 'number')
    return next(new HttpNotAcceptableError("Param width must be number"))

  if (0 > width || width > 5000)
    return next(new HttpNotAcceptableError("Param width must be > 0 and <= 5000"))

  if (typeof height !== 'number')
    return next(new HttpNotAcceptableError("Param height must be number"))

  if (0 > height || height > 5000)
    return next(new HttpNotAcceptableError("Param height must be > 0 and <= 5000"))

  try {
    const data = await pdfMobile(pages, width, height)
    res.type('pdf')
    res.send(data)
  } catch(e) {
    return next(new HttpInternalServerError(e.message, null, e))
  }
})

router.post('/image/:type(png|jpeg)', async (req, res, next) => {

  let { images, width, height } = req.body

  if (images instanceof Array === false)
    return next(new HttpNotAcceptableError("Param images must be Array"))

  if (!Number.isInteger(width))
    return next(new HttpNotAcceptableError("Param width must be integer"))

  if (0 > width || width > 10000)
    return next(new HttpNotAcceptableError("Param width must be > 0 and <= 10000"))

  if (!Number.isInteger(height))
    return next(new HttpNotAcceptableError("Param height must be integer"))

  if (0 > height || height > 10000)
    return next(new HttpNotAcceptableError("Param height must be > 0 and <= 10000"))

  const type = req.params.type

  let data

  try {
    data = await image(images, width, height, type)
  } catch (e) {
    return next(new HttpInternalServerError(e.message, null, e))
  }

  if (data.length > 1) {
    const zip = new Zip
    data.forEach((image, index) =>
      zip.file(`${index + 1}.${type}`, image)
    )
    data = await zip.generateAsync({
      type: 'nodebuffer'
    })
    res.type('zip')
  } else {
    data = data[0]
    res.type(type)
  }

  res.end(data, 'binary')
})

export default router
