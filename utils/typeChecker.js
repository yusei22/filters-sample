const array={
    allTypesAre : (array, type) => {
        for (let i = 0; i < array.length; i++) {
            if (typeof array[i] !== type) {
                return false;
            }
        }
        return true;
    },
    includetype  :(array, type) => {
        for (let i = 0; i < array.length; i++) {
            if (typeof array[i] === type) {
                return true;
            }
        }
        return false;
    }
}
const imageData={
    isImageData:(imagedata)=>{
        if(imagedata instanceof ImageData){
            return true;
        }
        else{
            return  false;
        }
    },
}
export{array,imageData}
