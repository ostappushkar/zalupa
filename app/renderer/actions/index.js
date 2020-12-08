import { Threshold } from '../services/Threshold';
import { Grayscale } from '../services/Grayscale';

import { get_pixel_dataset, k_means, quantize } from '../services/Cluster';
import action from './action';
import actionTypes from '../types';
import {
  calculateCumulativeFrequency,
  calculateFrequency,
  initImage,
  parseHistogramData,
} from '../services/helpers';

export const loadEtalon = (files) => (dispatch) => {
  if (files.length > 0) {
    const file = files[0];
    const fr = new FileReader();
    fr.onloadend = (e) => {
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => {
        dispatch(action(actionTypes.LOAD_ETALON, img));
      };
    };
    fr.readAsDataURL(file);
  }
};

export const loadPattern = (files) => (dispatch) => {
  if (files.length > 0) {
    const file = files[0];
    const fr = new FileReader();
    fr.onloadend = (e) => {
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => {
        dispatch(action(actionTypes.LOAD_PATTERN, img));
      };
    };
    fr.readAsDataURL(file);
  }
};

export const setThreshold = (threshold) => (dispatch) => {
  dispatch(action(actionTypes.SET_THRESHOLD, threshold));
};

export const setKCount = (kCount) => (dispatch) => {
  dispatch(action(actionTypes.SET_KCOUNT, kCount));
};

export const restoreOriginal = () => (dispatch) => {
  dispatch(action(actionTypes.RESTORE_ORIGINAL));
};

export const saveResult = () => (dispatch, getState) => {
  const { image, canvas } = getState();
  if (image) {
    const imageType = image.substring(image.indexOf(':') + 1, image.indexOf(';'));
    const link = document.createElement('a');
    link.href = canvas.toDataURL(imageType);
    link.download = 'result.png';
    link.click();
    dispatch(action(actionTypes.SAVE_RESULT));
  }
};

export const imageThreshold = () => (dispatch, getState) => {
  dispatch(action(actionTypes.IMAGE_THRESHOLD));
  const { threshold, etalonOriginal, patternOriginal } = getState();
  dispatch(
    action(actionTypes.PROCEED_IMAGE, {
      pattern: Threshold(patternOriginal, threshold),
      etalon: Threshold(etalonOriginal, threshold),
    }),
  );
};

export const imageClusterize = () => (dispatch, getState) => {
  dispatch(action(actionTypes.IMAGE_CLUSTERIZE));
  const { kCount, etalonOriginal, patternOriginal } = getState();
  const datasetEtalon = get_pixel_dataset(etalonOriginal, 10);
  const centroidsEtalon = k_means(datasetEtalon, kCount);
  const datasetPattern = get_pixel_dataset(patternOriginal, 10);
  const centroidsPattern = k_means(datasetPattern, kCount);
  dispatch(
    action(actionTypes.PROCEED_IMAGE, {
      pattern: quantize(patternOriginal, centroidsPattern),
      etalon: quantize(etalonOriginal, centroidsEtalon),
    }),
  );
};

export const imageGrayscale = () => (dispatch, getState) => {
  dispatch(action(actionTypes.IMAGE_GRAYSCALE));
  const { etalonOriginal, patternOriginal } = getState();
  dispatch(
    action(actionTypes.PROCEED_IMAGE, {
      pattern: Grayscale(patternOriginal),
      etalon: Grayscale(etalonOriginal),
    }),
  );
};

export const imageHistogram = () => (dispatch, getState) => {
  const { etalonOriginal, patternOriginal } = getState();
  const etalonCanvas = initImage(etalonOriginal);
  const patternCanvas = initImage(patternOriginal);
  const patternWidth = patternCanvas.width;
  const patternHeight = patternCanvas.height;
  const etalonWidth = etalonCanvas.width;
  const etalonHeight = etalonCanvas.height;
  const patternData = patternCanvas.getContext('2d').getImageData(0, 0, patternWidth, patternHeight)
    .data;
  const etalonData = etalonCanvas.getContext('2d').getImageData(0, 0, etalonWidth, etalonHeight)
    .data;
  const histogram = parseHistogramData(
    calculateFrequency(etalonData),
    calculateFrequency(patternData),
  );
  dispatch(action(actionTypes.IMAGE_HISTOGRAM, histogram));
  const cumulative = parseHistogramData(
    calculateCumulativeFrequency(etalonData),
    calculateCumulativeFrequency(patternData),
  );
  dispatch(action(actionTypes.IMAGE_CUMULATIVE, cumulative));
};

export const imageHistogramClusterized = () => (dispatch, getState) => {
  const { etalon, pattern } = getState();
  const etalonImage = new Image();
  etalonImage.src = etalon;
  etalonImage.onload = () => {
    const patternImage = new Image();
    patternImage.src = pattern;
    patternImage.onload = () => {
      const etalonCanvas = initImage(etalonImage);
      const patternCanvas = initImage(patternImage);
      const patternWidth = patternCanvas.width;
      const patternHeight = patternCanvas.height;
      const etalonWidth = etalonCanvas.width;
      const etalonHeight = etalonCanvas.height;
      const patternData = patternCanvas
        .getContext('2d')
        .getImageData(0, 0, patternWidth, patternHeight).data;
      const etalonData = etalonCanvas.getContext('2d').getImageData(0, 0, etalonWidth, etalonHeight)
        .data;
      const histogram = parseHistogramData(
        calculateFrequency(etalonData),
        calculateFrequency(patternData),
      );
      dispatch(action(actionTypes.IMAGE_HISTOGRAM_CLUSTERIZED, histogram));
      const cumulative = parseHistogramData(
        calculateCumulativeFrequency(etalonData),
        calculateCumulativeFrequency(patternData),
      );
      dispatch(action(actionTypes.IMAGE_CUMULATIVE_CLUSTERIZED, cumulative));
    };
  };
};
