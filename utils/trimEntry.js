import *as CreateMassage from './messenger.js'
function RGB(dt0, dt1, dt2, dt3) {
    let R, G, B, A
    if (Array.isArray(dt0)) {
        const array = dt0.slice();
        for (let i = 0; i < 4; i++) {
            if (typeof array[i] !== 'number' && array[i] <= 255) {
                console.warn(CreateMassage.error.ArgumentMustBe('number'));
                array[0] = 0; array[1] = 0; array[2] = 0; array[3] = 0;
                break;
            }
        }
        const Acolor = typeof array[3] !== 'undefined' ? array[3] : 0;
        R = array[0]; G = array[1]; B = array[2]; A = Acolor;
        return { R: R, G: G, B: B, A: A }
    }
    else if (typeof dt0 === 'number' && typeof dt1 === 'number' && typeof dt2 === 'number'
        && dt0 <= 255 && dt1 <= 255 && dt2 <= 255
    ) {
        const Acolor = typeof dt3 === 'number'&&dt3 <= 255 ? dt3 : 0;
        R = dt0; G = dt0; B = dt0; A = Acolor;
        return { R: R, G: G, B: B, A: A }
    }
    else {
        R = 0; G = 0; B = 0; A = 0;
        return { R: R, G: G, B: B, A: A }
    }
}
function Number(Number, defaultNumber) {

}
export { RGB, }