import *as Checker from './parts/GAZ_checker.js';
import *as ColorOP from './parts/GAZ_color.js';
const createMassage = {
    argumentError: (validValue) => {
        return `TypeError:Argument must be a ${validValue} .`
    },
    undefinedError: () => {
        return `TypeError:Argument is undefined`
    },
    invalid: (value) => {
        return `TypeError:${value}is an invalid`
    }
}
/**
await new Promise((resolve, reject) => {})
 */
export class GAZ {
    constructor(ImageData, Context) {
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
    async Mosaic(msize, ImageData = this.ImageData, Context = this.Context) {
        const oldData = ImageData.data;
        const newImageData = Context.createImageData(ImageData);
        const newData = newImageData.data;
        await new Promise((resolve, reject) => {
            // モザイクの大きさの単位で繰り返す
            for (let y = 0; y < ImageData.height; y += msize) {
                for (let x = 0; x < ImageData.width; x += msize) {
                    // モザイクの大きさを計算する
                    let msizex = msize;
                    let msizey = msize;
                    // モザイクの正方形が右か下にはみ出した場合の処理
                    if (x + msize > ImageData.width) {
                        msizex = ImageData.width - x;
                    }
                    if (y + msize > ImageData.height) {
                        msizey = ImageData.height - y;
                    }

                    // モザイクの長方形内の点の色の平均を計算する
                    let mr = 0;
                    let mg = 0;
                    let mb = 0;
                    let ma = 0;
                    // imageData, newImageData の点の data のインデックス値
                    let pt;
                    pt = (x + y * ImageData.width) * 4;
                    for (let y2 = 0; y2 < msizey; y2++) {
                        for (let x2 = 0; x2 < msizex; x2++) {
                            mr += oldData[pt];
                            mg += oldData[pt + 1];
                            mb += oldData[pt + 2];
                            ma += oldData[pt + 3];
                            pt += 4;
                            // 下記のほうがわかりやすいが、上記のほうが高速なので上記を採用する
                            //mr += getr(imageData, x + x2, y + y2);
                            //mg += getg(imageData, x + x2, y + y2);
                            //mb += getb(imageData, x + x2, y + y2);
                        }
                        pt += 4 * (ImageData.width - msizex);
                    }
                    let dotnum = msizex * msizey;
                    mr = Math.floor(mr / dotnum);
                    mg = Math.floor(mg / dotnum);
                    mb = Math.floor(mb / dotnum);
                    ma = Math.floor(ma / dotnum);

                    // 平均化した色でモザイクの長方形を塗る
                    pt = (x + y * ImageData.width) * 4;
                    for (let y2 = 0; y2 < msizey; y2++) {
                        for (let x2 = 0; x2 < msizex; x2++) {
                            newData[pt] = mr;
                            newData[pt + 1] = mg;
                            newData[pt + 2] = mb;
                            newData[pt + 3] = ma;
                            pt += 4;
                            // 下記のほうがわかりやすいが、上記のほうが高速なので上記を採用する
                            // drawpixel(newImageData, x + x2, y + y2, mr, mg, mb, 255);
                        }
                        pt += 4 * (ImageData.width - msizex);
                    }
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
                //inProcess[x / 4] = true;
                const seed = scanToLeftRightfromSeed(x);
                createSeedfromOldMinMax(seed.fillmin, seed.fillmax);
                //inProcess[x / 4] = false;
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

}
