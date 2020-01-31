/*jshint esversion: 6, asi: true*/
var versionNumber = 0.6;
var frameData, layers, hasArtboard, layerCount, layerData;
export function convert (data) {
    hasArtboard = false;
    layerCount = 0;
    // var vm.imageIdList = [];

    // console.log('tester', vm.imageUrlList);
    var layerData = filterTypes(data);
    layerData[0].layerCount = layerCount;
console.log('layerData', layerData);

    return layerData;
}


function filterTypes(figmaData, opt_parentFrame, boolType) {
    var aeuxData = [];
    // var parentFrame = opt_parentFrame || {};
    var parentFrame = opt_parentFrame || null;
    

    if (!hasArtboard) {
        // console.log('artboard');
        
        aeuxData.push(storeArtboard(figmaData));
        frameData = figmaData;      // store the whole frame data
    }
    layers = figmaData.children;
    // console.log(figmaData);

    layers.forEach(layer => {
        // console.log(layer.type);
        
        if (layer.visible === false) { return; }         // skip layer if hidden
        // console.log(layer.name, layer.type);
        if (layer.type == "GROUP" || layer.type == "FRAME" || layer.type == "AUTOLAYOUT") {            
            aeuxData.push(getGroup(layer, parentFrame));
        }
        if (layer.fillGeometry && layer.fillGeometry.length > 1) { layer.type = "BOOLEAN_OPERATION" }         // overwrite the layer type

        if (layer.type == "BOOLEAN_OPERATION") {
            layer = getBoolean(layer, parentFrame, boolType);
            if (layer) {        // skip if no layers in the compound
                aeuxData.push(layer);
            } else { return; }
        }
        if (layer.type == "RECTANGLE" ||
            layer.type == "ELLIPSE" ||
            layer.type == "VECTOR" ||
            layer.type == "LINE" ||
            layer.type == "STAR" ||
            layer.type == "POLYGON") {
              aeuxData.push(getShape(layer, parentFrame, boolType));
            layerCount++;
        }
        if (layer.type == "INSTANCE" || layer.type == "COMPONENT") {    // instances and master symbols
            // console.log(layer.name);
            // console.log('SYMBOL');
            
            aeuxData.push(getComponent(layer, parentFrame));
            layerCount++;
        }
        if (layer.type == "TEXT") {
            aeuxData.push(getText(layer, parentFrame));
            layerCount++;
        }
    });
    // console.log(aeuxData);
    
  return aeuxData;
}

