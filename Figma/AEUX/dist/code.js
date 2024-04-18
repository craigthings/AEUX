/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./src/code.ts");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./src/code.ts":
/*!*********************!*\
  !*** ./src/code.ts ***!
  \*********************/
/*! no static exports found */
/***/ (function(module, exports) {

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
figma.showUI(__html__, { width: 166, height: 184 });
let hasFrameData;
let shapeTree = [];
let imageHashList = [];
let imageBytesList = [];
let rasterizeList = [];
let prefs = {
    exportRefImage: false,
    imgSaveDialog: false,
};
// receive message from the UI
figma.ui.onmessage = message => {
    if (message.type === 'getPrefs') {
        // console.log('get those prefs');
        figma.clientStorage.getAsync('aeux.prefs')
            .then(prefs => {
            if (prefs) {
                figma.ui.postMessage({ type: 'retPrefs', prefs: prefs });
                return prefs;
            }
            else {
                // console.log('gotta save new prefs', message.defaultPrefs);
                figma.clientStorage.setAsync('aeux.prefs', message.defaultPrefs)
                    .then(() => {
                    figma.ui.postMessage({ type: 'retPrefs', prefs: message.defaultPrefs });
                });
                return message.defaultPrefs;
            }
        })
            .then(userPrefs => {
            prefs = userPrefs;
        });
    }
    if (message.type === 'setPrefs') {
        // console.log('save those prefs', message.prefs);
        figma.clientStorage.setAsync('aeux.prefs', message.prefs)
            .then(ret => {
            figma.ui.postMessage(message.prefs);
            prefs = message.prefs; // store the prefs locally
        });
    }
    if (message.type === 'exportCancel') {
    }
    if (message.type === 'exportSelection') {
        hasFrameData = false;
        shapeTree = [];
        imageHashList = [];
        imageBytesList = [];
        rasterizeList = [];
        let exportJSON = false;
        if (message.exportJSON) {
            exportJSON = true;
        }
        // nothing selected
        if (figma.currentPage.selection.length < 1) {
            figma.ui.postMessage({ type: 'fetchAEUX', data: null });
            return;
        }
        try {
            // pre-process the selected shapes hierarchy
            let selection = nodeToObj(figma.currentPage.selection);
            if (shapeTree[0].children.length < 1) {
                shapeTree[0].children = selection;
            }
            // console.log('shapeTree: ', shapeTree);
        }
        catch (error) {
            console.log(error);
            console.log('selected layers need to be inside of a frame');
            figma.ui.postMessage({ type: 'footerMsg', action: 'Layers must be inside of a frame', layerCount: null });
        }
        let refImg = null, tempGroup, parentFrame;
        if (prefs.exportRefImage) { // include a reference image with transfer
            parentFrame = findFrame(figma.currentPage.selection[0]);
            let parentFrameName = parentFrame.name.replace(/\s*(\/|\\)\s*/g, '-').replace(/^\*\s/, '').replace(/^\*/, '');
            // group and mask
            let mask = figma.createRectangle();
            mask.x = parentFrame.x;
            mask.y = parentFrame.y;
            mask.resize(parentFrame.width, parentFrame.height);
            tempGroup = figma.group([mask], mask.parent);
            tempGroup.appendChild(parentFrame);
            mask.isMask = true;
            rasterizeList.push(parentFrame.id);
            refImg = {
                type: 'Image',
                name: parentFrameName,
                id: parentFrame.id.replace(/:/g, '-'),
                frame: { x: parentFrame.width / 2, y: parentFrame.height / 2, width: parentFrame.width, height: parentFrame.height },
                isVisible: true,
                opacity: 50,
                blendMode: 'BlendingMode.NORMAL',
                isMask: false,
                rotation: 0,
                guide: true,
            };
        }
        if (rasterizeList.length > 0) {
            rasterizeList = [...new Set(rasterizeList)]; // remove duplicates
            // console.log('RASTERIZELIST', rasterizeList);
            let requests = rasterizeList.map((item) => {
                console.log('iten++', item);
                return new Promise((resolve) => {
                    asyncCollectHashes(item, resolve);
                });
            });
            Promise.all(requests)
                .then(() => storeImageData(imageHashList, shapeTree, refImg))
                .then(() => {
                // remove the reference mask
                if (tempGroup) {
                    tempGroup.parent.appendChild(parentFrame);
                    tempGroup.remove();
                }
            });
        }
        else {
            // check if images need to export then send message to ui.ts
            if (exportJSON) {
                figma.ui.postMessage({ type: 'exportAEUX', data: shapeTree });
            }
            else if (imageHashList.length < 1) {
                figma.ui.postMessage({ type: 'fetchAEUX', data: shapeTree });
            }
            else {
                storeImageData(imageHashList, shapeTree, null);
            }
        }
        // console.log('imageHashList', imageHashList);
        function clone(val) {
            return JSON.parse(JSON.stringify(val));
        }
        function asyncCollectHashes(id, cb) {
            setTimeout(() => {
                // console.log('done with', item);
                // @ts-ignore
                figma.getNodeByIdAsync(id).then(node => {
                    let shape = node;
                    // disable effects
                    let effectVisList = []; // to store the effect visibility
                    let effects;
                    if (shape.effects) {
                        effects = clone(shape.effects);
                        effects.forEach(effect => {
                            effectVisList.push(effect.visible);
                            if (effect.type == 'DROP_SHADOW' || effect.type == 'LAYER_BLUR') {
                                effect.visible = false;
                            }
                        });
                        shape.effects = effects;
                    }
                    let compMult = 3;
                    let imgScale = Math.min(3500 / Math.max(shape.width, shape.height), compMult); // limit it to 4000px
                    // console.log('IMAGESCALE', imgScale, shape);
                    shape.exportAsync({
                        format: "PNG",
                        useAbsoluteBounds: true,
                        constraint: { type: "SCALE", value: imgScale }
                    })
                        .then(img => {
                        imageHashList.push({
                            hash: figma.createImage(img).hash,
                            id: `${shape.name.replace(/^\*\s/, '').replace(/^\*/, '')}_${id}`
                        });
                    })
                        .then(() => {
                        // re-enable effects 
                        for (let i = 0; i < effectVisList.length; i++) {
                            effects[i].visible = effectVisList[i];
                        }
                        shape.effects = effects;
                    })
                        .then(() => {
                        cb();
                    });
                });
            }, 100);
        }
    }
    if (message.type === 'addRasterizeFlag') {
        if (figma.currentPage.selection.length < 1) {
            return;
        } // nothing selected
        // let selection = nodeToObj(figma.currentPage.selection)
        let layerCount = addMagicStar(figma.currentPage.selection, 0) || 0;
        // reselect layers
        figma.currentPage.selection = figma.currentPage.selection;
        figma.ui.postMessage({ type: 'footerMsg', action: 'marked as PNG', layerCount });
    }
    // if (message.type === 'flattenLayers') {
    //     if (figma.currentPage.selection.length < 1) { return }      // nothing selected
    //     // let selection = nodeToObj(figma.currentPage.selection)
    //     let layerCount = flattenRecursive(figma.currentPage.selection, 0) || 0
    //     // reselect layers
    //     figma.currentPage.selection = figma.currentPage.selection
    //     figma.ui.postMessage({type: 'footerMsg', action: 'flattened', layerCount});
    // }
    // if (message.type === 'rasterizeSelection') {
    //     if (figma.currentPage.selection.length < 1) { return }      // nothing selected
    //     // let selection = nodeToObj(figma.currentPage.selection)
    //     let layerCount = rasterizeSelection(figma.currentPage.selection, 0) || 0
    //     // console.log('layerCount', layerCount);
    //     // reselect layers
    //     figma.currentPage.selection = figma.currentPage.selection
    //     figma.ui.postMessage({type: 'footerMsg', action: 'rasterized', layerCount});
    // }
    // if (message.type === 'detachComponents') {
    //     console.log('detachComponents');
    //     let layerCount = 4;
    //     figma.ui.postMessage({type: 'footerMsg', action: 'flattened', layerCount});
    // }
    //Communicate back to the UI
    // console.log('send message back to ui');
};
function nodeToObj(nodes) {
    //   console.log('nodes', nodes);
    if (nodes.length < 1) {
        return [];
    }
    // console.log(nodes[0].type);
    let arr = [];
    // look for the parent frame of everything except regular (non-autoLayout) frames and loose components
    if (nodes[0] && ((nodes[0].type === 'FRAME' && nodes[0].parent.type === 'PAGE') ||
        // (nodes[0].type === 'FRAME' && nodes[0].layoutMode === 'NONE') || 
        (nodes[0].type === 'COMPONENT' && nodes[0].parent.type === 'PAGE'))) { // a frame or a component master outside of a frame is directly selected
        console.log('GOT A FRAME');
        // console.log(nodes[0].children);
        hasFrameData = true; // dont need to get the frame data
        shapeTree.push(getElement(nodes[0], false));
        nodes = nodes[0].children;
    }
    // get shapes 
    if (nodes.length < 1) {
        return [];
    }
    nodes.forEach(node => {
        // get the frame data
        if (!hasFrameData) {
            if (node.parent.type === 'PAGE') {
                return;
            } // layer is outside of a frame 
            // console.log('get the frame data');
            let frame = findFrame(node);
            // console.log('frame:', frame);
            let frameData = getElement(frame, true); // skip gathering children data
            frameData.children = []; // clear the children of the frame to push them later
            shapeTree.push(frameData);
        }
        let obj = sanitizeValue(getElement(node, false));
        arr.push(obj);
    });
    // console.log('arr: ', arr);
    return arr;
    function getElement(node, skipChildren) {
        // console.log('node', node.name);
        let rasterize = false;
        let obj = {
            children: [],
            type: null,
        };
        if (node.name && node.name.charAt(0) == '*' && node != findFrame(node)) {
            console.log('rasterize', node);
            rasterizeList.push(node.id);
            rasterize = true;
        }
        for (const key in node) {
            try {
                let element = node[key];
                // console.log(element);
                if (key === 'children' && !skipChildren && !rasterize) {
                    element = nodeToObj(element);
                }
                if (key === 'backgrounds') {
                    element = nodeToObj(element);
                }
                if (key === 'fills' && element.length > 0) { // add image fills to rasterizeList
                    let hasImageFill = false;
                    for (const i in element) {
                        const fill = element[i];
                        if (fill.type == 'IMAGE') {
                            hasImageFill = true;
                            obj['rasterize'] = true;
                            // console.log('image', element);
                            // obj.type = 'RECTANGLE'
                            // return
                        }
                    }
                    if (hasImageFill) {
                        rasterizeList.push(node.id);
                    }
                }
                // corner radius
                // if (key === 'cornerRadius') {
                //     console.log(key,  element);
                // }
                if (element == figma.mixed && key === 'cornerRadius') {
                    element = Math.min(node.topLeftRadius, node.topRightRadius, node.bottomLeftRadius, node.bottomRightRadius);
                }
                // try to get the first value on the text
                if (element == figma.mixed) {
                    let str = 'getRange' + key.replace(/^\w/, c => c.toUpperCase());
                    try {
                        element = node[str](0, 1);
                    }
                    catch (error) {
                        continue;
                    }
                }
                // layer.fontName !== (figma.mixed)) ? layer.fontName.family : layer.getRangeFontName(0,1).family
                // if (key === 'parent') { console.log(element); }
                obj[key] = element;
            }
            catch (error) {
                console.log('ERROR', error);
            }
        }
        // keep track of Auto-layout frames for alignment of children
        if (node.type === 'FRAME' && node.layoutMode !== 'NONE') {
            obj.type = 'AUTOLAYOUT';
        }
        return obj;
    }
    function collectImageHashes(element, id) {
        // console.log('imageHash', id, element);
        for (const i in element) {
            const fill = element[i];
            if (fill.type == 'IMAGE') {
                imageHashList.push({ hash: fill.imageHash, id });
            }
        }
    }
}
function storeImageData(imageHashList, layers, refImg) {
    return __awaiter(this, void 0, void 0, function* () {
        // console.log('layers++', layers);
        // console.log('imageHashList++', imageHashList);
        for (const i in imageHashList) {
            // console.log('i', i);
            const hash = imageHashList[i].hash;
            // console.log('hash', hash);
            const name = imageHashList[i].id
                .replace(/[\\:"*?%<>|]/g, '-') // replace illegal characters
                .replace(/\s*(\/|\\)\s*/g, '-'); // remove slashes
            // console.log('name', name);
            try {
                let image = figma.getImageByHash(hash);
                let bytes = yield image.getBytesAsync();
                imageBytesList.push({ name, bytes });
                // console.log('bytes', bytes);
            }
            catch (error) { }
        }
        if (imageBytesList.length > 0) {
            figma.ui.postMessage({ type: 'fetchImagesAndAEUX', images: imageBytesList, data: layers, refImg });
        }
        else {
            figma.ui.postMessage({ type: 'fetchAEUX', data: layers });
        }
    });
}
function findFrame(node) {
    // console.log('node:', node);
    // console.log('node.type:', node.type);
    try {
        if ((node.type !== 'FRAME' && !(node.type === 'COMPONENT' && node.parent.type === 'PAGE'))
            || (node.type === 'FRAME' && node.parent.type === 'FRAME')) {
            // if (node.type !== 'FRAME' && node.type !== 'COMPONENT') {                
            return findFrame(node.parent);
        }
        else {
            hasFrameData = true;
            return node;
        }
    }
    catch (error) {
        figma.ui.postMessage({ type: 'footerMsg', action: 'Error in findFrame() 😖', layerCount: null });
    }
}
function addMagicStar(selection, layerCount) {
    if (findFrame(selection[0]) == selection[0]) { // selection is the top most frame
        selection = selection[0].children; // select all the children
    }
    selection.forEach(shape => {
        if (shape.name.charAt(0) !== '*') {
            shape.name = `* ${shape.name}`;
            layerCount++;
        }
    });
    return layerCount;
}
function flattenRecursive(selection, layerCount) {
    try {
        selection.forEach(shape => {
            console.log('try flattening', shape);
            if (shape.type == 'BOOLEAN_OPERATION') {
                figma.flatten([shape]);
                layerCount++;
            }
            else if (shape.cornerRadius == figma.mixed || shape.cornerRadius > 0) {
                // flatten rounded corners
                figma.flatten([shape]);
                layerCount++;
            }
            else if (shape.children) {
                layerCount = flattenRecursive(shape.children, layerCount);
            }
            else {
                let t = shape.relativeTransform;
                console.log('shape.type', shape.type);
                /// check for transforms
                if (t[0][0].toFixed(6) != 1 ||
                    t[0][1].toFixed(6) != 0 ||
                    t[1][0].toFixed(6) != 0 ||
                    t[1][1].toFixed(6) != 1 ||
                    false) {
                    figma.flatten([shape]);
                    layerCount++;
                }
                else if (shape.type == 'TEXT') {
                    figma.flatten([shape]);
                    layerCount++;
                }
            }
        });
        return layerCount;
    }
    catch (error) {
        console.log(error);
        return layerCount;
    }
}
function rasterizeSelection(selection, layerCount) {
    try {
        let newSelection = [];
        selection.forEach(shape => {
            if (shape.type == 'GROUP') {
                let imgScale = Math.min(4000 / Math.max(shape.width, shape.height), 6); // limit it to 4000px
                // alert(imgScale)       
                let options = {
                    format: "PNG",
                    constraint: { type: "SCALE", value: imgScale }
                };
                let shapeTransform = shape.relativeTransform; // store transform
                let removeTransform = [[1, 0, shape.x], [0, 1, shape.y]];
                shape.relativeTransform = removeTransform;
                shape.exportAsync(options)
                    .then(img => {
                    // console.log(figma.createImage(img));
                    let rect = figma.createRectangle();
                    shape.parent.appendChild(rect);
                    rect.x = shape.x;
                    rect.y = shape.y;
                    rect.relativeTransform = shapeTransform;
                    rect.name = shape.name + '_rasterize';
                    rect.resize(shape.width, shape.height);
                    let fillObj = JSON.parse(JSON.stringify(rect.fills[0]));
                    fillObj.filters = {
                        contrast: 0,
                        exposure: 0,
                        highlights: 0,
                        saturation: 0,
                        shadows: 0,
                        temperature: 0,
                        tint: 0,
                    };
                    fillObj.imageHash = figma.createImage(img).hash;
                    fillObj.imageTransform = [[1, 0, 0], [0, 1, 0]];
                    fillObj.scaleMode = "CROP";
                    fillObj.type = "IMAGE";
                    fillObj.scalingFactor = 0.5,
                        delete fillObj.color;
                    rect.fills = [fillObj];
                    newSelection.push(rect);
                    shape.relativeTransform = shapeTransform;
                });
                layerCount++;
            }
        });
        setTimeout(() => { figma.currentPage.selection = newSelection; }, 50);
        return layerCount;
    }
    catch (error) {
        console.log(error);
        return layerCount;
    }
}
function generateFrameImage() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let firstSelected = figma.currentPage.selection[0];
            let parentFrame = findFrame(figma.currentPage.selection[0]);
            let options = {
                format: "PNG",
                constraint: { type: "SCALE", value: 6 }
            };
            parentFrame.exportAsync(options)
                .then(img => {
                // console.log('hsadjfhjkahsdf', img);
                return figma.createImage(img);
            });
        }
        catch (error) {
            console.log(error);
            return null;
        }
    });
}
/** Sanitizes the given data to ensure compatibility with postMessage. */
function sanitizeValue(data, key) {
    if (typeof data === 'symbol') {
        // Custom handling for symbol types.
        let resultValue = data.toString();
        valueWarn('Symbol', key, resultValue);
        return resultValue;
    }
    else if (typeof data === 'function') {
        // Custom handling for function types.
        let resultValue = data.toString();
        valueWarn('Function', key, resultValue);
        return resultValue;
    }
    else if (data instanceof RegExp) {
        // RegExp values are not fully supported in postMessage, so converting to string is the safest route.
        let resultValue = data.toString();
        valueWarn('RegExp', key, resultValue);
        return resultValue;
    }
    else if (data === null ||
        data === undefined ||
        typeof data === 'boolean' ||
        typeof data === 'number' ||
        typeof data === 'bigint' ||
        typeof data === 'string') {
        // Return the value as-is for primitive types.
        return data;
    }
    else if (data instanceof ArrayBuffer ||
        data instanceof DataView ||
        data instanceof Date ||
        data instanceof Map ||
        data instanceof Set ||
        data instanceof Error ||
        data instanceof Int8Array ||
        data instanceof Uint8Array ||
        data instanceof Uint8ClampedArray ||
        data instanceof Int16Array ||
        data instanceof Uint16Array ||
        data instanceof Int32Array ||
        data instanceof Uint32Array ||
        data instanceof Float32Array ||
        data instanceof Float64Array //||
    //   data instanceof BigInt64Array || // ES2020
    //   data instanceof BigUint64Array // EX2020
    ) {
        // Return the value as-is for supported types.
        return data;
    }
    else if (Array.isArray(data)) {
        // Recursively process each element of the array.
        return data.map(value => sanitizeValue(value));
    }
    else if (typeof data === 'object') {
        // Create a new object to accumulate only supported values.
        const result = {};
        for (const [key, value] of Object.entries(data)) {
            result[key] = sanitizeValue(value, key);
        }
        return result;
    }
    else {
        console.warn(`sanitizeValue: Unsupported type ${(typeof data)} encountered:`, data);
        return null;
    }
    function valueWarn(typeName, key, value) {
        console.warn(`sanitizeValue: Unsupported value of type "${typeName}" encountered for key "${key}". Converting to string: ${value}`);
    }
}


