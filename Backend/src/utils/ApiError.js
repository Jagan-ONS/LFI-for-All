class ApiError extends Error {
    //error will be handled by node js 
    //but the response is handled by express
    constructor(
        statusCode,
        message = "Something went wrong !!",
        errors = [],
        stack = ""
    ){
        super(message)
        this.statusCode = statusCode
        this.data = null
        //what does data contains 
        this.message = message
        this.success = false
        this.errors = errors
        //what is stack 
        if(stack){
            this.stack = stack
        }
        else{
            Error.captureStackTrace(this,this.constructor)
        }
    }
}

export {ApiError}
