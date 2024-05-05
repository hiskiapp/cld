import * as tf from '@tensorflow/tfjs'

export default class Caledi {
  constructor() {
    this.model = tf.loadLayersModel('/model/model.json')
    this.labels = [
      'brown leaf spot',
      'brown_streak_disease',
      'green_might_damage',
      'healthy',
      'mosaic_disease',
      'red_mite_damage',
    ]
  }

  async processImage(base64) {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')

        ctx.drawImage(img, 0, 0, img.width, img.height)

        let input = tf.browser.fromPixels(canvas)

        const resized = tf.image.resizeBilinear(input, [300, 300])

        const reshaped = resized.reshape([1, 300, 300, 3])

        const normalized = reshaped.div(255.0)

        resolve(normalized)
      }

      img.onerror = (error) => reject(error)

      img.src = 'data:image/jpeg;base64,' + base64
    })
  }

  async predict(img) {
    const model = await this.model
    const input = await this.processImage(img)
    const predict = model.predict(input)
    const predictArray = await predict.data()

    let prediction = {}
    let result = { name: '', value: 0 }

    predictArray.forEach((element, i) => {
      prediction[this.labels[i]] = element
      if (element > result.value) {
        result = {
          name: this.labels[i],
          value: element,
        }
      }
    })

    if (result.value < 0.66) {
      result = { name: 'unknown', value: 0 }
    }

    return { prediction, result }
  }
}
