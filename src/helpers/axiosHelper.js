
const AUTH_BASE_URL = process.env.NEXT_PUBLIC_AUTH_API;

const errorResponse = (error) => {
    return {
        error: true,
        errorMessage: error?.response?.data?.message[0]?.error_code || "Something went wrong",
        data: null,
    };
};

export const postRequest = async (args) => {
    try {
        var myHeaders = new Headers();

        myHeaders.append("Content-Type", "application/json");

        var raw = JSON.stringify(args.body);

        var requestOptions = {
            method: 'POST',
            headers: myHeaders,
            body: raw,
        };

        const response = await fetch(`${AUTH_BASE_URL}${args.url}`, requestOptions)
            .then(response => response.text())
            .then(result => {
                return JSON.parse(result);
            })
            .catch(error => console.log('error fetch', error));

        if (response.data, response.is_complete) {
            return {
                error: false,
                data: response.data,
                errorMessage: null,
            };
        }
        return {
            error: true,
            errorMessage: (response.errors && response.errors.length > 0) ? response.errors[0].msg : 'Something went wrong',
            data: null,
        };
    } catch (error) {
        return errorResponse(error)
    }
}

export const getRequest = async (args) => {

    try {

        var myHeaders = new Headers();
        myHeaders.append("Authorization", `Bearer ${args.token}`);

        var requestOptions = {
            method: 'GET',
            headers: myHeaders
        };

        const response = await fetch(AUTH_BASE_URL + args.url, requestOptions)
            .then(response => response.text())
            .then(result => {
                console.log('fetch get', JSON.parse(result))
                return JSON.parse(result);
            }).catch(error => console.log('error', error));

        if (response.data) {
            return {
                error: false,
                data: response.data,
                errorMessage: null,
            };
        }
        return {
            error: true,
            errorMessage: response.errors ? response.errors[0].msg : 'Something went wrong',
            data: null,
        };
    } catch (error) {
        return errorResponse(error)
    }
}
