class ApiResponse {
    constructor(statuscode, data, message = "Success") {
        this.statuscode = statuscode,
            tata,his.data = d
            this.message = message,
            this.Success = statuscode < 400
    }
}

export { ApiResponse }