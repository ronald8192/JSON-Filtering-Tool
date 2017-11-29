let logFileContent = "";

let operators = {
    eq: (a,b)=>{return a==b},
    typeEq: (a,b)=>{return a===b},
    neq: (a,b)=>{return a!=b},
    gt: (a,b)=>{return a>b},
    lt: (a,b)=>{return a<b},
}

function getValueFromObject(obj, key) {
    if(obj === null || obj === undefined) {
        return "NO_VALUE"
    }
    if(obj === NaN){
        return "NaN"
    }
    if(key.length == 0){
        return obj;
    } else if(key.length == 1) {
        return (key[0] in obj) ? obj[key[0]] : "NO_VALUE"
    } else {
        return (key[0] in obj) ? getValueFromObject(obj[key[0]], key.slice(1, key.length)) : "NO_VALUE"
    }
}

function filter(rec, previous, filters) {
    if(filters.length == 0){
        return previous
    } else if(filters.length == 1) {
        return previous && operators[filters[0].operator](getValueFromObject(rec,filters[0].k.split(".")), filters[0].v)
    } else {
        return previous 
        && filter(rec, operators[filters[0].operator](
        	    getValueFromObject(rec,filters[0].k.split(".")), filters[0].v),
                filters.slice(1,filters.length)
            )
    }
}

function parseLog(logs, filters) {
    return logs.map(records=>records.Records.filter(rec=>filter(rec, true, filters))).reduce((x,y)=>x.concat(y))
}

    // function objectDeepKeys(obj){
    //     let keys = Object.keys(obj)
    //     let childkey = keys.map((key,i,arr)=>{
    //         if(obj[key] instanceof Object){
    //             let child = objectDeepKeys(obj[key]).map(k=>`${key}.${k}`)
    //             console.log(`current:${key}, child:${child}`)
    //             arr.splice(i,1)
    //             return child
    //         }
    //     })
    //     childkey = childkey.filter(k=>k!=undefined && k.length>0)
    //     if(childkey.length > 0 && (childkey[0] instanceof Array)){
    //         childkey = childkey.reduce((accumulator, currentValue) => accumulator.concat(currentValue));
    //     }
    //     return keys.concat(childkey)
    // }

    // return keys even the item is object
    function objectDeepKeys(obj) {
        return Object.keys(obj)
        .filter(key => obj[key] instanceof Object)
        .map(key => objectDeepKeys(obj[key]).map(k => `${key}.${k}`))
        .reduce((x, y) => x.concat(y), Object.keys(obj))
    }


$(()=>{

    $("#select-file").click(function(e){
        e.preventDefault()
        $("#jsonfile").click()
    })

    $("#filter-add").click(function(e){
        e.preventDefault();
        $("#template-filter-conditions > div").clone().appendTo($(".filter-key-value"))
    })

    let csvDownloadContent = ""
    $("#run").click(()=>{
        $("#output").html("")
        $("#output-pre").html("")

        let filters = []
        $.each($(".filter-key-value").find(".filter-key"), (k,v) => {
            filters.push({
                k : v.value,
                v : $(".filter-key-value").find(".filter-value").eq(k).val(),
                operator: $(".filter-key-value").find(".filter-operater").eq(k).val()
            })
        })
        // console.log(filters)
        let matchedRecords = parseLog(JSON.parse(logFileContent), filters)
        if(matchedRecords.length > 0){
        	$("#matched-count").text(matchedRecords.length)
            let preferedAttributes = $("#attrib-to-show").val().trim().split("\n").filter(x=>x!="").map(x=>x.split("."))
            let csv = ""
            if(preferedAttributes.length == 0){
                matchedRecords.map(record => 
                    preferedAttributes = preferedAttributes.concat(
                        objectDeepKeys(record).filter(recordKeys => preferedAttributes.indexOf(recordKeys) < 0)
                        )
                    )
                preferedAttributes = preferedAttributes.map(k=>k.split("."))
                preferedAttributes = preferedAttributes.filter(recordKeys => !(getValueFromObject(matchedRecords[0],recordKeys) instanceof Object))
                $("#attrib-to-show").val(preferedAttributes.map(attrib=>attrib.join(".")).join("\n"))
            }

            let csvHeader = $("#attrib-to-show").val().trim().split("\n").join(",")
            csv = matchedRecords.reduce((a,b)=>`${a}<br>${preferedAttributes.map(x=>getValueFromObject(b,x))}`,csvHeader)
            csvDownloadContent = matchedRecords.reduce((a,b)=>`${a}\n${preferedAttributes.map(x=>getValueFromObject(b,x))}`,csvHeader)
            
            $("#output").append(csv)
            $("#output").append($("<hr />"))
            $("#output-pre").append(JSON.stringify(matchedRecords, null, 4))
        } else {
            $("#output").append("No matched record.")
        }
    })

    $("#result-download-csv").click(function(){

        function download(filename, text) {
            var element = document.createElement('a');
            element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
            element.setAttribute('download', filename);

            element.style.display = 'none';
            document.body.appendChild(element);

            element.click();

            document.body.removeChild(element);
        }
        download(`filter-${(new Date()).getTime()}.csv`, csvDownloadContent)
    })

    $("#jsonfile").change((e)=>{
        let files = e.target.files
        if(files.length > 0){
            if (files[0].type.match('json')){
            	$("#selected-file-name").text(files[0].name)
                var reader = new FileReader();
                reader.addEventListener("load", (event) => {
                    var textFile = event.target;
                    var div = document.createElement("div");
                    logFileContent = `[${textFile.result.trim().split("\n").join(",")}]`

                });
                //Read the text file
                reader.readAsText(files[0]);
        	} else {
        		$("#selected-file-name").text("Please select a json file...")
        	}
        }
    })

})