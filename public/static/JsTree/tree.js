$(function() {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            // console.log(this.response);


        }
    };
//console.log('https://files.obmcse.xyr/connectors/php/filemanager.php?mode=initiate');
    xhttp.open("GET", 'https://files.obmcse.xyr/connectors/php/filemanager.php?mode=initiate', false);

    xhttp.getResponseHeader('Set-Cookie');
    xhttp.send();

});

$(function() {

    $('#container').jstree({
        "core": {
            "animation": 0,
            "check_callback": true,
            "themes": {"stripes": true},
            'data': function (node, cb) {

                //console.log(node);

                if (node.id === '#') {
                    //	console.log('root');

                    getData(this.parent, 'https://files.obmcse.xyr/connectors/php/filemanager.php?mode=getfolder&path=/', cb);

                }
                else if (node.type === 'folder') {
                    //	console.log(node);
                    var url = 'https://files.obmcse.xyr/connectors/php/filemanager.php?mode=getfolder&path=' + node.a_attr.href;

                    getData(this.parent, url, cb);

                }


            }
        },
        "types": {
            "#": {
                "max_children": 1,
                "max_depth": 4,
                "valid_children": ["root"]
            },
            "root": {
                "icon": "/static/3.3.4/assets/images/tree_icon.png",
                "valid_children": ["default"]
            },
            'folder': {},
            'file': {}
        },
        "plugins": [
            "contextmenu", "dnd", "search",
            "state", "types", "wholerow"
        ]
    });
});
$(function() {
    $('#container').on("changed.jstree", function (e, data) {

        if (data.node != null && data.node.type == 'file') {
            DEFAULT_URL = 'https://files.obmcse.xyr/connectors/php/filemanager.php?mode=download&path=' + data.selected;
        }


    });
});
function getData (obj,url ,cb){
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200)
        {
            //console.log(this.response);

            cb.call( obj,
                jsonConverter((JSON.parse(this.response)).data,url));


        }
    };
    //console.log(url);
    xhttp.open("GET", url, true);
    xhttp.withCredentials = true;

    xhttp.send();
}
var jsonConverter = function (data,url){
    var obj=[];

    dataLength = data.length;
    //console.log(dataLength);
    for (i = 0;i<dataLength;i++){
        //	console.log(i+"i");
        //  console.log(data[i] +"data");
        var o ={};
        o.id = data[i].id;

        h = {}
        h.href = data[i].attributes.path;
        o.a_attr = h;

        o.text = data[i].attributes.name;
        o.children = false;
        o.state = {"opened" : false };
        o.type = data[i].type;
        if(data[i].type === 'folder'){
            o.children = true;
        }
        else {


            //    console.log(data[i].attributes.extension);
            if(data[i].attributes.extension=='jpg'  || data[i].attributes.extension=='JPG'  || data[i].attributes.extension=='jpeg' || data[i].attributes.extension=='png'){
                o.icon ='/wb_assets/static/img/jstreeimage.png';
            }
            else if(data[i].attributes.extension == 'pdf'){
                o.icon ='/wb_assets/static/img/jstreepdf.png';
            }
        }
        obj.push(o);
    }

    //console.log(obj);
    return obj;

}
