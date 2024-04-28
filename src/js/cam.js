import Caledi from './tf'

document.addEventListener('alpine:init', () => {
  Alpine.data('cam', () => ({
    started: false,
    processing: false,
    finished: false,
    base64image: null,
    predictions: [],
    is_unknown: false,
    video: document.getElementById('main-cam'),
    is_front_camera: false,

    async start() {
      this.started = true
      try {
        await this.setupCamera()
      } catch (e) {
        console.error('navigator.getUserMedia error:', e)
      }
    },

    checkDevice() {
      var userAgent = navigator.userAgent || navigator.vendor || window.opera;

      if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
        return "ios";
      }

      return "android";
    },

    async setupCamera(facingMode = 'user') {
      if (this.checkDevice() == 'android') {
        await this.setupCameraAndroid(facingMode);
      } else {
        this.setupCameraIos(facingMode);
      }
    },

    async setupCameraAndroid(facingMode = 'environment') {
      if (window.stream) {
        window.stream.getTracks().forEach(track => track.stop());
      }

      let constraints = {
        video: {
          facingMode: facingMode,
          width: 640,
          height: 420
        },
        audio: false
      };

      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints)
        window.stream = stream
        this.video.srcObject = stream
        this.video.play()
      } catch (error) {
        alert('You have to enable the camera');
      }
    },

    async setupCameraIos(facingMode = 'environment') {
      const constraints = (window.constraints = {
        audio: false,
        video: {
          facingMode: facingMode,
          width: {
            ideal: 640
          },
          height: {
            ideal: 420
          }
        }
      });

      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints)
        this.video.srcObject = stream
      } catch (error) {
        alert('You have to enable the camera');
      }
    },

    switchCamera() {
      this.is_front_camera = !this.is_front_camera

      this.setupCamera(this.is_front_camera ? "user" : "environment");
    },

    async submit() {
      this.base64image = this.captureVideoFrame()
      await this.predict(this.getBase64Image())
    },

    async upload(e) {
      const file = e.target.files[0]
      this.base64image = await this.readFileAsDataURL(file)
      await this.predict(this.getBase64Image())
    },

    async urlfile() {
      const url = prompt('Please enter the image URL')
      if (url) {
        try {
          const response = await fetch(url)
          const blob = await response.blob()
          this.base64image = await this.readFileAsDataURL(blob)
          await this.predict(this.getBase64Image())
        } catch (error) {
          console.error(error)
        }
      }
    },

    captureVideoFrame() {
      const canvas = document.createElement('canvas')
      canvas.width = this.video.videoWidth
      canvas.height = this.video.videoHeight
      canvas.getContext('2d').drawImage(this.video, 0, 0, canvas.width, canvas.height)
      this.video.pause()
      return canvas.toDataURL('image/png')
    },

    readFileAsDataURL(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()

        reader.onload = () => {
          resolve(reader.result)
        }

        reader.onerror = reject

        reader.readAsDataURL(file)
      })
    },

    getBase64Image() {
      return this.base64image.split(',')[1]
    },

    async predict(base64) {
      this.processing = true
      this.finished = false
      this.predictions = []

      try {
        const caledi = new Caledi()
        const response = await caledi.predict(base64)

        if (response.result.name === 'unknown') {
          this.is_unknown = true
        } else {
          this.predictions = this.formatPredictions(response)
        }
      } catch (error) {
        console.error(error)
      } finally {
        this.processing = false
        this.finished = true
      }
    },

    formatPredictions(res) {
      return Object.entries(res.prediction).map(([key, value]) => ({
        disease: key
          .replace(/[_-]/g, ' ')
          .replace(/\w\S*/g, (w) => w.replace(/^\w/, (c) => c.toUpperCase())),
        accuracy: (value * 100).toFixed(2) + '%',
        is_max: res.result.name === key,
      }))
    },

    retry() {
      this.started = true
      this.finished = false
      this.base64image = null
      this.predictions = []
      this.is_unknown = false
      this.video.play()
    },

    refresh() {
      window.location.reload()
    },
  }))
})