//// get layer data: SHAPE
function getShape(layer, parentFrame, boolType) {
    var layerType = getShapeType(layer);
    var frame = getFrame(layer, parentFrame);
    var path = getPath(layer, frame);
    // console.log('parentFrame', layer.name, parentFrame)
    // console.log('frame', layer.name, frame)

    if (path == 'multiPath') {
        console.log('multipath');
        
        return getBoolean(layer, parentFrame, true);
    }
    // console.log(layer.relativeTransform[0][0]);

	var layerData =  {
        type: layerType,
		name: layer.name,
		id: layer.id,
		frame: frame,
		// absoluteBoundingBox: layer.absoluteBoundingBox,
        fill: getFills(layer),
        stroke: getStrokes(layer),
        isVisible: (layer.visible !== false),
		path: path,
		roundness: Math.round(layer.cornerRadius) || 0,
		// roundness: (layer.type == 'RECTANGLE') ? Math.round(layer.cornerRadius) || 0 : 0,
		opacity: layer.opacity*100 || 100,
        rotation: getRotation(layer),
		flip: getFlipMultiplier(layer),
        blendMode: getLayerBlending(layer.blendMode),
        booleanOperation: boolType || getBoolType(layer),
        isMask: layer.isMask,
        // for polygons and stars
        pointCount: layer.pointCount || null,     
        isStar: (layer.type == 'STAR') ? true : false,
        outerRad: Math.max(frame.width, frame.height) / 2,
        innerRad: layer.innerRadius || null,
        polyScale: getPolyscale(layer),
  };
//   console.log(layerData.roundness);
  

  /// if fill is an image and should return that instead of a shape
  if (layerData.fill != null && layerData.fill.type == 'Image') {
      return layerData.fill;
  }

  getEffects(layer, layerData);

//   console.log(layerData);
  return layerData;																// output a string of the collected data
}
//// get layer data: TEXT
function getText(layer, parentFrame) {
    var frame = {};
    var flip = getFlipMultiplier(layer)

    var tempFrame = getFrame(layer, parentFrame);
    var lineHeight = getLineHeight(layer);
    frame = {
        width: layer.width * 1.02,
        height: layer.height,
        x: tempFrame.x,
        y: tempFrame.y,
    };
    // console.log(frame.x);
    
	var layerData =  {
        type: 'Text',
        kind: 'Area',
        name: layer.name.replace(/[\u2028]/g, ' '),
        stringValue: getTextProps(layer),
        id: layer.id,
        frame: frame,
        isVisible: (layer.visible !== false),
        opacity: layer.opacity*100 || 100,
        textColor: getFills(layer)[0].color || getFills(layer)[0].gradient.points[0].color,
        fill: null,
        stroke: getStrokes(layer),
        blendMode: getLayerBlending(layer.blendMode),
        // fontName: layer.style.fontPostScriptName,
        fontName: layer.fontName.family.replace(' ', '') + '-' + layer.fontName.style.replace(' ', ''),
        fontSize: layer.fontSize,
        // trackingAdjusted: layer.style.letterSpacing / layer.style.fontSize * 1000,
        trackingAdjusted: getTracking(layer),
        // tracking: layer.letterSpacing.value,        // xxx could be percent
        justification: getJustification(layer),
        lineHeight: lineHeight,
        flip: flip,
        rotation: getRotation(layer),
        isMask: layer.isMask,
    };

    getEffects(layer, layerData);

    return layerData;



    function getTextProps(layer) {        
        var text = layer.characters.replace(/[\u2028]/g, '\n');        
        // var transformVal = 0;
        // var transformVal = layer.sketchObject.styleAttributes()["MSAttributedStringTextTransformAttribute"];

        if (layer.textCase == 'UPPER') { text = text.toUpperCase(); }
        if (layer.textCase == 'LOWER') { text = text.toLowerCase(); }
        if (layer.textCase == 'TITLE') { text = toTitleCase(text); }

        return text;

        function toTitleCase(str) {
            return str.replace(
                /\w\S*/g,
                function(txt) {
                    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
                }
            );
        }
    }

    function getJustification(layer) {
        var justify = layer.textAlignHorizontal;

        if (justify == 'RIGHT') { return 1 }
        if (justify == 'CENTER') { return 2 }
        if (justify == 'JUSTIFIED') { return 3 }

        return 0;
    }
    function getLineHeight(layer) {
        if (layer.lineHeight.unit == 'PIXELS') {
            return layer.lineHeight.value;
        } else if (layer.lineHeight.unit == 'PERCENT') {
            return layer.fontSize * (layer.lineHeight.value / 100); 
        } else {
            return null;
        }
    }
    function getTracking(layer) {
        if (layer.letterSpacing.unit == 'PIXELS') {
            return layer.fontSize * layer.letterSpacing.value * 3.9;
        } else if (layer.lineHeight.unit == 'PERCENT') {
            return layer.letterSpacing.value * 10;
        } else {
            return 0;
        }
    }
}
//// get layer data: GROUP
function getGroup(layer, parentFrame) {
    // var flip = getFlipMultiplier(layer);
    var frame = getFrame(layer);
    var calcFrame = getFrame(layer, parentFrame);
    // var stackOffset = (parentFrame == null) ? frame : parentFrame;
    // console.log('parentFrame', layer.name, parentFrame)
    // console.log('group frame', layer.name, stackOffset);
    
	var layerData =  {
        type: 'Group',
		name: '\u25BD ' + layer.name,
		id: layer.id,
		frame: calcFrame,
        isVisible: (layer.visible !== false),
		opacity: Math.round(layer.opacity * 100) || 100,
		// rotation: getRotation(layer) * (flip[1]/100),
		rotation: getRotation(layer),
		blendMode: getLayerBlending(layer.blendMode),
        flip: getFlipMultiplier(layer),
        // hasClippingMask: false,
        shouldBreakMaskChain: true,
        layers: [],
    // layers: filterTypes(layer, frame),
    };
    if (layer.type == 'AUTOLAYOUT') {
        layerData.layers = filterTypes(layer)
        // console.log('background', getShape(layer));
        
        layerData.layers.unshift(getShape(layer, frame))  // add the background of the frame
        layerData.layers[0].type = 'AutoLayoutBG'
    } else {
        layerData.layers = filterTypes(layer, frame)
    }
  getEffects(layer, layerData);
//   console.log(layerData)
  return layerData;
}
//// get layer data: SYMBOL
function getComponent(layer, parentFrame) {
    var frame = getFrame(layer);
    var calcFrame = getFrame(layer, parentFrame);
    console.log('DO IT INSTANCE');
    

	var layerData =  {
        type: 'Component',
        name: layer.name,
        masterId: layer.componentId,
        // masterId: 'override',
        id: layer.id,
        frame: calcFrame,
        // frame: {x: 0, y: 0, width: 100, height: 100},
        isVisible: (layer.visible !== false),
        opacity: layer.opacity*100 || 100,
        blendMode: getLayerBlending(layer.blendMode),
        symbolFrame: layer.masterComponent,
        // symbolFrame: getMasterFrame( layer.componentId ),       // this needs to be the frame of the master
        // bgColor: sketchColorToArray(layer.master.sketchObject.backgroundColor()),
        bgColor: [1,1,1,1],
        rotation: getRotation(layer),
        flip: getFlipMultiplier(layer),
        isMask: layer.isMask,
        // layers: filterTypes(layer, {x: 0, y: 0, width: frame.width, height: frame.height}),
        // layers: filterTypes(layer),
        // layers: filterTypes(layer, frame),
    };
    if (layer.layoutMode !== 'NONE') {
        layerData.layers = filterTypes(layer)
        // console.log('background', getShape(layer));
        
        layerData.layers.unshift(getShape(layer, frame))  // add the background of the frame
        layerData.layers[0].type = 'AutoLayoutBG'
    } else {
        layerData.layers = filterTypes(layer, {x: frame.width/2, y: frame.height/2, width: frame.width, height: frame.height})
        // layerData.layers = filterTypes(layer, frame)
    }

    getEffects(layer, layerData);

    // getOverrides(layer, layerData);
    return layerData;


    /// get text and nested symbol overrides
    function getOverrides(layer, symbolObj) {
        // reset vars
        var overrideList = [];
        var overrides = layer.overrides;

        // loop through each override on the layer
        for (var i = 0; i < overrides.length; i++) {
            var override = overrides[i];
            if (!override.isDefault) {              // has an override
                symbolObj.id = 'override';
                symbolObj.masterId = 'override';

                // DEPRECIATED forced symbol detach
                // if (override.property == 'image') {     // needs to be detatched from master
                //     var detatchedGroup = layer.detach();
                //     overrideList = [];                  // reset the list
                //     i = 0;                              // reset the count
                // }

                // loop through all layers in the symbol
                for (var j = 0; j < symbolObj.layers.length; j++) {
                    var currentLayer = symbolObj.layers[j];
                    //// it is a GROUP ////    recurse deeper
                    if (currentLayer.type == 'Group') {
                        getOverrides(layer, currentLayer);
                        continue;
                    }
                    //// it is a SYMBOL ////
                    if (override.symbolOverride) {
                        if (currentLayer.id == override.path) {      // do ids match?
                            var overrideSymbol = document.getComponentMasterWithID(override.value);
                            currentLayer.name = overrideSymbol.name;
                            currentLayer.masterId = overrideSymbol.id;
                            currentLayer.layers = filterTypes( overrideSymbol );
                        }
                    }
                    //// it is TEXT ////
                    if (currentLayer.id == override.path) {      // do ids match?
                        currentLayer[ override.property ] = override.value;  // replace the text/image value
                    }
                }
            }
        }
    }
    function getMasterFrame(id) {
        var frameObj = {};
        vm.figmaTree.forEach(frame => {
            if (frame.id == id) {
                frameObj = {
                    width: frame.size.x,
                    height: frame.size.y,
                    x: frame.relativeTransform[0][2],
                    y: frame.relativeTransform[1][2],
                };
            }
        });
        return frameObj;
    }
}
//// get layer data: BOOLEAN_OPERATION
function getBoolean(layer, parentFrame, isMultipath) {
    var frame = getFrame(layer, parentFrame);
    var boolType = getBoolType(layer);
    
	var layerData =  {
        type: 'CompoundShape',
		name: layer.name,
		id: layer.id,
        frame: frame,
        fill: getFills(layer),
        stroke: getStrokes(layer),
        isVisible: (layer.visible !== false),
		opacity: Math.round(layer.opacity*100) || 100,
		rotation: getRotation(layer),
		blendMode: getLayerBlending(layer.blendMode),
        flip: [100,100],
        booleanOperation: boolType,
        isMask: layer.isMask,
        // hasClippingMask: false,
        // shouldBreakMaskChain: true,
        // layers: filterTypes(layer, frame, boolType),
    };

    if (isMultipath) {
        console.log('get that multipath');        
        
        layerData.layers = getCompoundPaths(layer.vectorPaths[0].data, layer);
    } else {
        // console.log('run getCompoundShapes' )
        // layerData.layers = getCompoundShapes(layer.children, boolType);            /// test if paths.lenght > 1
        // try {
            layerData.layers = filterTypes(layer, frame, boolType);
        // } catch (error) {
        //     layerData.layers = getBoolean(layer, frame, boolType)
        // }
    }
    getEffects(layer, layerData);
    // console.log(layerData)
  return layerData;
}
// depreceiated
// function getBooleanOLD(layer, parentFrame, isMultipath) {
//     // console.log('getBoolean');
//     // var flip = getFlipMultiplier(layer);
//     var frame = getFrame(layer, parentFrame);
//     // console.log(layer.name, getBoolType(layer))
//     var boolType = getBoolType(layer);
//     var path = getPath(layer, frame);
//     console.log(path);
    
