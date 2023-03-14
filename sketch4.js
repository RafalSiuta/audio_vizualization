const canvasSketch = require('canvas-sketch');
const math = require('canvas-sketch-util/math');
const eases = require('eases');
const random = require('canvas-sketch-util/random');

const screenSide = 1080;

const settings = {
  dimensions: [ screenSide, screenSide ],
  animate: true
};

let audio;
let audioContext, audioData, sourceNode, analyserNode;
let manager;
let minDb, maxDb;

const sketch = () => {
  const numCircles = 6;
  const numSlices = 2;
  const slice = Math.PI * 2 / numSlices;
  const radius = 200;

  const bins = [4, 12, 37];
  const lineWidths = [];
  const rotationOffsets = [];

  let lineWidth, bin, mapped, phi;

  for (let i = 0; i < numCircles * numSlices; i++) {
    bin = random.rangeFloor(4,64);
    bins.push(bin);
  }

  for (let i = 0; i < numCircles; i++) {
    const t = i / (numCircles - 1);
    lineWidth = eases.quadIn(t) * 120 + 10; //largest possible value
    lineWidths.push(lineWidth);
  }

  for (let i = 0; i < numCircles; i++) {
    rotationOffsets.push(random.range(Math.PI * -0.25, Math.PI * 0.25) - Math.PI * 0.5);
  }
  

  return ({ context, width, height }) => {
    context.fillStyle = '#EEEAE0';
    context.fillRect(0, 0, width, height);

    if (!audioContext) return;
    analyserNode.getFloatFrequencyData(audioData);

    context.save();
    context.translate(width * 0.5, height * 0.5);
    context.scale(1, -1);

    let cradius = radius;

    //looping through num of circles 
    for (let i = 0; i < numCircles; i++){
      
      context.save();
      context.rotate(rotationOffsets[i]);

      cradius += lineWidths[i] * 0.5 + 2;

      //looping through num of slices
      for (let j = 0; j < numSlices; j++){
        context.rotate(slice);
        context.lineWidth = lineWidths[i];
        ///part for each circle i * numSlices... // and ..+ j is on each part in that circle
        bin = bins[i * numSlices + j];

        mapped = math.mapRange(audioData[bin], minDb, maxDb, 0, 1, true);

        phi = slice * mapped;

        context.beginPath();
        //Math.abs - returns absolute value in case value will be negative ex. -70
        //full circle drawing example: context.arc(0, 0, radius, 0, Math.PI * 2);
        context.arc(0, 0, cradius, 0, phi);
        context.stroke();

      }
      cradius += lineWidths[i] * 0.5;

      context.restore();
    }
    context.restore();

    // for (let i = 0; i < bins.length; i++){
    //   //const avg = getAverage(audioData);
    //   const bin = bins[i];
    //   const mapped = math.mapRange(audioData[bin], analyserNode.minDecibels, analyserNode.maxDecibels, 0, 1, true);
    //   const radius = mapped * 300;
    //    //console.log(audioData);
    // }

  };
};

const addListeners = () => {
  window.addEventListener('mouseup', () => {
    if (!audioContext) createAudio();
    
    if(audio.paused) {
      audio.play();
      manager.play();
    } else {
      audio.pause();
      manager.pause();
    } 
  });
}

const createAudio = () => {
  audio = document.createElement('audio');
  audio.src = 'audio/Resonate.mp3';

  audioContext = new AudioContext();

  sourceNode = audioContext.createMediaElementSource(audio);
  //connect mean connect to aodiu source witchins the speaker:
  sourceNode.connect(audioContext.destination);

  analyserNode = audioContext.createAnalyser();
  analyserNode.fftSize = 512;
  analyserNode.smoothingTimeConstant = 0.9;
  sourceNode.connect(analyserNode);

  minDb = analyserNode.minDecibels;
  maxDb = analyserNode.maxDecibels;

  audioData = new Float32Array(analyserNode.frequencyBinCount);

  //console.log(audioData.length);
};

const getAverage = (data) => {
  let sum = 0;

  for (let i = 0; i < data.length; i++){
    sum += data[i];
  }
  return sum / data.length;
}
// build function thet will pouse animation while we pouse 

const start = async () => {
  addListeners();
  manager = await canvasSketch(sketch, settings);
  manager.pause();
}

start();


//DOC LINKS:
//web audio codec guide:
//https://developer.mozilla.org/en-US/docs/Web/Media/Formats/Audio_codecs
//autoplay guide;
//https://developer.mozilla.org/en-US/docs/Web/Media/Autoplay_guide
//https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API 
//ANALYSER NODE FREQUENCYBINCOUNT:
//https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode/frequencyBinCount
//CANVAS-SKETCH MANAGER:
//https://github.com/mattdesl/canvas-sketch/blob/master/docs/api.md#sketchmanager
//analaser node get frequency data:
//https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode/getFloatFrequencyData
//get logarythmic byte:
//https://stackoverflow.com/questions/35799286/get-logarithmic-bytefrequencydata-from-audio/43369065#43369065
//A fast Fourier transform (FFT) is an algorithm that computes the discrete Fourier transform (DFT) of a sequence, or its inverse (IDFT).
// https://en.wikipedia.org/wiki/Fast_Fourier_transform   // note: The DFT is obtained by decomposing a sequence of values into components of different frequencies
//easing resources:
//http://robertpenner.com/easing/
//bezier generator:
//https://cubic-bezier.com/#.25,.1,.25,1
//npm eases package:
//https://www.npmjs.com/package/eases


