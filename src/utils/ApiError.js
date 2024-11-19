class ApiError extends Error{
    constructor(
        statusCode,
        message="Something went wrong",
        errors=[],//errors could be many so provide []
        stack=""
    ){
        super(message) 
        this.statusCode=statusCode
        this.errors=errors
        this.data=null
        this.message=message
        this.success = false

        if(stack){
            this.stack=stack
        }else{
            Error.captureStackTrace(this , this.constructor)
        }
    }
}


export{ApiError}