//     if (path == 'multiPath') {
//         // console.log('bool multipath');
//         isMultipath = true;
//     }


// 	var layerData =  {
//         type: 'CompoundShape',
// 		name: layer.name,
// 		id: layer.id,
//         frame: frame,
//         fill: getFills(layer),
//         stroke: getStrokes(layer),
//         isVisible: (layer.visible !== false),
// 		opacity: Math.round(layer.opacity*100) || 100,
// 		rotation: getRotation(layer),
// 		blendMode: getLayerBlending(layer.blendMode),
//         flip: [100,100],
//         booleanOperation: boolType,
//         // flip: getFlipMultiplier(layer),
//         isMask: layer.isMask,
//     };

//     getEffects(layer, layerData);

//     if (isMultipath) {        
//         layerData.layers = getCompoundPaths(layer.fillGeometry[0].path, layer);
//     } else {
//         // console.log('run getCompoundShapes' )
//         // layerData.layers = getCompoundShapes(layer.children, boolType);            /// test if paths.lenght > 1
//         try {
//             layerData.layers = filterTypes(layer, frame, boolType);
//         } catch (error) {
//             layerData.layers = getBoolean(layer, frame, boolType)
//         }
//     }

//     // console.log('bool', layerData);
//     if (layerData.layers.length < 1) { return null }
//     return layerData;
// }
//// get layer data: COMPOUND SHAPE
function getCompoundShapes(layers, boolType, isMultipath) {
    var layerList = [];
    var layerCount = 0;

    try {
        layerCount = layers.length;
    } catch (e) {
        // console.log('catch')
    }

    /// loop through all nested shapes
    for (var i = 0; i < layerCount; i++) {
        var layer = layers[i];
        var frame = getFrame(layer);
        var path = getPath(layer, frame);
        // console.log(path)
        // if (path == 'multiPath') {
        //     return getBoolean(layer, null, true);
        // }

        // var flip = getFlipMultiplier(layer);
        layerList.push({
            type: 'CompoundShape',
            name: layer.name,
    		id: layer.id,
    		frame: getFrame(layer),
            isVisible: (layer.visible !== false),
            // path: path,
            roundness: Math.round(layer.cornerRadius) || 0,
            flip: getFlipMultiplier(layer),
            rotation: getRotation(layer),
            booleanOperation: getBoolType,
            // layers: filterTypes(layer, frame),
        });



        if (layer.type == 'BOOLEAN_OPERATION') {
            if (isMultipath) {
                console.log('multipath smarts')
                layerList[layerList.length-1].layers = getCompoundPaths(layer.fillGeometry[0].path, layer);
            } else {
                layerList[layerList.length-1].layers = getCompoundShapes(layer.children, boolType);            /// test if paths.lenght > 1
            }
        } else {
            console.log(layer)
            layerList[layerList.length-1].layers = filterTypes(layer, frame, boolType);
        }
    }
    // console.log(layerList)
    return layerList;
}
function getCompoundPaths(paths, layer) {
    console.log(paths);
    
    var layerList = [];
    // console.log(layerList)
    // var pathList = paths.match(/M-?\d*(\.\d+)?/);
    var pathList = paths.match(/M.*?((?=M)|$)/g);
    // var pathList = paths.match(/(M|(?<=Z)).*?((?=M)|$)/g);
    // var pathList = paths.split(/(ZM)/);
    // console.log(pathList)
    // console.log('layer.absoluteBoundingBox', layer.absoluteBoundingBox);

    /// loop through all nested shapes
    for (var i = 0; i < pathList.length; i++) {
    //     var layer = layers[i];
    //     // var flip = getFlipMultiplier(layer);
        layerList.push({
            type: 'Path',
            name: layer.name,
    		id: null,
    		frame: {
                width: 100,
                height: 100,
                x: 0,
                y: 0,
            },
    //         isVisible: (layer.visible !== false),
            path: getPath(pathList[i], layer.absoluteBoundingBox, 'multiPath'),
    //         roundness: Math.round(layer.cornerRadius) || 0,
            flip: [100,100],
            rotation: 0,
            booleanOperation: getBoolType(layer),
        });
// console.log(layer.name, layerList);
    //     console.log(layers[i]);
    }
// console.log(layerList)
    return layerList;
}
function getEffects(layer, layerData) {
    // console.log(layer);
    
    layerData.shadow = [];
    layerData.innerShadow = [];
    layerData.blur = [];

    if (layer.effects.length > 0) {
        for (var i = 0; i < layer.effects.length; i++) {
            var effect = layer.effects[i];

            if (effect.type == 'DROP_SHADOW') {
                if (effect.visible) {
                    layerData.shadow.push({
        				color: colorObjToArray(effect),
        				position: [effect.offset.x, effect.offset.y],
        				blur: effect.radius,
        				spread: 0
        			});
                }
                continue;
            }
            if (effect.type == 'INNER_SHADOW') {
                if (effect.visible) {
                    layerData.innerShadow.push({
        				color: colorObjToArray(effect),
        				position: [effect.offset.x, effect.offset.y],
        				blur: effect.radius,
        				spread: 0
        			});
                }
            }
            if (effect.type == 'LAYER_BLUR') {
                if (effect.visible) {
                    layerData.blur.push({
                        radius: effect.radius,
                        type: 0,
        			});
                }
            }
            if (effect.type == 'BACKGROUND_BLUR') {
                // adjustment layer
            }
        }
    }

    if (layerData.shadow.length == 0)       { layerData.shadow = null };
    if (layerData.innerShadow.length == 0)  { layerData.innerShadow = null };
    if (layerData.blur.length == 0)         { layerData.blur = null };
}
function getBoolType (layer) {
    var boolType = layer.booleanOperation;
    // console.log(layer.name, layer.booleanOperation)

    switch (boolType) {
        case 'ADD':
            return 0;
        case 'SUBTRACT':
            return 1;
        case 'INTERSECT':
            return 2;

        default:
            return 3;
    }
}
function getFrame(layer, parentFrame) {  
  var matrix = layer.relativeTransform;
  var isRotated = matrix[0][0] != 1;
  var isFlipped = (matrix[0][0] < 0 && matrix[1][1] > 0) || (matrix[0][0] > 0 && matrix[1][1] < 0);
  var flippedHorizontal = matrix[0][0] < 0 && matrix[1][1] > 0;
  var flippedVertical = matrix[0][0] > 0 && matrix[1][1] < 0;
  // console.log('flippedHorizontal:', flippedHorizontal);
  // console.log('flippedVertical:', flippedVertical);
  
  
  var offset = [0,0];
  if (parentFrame) {
    // if (layer.type !== 'GROUP') {
      // offset = [layer.width/2, layer.height/2];
      // offset = [layer.width/2, parentFrame.y - parentFrame.height/2];
      offset = [parentFrame.x - parentFrame.width/2, parentFrame.y - parentFrame.height/2];
      // console.log('not a group: ', layer.name);
    // } else {
    //   console.log('do some math', layer.name );
    //   // offset = [100, 100]
      
    //   // offset = [parentFrame.x - layer.width/2, parentFrame.y - parentFrame.height/2];
    // }
  }
  // console.log(offset);
  
  // var offset = (parentFrame && layer.type !== 'GROUP') ? [parentFrame.x - parentFrame.width/2, parentFrame.y - parentFrame.height/2] : [0,0];
  
  // console.log('parentFrame', layer.name, parentFrame);
  // console.log('offset', layer.name, offset);
  

  var width = layer.width || 0;
  var height = layer.height || 0;
  // var x = matrix[0][2] - offset[0];
  // var y = matrix[1][2] - offset[1];
  // var x = (matrix[0][2] * matrix[0][0]) + (matrix[1][2] * matrix[1][0]);
  // var y = -( (matrix[0][2] * matrix[1][0]) - (matrix[1][2] * matrix[0][0]) );

  // find the center of the shape
  var hypot = Math.sqrt(width/2 * width/2 + height/2 * height/2);
  var angle = layer.rotation * (Math.PI/180);

  var vertOffset = 0;
  // var horizOffset = 0;
  if (flippedHorizontal) { 
    // if (angle < Math.abs()) {
      offset[1] -= height;
    // } else {
      // horizOffset = -width;
      // angle = - angle;
    // }
  // }
  // if (flippedVertical) { 
  //   vertOffset = -height;
  }
  
  // var x = layer.x;
  // var y = layer.y;
  var x = layer.x + Math.cos(Math.atan2(height, width) - angle) * hypot - offset[0];
  var y = layer.y + Math.sin(Math.atan2(height, width) - angle) * hypot - offset[1];
  

  // if (isRotated || isFlipped) {
  //   // console.log(layer, 'calc');
  //   // console.log('x', x);
    
  //   if (matrix[0][0] < 0) { x -= width; } // flipped horizontal
  //   if (matrix[1][1] < 0) { y -= height; } // flipped vertical
  //   // x = layer.absoluteTransform[0] - width/2 - offset[0];
  //   // y = layer.absoluteTransform[1] - height/2 - offset[1];
  //   // x = layer.absoluteTransform[0] - frameData.absoluteTransform[0] + layer.absoluteTransform.width/2 - width/2 - offset[0];
  //   // y = layer.absoluteTransform[1] - frameData.absoluteTransform[1] + layer.absoluteTransform.height/2 - height/2 - offset[1];
  //   // x = layer.absoluteTransform[0][2] - frameData.absoluteTransform[0][2];
  //   // y = layer.absoluteTransform[1][2] - frameData.absoluteTransform[1][2];
  //   // console.log(layer.absoluteTransform);
  //   // console.log(frameData.absoluteTransform);
    
  //   // x = layer.absoluteTransform[0][2] - frameData.absoluteTransform[0][2] + layer.width/2 - layer.x - offset[0];
  //   // y = layer.absoluteTransform[1][2] - frameData.absoluteTransform[1][2] + layer.height/2 - layer.y - offset[1];
  // }

    // console.log(layer.name, offset);
    return {
        width: width,
        height: height,
        x: x,
        y: y,
    };
}
function frameOffset(boundingBox) {
    return {
        width: boundingBox.width,
        height: boundingBox.height,
        x: boundingBox.x - frameOffset.x,
        y: boundingBox.y - frameOffset.y,
    };
}
//// get artboard data
function storeArtboard(data) {
    var bgColor = colorObjToArray(data.backgrounds);
    if (!bgColor || bgColor[3] < 0.0000001) { bgColor = [1,1,1,1] }

    var artboardObj = {
        type: "Artboard",
        aeuxVersion: versionNumber,
        hostApp: "Figma",
        name: data.name,
        bgColor: bgColor,
        size: [data.width, data.height],
        images: [],
    };

    frameOffset.x = data.absoluteTransform[0][2];
    frameOffset.y = data.absoluteTransform[1][2];

  /// tells filterTypes() this doesn't need to run again
    hasArtboard = true;

    return artboardObj;
}

