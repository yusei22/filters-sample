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
export{array}
