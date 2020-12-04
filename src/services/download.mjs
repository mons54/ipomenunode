import puppeteer from 'puppeteer'
import { PDFDocument } from 'pdf-lib'
import { APP_NAME } from '../config/env.mjs'

const margin = 12
const border = 1

function getDocumentWithMark (body, fonts, bleed) {
  bleed += margin - border / 2
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
         @import url(${fonts});
          body {
            position: relative;
            margin: 0;
            padding: ${margin}px;
          }
          * {
            box-sizing: border-box;
          }
          .bleed {
            position: absolute;
            border: ${border}px solid rgba(0, 0, 0);
          }
          .bleed--topleft {
            top: 0;
            height: ${margin}px;
            left: ${bleed}px;
          }
          .bleed--topright {
            top: 0;
            height: ${margin}px;
            right: ${bleed}px;
          }
          .bleed--bottomleft {
            bottom: 0;
            height: ${margin}px;
            left: ${bleed}px;
          }
          .bleed--bottomright {
            bottom: 0;
            height: ${margin}px;
            right: ${bleed}px;
          }
          .bleed--lefttop {
            left: 0;
            width: ${margin}px;
            top: ${bleed}px;
          }
          .bleed--leftbottom {
            left: 0;
            width: ${margin}px;
            bottom: ${bleed}px;
          }
          .bleed--righttop {
            right: 0;
            width: ${margin}px;
            top: ${bleed}px;
          }
          .bleed--rightbottom {
            right: 0;
            width: ${margin}px;
            bottom: ${bleed}px;
          }
        </style>
      </head>
      <body style="padding: ${margin}px">
        ${body}
        <div class="bleed bleed--topleft"></div>
        <div class="bleed bleed--topright"></div>
        <div class="bleed bleed--bottomleft"></div>
        <div class="bleed bleed--bottomright"></div>
        <div class="bleed bleed--lefttop"></div>
        <div class="bleed bleed--leftbottom"></div>
        <div class="bleed bleed--righttop"></div>
        <div class="bleed bleed--rightbottom"></div>
      </body>
    </html>
  `
}

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
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--font-render-hinting=slight',
    ]
  })
}

export async function pdf (pages, width, height, bleed, mark) {

  const bleedIn = bleed * 0.75

  const pdf = await PDFDocument.create()
  const browser = await getBrowser()

  let promises = []

  pages.forEach(page => {

    let document

    if (mark)
      document = getDocumentWithMark(page.html, page.fonts, bleed)
    else
      document = getDocument(page.html, page.fonts)

    promises.push(new Promise(async resolve => {
      const page = await browser.newPage()
      await page.goto('data:text/html,' + document, {
        waitUntil: 'networkidle0',
      })
      if (mark) {
        width += bleed * 2 + margin * 2
        height += bleed * 2 + margin * 2
      }
      const data = await page.pdf({
        printBackground: true,
        width,
        height,
      })
      const [copy] = await pdf.copyPages(await PDFDocument.load(data), [0])
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
      }))
    }))
  })

  images = await Promise.all(promises)

  browser.close()

  return images
}