//// get layer data: FILL
function getFills(layer) {
    // console.log('getFills');
    
    // /// get layer style object
    // var style = layer.sketchObject.style();

    // /// check if the layer has at least one fill
	// var hasFill = ( style.firstEnabledFill() ) ? true : false;

    // if (hasFill) {
    var fillData = [];
    var fills = layer.fills;
    var size = [layer.width, layer.height];

        // loop through all fills
        for (var i = 0; i < fills.length; i++) {
            var fill = fills[i];

            // add fill to fillProps only if fill is enabled
            if (fill.visible !== false) {
                var fillObj = {}
                var fillType = getFillType(fill.type);   /// find type and if a gradient get the grad type
                // fill is a gradient
                if (fillType[0] > 0) {
                    var gradType = fillType[1];
                    
                    fillObj = {
                        type: 'gradient',
                        startPoint: [-0.5 * layer.width, -0.5 * layer.height],
                        endPoint: [0.5 * layer.width, 0.5 * layer.height],
                        // startPoint: [-fill.gradientTransform[1][2] * layer.width,
                        //         (-0.5-fill.gradientTransform[0][2]) * layer.height],
                        // endPoint:   [0,0],
                        // endPoint:   [fill.gradientTransform[1][0],
                        //              fill.gradientTransform[1][1]],
                        gradType:  gradType,
                        gradient: getGradient(fill.gradientStops),
                        opacity: 100,
                        blendMode: getShapeBlending( fill.blendMode ),
                    }
                    // console.log(fill.gradientTransform);
                    
                    // console.log('FIRST Transform',
                    //     [fill.gradientTransform[0][0].toFixed(2), fill.gradientTransform[0][1].toFixed(2), -fill.gradientTransform[0][2].toFixed(2)]
                    // );
                    // console.log('SECOND Transform',
                    //     [fill.gradientTransform[1][0].toFixed(2), fill.gradientTransform[1][1].toFixed(2), -fill.gradientTransform[1][2].toFixed(2)]
                    // );
                    // console.log('translate',
                    //     [fillObj.startPoint[0].toFixed(2), fillObj.startPoint[1].toFixed(2)]
                    // );
                    // console.log('point 01',
                    //     [fillObj.endPoint[0].toFixed(2), fillObj.endPoint[1].toFixed(2)]
                    // );
                    
                // fill is an image or texture
                } else if (fill.type == 'IMAGE') {
                    fillData = getImageFill(layer, fill);
                    break;
                // fill is a solid
                } else {                    
                    var color = colorObjToArray(fill);                    
                    
                    fillObj = {
    					type: 'fill',
    					enabled: fill.visible !== false,
                        color: color,
                        opacity: color[3] * 100,
    					// opacity: (color) ? 100 : Math.round(color[3] * 100),
    					blendMode: getShapeBlending( fill.blendMode ),
    				}
                }

                // add obj string to array
				fillData.push(fillObj);
			}
		}
		return fillData;
	// } else {
	// 	return null;
	// }
}
//// get layer data: IMAGE
function getImageFill(layer) {

  console.log('getImageFill');
	var layerData =  {
    type: 'Image',
    name: layer.name,
    id: layer.id.replace(/:/g, '-'),
    frame: getFrame(layer),
    isVisible: (layer.visible !== false),
    opacity: layer.opacity*100 || 100,
    blendMode: getLayerBlending(layer.blendMode),
    isMask: layer.isMask,
    rotation: getRotation(layer),
  };

    // vm.imageIdList.push(layer.id);

    return layerData;
}
//// get layer data: STROKE
function getStrokes(layer) {
    /// get layer style object
    // var style = layer.sketchObject.style();

    // /// check if the layer has at least one stroke
    // var hasStroke = ( style.firstEnabledstroke() ) ? true : false;

	// if (hasStroke) {
        var strokeData = [];
        var strokes = layer.strokes;
        var size = [layer.width, layer.height];

        // loop through all strokes
        for (var i = 0; i < strokes.length; i++) {
            var stroke = strokes[i];
            if (stroke.visible !== false) {
                var strokeObj = {}
                var fillType = getFillType(stroke.type);   /// find type and if a gradient get the grad type
                // stroke is a gradient
                if (fillType[0] > 0) {
                    var gradType = fillType[1];

                    strokeObj = {
                        type: 'gradient',
                        startPoint: [-0.5 * layer.width, -0.5 * layer.height],
                        endPoint: [0.5 * layer.width, 0.5 * layer.height],
                        // startPoint: [stroke.gradientTransform[0][0] * size[0] - size[0]/2,
                        //              stroke.gradientTransform[0][1] * size[1] - size[1]/2],
                        // endPoint:   [stroke.gradientTransform[1][0] * size[0] - size[0]/2,
                        //              stroke.gradientTransform[1][1] * size[1] - size[1]/2],
                        gradType:  gradType,
                        gradient: getGradient(stroke.gradientStops),
        				opacity: 100,
        				width: layer.strokeWeight,
        				cap: getCap(layer),
        				join: getJoin(layer),
                        strokeDashes: layer.dashPattern,
                        blendMode: getShapeBlending( stroke.blendMode ),
        			}
                // stroke is a solid
                } else {                    
                    var color = colorObjToArray(stroke);
                    strokeObj = {
                        type: 'fill',
                        enabled: stroke.visible !== false,
        				color: color,
        				opacity: color[3] * 100,
        				width: layer.strokeWeight,
        				cap: getCap(layer),
        				join: getJoin(layer),
                        strokeDashes: layer.dashPattern,
                        blendMode: getShapeBlending( stroke.blendMode ),
        			}
                }

            // add obj string to array
			strokeData.push(strokeObj);
		}
	}
		return strokeData;															// return array of all strokes
    function getCap(layer) {
        if (layer.strokeCap == 'ROUND') {
            return 1;
        }
        if (layer.strokeCap == 'SQUARE') {
            return 2;
        }
        return 0;
    }
    function getJoin(layer) {
        if (layer.strokeJoin == 'ROUND') {
            return 1;
        }
        if (layer.strokeJoin == 'BEVEL') {
            return 2;
        }
        return 0;
    }
}
//// get layer data: GRADIENT
function getGradient(grad) {
    var gradObj = {
        length: grad.length,
        points: []
    };

    for (var i = 0; i < gradObj.length; i++) {
        var colorArr = colorObjToArray(grad[i]);
        gradObj.points.push({
            color: colorArr,
            midPoint: 0.5,
            opacity: colorArr[3],
            rampPoint: grad[i].position,
        });
    }
    return gradObj;
}

