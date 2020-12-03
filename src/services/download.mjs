import puppeteer from 'puppeteer'
import { PDFDocument, rgb } from 'pdf-lib'
import { APP_NAME } from '../config/env.mjs'

function getDocument (body, fonts) {

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
         @import url(${fonts});
          body {
            padding: 0;
            margin: 0;
          }
          * {
            box-sizing: border-box;
          }
        </style>
      </head>
      <body>${body}</body>
    </html>
  `
}

async function getBrowser () {
  return puppeteer.launch({
    args: [
      '--font-render-hinting=slight',
    ]
  })
}


function bleedBox (page, width, height) {

  const margin = 10

  width *= 0.75
  height *= 0.75

  const pageWidth = page.getWidth()
  const pageHeight = page.getHeight()

  const line = {
    thickness: 1,
    color: rgb(0, 0, 0),
  }

  page.setWidth(pageWidth + margin * 2)
  page.setHeight(pageHeight  + margin * 2)
  page.translateContent(margin, margin)

  const left = (pageWidth - width) / 2
  const bottom = (pageHeight - height) / 2

  const top = height + bottom
  const right = width + left

  // Left Top
  line.start = { x: left, y: pageHeight }
  line.end = { x: left, y: pageHeight + margin }
  page.drawLine(line)

  // Left Bottom
  line.start = { x: left, y: 0 }
  line.end = { x: left, y: -margin }
  page.drawLine(line)

  // Top Left
  line.start = { x: 0, y: top }
  line.end = { x: -margin, y: top }
  page.drawLine(line)

  // Top Right
  line.start = { x: pageWidth, y: top }
  line.end = { x: pageWidth + margin, y: top }
  page.drawLine(line)

  // Right Top
  line.start = { x: right, y: pageHeight }
  line.end = { x: right, y: pageHeight + margin }
  page.drawLine(line)

  // Right Bottom
  line.start = { x: right, y: 0 }
  line.end = { x: right, y: -margin }
  page.drawLine(line)

  // Bottom Left
  line.start = { x: 0, y: bottom }
  line.end = { x: -margin, y: bottom }
  page.drawLine(line)

  // Bottom Right
  line.start = { x: pageWidth, y: bottom }
  line.end = { x: pageWidth + margin, y: bottom }
  page.drawLine(line)

  page.setBleedBox(left + margin, bottom + margin, width, height)
}

function cropBox (page, width, height) {

  width *= 0.75
  height *= 0.75

  const left = (page.getWidth() - width) / 2
  const bottom = (page.getHeight() - height) / 2

  page.setCropBox(left, bottom, width, height)
}

export async function pdf (pages, width, height, bleed, mark) {

  const bleedIn = bleed * 0.75

  const pdf = await PDFDocument.create()
  const browser = await getBrowser()

  let promises = []

  pages.forEach(page => {

    const document = getDocument(page.html, page.fonts)

    promises.push(new Promise(async resolve => {
      const page = await browser.newPage()
      await page.goto('data:text/html,' + document, {
        waitUntil: 'networkidle0',
      })
      await page.evaluate(() => {
        const pageInner = document.getElementById('pageInner')
        if (!pageInner)
          return
        pageInner.childNodes.forEach(element => {
          if (element.offsetLeft > pageInner.offsetWidth)
            element.style.display = 'none'
        })

      })
      const data = await page.pdf({
        printBackground: true,
        width: width + bleed * 2,
        height: height + bleed * 2,
      })
      const [copy] = await pdf.copyPages(await PDFDocument.load(data), [0])
      if (mark)
        bleedBox(copy, width, height)
      else
        cropBox(copy, width, height)
      resolve(copy)
    }))
  })

  pages = await Promise.all(promises)

  browser.close()

  pages.forEach(page => pdf.addPage(page))

  pdf.setProducer(APP_NAME)
  pdf.setCreator(APP_NAME)

  return Buffer.from(await pdf.save())
}


export async function image (images, width, height, bleed, type = 'png') {

  const browser = await getBrowser()

  const promises = []

  images.forEach(image => {

    const document = getDocument(image.html, image.fonts)

    promises.push(new Promise(async resolve => {

      const page = await browser.newPage()

      await page.setViewport({
        width,
        height,
      })

      await page.goto('data:text/html,' + document, {
        waitUntil: 'networkidle0',
      })

      resolve(await page.screenshot({
        type,
        clip: {
          x: bleed,
          y: bleed,
          width: width,
          height: height,
        },
      }))
    }))
  })

  images = await Promise.all(promises)

  browser.close()

  return images
}
