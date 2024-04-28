# Caledi - Cassava Leaf Disease Classificator

Caledi is a cassava leaf disease classificator. It uses machine learning to classify cassava leaf disease. Using TensorflowJS.

## Project Structure

- `src/js/main.js`: The entry point of the application.
- `src/js/cam.js`: Contains the `readFileAsDataURL` function which is used to read image files.
- `src/js/tf.js`: Contains the `Caledi` class which is used for image processing and prediction.
- `public/model/model.json`: The machine learning model used for prediction.

## How to Use

1. Open the application in a web browser.
2. Upload an image of a cassava leaf.
3. The application will classify the disease present in the leaf.

## Development

To start development, run the following command:

```sh
npm install
npm run dev
```