//// get layer data: SHAPE TYPE
function getShapeType(layer) {
    if ( layer.type == 'RECTANGLE' ) { return 'Rect' }
    if ( layer.type == 'ELLIPSE' ) { return 'Ellipse' }
    if ( layer.type == 'STAR' || layer.type == 'POLYGON') { return 'Star' }
    return 'Path';
}
//// get layer data: SHAPE TYPE
function getFillType(type) {
    var typeList = [];

    if (type.search(/gradient/i) > -1) {
        typeList.push(1);       // it's a gradient
        if (type == 'GRADIENT_LINEAR') {
            typeList.push(0);   // it's a linear gradient
        } else if (type == 'GRADIENT_RADIAL') {
            typeList.push(1);   // it's a radial gradient
        } else {
            typeList.push(2);   // it's a linear or anything else
        }
    } else {
        typeList.push(0);       // it's a solid
    }

    return typeList;
}
//// checks for non-uniform scaling of parametric polygons and stars
function getPolyscale(layer) {
  var polyScale = [100, 100];
  var w = layer.width;
  var h = layer.height;
  if (w < h) { polyScale[0] = w/h * 100; }
  if (h < w) { polyScale[1] = h/w * 100; }

  return polyScale;
}

//// convert color obj to array
function colorObjToArray(colorObj) {
    // console.log(colorObj);
    
    var c = (colorObj.length > 0) ? colorObj[0] : colorObj;
    var alpha = c.opacity || c.color.a || 1;

    if (c.color.r === undefined) { return null }
    
    return [c.color.r, c.color.g, c.color.b, alpha];
}

