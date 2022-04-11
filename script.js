"use strict";
let globalImg;
function loadImage() {
    let files = document.getElementById("imgInput").files;
    if (!files)
        return;
    let file = files[0];
    let ctx = document.getElementById("originalImg").getContext('2d');
    let img = new Image();
    globalImg = img;
    let url = window.URL || window.webkitURL;
    let src = url.createObjectURL(file);
    img.src = src;
    img.onload = function () {
        drawImageScaled(img, ctx);
        url.revokeObjectURL(src);
        resetParams();
        setHeight(img.height.toString(), false);
        setWidth(img.width.toString(), false);
    };
}
function resetParams() {
    setHeight(globalImg.height.toString(), false);
    setWidth(globalImg.width.toString(), false);
    ;
    aspectRatio = globalHeight / globalWidth;
}
function getHeight() {
    return parseInt(document.getElementById("height").value);
}
function getWidth() {
    return parseInt(document.getElementById("width").value);
}
function keydownNumberValidation(event) {
    console.log("keydown");
    event = event || window.event;
    if (!/^(\d+)|(Backspace)|(Delete)$/.test(event.key)) {
        console.log(`key: ${event.key}`);
        event.preventDefault();
        return;
    }
}
function scaleImage() {
    var _a, _b, _c;
    let scaled = calcScaledRGB();
    outputScaledImage(scaled);
    (_a = document.getElementById("copy-hex")) === null || _a === void 0 ? void 0 : _a.remove();
    (_b = document.getElementById("hex-full")) === null || _b === void 0 ? void 0 : _b.remove();
    (_c = document.getElementById("hex-full-div")) === null || _c === void 0 ? void 0 : _c.remove();
    let hexFullDiv = document.createElement('div');
    hexFullDiv.setAttribute("id", "hex-full-div");
    hexFullDiv.appendChild(document.createTextNode('Display full hex'));
    let hexFull = document.createElement('input');
    hexFull.setAttribute("id", "hex-full");
    hexFull.setAttribute("type", "checkbox");
    hexFullDiv.appendChild(hexFull);
    let copyHEX = document.createElement('button');
    copyHEX.setAttribute("id", "copy-hex");
    copyHEX.appendChild(document.createTextNode('Copy image as hex'));
    copyHEX.onclick = function () {
        let str = "";
        let tr_pix = document.getElementById("transparency_pixel").value.replace(/\s/g, "");
        let tr_rep = document.getElementById("transparency_replacement").value.replace(/\s/g, "");
        let start = true;
        for (let row of scaled) {
            if (!start)
                str += "\n";
            start = false;
            let startInner = true;
            for (let pixel of row) {
                if (!startInner)
                    str += " ";
                startInner = false;
                str += rgbToHex(pixel[0], pixel[1], pixel[2], pixel[3], hexFull.checked, tr_pix, tr_rep);
            }
        }
        console.log(str);
        copyTextToClipboard(str);
        alert("Image hex copied to clipboard");
    };
    document.body.appendChild(hexFullDiv);
    document.body.appendChild(copyHEX);
}
// https://stackoverflow.com/questions/400212/how-do-i-copy-to-the-clipboard-in-javascript
function fallbackCopyTextToClipboard(text) {
    var textArea = document.createElement("textarea");
    textArea.value = text;
    // Avoid scrolling to bottom
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
        var successful = document.execCommand('copy');
        var msg = successful ? 'successful' : 'unsuccessful';
        console.log('Fallback: Copying text command was ' + msg);
    }
    catch (err) {
        console.error('Fallback: Oops, unable to copy', err);
    }
    document.body.removeChild(textArea);
}
function copyTextToClipboard(text) {
    if (!navigator.clipboard) {
        fallbackCopyTextToClipboard(text);
        return;
    }
    navigator.clipboard.writeText(text).then(function () {
        console.log('Async: Copying to clipboard was successful!');
    }, function (err) {
        console.error('Async: Could not copy text: ', err);
    });
}
// https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
function componentToHex(c, hexFull) {
    let hex = c.toString(16);
    hex = hex.length == 1 ? "0" + hex : hex;
    if (hex.length > 1 && !hexFull) {
        hex = hex.charAt(0);
    }
    return hex;
}
function rgbToHex(r, g, b, a, hexFull, tr_pix, tr_rep) {
    let isTransparent = a < (0.5 * 255);
    let hex;
    if (isTransparent) {
        hex = tr_pix;
        return hex;
    }
    hex = componentToHex(r, hexFull) + componentToHex(g, hexFull) + componentToHex(b, hexFull);
    return isTransparent ? tr_pix : parseInt(hex, 16) == parseInt(tr_pix, 16) ? tr_rep : hex;
}
function outputScaledImage(scaled) {
    let ctx = document.getElementById("scaledImg").getContext("2d");
    let height = scaled.length;
    let width = scaled[0].length;
    let h = ctx.canvas.height;
    let w = ctx.canvas.width;
    let imgData = ctx.getImageData(0, 0, w, h);
    let data = imgData.data; // the array of RGBA values
    for (let i = 0; i < height; i++) {
        for (let j = 0; j < width; j++) {
            let s = 4 * i * w + 4 * j; // calculate the index in the array
            let x = scaled[i][j]; // the RGB values
            data[s] = x[0];
            data[s + 1] = x[1];
            data[s + 2] = x[2];
            data[s + 3] = x[3] < (0.5 * 255) ? 0 : 255; // fully opaque
        }
    }
    let canvas = ctx.canvas;
    canvas.width = width;
    canvas.height = height;
    ctx.putImageData(imgData, 0, 0);
}
function calcScaledRGB() {
    let rgb = getRGBdata(document.getElementById("originalImg").getContext("2d"));
    let scaledRGB = [...Array(Math.floor(globalHeight))].map(e => [...Array(Math.floor(globalWidth))].map(e => Array(4)));
    let newX = 0;
    let newY = 0;
    for (let i of linspace(0, globalImg.height - 1, Math.floor(globalHeight))) {
        for (let j of linspace(0, globalImg.width - 1, Math.floor(globalWidth))) {
            let y = Math.round(i);
            let x = Math.round(j);
            let pixelStart = (y * globalImg.width * 4) + (x * 4);
            scaledRGB[newY][newX] = [
                rgb[pixelStart],
                rgb[pixelStart + 1],
                rgb[pixelStart + 2],
                rgb[pixelStart + 3]
            ];
            newX = newX + 1;
        }
        newX = 0;
        newY = newY + 1;
    }
    return scaledRGB;
}
function getRGBdata(ctx) {
    return ctx.getImageData(0, 0, globalImg.width, globalImg.height).data;
}
// https://stackoverflow.com/questions/40475155/does-javascript-have-a-method-that-returns-an-array-of-numbers-based-on-start-s
function linspace(start, stop, num, endpoint = true) {
    const div = endpoint ? (num - 1) : num;
    const step = (stop - start) / div;
    return Array.from({ length: num }, (_, i) => start + step * i);
}
let aspectRatio;
let globalHeight, globalWidth;
function setHeight(height, ratioLocked) {
    console.log(`setting height to ${height} with locked ratio: ${ratioLocked}`);
    if (isNaN(parseInt(height)))
        return;
    let heightInput = document.getElementById("height");
    heightInput.value = height;
    globalHeight = parseInt(height);
    if (!ratioLocked) {
        aspectRatio = globalHeight / globalWidth;
        return;
    }
    let widthInput = document.getElementById("width");
    let newWidth = Math.round(getHeight() / aspectRatio);
    widthInput.value = newWidth.toString();
    globalWidth = newWidth;
}
function setWidth(width, ratioLocked) {
    console.log(`setting width to ${width} with locked ratio: ${ratioLocked}`);
    if (isNaN(parseInt(width)))
        return;
    let widthInput = document.getElementById("width");
    widthInput.value = width;
    globalWidth = parseInt(width);
    if (!ratioLocked) {
        aspectRatio = getHeight() / getWidth();
        return;
    }
    let heightInput = document.getElementById("height");
    let newHeight = Math.round(getWidth() * aspectRatio);
    heightInput.value = newHeight.toString();
    globalHeight = newHeight;
}
function ratioLocked() {
    return document.getElementById("lock-ratio").checked;
}
// https://stackoverflow.com/questions/23104582/scaling-an-image-to-fit-on-canvas
function drawImageScaled(img, ctx) {
    let canvas = ctx.canvas;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvas.height = img.height;
    canvas.width = img.width;
    ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, img.width, img.height);
}
