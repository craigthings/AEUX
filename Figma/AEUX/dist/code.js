!function(e){var t={};function n(r){if(t[r])return t[r].exports;var a=t[r]={i:r,l:!1,exports:{}};return e[r].call(a.exports,a,a.exports,n),a.l=!0,a.exports}n.m=e,n.c=t,n.d=function(e,t,r){n.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:r})},n.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},n.t=function(e,t){if(1&t&&(e=n(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var r=Object.create(null);if(n.r(r),Object.defineProperty(r,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var a in e)n.d(r,a,function(t){return e[t]}.bind(null,a));return r},n.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return n.d(t,"a",t),t},n.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},n.p="",n(n.s=20)}({20:function(e,t){var n=this&&this.__awaiter||function(e,t,n,r){return new(n||(n=Promise))(function(a,i){function o(e){try{f(r.next(e))}catch(e){i(e)}}function s(e){try{f(r.throw(e))}catch(e){i(e)}}function f(e){e.done?a(e.value):new n(function(t){t(e.value)}).then(o,s)}f((r=r.apply(e,t||[])).next())})};let r;figma.showUI(__html__,{width:166,height:174});let a=[],i=[],o=[],s={exportRefImage:!1};function f(e,t,r){return n(this,void 0,void 0,function*(){for(const t in e){const n=e[t].hash,r=e[t].id.replace(/:/g,"-").replace(/\s*(\/|\\)\s*/g,"-");try{let e=figma.getImageByHash(n),t=yield e.getBytesAsync();o.push({name:r,bytes:t})}catch(e){}}o.length>0?figma.ui.postMessage({type:"fetchImagesAndAEUX",images:o,data:t,refImg:r}):figma.ui.postMessage({type:"fetchAEUX",data:t})})}function l(e){return"FRAME"!==e.type&&("COMPONENT"!==e.type||"PAGE"!==e.parent.type)||"FRAME"===e.type&&"NONE"!==e.layoutMode||"FRAME"===e.type&&"FRAME"===e.parent.type?l(e.parent):(r=!0,e)}figma.ui.onmessage=e=>{if("getPrefs"===e.type&&figma.clientStorage.getAsync("aeux.prefs").then(t=>t?(figma.ui.postMessage({type:"retPrefs",prefs:t}),t):(figma.clientStorage.setAsync("aeux.prefs",e.defaultPrefs).then(()=>{figma.ui.postMessage({type:"retPrefs",prefs:e.defaultPrefs})}),e.defaultPrefs)).then(e=>{s=e}),"setPrefs"===e.type&&figma.clientStorage.setAsync("aeux.prefs",e.prefs).then(t=>{figma.ui.postMessage(e.prefs),s=e.prefs}),"exportSelection"===e.type){r=!1,a=[],i=[],o=[];let t=!1;if(e.exportJSON&&(t=!0),figma.currentPage.selection.length<1)return void figma.ui.postMessage({type:"fetchAEUX",data:null});try{let e=function e(t){if(t.length<1)return[];let n=[];t[0]&&("FRAME"===t[0].type&&"PAGE"===t[0].parent.type||"COMPONENT"===t[0].type&&"PAGE"===t[0].parent.type)&&(console.log("GOT A FRAME"),r=!0,a.push(o(t[0],!1)),t=t[0].children);if(t.length<1)return[];t.forEach(e=>{if(!r){if("PAGE"===e.parent.type)return;let t=l(e),n=o(t,!0);n.children=[],a.push(n)}let t=o(e,!1);n.push(t)});return n;function o(t,n){let r={children:[],type:null};for(const a in t){let i=t[a];if("children"!==a||n||(i=e(i)),"backgrounds"===a&&(i=e(i)),"fills"===a&&i.length>0&&s(i,t.id),i==figma.mixed&&"cornerRadius"===a&&(i=Math.min(t.topLeftRadius,t.topRightRadius,t.bottomLeftRadius,t.bottomRightRadius)),i==figma.mixed){let e="getRange"+a.replace(/^\w/,e=>e.toUpperCase());try{i=t[e](0,1)}catch(e){continue}}r[a]=i}return"FRAME"===t.type&&"NONE"!==t.layoutMode&&(r.type="AUTOLAYOUT"),r}function s(e,t){for(const n in e){const r=e[n];"IMAGE"==r.type&&i.push({hash:r.imageHash,id:t})}}}(figma.currentPage.selection);a[0].children.length<1&&(a[0].children=e),console.log("frameArr: ",a)}catch(e){console.log(e),console.log("selected layers need to be inside of a frame"),figma.ui.postMessage({type:"footerMsg",action:"selected layers need to be inside of a frame",layerCount:null})}if(s.exportRefImage){let e=l(figma.currentPage.selection[0]);console.log("exportRefImage",s.exportRefImage);let t={format:"PNG",constraint:{type:"SCALE",value:6}};e.exportAsync(t).then(t=>{i.push({hash:figma.createImage(t).hash,id:e.name+"_reference"})}).then(()=>{let t=e.name.replace(/\s*(\/|\\)\s*/g,"-"),n={type:"Image",name:t+"_reference",id:t+"_reference",frame:{x:e.width/2,y:e.height/2,width:e.width,height:e.height},isVisible:!0,opacity:50,blendMode:"BlendingMode.NORMAL",isMask:!1,rotation:0,guide:!0};f(Array.from(new Set(i)),a,n)})}else t?figma.ui.postMessage({type:"exportAEUX",data:a}):i.length<1?figma.ui.postMessage({type:"fetchAEUX",data:a}):f(Array.from(new Set(i)),a,null)}if("flattenLayers"===e.type){if(figma.currentPage.selection.length<1)return;let e=function e(t,n){try{return t.forEach(t=>{if(console.log("try flattening",t),"BOOLEAN_OPERATION"==t.type)figma.flatten([t]),n++;else if(t.cornerRadius==figma.mixed||t.cornerRadius>0)figma.flatten([t]),n++;else if(t.children)n=e(t.children,n);else{let e=t.relativeTransform;console.log("shape.type",t.type),1!=e[0][0].toFixed(6)||0!=e[0][1].toFixed(6)||0!=e[1][0].toFixed(6)||1!=e[1][1].toFixed(6)?(figma.flatten([t]),n++):"TEXT"==t.type&&(figma.flatten([t]),n++)}}),n}catch(e){return console.log(e),n}}(figma.currentPage.selection,0)||0;figma.currentPage.selection=figma.currentPage.selection,figma.ui.postMessage({type:"footerMsg",action:"flattened",layerCount:e})}if("rasterizeSelection"===e.type){if(figma.currentPage.selection.length<1)return;let e=function(e,t){try{let n=[];return e.forEach(e=>{if("GROUP"==e.type){console.log("got a group");let r={format:"PNG",constraint:{type:"SCALE",value:6}},a=e.relativeTransform,i=[[1,0,e.x],[0,1,e.y]];e.relativeTransform=i,e.exportAsync(r).then(t=>{let r=figma.createRectangle();e.parent.appendChild(r),r.x=e.x,r.y=e.y,r.relativeTransform=a,r.name=e.name+"_rasterize",r.resize(e.width,e.height);let i=JSON.parse(JSON.stringify(r.fills));i.imageHash=figma.createImage(t).hash,r.fills=i,n.push(r),e.relativeTransform=a}),t++}}),setTimeout(()=>{figma.currentPage.selection=n},50),t}catch(e){return console.log(e),t}}(figma.currentPage.selection,0)||0;figma.currentPage.selection=figma.currentPage.selection,figma.ui.postMessage({type:"footerMsg",action:"rasterized",layerCount:e})}if("detachComponents"===e.type){console.log("detachComponents");let e=4;figma.ui.postMessage({type:"footerMsg",action:"flattened",layerCount:e})}}}});