//// return enumerated layer blending mode
function getLayerBlending(mode) {
    var aeBlendMode;

    switch (mode) {
        case 'DARKEN':
            aeBlendMode = 'BlendingMode.DARKEN';
            break;
        case 'MULTIPLY':
            aeBlendMode = 'BlendingMode.MULTIPLY';
            break;
        case 'LINEAR_BURN':
            aeBlendMode = 'BlendingMode.LINEAR_BURN';
            break;
        case 'COLOR_BURN':
            aeBlendMode = 'BlendingMode.COLOR_BURN';
            break;
        case 'LIGHTEN':
            aeBlendMode = 'BlendingMode.LIGHTEN';
            break;
        case 'SCREEN':
            aeBlendMode = 'BlendingMode.SCREEN';
            break;
        case 'LINEAR_DODGE':
            aeBlendMode = 'BlendingMode.LINEAR_DODGE';
            break;
        case 'COLOR_DODGE':
            aeBlendMode = 'BlendingMode.COLOR_DODGE';
            break;
        case 'OVERLAY':
            aeBlendMode = 'BlendingMode.OVERLAY';
            break;
        case 'SOFT_LIGHT':
            aeBlendMode = 'BlendingMode.SOFT_LIGHT';
            break;
        case 'HARD_LIGHT':
            aeBlendMode = 'BlendingMode.HARD_LIGHT';
            break;
        case 'DIFFERENCE':
            aeBlendMode = 'BlendingMode.DIFFERENCE';
            break;
        case 'EXCLUSION':
            aeBlendMode = 'BlendingMode.EXCLUSION';
            break;
        case 'HUE':
            aeBlendMode = 'BlendingMode.HUE';
            break;
        case 'SATURATION':
            aeBlendMode = 'BlendingMode.SATURATION';
            break;
        case 'COLOR':
            aeBlendMode = 'BlendingMode.COLOR';
            break;
        case 'LUMINOSITY':
            aeBlendMode = 'BlendingMode.LUMINOSITY';
            break;
        default: aeBlendMode = 'BlendingMode.NORMAL';
    }
    return aeBlendMode;
}

