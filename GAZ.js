import *as Checker from './parts/type-checker.js';
import *as CreateMassage from './parts/message.js';
import *as TrimEntry from './parts/trim-entry.js';
/**
await new Promise((resolve, reject) => {})
*/
export class GAZ {
    constructor(ImageData, Context) {
        Checker.imageData.isImageData(ImageData);
        this.ImageData = ImageData;
        this.Context = Context;
    };
    static getColorDistance(color1,color2) {
        const red = 0.3;
        const green = 0.59;
        const blue = 0.11;
        const distance = Math.pow(((color2[0] - color1[0]) * red), 2) + Math.pow(((color2[1] - color1[1]) * green), 2) + Math.pow(((color2[2] - color1[2]) * blue), 2);
        return distance;
    };
    Duplicate(ImageData = this.ImageData, Context = this.Context) {
        if(!Checker.imageData.isImageData(ImageData)){return false};
        const Duplication = Context.createImageData(ImageData);
        const DuplicationPixcelData = Duplication.data
        const PixcelData = ImageData.data;
        for (let i = 0; i < PixcelData.length; i++) {
            DuplicationPixcelData[i] = PixcelData[i];
        }
        return new GAZ(Duplication, Context);
    };
    getColorIndicesForCoord(x, y, width = this.ImageData.width) {
        const redIndices = y * (width * 4) + x * 4;
        return redIndices;
    };
    async GrayScale(ImageData = this.ImageData, Context = this.Context) {
        const newImageData = Context.createImageData(ImageData);
        const newdata = newImageData.data;
        const AgImageData = ImageData.data;
        await new Promise((resolve, reject) => {
            for (let i = 0; i < AgImageData.length; i += 4) {
                // (r+g+b)/3
                const color = (AgImageData[i] + AgImageData[i + 1] + AgImageData[i + 2]) / 3;
                newdata[i] = newdata[i + 1] = newdata[i + 2] = color;
            }
            resolve();
        });
        return new GAZ(newImageData, Context);
    }
    async NegativePositive(ImageData = this.ImageData, Context = this.Context) {
        const oldData = ImageData.data;
        const newImageData = Context.createImageData(ImageData);
        const newData = newImageData.data;
        await new Promise((resolve, reject) => {
            for (let i = 0; i < oldData.length; i += 4) {
                // 255-(r|g|b)
                newData[i] = 255 - oldData[i];
                newData[i + 1] = 255 - oldData[i + 1];
                newData[i + 2] = 255 - oldData[i + 2];
            }
            resolve();
        })
        return new GAZ(newImageData, Context);
    }
    async Binarization(ImageData = this.ImageData, Context = this.Context) {
        const oldData = ImageData.data;
        const newImageData = Context.createImageData(ImageData);
        const newData = newImageData.data;
        const threshold = 255 / 2;
        const getColor = (data, i) => {
            // threshold < rgbの平均
            const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
            if (threshold < avg) {
                // white
                return 255;
            } else {
                // black
                return 0;
            }
        };
        await new Promise((resolve, reject) => {
            for (let i = 0; i < oldData.length; i += 4) {
                const color = getColor(oldData, i);
                newData[i] = newData[i + 1] = newData[i + 2] = color;
            }
            resolve();
        })
        return new GAZ(newImageData, Context);
    }
    async GammaCorrection(gamma, ImageData = this.ImageData, Context = this.Context) {
        const oldData = ImageData.data;
        const newImageData = Context.createImageData(ImageData);
        const newData = newImageData.data;
        // ガンマ値=2.0
        // 補正式
        const correctify = val => 255 * Math.pow(val / 255, 1 / gamma);
        for (let i = 0; i < oldData.length; i += 4) {
            newData[i] = correctify(oldData[i]);
            newData[i + 1] = correctify(oldData[i + 1]);
            newData[i + 2] = correctify(oldData[i + 2]);
        }
    }
    async Sharpening(ImageData = this.ImageData, Context = this.Context) {
        const oldData = ImageData.data;
        const newImageData = this.Duplicate(ImageData, Context).ImageData;
        const newData = newImageData.data;
        const sharpedColor = (color, i) => {
          // 係数
          const sub = -1;
          const main = 10;
    
          const prevLine = i - (ImageData.width * 4);
          const nextLine = i + (ImageData.width * 4);
    
          const sumPrevLineColor = (oldData[prevLine - 4 + color] * sub) + (oldData[prevLine + color] * sub) + (oldData[prevLine + 4 + color] * sub);
          const sumCurrLineColor = (oldData[i - 4 + color] * sub)        + (oldData[i + color] * main)       + (oldData[i + 4 + color] * sub);
          const sumNextLineColor = (oldData[nextLine - 4 + color] * sub) + (oldData[nextLine + color] * sub) + (oldData[nextLine + 4 + color] * sub);
          return (sumPrevLineColor + sumCurrLineColor + sumNextLineColor) / 2
        };
        await new Promise((resolve, reject) => {
        // 2行目〜n-1行目
        for (let i = ImageData.width * 4; i < oldData.length - (ImageData.width * 4); i += 4) {
            // 2列目〜n-1列目
            if (i % (ImageData.width * 4) === 0 || i % ((ImageData.width * 4) + 300) === 0) {
              // nop
            } else {
              newData[i] = sharpedColor(0, i);
              newData[i + 1] = sharpedColor(1, i);
              newData[i + 2] = sharpedColor(2, i);
              //data2[i + 3] = 255 * strength*0.01;
            }
          };
          resolve();
        })
        return new GAZ(newImageData, Context);
      }
    async Mosaic(msize, ImageData = this.ImageData, Context = this.Context) {
        const oldData = ImageData.data;
        const newImageData = Context.createImageData(ImageData);
        const newData = newImageData.data;
        await new Promise((resolve, reject) => {
            for (let y = 0; y < ImageData.height; y += msize) {
                for (let x = 0; x < ImageData.width; x += msize) {
                    let msizex = msize;
                    let msizey = msize;
                    if (x + msize > ImageData.width) {
                        msizex = ImageData.width - x;
                    }
                    if (y + msize > ImageData.height) {
                        msizey = ImageData.height - y;
                    }
                    let mr = 0;
                    let mg = 0;
                    let mb = 0;
                    let ma = 0;
                    let pt;
                    pt = (x + y * ImageData.width) * 4;
                    for (let y2 = 0; y2 < msizey; y2++) {
                        for (let x2 = 0; x2 < msizex; x2++) {
                            mr += oldData[pt];
                            mg += oldData[pt + 1];
                            mb += oldData[pt + 2];
                            ma += oldData[pt + 3];
                            pt += 4;
                        }
                        pt += 4 * (ImageData.width - msizex);
                    }
                    let dotnum = msizex * msizey;
                    mr = Math.floor(mr / dotnum);
                    mg = Math.floor(mg / dotnum);
                    mb = Math.floor(mb / dotnum);
                    ma = Math.floor(ma / dotnum);
                    pt = (x + y * ImageData.width) * 4;
                    for (let y2 = 0; y2 < msizey; y2++) {
                        for (let x2 = 0; x2 < msizex; x2++) {
                            newData[pt] = mr;
                            newData[pt + 1] = mg;
                            newData[pt + 2] = mb;
                            newData[pt + 3] = ma;
                            pt += 4;
                        }
                        pt += 4 * (ImageData.width - msizex);
                    }
                }
            }
            resolve();
        })

        return new GAZ(newImageData, Context);
    }
    async Blur(bsize, ImageData = this.ImageData, Context = this.Context) {
        // ぼかしの点の数
        let dotnum = bsize * bsize;
        const oldData = ImageData.data;
        const newImageData = Context.createImageData(ImageData);
        const newData = newImageData.data;
        await new Promise((resolve, reject) => {
            let bsize2 = Math.floor(bsize / 2);
            let ar = new Array();
            let ag = new Array();
            let ab = new Array();
            let aa = new Array();
            let pt = 0;
            for (let y = 0; y < ImageData.height; y++) {
              ar[y] = new Array();
              ag[y] = new Array();
              ab[y] = new Array();
              aa[y] = new Array();
              for (let x = 0; x < bsize2; x++) {
                if(oldData[pt + 3]===0){
                    ar[y][x]=ag[y][x]=ab[y][x]=255
                }
                else{
                    ar[y][x] = oldData[pt];
                    ag[y][x] = oldData[pt + 1];
                    ab[y][x] = oldData[pt + 2];
                }
                aa[y][x] = oldData[pt + 3];
              }
              for (let x = bsize2; x < ImageData.width + bsize2; x++) {
                if(oldData[pt + 3]===0){
                    ar[y][x]=ag[y][x]=ab[y][x]=255
                }
                else{
                    ar[y][x] = oldData[pt];
                    ag[y][x] = oldData[pt + 1];
                    ab[y][x] = oldData[pt + 2];
                }
                aa[y][x] = oldData[pt + 3];
                pt += 4;
              }
              pt -= 4;
              for (let x = ImageData.width + bsize2; x < ImageData.width + bsize - 1; x++) {
                if(oldData[pt + 3]===0){
                    ar[y][x]=ag[y][x]=ab[y][x]=255
                }
                else{
                    ar[y][x] = oldData[pt];
                    ag[y][x] = oldData[pt + 1];
                    ab[y][x] = oldData[pt + 2];
                }
                aa[y][x] = oldData[pt + 3];
              }
              pt += 4;
            }
            let br, bg, bb,ba;
            let ar2 = new Array();
            let ag2 = new Array();
            let ab2 = new Array();
            let aa2 = new Array();
            for (let y = bsize2; y < ImageData.height + bsize2; y++) {
              let y2 = y - bsize2;
              ar2[y] = new Array();
              ag2[y] = new Array();
              ab2[y] = new Array();
              aa2[y] = new Array();
              br = bb = bg =ba= 0;
              for (let x = 0; x < bsize; x++) {
                br += ar[y2][x];
                bg += ag[y2][x];
                bb += ab[y2][x];
                ba += aa[y2][x];
              }
              for (let x = 0; x < ImageData.width; x++) {
                ar2[y][x] = br;
                ag2[y][x] = bg;
                ab2[y][x] = bb;
                aa2[y][x] = ba;
                br += ar[y2][x + bsize] - ar[y2][x];
                bg += ag[y2][x + bsize] - ag[y2][x];
                bb += ab[y2][x + bsize] - ab[y2][x];
                ba += aa[y2][x + bsize] - aa[y2][x];
              }
            }
            for (let y = 0; y < bsize2; y++) {
              ar2[y] = new Array();
              ag2[y] = new Array();
              ab2[y] = new Array();
              aa2[y] = new Array();
              for (let x = 0; x < ImageData.width; x++) {
                ar2[y][x] = ar2[bsize2][x];
                ag2[y][x] = ag2[bsize2][x];
                ab2[y][x] = ab2[bsize2][x];
                aa2[y][x] = aa2[bsize2][x];
              }
            }
            for (let y = ImageData.height + bsize2; y < ImageData.height + bsize; y++) {
              ar2[y] = new Array();
              ag2[y] = new Array();
              ab2[y] = new Array();
              aa2[y] = new Array();
              for (let x = 0; x < ImageData.width; x++) {
                ar2[y][x] = ar2[ImageData.height][x];
                ag2[y][x] = ag2[ImageData.height][x];
                ab2[y][x] = ab2[ImageData.height][x];
                aa2[y][x] = aa2[ImageData.height][x];
              }
            }
            for (let x = 0; x < ImageData.width; x++) {
              pt = 4 * x;
              br = bb = bg =ba= 0;
              for (let y = 0; y < bsize; y++) {
                br += ar2[y][x];
                bg += ag2[y][x];
                bb += ab2[y][x];
                ba += aa2[y][x];
              }
              for (let y = 0; y < ImageData.height; y++) {
                newData[pt] = Math.floor(br / dotnum);
                newData[pt + 1] = Math.floor(bg / dotnum);
                newData[pt + 2] = Math.floor(bb / dotnum);
                newData[pt + 3] = Math.floor(ba / dotnum);
                pt += ImageData.width * 4;
                br += ar2[y + bsize][x] - ar2[y][x];
                bg += ag2[y + bsize][x] - ag2[y][x];
                bb += ab2[y + bsize][x] - ab2[y][x];
                ba += aa2[y + bsize][x] - aa2[y][x];
              }
            }
            resolve();
        })
        return new GAZ(newImageData, Context);
      }
    async ScanlineSeedFill({ x = 0, y = 0, ImageData = this.ImageData, Context = this.Context, difference = 100, colorAfterApplying = [0, 0, 0, 0] }) {
        const getColorDistance = GAZ.getColorDistance;
        const newImageData = this.Duplicate(ImageData, Context).ImageData;
        const newdata = newImageData.data;
        const width = newImageData.width;
        const height = newImageData.height;
        const datawidth = width * 4
        const firstRedPos = this.getColorIndicesForCoord(x, y);
        const dmRGB = newdata.slice(firstRedPos, firstRedPos + 4)
        const aaRGB = Checker.array.allTypesAre(colorAfterApplying, 'number') ? colorAfterApplying : [0, 0, 0, 0];
        let Bbuffer=[];
        //let inProcess = new Array(width * height);
        //inProcess.fill(false);
        const lightDifference = difference < 125 ? difference : 124;
        const indexRightmostColumn = (i) => {
            return datawidth - (i % datawidth) + i - 4;
        };
        const indexLeftmostColumn = (i) => {
            return i - (i % datawidth);
        };
        function fill(i) {
            newdata[i] = aaRGB[0];
            newdata[i + 1] = aaRGB[1];
            newdata[i + 2] = aaRGB[2];
            newdata[i + 3] = aaRGB[3];
        }
        const isMatchColor = (i) => {
            if (
                newdata[i] === aaRGB[0] &&
                newdata[i + 1] === aaRGB[1] &&
                newdata[i + 2] === aaRGB[2] &&
                newdata[i + 3] === aaRGB[3]
            ) {
                return true;
            }
            else {
                return false;
            }
        }
        const isApproximationColor = (i) => {
            if (
                getColorDistance([newdata[i], newdata[i + 1], newdata[i + 2]], dmRGB) < difference
                && Math.abs(newdata[i + 3] - dmRGB[3]) < lightDifference
            ) {
                return true;
            }
            else {
                false;
            }
        }
        function createSeedfromOldMinMax(redIndex_min, redIndex_max) {
            let buffer = [];
            let trueWasIs_top = false;
            for (let i = redIndex_min - datawidth; i <= redIndex_max - datawidth; i += 4) {
                if (isApproximationColor(i)) {
                    trueWasIs_top = true;
                }
                else {
                    if (trueWasIs_top) { buffer.push(i - 4) }
                    trueWasIs_top = false;
                }
            }
            if (trueWasIs_top) { buffer.push(redIndex_max - datawidth) };
            let trueWasIs_bottom = false;
            for (let i = redIndex_min + datawidth; i <= redIndex_max + datawidth; i += 4) {
                if (isApproximationColor(i)) {
                    trueWasIs_bottom = true;
                }
                else {
                    if (trueWasIs_bottom) { buffer.push(i - 4) }
                    trueWasIs_bottom = false;
                }
            }
            if (trueWasIs_bottom) { buffer.push(redIndex_max + datawidth) };
            buffer.forEach(x => {
                if (isMatchColor(x)) { return; }
                const seed = scanToLeftRightfromSeed(x);
                createSeedfromOldMinMax(seed.fillmin, seed.fillmax);
            })
            return;
        }
        function scanToLeftRightfromSeed(redIndex) {
            const min = indexLeftmostColumn(redIndex);
            const max = indexRightmostColumn(redIndex);
            //fillmin, fillmaxの最小を設定
            let fillmax = redIndex;
            let fillmin = redIndex;
            //右
            for (; fillmax + 4 <= max; fillmax += 4) {
                if (isApproximationColor(fillmax + 4)) {
                    fill(fillmax + 4);
                }
                else {
                    break;
                }
            }
            //左
            for (; fillmin - 4 >= min; fillmin -= 4) {
                if (isApproximationColor(fillmin - 4)) {
                    fill(fillmin - 4);
                }
                else {
                    break;
                }
            }
            fill(redIndex);
            fillmin = fillmin > min ? fillmin : min;
            fillmax = fillmax < max ? fillmax : max;
            return { fillmin: fillmin, fillmax: fillmax };
        }
        let newGAZ;
        await runfirst();
        async function runfirst() {
            await new Promise((resolve) => {
                const firstSeed = scanToLeftRightfromSeed(firstRedPos);
                createSeedfromOldMinMax(firstSeed.fillmin, firstSeed.fillmax);
                resolve();
            })
                .catch((e) => {
                    newGAZ = new GAZ(newImageData, Context);
                })
                .then(() => {
                    newGAZ = new GAZ(newImageData, Context);
                })
        }
        return newGAZ;

    }
    async ScanlineSeedFill_NoRecursion({ x = 0, y = 0, ImageData = this.ImageData, Context = this.Context, difference = 100, colorAfterApplying = [0, 0, 0, 0] }) {
        const getColorDistance = GAZ.getColorDistance;
        if(Checker.imageData.isImageData(ImageData)){console.error(CreateMassage.error.ArgumentMustBe(ImageData))}
        const newImageData = this.Duplicate(ImageData, Context).ImageData;
        const newdata = newImageData.data;
        const width = newImageData.width;
        const height = newImageData.height;
        const datawidth = width * 4
        const firstRedPos = this.getColorIndicesForCoord(x, y);
        const dmRGB = newdata.slice(firstRedPos, firstRedPos + 4)
        const trimEntryedRGB=TrimEntry.RGB(colorAfterApplying);
        const aaRGB = [trimEntryedRGB.R,trimEntryedRGB.G,trimEntryedRGB.B,trimEntryedRGB.A]
        //ここにためて再帰関数使わんでいいようにする!
        let buffer=[];
        const lightDifference = difference
        const indexRightmostColumn = (i) => {
            return datawidth - (i % datawidth) + i - 4;
        };
        const indexLeftmostColumn = (i) => {
            return i - (i % datawidth);
        };
        function fill(i) {
            newdata[i] = aaRGB[0];
            newdata[i + 1] = aaRGB[1];
            newdata[i + 2] = aaRGB[2];
            newdata[i + 3] = aaRGB[3];
        }
        const isMatchColor = (i) => {
            if (
                newdata[i] === aaRGB[0] &&
                newdata[i + 1] === aaRGB[1] &&
                newdata[i + 2] === aaRGB[2] &&
                newdata[i + 3] === aaRGB[3]
            ) {
                return true;
            }
            else {
                return false;
            }
        }
        const isApproximationColor = (i) => {
            if (
                getColorDistance([newdata[i], newdata[i + 1], newdata[i + 2]], dmRGB) < difference
                && Math.abs(newdata[i + 3] - dmRGB[3]) < lightDifference
            ) {
                return true;
            }
            else {
                false;
            }
        }
        function createSeedfromOldMinMax(redIndex_min, redIndex_max) {
            function top(){
                let trueWasIs = false;
                for (let i = redIndex_min - datawidth; i <= redIndex_max - datawidth; i += 4) {
                    if (isApproximationColor(i)) {
                        trueWasIs = true;
                    }
                    else {
                        const insertIndex=i - 4
                        if (trueWasIs&&!isMatchColor(insertIndex)) { buffer.push(insertIndex) }
                        trueWasIs = false;
                    }
                }
                const insertIndex=redIndex_max - datawidth;
                if (trueWasIs&&!isMatchColor(insertIndex)) { buffer.push(insertIndex) };
            }
            function buttom(){
                let trueWasIs = false;
                for (let i = redIndex_min + datawidth; i <= redIndex_max + datawidth; i += 4) {
                    if (isApproximationColor(i)) {
                        trueWasIs = true;
                    }
                    else {
                        const insertIndex=i - 4
                        if (trueWasIs&&!isMatchColor(insertIndex)) { buffer.push(insertIndex) }
                        trueWasIs = false;
                    }
                }
                const insertIndex=redIndex_max + datawidth
                if (trueWasIs&&!isMatchColor(insertIndex)) { buffer.push(insertIndex) };
            }
            top();
            buttom();
            return;
        }
        function scanToLeftRightfromSeed(redIndex) {
            const min = indexLeftmostColumn(redIndex);
            const max = indexRightmostColumn(redIndex);
            //fillmin, fillmaxの最小を設定
            let fillmax = redIndex;
            let fillmin = redIndex;
            //右
            for (; fillmax + 4 <= max; fillmax += 4) {
                if (isApproximationColor(fillmax + 4)) {
                    fill(fillmax + 4);
                }
                else {
                    break;
                }
            }
            //左
            for (; fillmin - 4 >= min; fillmin -= 4) {
                if (isApproximationColor(fillmin - 4)) {
                    fill(fillmin - 4);
                }
                else {
                    break;
                }
            }
            fill(redIndex);
            fillmin = fillmin > min ? fillmin : min;
            fillmax = fillmax < max ? fillmax : max;
            return { fillmin: fillmin, fillmax: fillmax };
        }
        await new Promise((resolve, reject) => {
            const seed=scanToLeftRightfromSeed(firstRedPos);
            createSeedfromOldMinMax(seed.fillmin, seed.fillmax);
            while(buffer.length>0){
                const point = buffer.pop();
                const seed=scanToLeftRightfromSeed(point);
                createSeedfromOldMinMax(seed.fillmin, seed.fillmax);
            }
            resolve();
        })
        return new GAZ(newImageData, Context);
    }
}
