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
const getColorDistance = ColorOP.getColorDistance;
export class GAZ {
    constructor(ImageData, Context) {
        this.ImageData = ImageData;
        this.Context = Context;
    }
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
    }
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
    async ScanlineSeedFill({ x = 0, y = 0, ImageData = this.ImageData, Context = this.Context, difference = 100, colorAfterApplying = [0, 0, 0, 0] }) {
        const newImageData = this.Duplicate(ImageData, Context).ImageData;
        const newdata = newImageData.data;
        const width = ImageData.width;
        const datawidth = width * 4
        const firstRedPos = this.getColorIndicesForCoord(x, y);
        const dmRGB = newdata.slice(firstRedPos, firstRedPos + 4)
        const aaRGB = Checker.array.allTypesAre(colorAfterApplying, 'number') ? colorAfterApplying : [0, 0, 0, 0];
        const lightDifference=difference<125?difference:124;
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
        let newGAZ
        await new Promise((resolve) => {
            const firstSeed = scanToLeftRightfromSeed(firstRedPos);
            createSeedfromOldMinMax(firstSeed.fillmin, firstSeed.fillmax);
            resolve();
        })
        .catch(()=>{
            newGAZ= new GAZ(newImageData, Context);
        })
        .finally(()=>{
            newGAZ= new GAZ(newImageData, Context);
        })
        return newGAZ;
    }

}
