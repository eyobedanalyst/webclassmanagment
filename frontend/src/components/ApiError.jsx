function ApiError({
    message = "Something went wrong."
}) {

    return (

        <div className="api-error">

            <strong>
                Unable to load data
            </strong>

            <p>
                {message}
            </p>

        </div>
    );
}


export default ApiError;