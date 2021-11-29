let video;
let mobileNet;
let label;
let confidence;
let displayText = "";
let slowButton;
let fastButton;
let toggleButton;
let bgColorByConfidence;
let refreshRate = 500;
let isImage = true;
let isVideo = false;
let imageInput;
let img;
let imagePredictions;
let imagePredictedAlready = false;

function setup() {
  if (isImage) setupWithImage();
  if (isVideo) setupWithVideo();
  buttonSetup();
  if (isVideo) mobileNet = ml5.imageClassifier("MobileNet", video, modelReady);
}

function setupWithVideo() {
  console.log("set up with video");
  if (imageInput) imageInput.remove();
  createCanvas(640, 520);
  video = createCapture(VIDEO);
  video.hide();
  background(0);
}

function setupWithImage() {
  console.log("set up with image");
  if (video) {
    const canvas = document.getElementsByTagName("canvas")[0];
    console.log("canvas: ", canvas);
    canvas.remove();
  }
  createCanvas(640, 520);
  imageInput = createFileInput(handleFile);
  imageInput.parent("imgInputContainer");
}

function handleFile(file) {
  print(file);
  if (file.type === "image") {
    img = createImg(file.data, "");
    img.hide();
    mobileNet = ml5.imageClassifier("MobileNet", predictImg);
    imagePredictedAlready = false;
  } else {
    img = null;
  }
}

function buttonSetup() {
  if (isVideo) {
    // slow button config

    slowButton = createButton("slow down!");
    slowButton.parent("btnContainer");
    slowButton.mousePressed(slowDownRefreshRate);
    slowButton.style("background-color", "red");
    slowButton.style("border-radius", "5px");
    slowButton.style("padding", "10px");

    // fast button config

    fastButton = createButton("hurry up!");
    fastButton.mousePressed(speedUpRefreshRate);
    fastButton.style("background-color", "green");
    fastButton.style("border-radius", "5px");
    fastButton.style("padding", "10px");
    fastButton.parent("btnContainer");
  }

  if (isImage && slowButton) slowButton.remove();
  if (isImage && slowButton) fastButton.remove();

  // image/video toggle config
  if (toggleButton) toggleButton.remove();
  toggleButton = createButton(`classify with ${isImage ? "webcam" : "image"}`);
  toggleButton.mousePressed(toggleClassificationType);
  toggleButton.style("background-color", "violet");
  toggleButton.style("border-radius", "5px");
  toggleButton.style("padding", "10px");
  toggleButton.parent("toggleBtnContainer");
}

function slowDownRefreshRate() {
  refreshRate += 100;
}

function speedUpRefreshRate() {
  if (refreshRate <= 100) return;
  refreshRate -= 100;
}

function toggleClassificationType() {
  console.log("toggle classification type!");
  isImage = !isImage;
  isVideo = !isVideo;
  const previouslyCreatedTexts = selectAll("span");
  previouslyCreatedTexts.forEach((text) => text.remove());
  setup();
}

function draw() {
  if (isVideo) {
    background(bgColorByConfidence || 0);
    image(video, 0, 0);
    fill(255);
    textSize(20);
    text(displayText, 10, height - 10);
  }
  if (isImage && img) {
    image(img, 0, 0, width, height - 130);
  }
}

function modelReady() {
  mobileNet.predict(gotResults);
}

function predictImg() {
  // Make a prediction with a selected image
  mobileNet
    .predict(img, 3, function (err, results) {
      if (err) {
        console.log(err);
      }
      console.log(results);
      return results;
    })
    .then((results) => {
      imagePredictions = results;
    })
    .then(() => {
      const previouslyCreatedTexts = selectAll("span");
      previouslyCreatedTexts.forEach((text) => text.remove());
      imagePredictions.forEach((prediction, i) => {
        fill(255);
        renderText = `Classified as ${prediction.label} with confidence of ${prediction.confidence}`;
        let p = createSpan(renderText);
        p.parent("imagePredictionContainer");
        p.style("font-size", "20px");
        p.style("color", "white");
        p.position(640, height + 180 + 20 * i);
      });
    });
}

async function gotResults(error, results) {
  try {
    label = results[0].label.split(",")[0];
    confidence = results[0].confidence.toFixed(2);
    displayText = `Classified as ${label} with confidence of ${confidence}`;
    getBackgroundColorBasedOnConfidence(confidence);
    await sleep(refreshRate);
    mobileNet.predict(gotResults);
  } catch (e) {
    console.log("error: ", error);
  }
}

function getBackgroundColorBasedOnConfidence(confidence) {
  if (confidence < 0.3) {
    // low confidence
    bgColorByConfidence = "#c13525";
  } else if (confidence >= 0.3 && confidence < 0.7) {
    // med confidence
    bgColorByConfidence = "#ffbb43";
  } else if (confidence > 0.7) {
    // high confidence
    bgColorByConfidence = "#6da06f";
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