//// return integer layer blending mode
function getShapeBlending(mode) {
    var aeBlendMode;

    switch (mode) {
        case 'DARKEN':
            aeBlendMode = 3;
            break;
        case 'MULTIPLY':
            aeBlendMode = 4;
            break;
        case 'COLOR_BURN':
            aeBlendMode = 5;
            break;
        case 'LINEAR_BURN':
            aeBlendMode = 6;
            break;
        case 'LIGHTEN':
            aeBlendMode = 9;
            break;
        case 'SCREEN':
            aeBlendMode = 10;
            break;
        case 'COLOR_DODGE':
            aeBlendMode = 11;
            break;
        case 'LINEAR_DODGE':
            aeBlendMode = 12;
            break;
        case 'OVERLAY':
            aeBlendMode = 15;
            break;
        case 'SOFT_LIGHT':
            aeBlendMode = 16;
            break;
        case 'HARD_LIGHT':
            aeBlendMode = 17;
            break;
        case 'DIFFERENCE':
            aeBlendMode = 23;
            break;
        case 'EXCLUSION':
            aeBlendMode = 24;
            break;
        case 'HUE':
            aeBlendMode = 26;
            break;
        case 'SATURATION':
            aeBlendMode = 27;
            break;
        case 'COLOR':
            aeBlendMode = 28;
            break;
        case 'LUMINOSITY':
            aeBlendMode = 29;
            break;
        default: aeBlendMode = 1;
    }

    return aeBlendMode;
}

//// get shape data: PATH
function getPath(layer, bounding, type) {    
    // console.log(layer);
    
    var pathStr, pathObj;
    if (layer.vectorPaths) {       // find an individual path
        pathStr = layer.vectorPaths || layer;
        pathObj = parseSvg(pathStr[0].data);
        // console.log(pathObj);
    } else if (type == 'multiPath') {
        // console.log(layer);
        
        pathObj = parseSvg(layer);
    } else {
        // get the fill path or the stroke path if no fill
        try {
            // console.log(layer);
            // convert path to rectangle for corner rounding
            if (layer.type == 'RECTANGLE') {
              // console.log('get that rectangle');
              
              // console.log(layer);
              
              return {
                points: [
                  [0, 0],
                  [bounding.width, 0],
                  [bounding.width, bounding.height],
                  [0, bounding.height],
                ],
                inTangents: [],
                outTangents: [],
                closed: true
              }
            } else if (layer.type == 'ELLIPSE') {
                // console.log('get that ellipse');
                
                return {
                    points: [
                        [bounding.width/2, 0],
                        [bounding.width, bounding.height/2],
                        [bounding.width/2, bounding.height],
                        [0, bounding.height/2],
                    ],
                    inTangents: [
                        [-bounding.width/3.56, 0],
                        [0, -bounding.height/3.56],
                        [bounding.width/3.56, 0],
                        [0, bounding.height/3.56],
                    ],
                    outTangents: [
                        [bounding.width/3.56, 0],
                        [0, bounding.height/3.56],
                        [-bounding.width/3.56, 0],
                        [0, -bounding.height/3.56],
                    ],
                    closed: true
                }
            } else if (layer.type == 'LINE') {
                // console.log('get that ellipse');
                
                return {
                    points: [
                        [0, 0],
                        [bounding.width, bounding.height],
                    ],
                    inTangents: [],
                    outTangents: [],
                    closed: false
                }
            // } else if (!layer.fillGeometry[0]) {
            //     // if (layer.children[0].fillGeometry[0]) { return 'multiPath' }
            //     // console.log('get svg');
            //     vm.svgIdList.push(layer.id);
            //     return null
            }
            
            
            // pathStr = layer.fillGeometry[0].path;
            // console.log('pathStr', pathStr);
            // // pathStr = (layer.fillGeometry[0]) ? layer.fillGeometry[0].path : layer.strokeGeometry[0].path;
            // pathObj = parseSvg(pathStr);
        } catch (e) {
            console.log(e);
            
            // layer.type = 'RECTANGLE';
            console.log('catch multipath')
            // console.log(layer);
            
            return 'multiPath';
        }
    }

    // convert path to rectangle for corner rounding
    if (layer.type == 'RECTANGLE') {
        console.log('get that rectangle');
        
        pathObj = {
            points: [
                [0, 0],
                [bounding.width, 0],
                [bounding.width, bounding.height],
                [0, bounding.height],
            ],
            inTangents: [],
            outTangents: [],
            closed: true
        }
    }
    // console.log(pathObj)
    return pathObj;
}

