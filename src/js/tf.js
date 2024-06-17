import * as tf from '@tensorflow/tfjs';

export default class Caledi {
  constructor() {
    this.model = tf.loadGraphModel('/model/cropnet/model.json');
    this.labels = [
      'Cassava Bacterial Blight',
      'Cassava Brown Streak Disease',
      'Cassava Green Mite',
      'Cassava Mosaic Disease',
      'Healthy'
    ];
  }

  async processImage(base64) {
    const img = new Image();
    img.src = 'data:image/jpeg;base64,' + base64;

    return new Promise((resolve, reject) => {
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, img.width, img.height);

        const input = tf.browser.fromPixels(canvas);
        const normalized = input.resizeBilinear([224, 224]).reshape([1, 224, 224, 3]).div(255.0);

        resolve(normalized);
      };

      img.onerror = (error) => reject(error);
    });
  }

  async predict(base64) {
    const model = await this.model;
    const input = await this.processImage(base64);
    const predict = model.predict(input);
    const predictArray = await predict.data();

    let result = { name: 'unknown', value: 0 };
    const prediction = this.labels.reduce((acc, label, i) => {
      acc[label] = predictArray[i];
      if (predictArray[i] > result.value) {
        result = { name: label, value: predictArray[i] };
      }
      return acc;
    }, {});

    if (result.value < 0.66) {
      result = { name: 'unknown', value: 0 };
    }

    return { prediction, result };
  }
}
