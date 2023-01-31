'use strict';

import './style.css'
// const Video = Twilio.Video;
import * as Video from 'twilio-video'
// const { GaussianBlurBackgroundProcessor, VirtualBackgroundProcessor, isSupported } = Twilio.VideoProcessors;
import { GaussianBlurBackgroundProcessor, VirtualBackgroundProcessor, isSupported } from '@twilio/video-processors';
// const bootstrap = window.bootstrap;
import * as bootstrap from 'bootstrap'

const gaussianBlurForm: HTMLFormElement | null = document.querySelector('form#gaussianBlur-Form');
const gaussianBlurButton: HTMLButtonElement | null = document.querySelector('button#gaussianBlur-Apply');
const virtualBackgroundForm: HTMLFormElement | null = document.querySelector('form#virtualBackground-Form');
const virtualBackgroundButton: HTMLButtonElement | null = document.querySelector('button#virtualBackground-Apply');
const videoInput: HTMLVideoElement | null = document.querySelector('video#video-input');
const removeProcessorButton: HTMLButtonElement | null = document.querySelector('button#no-processor-apply');
const errorMessage: HTMLDivElement | null = document.querySelector('div.modal-body');
const errorModelElement: HTMLDivElement | null = document.querySelector('div#errorModal')
let errorModal: bootstrap.Modal | undefined
if (errorModelElement) { errorModal = new bootstrap.Modal(errorModelElement); }

// Same directory as the current js file
const assetsPath = '';

let videoTrack: Video.LocalVideoTrack;
let gaussianBlurProcessor: GaussianBlurBackgroundProcessor;
let virtualBackgroundProcessor: VirtualBackgroundProcessor;

if (!isSupported && errorModal) {
  if (errorMessage) errorMessage.textContent = 'This browser is not supported.';
  errorModal.show();
}

const loadImage = (name: String) =>
  new Promise((resolve) => {
    const image = new Image();
    image.src = `./src/backgrounds/${name}.jpg`;
    image.onload = () => resolve(image);
  });

let images: any = {};
Promise.all([
  loadImage('living_room'),
  loadImage('office'),
  loadImage('vacation'),
]).then(([livingRoom, office, vacation]) => {

  images.livingRoom = livingRoom;
  images.office = office;
  images.vacation = vacation;
  return images;
});

Video.createLocalVideoTrack({
  width: 1280,
  height: 720,
  frameRate: 24,
}).then((track) => {
  if (videoInput) track.attach(videoInput);
  return videoTrack = track;
});

// Adding processor to Video Track
const setProcessor = (processor: Video.VideoProcessor | null, track: Video.LocalVideoTrack) => {
  if (track.processor && removeProcessorButton) {
    removeProcessorButton.disabled = true;
    track.removeProcessor(track.processor);
  }
  if (processor && removeProcessorButton) {
    removeProcessorButton.disabled = false;
    track.addProcessor(processor);
  }
};

if (gaussianBlurButton && gaussianBlurForm) {
  gaussianBlurButton.onclick = async event => {
    event.preventDefault();
    const options: any = {};
    const inputs = gaussianBlurForm.getElementsByTagName('input');
    for (let item of Array.from(inputs)) {
      options[item.id] = item.valueAsNumber;
    }
    const { maskBlurRadius, blurFilterRadius } = options;
    if (!gaussianBlurProcessor) {
      gaussianBlurProcessor = new GaussianBlurBackgroundProcessor({
        assetsPath,
        maskBlurRadius,
        blurFilterRadius,
      });
      await gaussianBlurProcessor.loadModel();
    } else {
      gaussianBlurProcessor.maskBlurRadius = maskBlurRadius;
      gaussianBlurProcessor.blurFilterRadius = blurFilterRadius;
    }
    setProcessor(gaussianBlurProcessor, videoTrack);
  };
}

if (virtualBackgroundButton && virtualBackgroundForm) {
  virtualBackgroundButton.onclick = async event => {
    event.preventDefault();
    const options: any = {};
    const inputs = virtualBackgroundForm.elements;
    // for (let item of Array.from(inputs)) {
    //   item.valueAsNumber
    //     ? (options[item.id] = item.valueAsNumber)
    //     : (options[item.id] = item.value);
    // }
    const itemVacation: any = inputs.namedItem('vacation')
    if (itemVacation) {
      itemVacation.valueAsNumber ? (options[itemVacation.id] = itemVacation.valueAsNumber) : options[itemVacation.id] = itemVacation.value
    }

    let backgroundImage = images[options.backgroundImage];

    let { maskBlurRadius, fitType } = options;
    if (!virtualBackgroundProcessor) {
      virtualBackgroundProcessor = new VirtualBackgroundProcessor({
        assetsPath,
        maskBlurRadius,
        backgroundImage,
        fitType,
      });
      await virtualBackgroundProcessor.loadModel();
    } else {
      virtualBackgroundProcessor.backgroundImage = backgroundImage;
      virtualBackgroundProcessor.fitType = fitType;
      virtualBackgroundProcessor.maskBlurRadius = maskBlurRadius;
    }
    setProcessor(virtualBackgroundProcessor, videoTrack);
  };
}

if (removeProcessorButton) {
  removeProcessorButton.disabled = true;
  removeProcessorButton.onclick = event => {
    event.preventDefault();
    setProcessor(null, videoTrack);
  };

}