function parseSvg(str, transformed) {
    // console.log(str)
    var pathObj = {
        points: [],
        inTangents: [],
        outTangents: [],
        closed: false,
    };
    var shouldClosePath = false;

    // used as a negative offset when pulling coords from SVG
    var minX = 9999999999999;
    var minY = 9999999999999;

    // add line breaks between SVG commands    
    var path = str.replace(/\s*([mlvhqczMLVHQCZ])\s*/g,"\n$1 ")
                .replace(/,/g," ")
                // .replace(/-/g," -")
                .replace(/ +/g," ");
    var strings = path.split("\n");
    // console.log(path);
    // shift all the points so the second point is first then reverse
    strings.splice(strings.length-1, 0, strings.splice(0, 1)[0]);
    strings.splice(strings.length-1, 0, strings.splice(0, 1)[0]);
    strings.splice(strings.length-1, 0, strings.splice(0, 1)[0]);
    strings.reverse();
    // console.log(strings);


    // check for closed
    var tempPointList = [];
    var zCount = 0;
    for (var i = 0; i < strings.length; i++) {
        var string = strings[i].trim();     // remove white space
        // if (string < 1) { continue; }   // skip if empty

        var op = string.substring(0,1);
        var terms = string.substring(2).trim().split(" ");

        // start or straight line
        if (op == 'L' ||  op == 'M') {
            var x = parseFloat(terms[0]);
            var y = parseFloat(terms[1]);
            tempPointList.push([x, y]);
            // if (x == tempPointList[tempPointList.length-1][0] && y == tempPointList[tempPointList.length-1][1]) {
            //     shouldClosePath = true;
            //     break;
            // }
        }
        // curve
        if (op == 'C') {
            x = parseFloat(terms[4]);
            y = parseFloat(terms[5]);
            tempPointList.push([x, y]);
        }
    }
    // store all points/tangents
    for (var i = 0; i < strings.length; i++) {
        string = strings[i].trim();     // remove white space

        if (string < 1) { continue; }   // skip if empty


        op = string.substring(0,1);
        terms = string.substring(2).trim().split(" ");

        // check closing
        if (op == 'Z') {
            // console.log('close');
            shouldClosePath = true;
            // zCount++;
        }

        // start or straight line
        if (!pathObj.closed && op == 'M') {
            zCount++;

            // calc min x,y for offset
            minX = Math.min(minX, terms[0])
            minY = Math.min(minY, terms[1])

            // add coords to pathObj
            pathObj.points.push( [parseFloat(terms[0]), parseFloat(terms[1])] );
            pathObj.inTangents.push( [0,0] );
            pathObj.outTangents.push( [0,0] );
        }
        // start or straight line
        if (op == 'L') {
            // calc min x,y for offset
            minX = Math.min(minX, terms[0])
            minY = Math.min(minY, terms[1])

            // add coords to pathObj
            // pathObj.points.push(terms);
            pathObj.points.push( [parseFloat(terms[0]), parseFloat(terms[1])] );
            pathObj.inTangents.push( [0,0] );
            pathObj.outTangents.push( [0,0] );
        }
        // // curve
        if (op == 'C') {
            // calc min x,y for offset
            minX = Math.min(minX, terms[4])
            minY = Math.min(minY, terms[5])

            // add coords to pathObj
            pathObj.points.push( [parseFloat(terms[4]), parseFloat(terms[5]) ] );
            pathObj.inTangents.push( [ terms[0], terms[1] ] );

            var outTangent = [terms[2]-terms[4], terms[3]-terms[5]];
            pathObj.outTangents.push( outTangent );
            // console.log(pathObj);
        }

        // horizontal/vertical line
        if (op == 'H') {
            var len = parseFloat(terms);
            try {
                lastTerms = strings[i+1].substring(2).trim().split(" ");
                pathObj.points.push([len, lastTerms[1] ]);
            } catch (e) {
                lastTerms = strings[0].substring(2).trim().split(" ");
                pathObj.points.push([len, lastTerms[1] ]);
            }
            pathObj.inTangents.push( [0,0] );
            pathObj.outTangents.push( [0,0] );
        }
        if (op == 'V') {
            var len = parseFloat(terms);
            try {
                lastTerms = strings[i+1].substring(2).trim().split(" ");
                pathObj.points.push([lastTerms[0], len]);
            } catch (e) {
                lastTerms = strings[0].substring(2).trim().split(" ");
                pathObj.points.push([lastTerms[0], len]);
            }
            pathObj.inTangents.push( [0,0] );
            pathObj.outTangents.push( [0,0] );
        }
        // console.log(op, terms);
    }
    // console.log(pathObj);
    // shift inTangents list
    pathObj.inTangents.splice(0, 0, pathObj.inTangents.splice(pathObj.inTangents.length-1, 1)[0]);

    for (var j = 0; j < pathObj.points.length; j++) {
        // offset points by min x,y  - skip if multiPath and regular
        // console.log(type);
        if (transformed) {
            // console.log('skip offset');
            pathObj.points[j][0] -= minX;
            pathObj.points[j][1] -= minY;
        }


        var point = pathObj.points[j];
        var inTangent = pathObj.inTangents[j];

        // if inTangents is not zero
        if (inTangent[0] != 0 || inTangent[1] != 0) {
            pathObj.inTangents[j] = [ inTangent[0]-point[0], inTangent[1]-point[1] ];
            // console.log('minus', [point[0], point[1]]);
        }


    }

    // rotate the points and tangents back to their original points when not closing the path
    if (!shouldClosePath) {
        for (var i = 0; i < pathObj.points.length-2; i++) {
            pathObj.points.unshift(pathObj.points.pop())
            pathObj.inTangents.unshift(pathObj.inTangents.pop())
            pathObj.outTangents.unshift(pathObj.outTangents.pop())
        }
    }
    // remove duplicate points when closing the path
    if (shouldClosePath) {
        pathObj.closed = true;

        // if the first coord matches the last
        if (pathObj.points[0][0] == pathObj.points[pathObj.points.length-1][0] &&
            pathObj.points[0][1] == pathObj.points[pathObj.points.length-1][1]) {
            // console.log('remove');
            pathObj.points.splice(k, 1)
            pathObj.inTangents.splice(k, 1)
            pathObj.outTangents.splice(k-1, 1)

        }

        // loop through coords and if the current coord matches the previous coord
        for (var k = 0; k < pathObj.points.length; k++) {
            if (k > 0 && pathObj.points[k][0] == pathObj.points[k-1][0] && pathObj.points[k][1] == pathObj.points[k-1][1]) {
                // console.log('remove', k);
                pathObj.points.splice(k, 1)
                pathObj.inTangents.splice(k, 1)
                pathObj.outTangents.splice(k-1, 1)

            }
        }
    }

    // console.log('zCount', zCount);
    if (zCount > 1) { return 'multiPath'; }
    return pathObj;
}

function getFlipMultiplier(layer) {
    var matrix = layer.relativeTransform;
    var x = (matrix[0][0] < 0) ? -100 : 100;     // horizontal flip
    var y = (matrix[1][1] < 0) ? -100 : 100;     // vertical flip

    // return [100, 100];
    return [x, y];
}
function getRotation(layer) {
    var matrix = layer.relativeTransform;
    // var flip = (layer.type == 'group' && matrix[1][1] < 0) ? -1 : 1;
    var flip = (matrix[0][0] < 0 || matrix[1][1] < 0) ? -1 : 1;
    return -(Math.asin(matrix[0][1]) / (Math.PI / 180)).toFixed(3) * flip;
}