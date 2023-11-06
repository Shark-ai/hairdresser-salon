const request = {

    get: function(url, success, method = "GET"){

        let xhttp = request.createHTTP(success);

        xhttp.open(method, url);
        xhttp.send();
    },

    post: function(url, body, success){
        let xhttp = request.createHTTP(success);

        xhttp.open("POST", url);
        xhttp.setRequestHeader("Content-type", "application/json");
        xhttp.send(JSON.stringify(body));
    },

    delete: function(url, success){
        request.get(url, success, "DELETE");
    },

    createHTTP: function(cbFn){
        const xhr = new XMLHttpRequest();

        xhr.onreadystatechange = function(){
            if (xhr.readyState == 4 && xhr.status == 200)
                cbFn(xhr.responseText);
        }

        return xhr;
    }
}

export { request };