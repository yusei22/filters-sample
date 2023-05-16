function GetRGBFromArgument(dt0, dt1, dt2, dt3) {
    let R, G, B, A
    if (Array.isArray(dt0)) {
      const array=dt0.slice();
        for (let i = 0; i < 4; i++) {
            if (typeof array[i] !== 'number') {
                console.warn(createMassage.invalid('Argument'));
                array[0]=0;array[1]=0;array[2]=0;array[3]=0;
                break;
            }
        }
        const Acolor = typeof array[3] !== 'undefined' ? array[3] : 0;
        R = array[0]; G = array[1]; B = array[2]; A = Acolor;
        return { R: R, G: G, B: B, A: A }
    }
    else if (typeof dt0 === 'number'&& typeof dt1 ===  'number'&&typeof dt2 === 'number') {
        const Acolor = typeof dt3 !== 'undefined' ? dt3 : 0;
        R = dt0; G = dt0; B = dt0; A = Acolor;
        return { R: R, G: G, B: B, A: A }
    }
    else {
      R = 0; G = 0; B = 0; A = 0;
      return { R: R, G: G, B: B, A: A }
    }  
}
function getColorDistance(color1,color2){
        const red = 0.3;
        const green = 0.59;
        const blue = 0.11;
        const distance = Math.pow(((color2[0] - color1[0]) * red), 2) + Math.pow(((color2[1] - color1[1]) * green), 2) + Math.pow(((color2[2] - color1[2]) * blue), 2);
        return distance;
}
export{GetRGBFromArgument,getColorDistance}