/***/ })

/******/ });
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vLy4vc3JjL2NvZGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtRQUFBO1FBQ0E7O1FBRUE7UUFDQTs7UUFFQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTs7UUFFQTtRQUNBOztRQUVBO1FBQ0E7O1FBRUE7UUFDQTtRQUNBOzs7UUFHQTtRQUNBOztRQUVBO1FBQ0E7O1FBRUE7UUFDQTtRQUNBO1FBQ0EsMENBQTBDLGdDQUFnQztRQUMxRTtRQUNBOztRQUVBO1FBQ0E7UUFDQTtRQUNBLHdEQUF3RCxrQkFBa0I7UUFDMUU7UUFDQSxpREFBaUQsY0FBYztRQUMvRDs7UUFFQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0EseUNBQXlDLGlDQUFpQztRQUMxRSxnSEFBZ0gsbUJBQW1CLEVBQUU7UUFDckk7UUFDQTs7UUFFQTtRQUNBO1FBQ0E7UUFDQSwyQkFBMkIsMEJBQTBCLEVBQUU7UUFDdkQsaUNBQWlDLGVBQWU7UUFDaEQ7UUFDQTtRQUNBOztRQUVBO1FBQ0Esc0RBQXNELCtEQUErRDs7UUFFckg7UUFDQTs7O1FBR0E7UUFDQTs7Ozs7Ozs7Ozs7O0FDbEZBO0FBQ0E7QUFDQSxtQ0FBbUMsTUFBTSw2QkFBNkIsRUFBRSxZQUFZLFdBQVcsRUFBRTtBQUNqRyxrQ0FBa0MsTUFBTSxpQ0FBaUMsRUFBRSxZQUFZLFdBQVcsRUFBRTtBQUNwRywrQkFBK0IsaUVBQWlFLHVCQUF1QixFQUFFLDRCQUE0QjtBQUNySjtBQUNBLEtBQUs7QUFDTDtBQUNBLHdCQUF3QiwwQkFBMEI7QUFDbEQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxzQ0FBc0MsaUNBQWlDO0FBQ3ZFO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7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O0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQSxTQUFTO0FBQ1QsMEJBQTBCLDRDQUE0QyxFQUFFO0FBQ3hFO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw2QkFBNkI7QUFDN0I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esd0RBQXdELGNBQWM7QUFDdEU7QUFDQTtBQUNBO0FBQ0Esa0VBQWtFLFNBQVMseUJBQXlCLElBQUksMkJBQTJCLE1BQU07QUFDekk7QUFDQSIsImZpbGUiOiJjb2RlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiIFx0Ly8gVGhlIG1vZHVsZSBjYWNoZVxuIFx0dmFyIGluc3RhbGxlZE1vZHVsZXMgPSB7fTtcblxuIFx0Ly8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbiBcdGZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblxuIFx0XHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcbiBcdFx0aWYoaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0pIHtcbiBcdFx0XHRyZXR1cm4gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0uZXhwb3J0cztcbiBcdFx0fVxuIFx0XHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuIFx0XHR2YXIgbW9kdWxlID0gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0gPSB7XG4gXHRcdFx0aTogbW9kdWxlSWQsXG4gXHRcdFx0bDogZmFsc2UsXG4gXHRcdFx0ZXhwb3J0czoge31cbiBcdFx0fTtcblxuIFx0XHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cbiBcdFx0bW9kdWxlc1ttb2R1bGVJZF0uY2FsbChtb2R1bGUuZXhwb3J0cywgbW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cbiBcdFx0Ly8gRmxhZyB0aGUgbW9kdWxlIGFzIGxvYWRlZFxuIFx0XHRtb2R1bGUubCA9IHRydWU7XG5cbiBcdFx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcbiBcdFx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xuIFx0fVxuXG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlcyBvYmplY3QgKF9fd2VicGFja19tb2R1bGVzX18pXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm0gPSBtb2R1bGVzO1xuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZSBjYWNoZVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5jID0gaW5zdGFsbGVkTW9kdWxlcztcblxuIFx0Ly8gZGVmaW5lIGdldHRlciBmdW5jdGlvbiBmb3IgaGFybW9ueSBleHBvcnRzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmQgPSBmdW5jdGlvbihleHBvcnRzLCBuYW1lLCBnZXR0ZXIpIHtcbiBcdFx0aWYoIV9fd2VicGFja19yZXF1aXJlX18ubyhleHBvcnRzLCBuYW1lKSkge1xuIFx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBuYW1lLCB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZ2V0dGVyIH0pO1xuIFx0XHR9XG4gXHR9O1xuXG4gXHQvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSBmdW5jdGlvbihleHBvcnRzKSB7XG4gXHRcdGlmKHR5cGVvZiBTeW1ib2wgIT09ICd1bmRlZmluZWQnICYmIFN5bWJvbC50b1N0cmluZ1RhZykge1xuIFx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBTeW1ib2wudG9TdHJpbmdUYWcsIHsgdmFsdWU6ICdNb2R1bGUnIH0pO1xuIFx0XHR9XG4gXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG4gXHR9O1xuXG4gXHQvLyBjcmVhdGUgYSBmYWtlIG5hbWVzcGFjZSBvYmplY3RcbiBcdC8vIG1vZGUgJiAxOiB2YWx1ZSBpcyBhIG1vZHVsZSBpZCwgcmVxdWlyZSBpdFxuIFx0Ly8gbW9kZSAmIDI6IG1lcmdlIGFsbCBwcm9wZXJ0aWVzIG9mIHZhbHVlIGludG8gdGhlIG5zXG4gXHQvLyBtb2RlICYgNDogcmV0dXJuIHZhbHVlIHdoZW4gYWxyZWFkeSBucyBvYmplY3RcbiBcdC8vIG1vZGUgJiA4fDE6IGJlaGF2ZSBsaWtlIHJlcXVpcmVcbiBcdF9fd2VicGFja19yZXF1aXJlX18udCA9IGZ1bmN0aW9uKHZhbHVlLCBtb2RlKSB7XG4gXHRcdGlmKG1vZGUgJiAxKSB2YWx1ZSA9IF9fd2VicGFja19yZXF1aXJlX18odmFsdWUpO1xuIFx0XHRpZihtb2RlICYgOCkgcmV0dXJuIHZhbHVlO1xuIFx0XHRpZigobW9kZSAmIDQpICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgJiYgdmFsdWUgJiYgdmFsdWUuX19lc01vZHVsZSkgcmV0dXJuIHZhbHVlO1xuIFx0XHR2YXIgbnMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuIFx0XHRfX3dlYnBhY2tfcmVxdWlyZV9fLnIobnMpO1xuIFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkobnMsICdkZWZhdWx0JywgeyBlbnVtZXJhYmxlOiB0cnVlLCB2YWx1ZTogdmFsdWUgfSk7XG4gXHRcdGlmKG1vZGUgJiAyICYmIHR5cGVvZiB2YWx1ZSAhPSAnc3RyaW5nJykgZm9yKHZhciBrZXkgaW4gdmFsdWUpIF9fd2VicGFja19yZXF1aXJlX18uZChucywga2V5LCBmdW5jdGlvbihrZXkpIHsgcmV0dXJuIHZhbHVlW2tleV07IH0uYmluZChudWxsLCBrZXkpKTtcbiBcdFx0cmV0dXJuIG5zO1xuIFx0fTtcblxuIFx0Ly8gZ2V0RGVmYXVsdEV4cG9ydCBmdW5jdGlvbiBmb3IgY29tcGF0aWJpbGl0eSB3aXRoIG5vbi1oYXJtb255IG1vZHVsZXNcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubiA9IGZ1bmN0aW9uKG1vZHVsZSkge1xuIFx0XHR2YXIgZ2V0dGVyID0gbW9kdWxlICYmIG1vZHVsZS5fX2VzTW9kdWxlID9cbiBcdFx0XHRmdW5jdGlvbiBnZXREZWZhdWx0KCkgeyByZXR1cm4gbW9kdWxlWydkZWZhdWx0J107IH0gOlxuIFx0XHRcdGZ1bmN0aW9uIGdldE1vZHVsZUV4cG9ydHMoKSB7IHJldHVybiBtb2R1bGU7IH07XG4gXHRcdF9fd2VicGFja19yZXF1aXJlX18uZChnZXR0ZXIsICdhJywgZ2V0dGVyKTtcbiBcdFx0cmV0dXJuIGdldHRlcjtcbiBcdH07XG5cbiBcdC8vIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbFxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5vID0gZnVuY3Rpb24ob2JqZWN0LCBwcm9wZXJ0eSkgeyByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iamVjdCwgcHJvcGVydHkpOyB9O1xuXG4gXHQvLyBfX3dlYnBhY2tfcHVibGljX3BhdGhfX1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5wID0gXCJcIjtcblxuXG4gXHQvLyBMb2FkIGVudHJ5IG1vZHVsZSBhbmQgcmV0dXJuIGV4cG9ydHNcbiBcdHJldHVybiBfX3dlYnBhY2tfcmVxdWlyZV9fKF9fd2VicGFja19yZXF1aXJlX18ucyA9IFwiLi9zcmMvY29kZS50c1wiKTtcbiIsInZhciBfX2F3YWl0ZXIgPSAodGhpcyAmJiB0aGlzLl9fYXdhaXRlcikgfHwgZnVuY3Rpb24gKHRoaXNBcmcsIF9hcmd1bWVudHMsIFAsIGdlbmVyYXRvcikge1xuICAgIHJldHVybiBuZXcgKFAgfHwgKFAgPSBQcm9taXNlKSkoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICBmdW5jdGlvbiBmdWxmaWxsZWQodmFsdWUpIHsgdHJ5IHsgc3RlcChnZW5lcmF0b3IubmV4dCh2YWx1ZSkpOyB9IGNhdGNoIChlKSB7IHJlamVjdChlKTsgfSB9XG4gICAgICAgIGZ1bmN0aW9uIHJlamVjdGVkKHZhbHVlKSB7IHRyeSB7IHN0ZXAoZ2VuZXJhdG9yW1widGhyb3dcIl0odmFsdWUpKTsgfSBjYXRjaCAoZSkgeyByZWplY3QoZSk7IH0gfVxuICAgICAgICBmdW5jdGlvbiBzdGVwKHJlc3VsdCkgeyByZXN1bHQuZG9uZSA/IHJlc29sdmUocmVzdWx0LnZhbHVlKSA6IG5ldyBQKGZ1bmN0aW9uIChyZXNvbHZlKSB7IHJlc29sdmUocmVzdWx0LnZhbHVlKTsgfSkudGhlbihmdWxmaWxsZWQsIHJlamVjdGVkKTsgfVxuICAgICAgICBzdGVwKChnZW5lcmF0b3IgPSBnZW5lcmF0b3IuYXBwbHkodGhpc0FyZywgX2FyZ3VtZW50cyB8fCBbXSkpLm5leHQoKSk7XG4gICAgfSk7XG59O1xuZmlnbWEuc2hvd1VJKF9faHRtbF9fLCB7IHdpZHRoOiAxNjYsIGhlaWdodDogMTg0IH0pO1xubGV0IGhhc0ZyYW1lRGF0YTtcbmxldCBzaGFwZVRyZWUgPSBbXTtcbmxldCBpbWFnZUhhc2hMaXN0ID0gW107XG5sZXQgaW1hZ2VCeXRlc0xpc3QgPSBbXTtcbmxldCByYXN0ZXJpemVMaXN0ID0gW107XG5sZXQgcHJlZnMgPSB7XG4gICAgZXhwb3J0UmVmSW1hZ2U6IGZhbHNlLFxuICAgIGltZ1NhdmVEaWFsb2c6IGZhbHNlLFxufTtcbi8vIHJlY2VpdmUgbWVzc2FnZSBmcm9tIHRoZSBVSVxuZmlnbWEudWkub25tZXNzYWdlID0gbWVzc2FnZSA9PiB7XG4gICAgaWYgKG1lc3NhZ2UudHlwZSA9PT0gJ2dldFByZWZzJykge1xuICAgICAgICAvLyBjb25zb2xlLmxvZygnZ2V0IHRob3NlIHByZWZzJyk7XG4gICAgICAgIGZpZ21hLmNsaWVudFN0b3JhZ2UuZ2V0QXN5bmMoJ2FldXgucHJlZnMnKVxuICAgICAgICAgICAgLnRoZW4ocHJlZnMgPT4ge1xuICAgICAgICAgICAgaWYgKHByZWZzKSB7XG4gICAgICAgICAgICAgICAgZmlnbWEudWkucG9zdE1lc3NhZ2UoeyB0eXBlOiAncmV0UHJlZnMnLCBwcmVmczogcHJlZnMgfSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHByZWZzO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coJ2dvdHRhIHNhdmUgbmV3IHByZWZzJywgbWVzc2FnZS5kZWZhdWx0UHJlZnMpO1xuICAgICAgICAgICAgICAgIGZpZ21hLmNsaWVudFN0b3JhZ2Uuc2V0QXN5bmMoJ2FldXgucHJlZnMnLCBtZXNzYWdlLmRlZmF1bHRQcmVmcylcbiAgICAgICAgICAgICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBmaWdtYS51aS5wb3N0TWVzc2FnZSh7IHR5cGU6ICdyZXRQcmVmcycsIHByZWZzOiBtZXNzYWdlLmRlZmF1bHRQcmVmcyB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gbWVzc2FnZS5kZWZhdWx0UHJlZnM7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICAgICAgICAudGhlbih1c2VyUHJlZnMgPT4ge1xuICAgICAgICAgICAgcHJlZnMgPSB1c2VyUHJlZnM7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBpZiAobWVzc2FnZS50eXBlID09PSAnc2V0UHJlZnMnKSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCdzYXZlIHRob3NlIHByZWZzJywgbWVzc2FnZS5wcmVmcyk7XG4gICAgICAgIGZpZ21hLmNsaWVudFN0b3JhZ2Uuc2V0QXN5bmMoJ2FldXgucHJlZnMnLCBtZXNzYWdlLnByZWZzKVxuICAgICAgICAgICAgLnRoZW4ocmV0ID0+IHtcbiAgICAgICAgICAgIGZpZ21hLnVpLnBvc3RNZXNzYWdlKG1lc3NhZ2UucHJlZnMpO1xuICAgICAgICAgICAgcHJlZnMgPSBtZXNzYWdlLnByZWZzOyAvLyBzdG9yZSB0aGUgcHJlZnMgbG9jYWxseVxuICAgICAgICB9KTtcbiAgICB9XG4gICAgaWYgKG1lc3NhZ2UudHlwZSA9PT0gJ2V4cG9ydENhbmNlbCcpIHtcbiAgICB9XG4gICAgaWYgKG1lc3NhZ2UudHlwZSA9PT0gJ2V4cG9ydFNlbGVjdGlvbicpIHtcbiAgICAgICAgaGFzRnJhbWVEYXRhID0gZmFsc2U7XG4gICAgICAgIHNoYXBlVHJlZSA9IFtdO1xuICAgICAgICBpbWFnZUhhc2hMaXN0ID0gW107XG4gICAgICAgIGltYWdlQnl0ZXNMaXN0ID0gW107XG4gICAgICAgIHJhc3Rlcml6ZUxpc3QgPSBbXTtcbiAgICAgICAgbGV0IGV4cG9ydEpTT04gPSBmYWxzZTtcbiAgICAgICAgaWYgKG1lc3NhZ2UuZXhwb3J0SlNPTikge1xuICAgICAgICAgICAgZXhwb3J0SlNPTiA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgLy8gbm90aGluZyBzZWxlY3RlZFxuICAgICAgICBpZiAoZmlnbWEuY3VycmVudFBhZ2Uuc2VsZWN0aW9uLmxlbmd0aCA8IDEpIHtcbiAgICAgICAgICAgIGZpZ21hLnVpLnBvc3RNZXNzYWdlKHsgdHlwZTogJ2ZldGNoQUVVWCcsIGRhdGE6IG51bGwgfSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIHByZS1wcm9jZXNzIHRoZSBzZWxlY3RlZCBzaGFwZXMgaGllcmFyY2h5XG4gICAgICAgICAgICBsZXQgc2VsZWN0aW9uID0gbm9kZVRvT2JqKGZpZ21hLmN1cnJlbnRQYWdlLnNlbGVjdGlvbik7XG4gICAgICAgICAgICBpZiAoc2hhcGVUcmVlWzBdLmNoaWxkcmVuLmxlbmd0aCA8IDEpIHtcbiAgICAgICAgICAgICAgICBzaGFwZVRyZWVbMF0uY2hpbGRyZW4gPSBzZWxlY3Rpb247XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZygnc2hhcGVUcmVlOiAnLCBzaGFwZVRyZWUpO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5sb2coZXJyb3IpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ3NlbGVjdGVkIGxheWVycyBuZWVkIHRvIGJlIGluc2lkZSBvZiBhIGZyYW1lJyk7XG4gICAgICAgICAgICBmaWdtYS51aS5wb3N0TWVzc2FnZSh7IHR5cGU6ICdmb290ZXJNc2cnLCBhY3Rpb246ICdMYXllcnMgbXVzdCBiZSBpbnNpZGUgb2YgYSBmcmFtZScsIGxheWVyQ291bnQ6IG51bGwgfSk7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IHJlZkltZyA9IG51bGwsIHRlbXBHcm91cCwgcGFyZW50RnJhbWU7XG4gICAgICAgIGlmIChwcmVmcy5leHBvcnRSZWZJbWFnZSkgeyAvLyBpbmNsdWRlIGEgcmVmZXJlbmNlIGltYWdlIHdpdGggdHJhbnNmZXJcbiAgICAgICAgICAgIHBhcmVudEZyYW1lID0gZmluZEZyYW1lKGZpZ21hLmN1cnJlbnRQYWdlLnNlbGVjdGlvblswXSk7XG4gICAgICAgICAgICBsZXQgcGFyZW50RnJhbWVOYW1lID0gcGFyZW50RnJhbWUubmFtZS5yZXBsYWNlKC9cXHMqKFxcL3xcXFxcKVxccyovZywgJy0nKS5yZXBsYWNlKC9eXFwqXFxzLywgJycpLnJlcGxhY2UoL15cXCovLCAnJyk7XG4gICAgICAgICAgICAvLyBncm91cCBhbmQgbWFza1xuICAgICAgICAgICAgbGV0IG1hc2sgPSBmaWdtYS5jcmVhdGVSZWN0YW5nbGUoKTtcbiAgICAgICAgICAgIG1hc2sueCA9IHBhcmVudEZyYW1lLng7XG4gICAgICAgICAgICBtYXNrLnkgPSBwYXJlbnRGcmFtZS55O1xuICAgICAgICAgICAgbWFzay5yZXNpemUocGFyZW50RnJhbWUud2lkdGgsIHBhcmVudEZyYW1lLmhlaWdodCk7XG4gICAgICAgICAgICB0ZW1wR3JvdXAgPSBmaWdtYS5ncm91cChbbWFza10sIG1hc2sucGFyZW50KTtcbiAgICAgICAgICAgIHRlbXBHcm91cC5hcHBlbmRDaGlsZChwYXJlbnRGcmFtZSk7XG4gICAgICAgICAgICBtYXNrLmlzTWFzayA9IHRydWU7XG4gICAgICAgICAgICByYXN0ZXJpemVMaXN0LnB1c2gocGFyZW50RnJhbWUuaWQpO1xuICAgICAgICAgICAgcmVmSW1nID0ge1xuICAgICAgICAgICAgICAgIHR5cGU6ICdJbWFnZScsXG4gICAgICAgICAgICAgICAgbmFtZTogcGFyZW50RnJhbWVOYW1lLFxuICAgICAgICAgICAgICAgIGlkOiBwYXJlbnRGcmFtZS5pZC5yZXBsYWNlKC86L2csICctJyksXG4gICAgICAgICAgICAgICAgZnJhbWU6IHsgeDogcGFyZW50RnJhbWUud2lkdGggLyAyLCB5OiBwYXJlbnRGcmFtZS5oZWlnaHQgLyAyLCB3aWR0aDogcGFyZW50RnJhbWUud2lkdGgsIGhlaWdodDogcGFyZW50RnJhbWUuaGVpZ2h0IH0sXG4gICAgICAgICAgICAgICAgaXNWaXNpYmxlOiB0cnVlLFxuICAgICAgICAgICAgICAgIG9wYWNpdHk6IDUwLFxuICAgICAgICAgICAgICAgIGJsZW5kTW9kZTogJ0JsZW5kaW5nTW9kZS5OT1JNQUwnLFxuICAgICAgICAgICAgICAgIGlzTWFzazogZmFsc2UsXG4gICAgICAgICAgICAgICAgcm90YXRpb246IDAsXG4gICAgICAgICAgICAgICAgZ3VpZGU6IHRydWUsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIGlmIChyYXN0ZXJpemVMaXN0Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHJhc3Rlcml6ZUxpc3QgPSBbLi4ubmV3IFNldChyYXN0ZXJpemVMaXN0KV07IC8vIHJlbW92ZSBkdXBsaWNhdGVzXG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZygnUkFTVEVSSVpFTElTVCcsIHJhc3Rlcml6ZUxpc3QpO1xuICAgICAgICAgICAgbGV0IHJlcXVlc3RzID0gcmFzdGVyaXplTGlzdC5tYXAoKGl0ZW0pID0+IHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnaXRlbisrJywgaXRlbSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGFzeW5jQ29sbGVjdEhhc2hlcyhpdGVtLCByZXNvbHZlKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgUHJvbWlzZS5hbGwocmVxdWVzdHMpXG4gICAgICAgICAgICAgICAgLnRoZW4oKCkgPT4gc3RvcmVJbWFnZURhdGEoaW1hZ2VIYXNoTGlzdCwgc2hhcGVUcmVlLCByZWZJbWcpKVxuICAgICAgICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAvLyByZW1vdmUgdGhlIHJlZmVyZW5jZSBtYXNrXG4gICAgICAgICAgICAgICAgaWYgKHRlbXBHcm91cCkge1xuICAgICAgICAgICAgICAgICAgICB0ZW1wR3JvdXAucGFyZW50LmFwcGVuZENoaWxkKHBhcmVudEZyYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgdGVtcEdyb3VwLnJlbW92ZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgLy8gY2hlY2sgaWYgaW1hZ2VzIG5lZWQgdG8gZXhwb3J0IHRoZW4gc2VuZCBtZXNzYWdlIHRvIHVpLnRzXG4gICAgICAgICAgICBpZiAoZXhwb3J0SlNPTikge1xuICAgICAgICAgICAgICAgIGZpZ21hLnVpLnBvc3RNZXNzYWdlKHsgdHlwZTogJ2V4cG9ydEFFVVgnLCBkYXRhOiBzaGFwZVRyZWUgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChpbWFnZUhhc2hMaXN0Lmxlbmd0aCA8IDEpIHtcbiAgICAgICAgICAgICAgICBmaWdtYS51aS5wb3N0TWVzc2FnZSh7IHR5cGU6ICdmZXRjaEFFVVgnLCBkYXRhOiBzaGFwZVRyZWUgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBzdG9yZUltYWdlRGF0YShpbWFnZUhhc2hMaXN0LCBzaGFwZVRyZWUsIG51bGwpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCdpbWFnZUhhc2hMaXN0JywgaW1hZ2VIYXNoTGlzdCk7XG4gICAgICAgIGZ1bmN0aW9uIGNsb25lKHZhbCkge1xuICAgICAgICAgICAgcmV0dXJuIEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkodmFsKSk7XG4gICAgICAgIH1cbiAgICAgICAgZnVuY3Rpb24gYXN5bmNDb2xsZWN0SGFzaGVzKGlkLCBjYikge1xuICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coJ2RvbmUgd2l0aCcsIGl0ZW0pO1xuICAgICAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgICAgICBmaWdtYS5nZXROb2RlQnlJZEFzeW5jKGlkKS50aGVuKG5vZGUgPT4ge1xuICAgICAgICAgICAgICAgICAgICBsZXQgc2hhcGUgPSBub2RlO1xuICAgICAgICAgICAgICAgICAgICAvLyBkaXNhYmxlIGVmZmVjdHNcbiAgICAgICAgICAgICAgICAgICAgbGV0IGVmZmVjdFZpc0xpc3QgPSBbXTsgLy8gdG8gc3RvcmUgdGhlIGVmZmVjdCB2aXNpYmlsaXR5XG4gICAgICAgICAgICAgICAgICAgIGxldCBlZmZlY3RzO1xuICAgICAgICAgICAgICAgICAgICBpZiAoc2hhcGUuZWZmZWN0cykge1xuICAgICAgICAgICAgICAgICAgICAgICAgZWZmZWN0cyA9IGNsb25lKHNoYXBlLmVmZmVjdHMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZWZmZWN0cy5mb3JFYWNoKGVmZmVjdCA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWZmZWN0VmlzTGlzdC5wdXNoKGVmZmVjdC52aXNpYmxlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZWZmZWN0LnR5cGUgPT0gJ0RST1BfU0hBRE9XJyB8fCBlZmZlY3QudHlwZSA9PSAnTEFZRVJfQkxVUicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWZmZWN0LnZpc2libGUgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNoYXBlLmVmZmVjdHMgPSBlZmZlY3RzO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGxldCBjb21wTXVsdCA9IDM7XG4gICAgICAgICAgICAgICAgICAgIGxldCBpbWdTY2FsZSA9IE1hdGgubWluKDM1MDAgLyBNYXRoLm1heChzaGFwZS53aWR0aCwgc2hhcGUuaGVpZ2h0KSwgY29tcE11bHQpOyAvLyBsaW1pdCBpdCB0byA0MDAwcHhcbiAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coJ0lNQUdFU0NBTEUnLCBpbWdTY2FsZSwgc2hhcGUpO1xuICAgICAgICAgICAgICAgICAgICBzaGFwZS5leHBvcnRBc3luYyh7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3JtYXQ6IFwiUE5HXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICB1c2VBYnNvbHV0ZUJvdW5kczogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0cmFpbnQ6IHsgdHlwZTogXCJTQ0FMRVwiLCB2YWx1ZTogaW1nU2NhbGUgfVxuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAgICAgLnRoZW4oaW1nID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGltYWdlSGFzaExpc3QucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGFzaDogZmlnbWEuY3JlYXRlSW1hZ2UoaW1nKS5oYXNoLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkOiBgJHtzaGFwZS5uYW1lLnJlcGxhY2UoL15cXCpcXHMvLCAnJykucmVwbGFjZSgvXlxcKi8sICcnKX1fJHtpZH1gXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHJlLWVuYWJsZSBlZmZlY3RzIFxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBlZmZlY3RWaXNMaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWZmZWN0c1tpXS52aXNpYmxlID0gZWZmZWN0VmlzTGlzdFtpXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHNoYXBlLmVmZmVjdHMgPSBlZmZlY3RzO1xuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2IoKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LCAxMDApO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmIChtZXNzYWdlLnR5cGUgPT09ICdhZGRSYXN0ZXJpemVGbGFnJykge1xuICAgICAgICBpZiAoZmlnbWEuY3VycmVudFBhZ2Uuc2VsZWN0aW9uLmxlbmd0aCA8IDEpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfSAvLyBub3RoaW5nIHNlbGVjdGVkXG4gICAgICAgIC8vIGxldCBzZWxlY3Rpb24gPSBub2RlVG9PYmooZmlnbWEuY3VycmVudFBhZ2Uuc2VsZWN0aW9uKVxuICAgICAgICBsZXQgbGF5ZXJDb3VudCA9IGFkZE1hZ2ljU3RhcihmaWdtYS5jdXJyZW50UGFnZS5zZWxlY3Rpb24sIDApIHx8IDA7XG4gICAgICAgIC8vIHJlc2VsZWN0IGxheWVyc1xuICAgICAgICBmaWdtYS5jdXJyZW50UGFnZS5zZWxlY3Rpb24gPSBmaWdtYS5jdXJyZW50UGFnZS5zZWxlY3Rpb247XG4gICAgICAgIGZpZ21hLnVpLnBvc3RNZXNzYWdlKHsgdHlwZTogJ2Zvb3Rlck1zZycsIGFjdGlvbjogJ21hcmtlZCBhcyBQTkcnLCBsYXllckNvdW50IH0pO1xuICAgIH1cbiAgICAvLyBpZiAobWVzc2FnZS50eXBlID09PSAnZmxhdHRlbkxheWVycycpIHtcbiAgICAvLyAgICAgaWYgKGZpZ21hLmN1cnJlbnRQYWdlLnNlbGVjdGlvbi5sZW5ndGggPCAxKSB7IHJldHVybiB9ICAgICAgLy8gbm90aGluZyBzZWxlY3RlZFxuICAgIC8vICAgICAvLyBsZXQgc2VsZWN0aW9uID0gbm9kZVRvT2JqKGZpZ21hLmN1cnJlbnRQYWdlLnNlbGVjdGlvbilcbiAgICAvLyAgICAgbGV0IGxheWVyQ291bnQgPSBmbGF0dGVuUmVjdXJzaXZlKGZpZ21hLmN1cnJlbnRQYWdlLnNlbGVjdGlvbiwgMCkgfHwgMFxuICAgIC8vICAgICAvLyByZXNlbGVjdCBsYXllcnNcbiAgICAvLyAgICAgZmlnbWEuY3VycmVudFBhZ2Uuc2VsZWN0aW9uID0gZmlnbWEuY3VycmVudFBhZ2Uuc2VsZWN0aW9uXG4gICAgLy8gICAgIGZpZ21hLnVpLnBvc3RNZXNzYWdlKHt0eXBlOiAnZm9vdGVyTXNnJywgYWN0aW9uOiAnZmxhdHRlbmVkJywgbGF5ZXJDb3VudH0pO1xuICAgIC8vIH1cbiAgICAvLyBpZiAobWVzc2FnZS50eXBlID09PSAncmFzdGVyaXplU2VsZWN0aW9uJykge1xuICAgIC8vICAgICBpZiAoZmlnbWEuY3VycmVudFBhZ2Uuc2VsZWN0aW9uLmxlbmd0aCA8IDEpIHsgcmV0dXJuIH0gICAgICAvLyBub3RoaW5nIHNlbGVjdGVkXG4gICAgLy8gICAgIC8vIGxldCBzZWxlY3Rpb24gPSBub2RlVG9PYmooZmlnbWEuY3VycmVudFBhZ2Uuc2VsZWN0aW9uKVxuICAgIC8vICAgICBsZXQgbGF5ZXJDb3VudCA9IHJhc3Rlcml6ZVNlbGVjdGlvbihmaWdtYS5jdXJyZW50UGFnZS5zZWxlY3Rpb24sIDApIHx8IDBcbiAgICAvLyAgICAgLy8gY29uc29sZS5sb2coJ2xheWVyQ291bnQnLCBsYXllckNvdW50KTtcbiAgICAvLyAgICAgLy8gcmVzZWxlY3QgbGF5ZXJzXG4gICAgLy8gICAgIGZpZ21hLmN1cnJlbnRQYWdlLnNlbGVjdGlvbiA9IGZpZ21hLmN1cnJlbnRQYWdlLnNlbGVjdGlvblxuICAgIC8vICAgICBmaWdtYS51aS5wb3N0TWVzc2FnZSh7dHlwZTogJ2Zvb3Rlck1zZycsIGFjdGlvbjogJ3Jhc3Rlcml6ZWQnLCBsYXllckNvdW50fSk7XG4gICAgLy8gfVxuICAgIC8vIGlmIChtZXNzYWdlLnR5cGUgPT09ICdkZXRhY2hDb21wb25lbnRzJykge1xuICAgIC8vICAgICBjb25zb2xlLmxvZygnZGV0YWNoQ29tcG9uZW50cycpO1xuICAgIC8vICAgICBsZXQgbGF5ZXJDb3VudCA9IDQ7XG4gICAgLy8gICAgIGZpZ21hLnVpLnBvc3RNZXNzYWdlKHt0eXBlOiAnZm9vdGVyTXNnJywgYWN0aW9uOiAnZmxhdHRlbmVkJywgbGF5ZXJDb3VudH0pO1xuICAgIC8vIH1cbiAgICAvL0NvbW11bmljYXRlIGJhY2sgdG8gdGhlIFVJXG4gICAgLy8gY29uc29sZS5sb2coJ3NlbmQgbWVzc2FnZSBiYWNrIHRvIHVpJyk7XG59O1xuZnVuY3Rpb24gbm9kZVRvT2JqKG5vZGVzKSB7XG4gICAgLy8gICBjb25zb2xlLmxvZygnbm9kZXMnLCBub2Rlcyk7XG4gICAgaWYgKG5vZGVzLmxlbmd0aCA8IDEpIHtcbiAgICAgICAgcmV0dXJuIFtdO1xuICAgIH1cbiAgICAvLyBjb25zb2xlLmxvZyhub2Rlc1swXS50eXBlKTtcbiAgICBsZXQgYXJyID0gW107XG4gICAgLy8gbG9vayBmb3IgdGhlIHBhcmVudCBmcmFtZSBvZiBldmVyeXRoaW5nIGV4Y2VwdCByZWd1bGFyIChub24tYXV0b0xheW91dCkgZnJhbWVzIGFuZCBsb29zZSBjb21wb25lbnRzXG4gICAgaWYgKG5vZGVzWzBdICYmICgobm9kZXNbMF0udHlwZSA9PT0gJ0ZSQU1FJyAmJiBub2Rlc1swXS5wYXJlbnQudHlwZSA9PT0gJ1BBR0UnKSB8fFxuICAgICAgICAvLyAobm9kZXNbMF0udHlwZSA9PT0gJ0ZSQU1FJyAmJiBub2Rlc1swXS5sYXlvdXRNb2RlID09PSAnTk9ORScpIHx8IFxuICAgICAgICAobm9kZXNbMF0udHlwZSA9PT0gJ0NPTVBPTkVOVCcgJiYgbm9kZXNbMF0ucGFyZW50LnR5cGUgPT09ICdQQUdFJykpKSB7IC8vIGEgZnJhbWUgb3IgYSBjb21wb25lbnQgbWFzdGVyIG91dHNpZGUgb2YgYSBmcmFtZSBpcyBkaXJlY3RseSBzZWxlY3RlZFxuICAgICAgICBjb25zb2xlLmxvZygnR09UIEEgRlJBTUUnKTtcbiAgICAgICAgLy8gY29uc29sZS5sb2cobm9kZXNbMF0uY2hpbGRyZW4pO1xuICAgICAgICBoYXNGcmFtZURhdGEgPSB0cnVlOyAvLyBkb250IG5lZWQgdG8gZ2V0IHRoZSBmcmFtZSBkYXRhXG4gICAgICAgIHNoYXBlVHJlZS5wdXNoKGdldEVsZW1lbnQobm9kZXNbMF0sIGZhbHNlKSk7XG4gICAgICAgIG5vZGVzID0gbm9kZXNbMF0uY2hpbGRyZW47XG4gICAgfVxuICAgIC8vIGdldCBzaGFwZXMgXG4gICAgaWYgKG5vZGVzLmxlbmd0aCA8IDEpIHtcbiAgICAgICAgcmV0dXJuIFtdO1xuICAgIH1cbiAgICBub2Rlcy5mb3JFYWNoKG5vZGUgPT4ge1xuICAgICAgICAvLyBnZXQgdGhlIGZyYW1lIGRhdGFcbiAgICAgICAgaWYgKCFoYXNGcmFtZURhdGEpIHtcbiAgICAgICAgICAgIGlmIChub2RlLnBhcmVudC50eXBlID09PSAnUEFHRScpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9IC8vIGxheWVyIGlzIG91dHNpZGUgb2YgYSBmcmFtZSBcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCdnZXQgdGhlIGZyYW1lIGRhdGEnKTtcbiAgICAgICAgICAgIGxldCBmcmFtZSA9IGZpbmRGcmFtZShub2RlKTtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCdmcmFtZTonLCBmcmFtZSk7XG4gICAgICAgICAgICBsZXQgZnJhbWVEYXRhID0gZ2V0RWxlbWVudChmcmFtZSwgdHJ1ZSk7IC8vIHNraXAgZ2F0aGVyaW5nIGNoaWxkcmVuIGRhdGFcbiAgICAgICAgICAgIGZyYW1lRGF0YS5jaGlsZHJlbiA9IFtdOyAvLyBjbGVhciB0aGUgY2hpbGRyZW4gb2YgdGhlIGZyYW1lIHRvIHB1c2ggdGhlbSBsYXRlclxuICAgICAgICAgICAgc2hhcGVUcmVlLnB1c2goZnJhbWVEYXRhKTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgb2JqID0gc2FuaXRpemVWYWx1ZShnZXRFbGVtZW50KG5vZGUsIGZhbHNlKSk7XG4gICAgICAgIGFyci5wdXNoKG9iaik7XG4gICAgfSk7XG4gICAgLy8gY29uc29sZS5sb2coJ2FycjogJywgYXJyKTtcbiAgICByZXR1cm4gYXJyO1xuICAgIGZ1bmN0aW9uIGdldEVsZW1lbnQobm9kZSwgc2tpcENoaWxkcmVuKSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCdub2RlJywgbm9kZS5uYW1lKTtcbiAgICAgICAgbGV0IHJhc3Rlcml6ZSA9IGZhbHNlO1xuICAgICAgICBsZXQgb2JqID0ge1xuICAgICAgICAgICAgY2hpbGRyZW46IFtdLFxuICAgICAgICAgICAgdHlwZTogbnVsbCxcbiAgICAgICAgfTtcbiAgICAgICAgaWYgKG5vZGUubmFtZSAmJiBub2RlLm5hbWUuY2hhckF0KDApID09ICcqJyAmJiBub2RlICE9IGZpbmRGcmFtZShub2RlKSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ3Jhc3Rlcml6ZScsIG5vZGUpO1xuICAgICAgICAgICAgcmFzdGVyaXplTGlzdC5wdXNoKG5vZGUuaWQpO1xuICAgICAgICAgICAgcmFzdGVyaXplID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKGNvbnN0IGtleSBpbiBub2RlKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGxldCBlbGVtZW50ID0gbm9kZVtrZXldO1xuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGVsZW1lbnQpO1xuICAgICAgICAgICAgICAgIGlmIChrZXkgPT09ICdjaGlsZHJlbicgJiYgIXNraXBDaGlsZHJlbiAmJiAhcmFzdGVyaXplKSB7XG4gICAgICAgICAgICAgICAgICAgIGVsZW1lbnQgPSBub2RlVG9PYmooZWxlbWVudCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChrZXkgPT09ICdiYWNrZ3JvdW5kcycpIHtcbiAgICAgICAgICAgICAgICAgICAgZWxlbWVudCA9IG5vZGVUb09iaihlbGVtZW50KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGtleSA9PT0gJ2ZpbGxzJyAmJiBlbGVtZW50Lmxlbmd0aCA+IDApIHsgLy8gYWRkIGltYWdlIGZpbGxzIHRvIHJhc3Rlcml6ZUxpc3RcbiAgICAgICAgICAgICAgICAgICAgbGV0IGhhc0ltYWdlRmlsbCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGkgaW4gZWxlbWVudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZmlsbCA9IGVsZW1lbnRbaV07XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZmlsbC50eXBlID09ICdJTUFHRScpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoYXNJbWFnZUZpbGwgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9ialsncmFzdGVyaXplJ10gPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCdpbWFnZScsIGVsZW1lbnQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIG9iai50eXBlID0gJ1JFQ1RBTkdMRSdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyByZXR1cm5cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoaGFzSW1hZ2VGaWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByYXN0ZXJpemVMaXN0LnB1c2gobm9kZS5pZCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gY29ybmVyIHJhZGl1c1xuICAgICAgICAgICAgICAgIC8vIGlmIChrZXkgPT09ICdjb3JuZXJSYWRpdXMnKSB7XG4gICAgICAgICAgICAgICAgLy8gICAgIGNvbnNvbGUubG9nKGtleSwgIGVsZW1lbnQpO1xuICAgICAgICAgICAgICAgIC8vIH1cbiAgICAgICAgICAgICAgICBpZiAoZWxlbWVudCA9PSBmaWdtYS5taXhlZCAmJiBrZXkgPT09ICdjb3JuZXJSYWRpdXMnKSB7XG4gICAgICAgICAgICAgICAgICAgIGVsZW1lbnQgPSBNYXRoLm1pbihub2RlLnRvcExlZnRSYWRpdXMsIG5vZGUudG9wUmlnaHRSYWRpdXMsIG5vZGUuYm90dG9tTGVmdFJhZGl1cywgbm9kZS5ib3R0b21SaWdodFJhZGl1cyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIHRyeSB0byBnZXQgdGhlIGZpcnN0IHZhbHVlIG9uIHRoZSB0ZXh0XG4gICAgICAgICAgICAgICAgaWYgKGVsZW1lbnQgPT0gZmlnbWEubWl4ZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHN0ciA9ICdnZXRSYW5nZScgKyBrZXkucmVwbGFjZSgvXlxcdy8sIGMgPT4gYy50b1VwcGVyQ2FzZSgpKTtcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW1lbnQgPSBub2RlW3N0cl0oMCwgMSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBsYXllci5mb250TmFtZSAhPT0gKGZpZ21hLm1peGVkKSkgPyBsYXllci5mb250TmFtZS5mYW1pbHkgOiBsYXllci5nZXRSYW5nZUZvbnROYW1lKDAsMSkuZmFtaWx5XG4gICAgICAgICAgICAgICAgLy8gaWYgKGtleSA9PT0gJ3BhcmVudCcpIHsgY29uc29sZS5sb2coZWxlbWVudCk7IH1cbiAgICAgICAgICAgICAgICBvYmpba2V5XSA9IGVsZW1lbnQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnRVJST1InLCBlcnJvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8ga2VlcCB0cmFjayBvZiBBdXRvLWxheW91dCBmcmFtZXMgZm9yIGFsaWdubWVudCBvZiBjaGlsZHJlblxuICAgICAgICBpZiAobm9kZS50eXBlID09PSAnRlJBTUUnICYmIG5vZGUubGF5b3V0TW9kZSAhPT0gJ05PTkUnKSB7XG4gICAgICAgICAgICBvYmoudHlwZSA9ICdBVVRPTEFZT1VUJztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gb2JqO1xuICAgIH1cbiAgICBmdW5jdGlvbiBjb2xsZWN0SW1hZ2VIYXNoZXMoZWxlbWVudCwgaWQpIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coJ2ltYWdlSGFzaCcsIGlkLCBlbGVtZW50KTtcbiAgICAgICAgZm9yIChjb25zdCBpIGluIGVsZW1lbnQpIHtcbiAgICAgICAgICAgIGNvbnN0IGZpbGwgPSBlbGVtZW50W2ldO1xuICAgICAgICAgICAgaWYgKGZpbGwudHlwZSA9PSAnSU1BR0UnKSB7XG4gICAgICAgICAgICAgICAgaW1hZ2VIYXNoTGlzdC5wdXNoKHsgaGFzaDogZmlsbC5pbWFnZUhhc2gsIGlkIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufVxuZnVuY3Rpb24gc3RvcmVJbWFnZURhdGEoaW1hZ2VIYXNoTGlzdCwgbGF5ZXJzLCByZWZJbWcpIHtcbiAgICByZXR1cm4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgdm9pZCAwLCBmdW5jdGlvbiogKCkge1xuICAgICAgICAvLyBjb25zb2xlLmxvZygnbGF5ZXJzKysnLCBsYXllcnMpO1xuICAgICAgICAvLyBjb25zb2xlLmxvZygnaW1hZ2VIYXNoTGlzdCsrJywgaW1hZ2VIYXNoTGlzdCk7XG4gICAgICAgIGZvciAoY29uc3QgaSBpbiBpbWFnZUhhc2hMaXN0KSB7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZygnaScsIGkpO1xuICAgICAgICAgICAgY29uc3QgaGFzaCA9IGltYWdlSGFzaExpc3RbaV0uaGFzaDtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCdoYXNoJywgaGFzaCk7XG4gICAgICAgICAgICBjb25zdCBuYW1lID0gaW1hZ2VIYXNoTGlzdFtpXS5pZFxuICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9bXFxcXDpcIio/JTw+fF0vZywgJy0nKSAvLyByZXBsYWNlIGlsbGVnYWwgY2hhcmFjdGVyc1xuICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXHMqKFxcL3xcXFxcKVxccyovZywgJy0nKTsgLy8gcmVtb3ZlIHNsYXNoZXNcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCduYW1lJywgbmFtZSk7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGxldCBpbWFnZSA9IGZpZ21hLmdldEltYWdlQnlIYXNoKGhhc2gpO1xuICAgICAgICAgICAgICAgIGxldCBieXRlcyA9IHlpZWxkIGltYWdlLmdldEJ5dGVzQXN5bmMoKTtcbiAgICAgICAgICAgICAgICBpbWFnZUJ5dGVzTGlzdC5wdXNoKHsgbmFtZSwgYnl0ZXMgfSk7XG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coJ2J5dGVzJywgYnl0ZXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2F0Y2ggKGVycm9yKSB7IH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoaW1hZ2VCeXRlc0xpc3QubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgZmlnbWEudWkucG9zdE1lc3NhZ2UoeyB0eXBlOiAnZmV0Y2hJbWFnZXNBbmRBRVVYJywgaW1hZ2VzOiBpbWFnZUJ5dGVzTGlzdCwgZGF0YTogbGF5ZXJzLCByZWZJbWcgfSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBmaWdtYS51aS5wb3N0TWVzc2FnZSh7IHR5cGU6ICdmZXRjaEFFVVgnLCBkYXRhOiBsYXllcnMgfSk7XG4gICAgICAgIH1cbiAgICB9KTtcbn1cbmZ1bmN0aW9uIGZpbmRGcmFtZShub2RlKSB7XG4gICAgLy8gY29uc29sZS5sb2coJ25vZGU6Jywgbm9kZSk7XG4gICAgLy8gY29uc29sZS5sb2coJ25vZGUudHlwZTonLCBub2RlLnR5cGUpO1xuICAgIHRyeSB7XG4gICAgICAgIGlmICgobm9kZS50eXBlICE9PSAnRlJBTUUnICYmICEobm9kZS50eXBlID09PSAnQ09NUE9ORU5UJyAmJiBub2RlLnBhcmVudC50eXBlID09PSAnUEFHRScpKVxuICAgICAgICAgICAgfHwgKG5vZGUudHlwZSA9PT0gJ0ZSQU1FJyAmJiBub2RlLnBhcmVudC50eXBlID09PSAnRlJBTUUnKSkge1xuICAgICAgICAgICAgLy8gaWYgKG5vZGUudHlwZSAhPT0gJ0ZSQU1FJyAmJiBub2RlLnR5cGUgIT09ICdDT01QT05FTlQnKSB7ICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgcmV0dXJuIGZpbmRGcmFtZShub2RlLnBhcmVudCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBoYXNGcmFtZURhdGEgPSB0cnVlO1xuICAgICAgICAgICAgcmV0dXJuIG5vZGU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGZpZ21hLnVpLnBvc3RNZXNzYWdlKHsgdHlwZTogJ2Zvb3Rlck1zZycsIGFjdGlvbjogJ0Vycm9yIGluIGZpbmRGcmFtZSgpIPCfmJYnLCBsYXllckNvdW50OiBudWxsIH0pO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGFkZE1hZ2ljU3RhcihzZWxlY3Rpb24sIGxheWVyQ291bnQpIHtcbiAgICBpZiAoZmluZEZyYW1lKHNlbGVjdGlvblswXSkgPT0gc2VsZWN0aW9uWzBdKSB7IC8vIHNlbGVjdGlvbiBpcyB0aGUgdG9wIG1vc3QgZnJhbWVcbiAgICAgICAgc2VsZWN0aW9uID0gc2VsZWN0aW9uWzBdLmNoaWxkcmVuOyAvLyBzZWxlY3QgYWxsIHRoZSBjaGlsZHJlblxuICAgIH1cbiAgICBzZWxlY3Rpb24uZm9yRWFjaChzaGFwZSA9PiB7XG4gICAgICAgIGlmIChzaGFwZS5uYW1lLmNoYXJBdCgwKSAhPT0gJyonKSB7XG4gICAgICAgICAgICBzaGFwZS5uYW1lID0gYCogJHtzaGFwZS5uYW1lfWA7XG4gICAgICAgICAgICBsYXllckNvdW50Kys7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gbGF5ZXJDb3VudDtcbn1cbmZ1bmN0aW9uIGZsYXR0ZW5SZWN1cnNpdmUoc2VsZWN0aW9uLCBsYXllckNvdW50KSB7XG4gICAgdHJ5IHtcbiAgICAgICAgc2VsZWN0aW9uLmZvckVhY2goc2hhcGUgPT4ge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ3RyeSBmbGF0dGVuaW5nJywgc2hhcGUpO1xuICAgICAgICAgICAgaWYgKHNoYXBlLnR5cGUgPT0gJ0JPT0xFQU5fT1BFUkFUSU9OJykge1xuICAgICAgICAgICAgICAgIGZpZ21hLmZsYXR0ZW4oW3NoYXBlXSk7XG4gICAgICAgICAgICAgICAgbGF5ZXJDb3VudCsrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoc2hhcGUuY29ybmVyUmFkaXVzID09IGZpZ21hLm1peGVkIHx8IHNoYXBlLmNvcm5lclJhZGl1cyA+IDApIHtcbiAgICAgICAgICAgICAgICAvLyBmbGF0dGVuIHJvdW5kZWQgY29ybmVyc1xuICAgICAgICAgICAgICAgIGZpZ21hLmZsYXR0ZW4oW3NoYXBlXSk7XG4gICAgICAgICAgICAgICAgbGF5ZXJDb3VudCsrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoc2hhcGUuY2hpbGRyZW4pIHtcbiAgICAgICAgICAgICAgICBsYXllckNvdW50ID0gZmxhdHRlblJlY3Vyc2l2ZShzaGFwZS5jaGlsZHJlbiwgbGF5ZXJDb3VudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBsZXQgdCA9IHNoYXBlLnJlbGF0aXZlVHJhbnNmb3JtO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdzaGFwZS50eXBlJywgc2hhcGUudHlwZSk7XG4gICAgICAgICAgICAgICAgLy8vIGNoZWNrIGZvciB0cmFuc2Zvcm1zXG4gICAgICAgICAgICAgICAgaWYgKHRbMF1bMF0udG9GaXhlZCg2KSAhPSAxIHx8XG4gICAgICAgICAgICAgICAgICAgIHRbMF1bMV0udG9GaXhlZCg2KSAhPSAwIHx8XG4gICAgICAgICAgICAgICAgICAgIHRbMV1bMF0udG9GaXhlZCg2KSAhPSAwIHx8XG4gICAgICAgICAgICAgICAgICAgIHRbMV1bMV0udG9GaXhlZCg2KSAhPSAxIHx8XG4gICAgICAgICAgICAgICAgICAgIGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgICAgIGZpZ21hLmZsYXR0ZW4oW3NoYXBlXSk7XG4gICAgICAgICAgICAgICAgICAgIGxheWVyQ291bnQrKztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoc2hhcGUudHlwZSA9PSAnVEVYVCcpIHtcbiAgICAgICAgICAgICAgICAgICAgZmlnbWEuZmxhdHRlbihbc2hhcGVdKTtcbiAgICAgICAgICAgICAgICAgICAgbGF5ZXJDb3VudCsrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBsYXllckNvdW50O1xuICAgIH1cbiAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5sb2coZXJyb3IpO1xuICAgICAgICByZXR1cm4gbGF5ZXJDb3VudDtcbiAgICB9XG59XG5mdW5jdGlvbiByYXN0ZXJpemVTZWxlY3Rpb24oc2VsZWN0aW9uLCBsYXllckNvdW50KSB7XG4gICAgdHJ5IHtcbiAgICAgICAgbGV0IG5ld1NlbGVjdGlvbiA9IFtdO1xuICAgICAgICBzZWxlY3Rpb24uZm9yRWFjaChzaGFwZSA9PiB7XG4gICAgICAgICAgICBpZiAoc2hhcGUudHlwZSA9PSAnR1JPVVAnKSB7XG4gICAgICAgICAgICAgICAgbGV0IGltZ1NjYWxlID0gTWF0aC5taW4oNDAwMCAvIE1hdGgubWF4KHNoYXBlLndpZHRoLCBzaGFwZS5oZWlnaHQpLCA2KTsgLy8gbGltaXQgaXQgdG8gNDAwMHB4XG4gICAgICAgICAgICAgICAgLy8gYWxlcnQoaW1nU2NhbGUpICAgICAgIFxuICAgICAgICAgICAgICAgIGxldCBvcHRpb25zID0ge1xuICAgICAgICAgICAgICAgICAgICBmb3JtYXQ6IFwiUE5HXCIsXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0cmFpbnQ6IHsgdHlwZTogXCJTQ0FMRVwiLCB2YWx1ZTogaW1nU2NhbGUgfVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgbGV0IHNoYXBlVHJhbnNmb3JtID0gc2hhcGUucmVsYXRpdmVUcmFuc2Zvcm07IC8vIHN0b3JlIHRyYW5zZm9ybVxuICAgICAgICAgICAgICAgIGxldCByZW1vdmVUcmFuc2Zvcm0gPSBbWzEsIDAsIHNoYXBlLnhdLCBbMCwgMSwgc2hhcGUueV1dO1xuICAgICAgICAgICAgICAgIHNoYXBlLnJlbGF0aXZlVHJhbnNmb3JtID0gcmVtb3ZlVHJhbnNmb3JtO1xuICAgICAgICAgICAgICAgIHNoYXBlLmV4cG9ydEFzeW5jKG9wdGlvbnMpXG4gICAgICAgICAgICAgICAgICAgIC50aGVuKGltZyA9PiB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGZpZ21hLmNyZWF0ZUltYWdlKGltZykpO1xuICAgICAgICAgICAgICAgICAgICBsZXQgcmVjdCA9IGZpZ21hLmNyZWF0ZVJlY3RhbmdsZSgpO1xuICAgICAgICAgICAgICAgICAgICBzaGFwZS5wYXJlbnQuYXBwZW5kQ2hpbGQocmVjdCk7XG4gICAgICAgICAgICAgICAgICAgIHJlY3QueCA9IHNoYXBlLng7XG4gICAgICAgICAgICAgICAgICAgIHJlY3QueSA9IHNoYXBlLnk7XG4gICAgICAgICAgICAgICAgICAgIHJlY3QucmVsYXRpdmVUcmFuc2Zvcm0gPSBzaGFwZVRyYW5zZm9ybTtcbiAgICAgICAgICAgICAgICAgICAgcmVjdC5uYW1lID0gc2hhcGUubmFtZSArICdfcmFzdGVyaXplJztcbiAgICAgICAgICAgICAgICAgICAgcmVjdC5yZXNpemUoc2hhcGUud2lkdGgsIHNoYXBlLmhlaWdodCk7XG4gICAgICAgICAgICAgICAgICAgIGxldCBmaWxsT2JqID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShyZWN0LmZpbGxzWzBdKSk7XG4gICAgICAgICAgICAgICAgICAgIGZpbGxPYmouZmlsdGVycyA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRyYXN0OiAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgZXhwb3N1cmU6IDAsXG4gICAgICAgICAgICAgICAgICAgICAgICBoaWdobGlnaHRzOiAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgc2F0dXJhdGlvbjogMCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNoYWRvd3M6IDAsXG4gICAgICAgICAgICAgICAgICAgICAgICB0ZW1wZXJhdHVyZTogMCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRpbnQ6IDAsXG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGZpbGxPYmouaW1hZ2VIYXNoID0gZmlnbWEuY3JlYXRlSW1hZ2UoaW1nKS5oYXNoO1xuICAgICAgICAgICAgICAgICAgICBmaWxsT2JqLmltYWdlVHJhbnNmb3JtID0gW1sxLCAwLCAwXSwgWzAsIDEsIDBdXTtcbiAgICAgICAgICAgICAgICAgICAgZmlsbE9iai5zY2FsZU1vZGUgPSBcIkNST1BcIjtcbiAgICAgICAgICAgICAgICAgICAgZmlsbE9iai50eXBlID0gXCJJTUFHRVwiO1xuICAgICAgICAgICAgICAgICAgICBmaWxsT2JqLnNjYWxpbmdGYWN0b3IgPSAwLjUsXG4gICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgZmlsbE9iai5jb2xvcjtcbiAgICAgICAgICAgICAgICAgICAgcmVjdC5maWxscyA9IFtmaWxsT2JqXTtcbiAgICAgICAgICAgICAgICAgICAgbmV3U2VsZWN0aW9uLnB1c2gocmVjdCk7XG4gICAgICAgICAgICAgICAgICAgIHNoYXBlLnJlbGF0aXZlVHJhbnNmb3JtID0gc2hhcGVUcmFuc2Zvcm07XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgbGF5ZXJDb3VudCsrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7IGZpZ21hLmN1cnJlbnRQYWdlLnNlbGVjdGlvbiA9IG5ld1NlbGVjdGlvbjsgfSwgNTApO1xuICAgICAgICByZXR1cm4gbGF5ZXJDb3VudDtcbiAgICB9XG4gICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGVycm9yKTtcbiAgICAgICAgcmV0dXJuIGxheWVyQ291bnQ7XG4gICAgfVxufVxuZnVuY3Rpb24gZ2VuZXJhdGVGcmFtZUltYWdlKCkge1xuICAgIHJldHVybiBfX2F3YWl0ZXIodGhpcywgdm9pZCAwLCB2b2lkIDAsIGZ1bmN0aW9uKiAoKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBsZXQgZmlyc3RTZWxlY3RlZCA9IGZpZ21hLmN1cnJlbnRQYWdlLnNlbGVjdGlvblswXTtcbiAgICAgICAgICAgIGxldCBwYXJlbnRGcmFtZSA9IGZpbmRGcmFtZShmaWdtYS5jdXJyZW50UGFnZS5zZWxlY3Rpb25bMF0pO1xuICAgICAgICAgICAgbGV0IG9wdGlvbnMgPSB7XG4gICAgICAgICAgICAgICAgZm9ybWF0OiBcIlBOR1wiLFxuICAgICAgICAgICAgICAgIGNvbnN0cmFpbnQ6IHsgdHlwZTogXCJTQ0FMRVwiLCB2YWx1ZTogNiB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgcGFyZW50RnJhbWUuZXhwb3J0QXN5bmMob3B0aW9ucylcbiAgICAgICAgICAgICAgICAudGhlbihpbWcgPT4ge1xuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCdoc2FkamZoamthaHNkZicsIGltZyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZpZ21hLmNyZWF0ZUltYWdlKGltZyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGVycm9yKTtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgfSk7XG59XG4vKiogU2FuaXRpemVzIHRoZSBnaXZlbiBkYXRhIHRvIGVuc3VyZSBjb21wYXRpYmlsaXR5IHdpdGggcG9zdE1lc3NhZ2UuICovXG5mdW5jdGlvbiBzYW5pdGl6ZVZhbHVlKGRhdGEsIGtleSkge1xuICAgIGlmICh0eXBlb2YgZGF0YSA9PT0gJ3N5bWJvbCcpIHtcbiAgICAgICAgLy8gQ3VzdG9tIGhhbmRsaW5nIGZvciBzeW1ib2wgdHlwZXMuXG4gICAgICAgIGxldCByZXN1bHRWYWx1ZSA9IGRhdGEudG9TdHJpbmcoKTtcbiAgICAgICAgdmFsdWVXYXJuKCdTeW1ib2wnLCBrZXksIHJlc3VsdFZhbHVlKTtcbiAgICAgICAgcmV0dXJuIHJlc3VsdFZhbHVlO1xuICAgIH1cbiAgICBlbHNlIGlmICh0eXBlb2YgZGF0YSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAvLyBDdXN0b20gaGFuZGxpbmcgZm9yIGZ1bmN0aW9uIHR5cGVzLlxuICAgICAgICBsZXQgcmVzdWx0VmFsdWUgPSBkYXRhLnRvU3RyaW5nKCk7XG4gICAgICAgIHZhbHVlV2FybignRnVuY3Rpb24nLCBrZXksIHJlc3VsdFZhbHVlKTtcbiAgICAgICAgcmV0dXJuIHJlc3VsdFZhbHVlO1xuICAgIH1cbiAgICBlbHNlIGlmIChkYXRhIGluc3RhbmNlb2YgUmVnRXhwKSB7XG4gICAgICAgIC8vIFJlZ0V4cCB2YWx1ZXMgYXJlIG5vdCBmdWxseSBzdXBwb3J0ZWQgaW4gcG9zdE1lc3NhZ2UsIHNvIGNvbnZlcnRpbmcgdG8gc3RyaW5nIGlzIHRoZSBzYWZlc3Qgcm91dGUuXG4gICAgICAgIGxldCByZXN1bHRWYWx1ZSA9IGRhdGEudG9TdHJpbmcoKTtcbiAgICAgICAgdmFsdWVXYXJuKCdSZWdFeHAnLCBrZXksIHJlc3VsdFZhbHVlKTtcbiAgICAgICAgcmV0dXJuIHJlc3VsdFZhbHVlO1xuICAgIH1cbiAgICBlbHNlIGlmIChkYXRhID09PSBudWxsIHx8XG4gICAgICAgIGRhdGEgPT09IHVuZGVmaW5lZCB8fFxuICAgICAgICB0eXBlb2YgZGF0YSA9PT0gJ2Jvb2xlYW4nIHx8XG4gICAgICAgIHR5cGVvZiBkYXRhID09PSAnbnVtYmVyJyB8fFxuICAgICAgICB0eXBlb2YgZGF0YSA9PT0gJ2JpZ2ludCcgfHxcbiAgICAgICAgdHlwZW9mIGRhdGEgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIC8vIFJldHVybiB0aGUgdmFsdWUgYXMtaXMgZm9yIHByaW1pdGl2ZSB0eXBlcy5cbiAgICAgICAgcmV0dXJuIGRhdGE7XG4gICAgfVxuICAgIGVsc2UgaWYgKGRhdGEgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlciB8fFxuICAgICAgICBkYXRhIGluc3RhbmNlb2YgRGF0YVZpZXcgfHxcbiAgICAgICAgZGF0YSBpbnN0YW5jZW9mIERhdGUgfHxcbiAgICAgICAgZGF0YSBpbnN0YW5jZW9mIE1hcCB8fFxuICAgICAgICBkYXRhIGluc3RhbmNlb2YgU2V0IHx8XG4gICAgICAgIGRhdGEgaW5zdGFuY2VvZiBFcnJvciB8fFxuICAgICAgICBkYXRhIGluc3RhbmNlb2YgSW50OEFycmF5IHx8XG4gICAgICAgIGRhdGEgaW5zdGFuY2VvZiBVaW50OEFycmF5IHx8XG4gICAgICAgIGRhdGEgaW5zdGFuY2VvZiBVaW50OENsYW1wZWRBcnJheSB8fFxuICAgICAgICBkYXRhIGluc3RhbmNlb2YgSW50MTZBcnJheSB8fFxuICAgICAgICBkYXRhIGluc3RhbmNlb2YgVWludDE2QXJyYXkgfHxcbiAgICAgICAgZGF0YSBpbnN0YW5jZW9mIEludDMyQXJyYXkgfHxcbiAgICAgICAgZGF0YSBpbnN0YW5jZW9mIFVpbnQzMkFycmF5IHx8XG4gICAgICAgIGRhdGEgaW5zdGFuY2VvZiBGbG9hdDMyQXJyYXkgfHxcbiAgICAgICAgZGF0YSBpbnN0YW5jZW9mIEZsb2F0NjRBcnJheSAvL3x8XG4gICAgLy8gICBkYXRhIGluc3RhbmNlb2YgQmlnSW50NjRBcnJheSB8fCAvLyBFUzIwMjBcbiAgICAvLyAgIGRhdGEgaW5zdGFuY2VvZiBCaWdVaW50NjRBcnJheSAvLyBFWDIwMjBcbiAgICApIHtcbiAgICAgICAgLy8gUmV0dXJuIHRoZSB2YWx1ZSBhcy1pcyBmb3Igc3VwcG9ydGVkIHR5cGVzLlxuICAgICAgICByZXR1cm4gZGF0YTtcbiAgICB9XG4gICAgZWxzZSBpZiAoQXJyYXkuaXNBcnJheShkYXRhKSkge1xuICAgICAgICAvLyBSZWN1cnNpdmVseSBwcm9jZXNzIGVhY2ggZWxlbWVudCBvZiB0aGUgYXJyYXkuXG4gICAgICAgIHJldHVybiBkYXRhLm1hcCh2YWx1ZSA9PiBzYW5pdGl6ZVZhbHVlKHZhbHVlKSk7XG4gICAgfVxuICAgIGVsc2UgaWYgKHR5cGVvZiBkYXRhID09PSAnb2JqZWN0Jykge1xuICAgICAgICAvLyBDcmVhdGUgYSBuZXcgb2JqZWN0IHRvIGFjY3VtdWxhdGUgb25seSBzdXBwb3J0ZWQgdmFsdWVzLlxuICAgICAgICBjb25zdCByZXN1bHQgPSB7fTtcbiAgICAgICAgZm9yIChjb25zdCBba2V5LCB2YWx1ZV0gb2YgT2JqZWN0LmVudHJpZXMoZGF0YSkpIHtcbiAgICAgICAgICAgIHJlc3VsdFtrZXldID0gc2FuaXRpemVWYWx1ZSh2YWx1ZSwga2V5KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgY29uc29sZS53YXJuKGBzYW5pdGl6ZVZhbHVlOiBVbnN1cHBvcnRlZCB0eXBlICR7KHR5cGVvZiBkYXRhKX0gZW5jb3VudGVyZWQ6YCwgZGF0YSk7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBmdW5jdGlvbiB2YWx1ZVdhcm4odHlwZU5hbWUsIGtleSwgdmFsdWUpIHtcbiAgICAgICAgY29uc29sZS53YXJuKGBzYW5pdGl6ZVZhbHVlOiBVbnN1cHBvcnRlZCB2YWx1ZSBvZiB0eXBlIFwiJHt0eXBlTmFtZX1cIiBlbmNvdW50ZXJlZCBmb3Iga2V5IFwiJHtrZXl9XCIuIENvbnZlcnRpbmcgdG8gc3RyaW5nOiAke3ZhbHVlfWApO1xuICAgIH1cbn1cbiJdLCJzb3VyY2VSb290IjoiIn0=