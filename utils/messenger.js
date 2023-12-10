const error = {
    ArgumentMustBe: (validValue) => {
        return `TypeError:Argument must be a ${validValue} .`
    },
    undefinedArgument: (value) => {
        if(value){
            return `Argument${value} a not found`
        }
        else{
            return `TypeError:Argument is undefined`
        }
    },
    isInvalidArgument:(value)=>{
        if(value){
            return `TypeError:${value} is invalid argument`
        }
        else{
            return `TypeError:Argument is invalid`
        }
    },
    isInvalidValue: (value) => {
        return `TypeError:${value}is an invalid`
    },
    
}
export{error}