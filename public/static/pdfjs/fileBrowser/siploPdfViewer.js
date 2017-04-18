/**
 * Created by buddhikajay on 5/25/16.
 * This file is used to customize functions of PDFJS's viewer
 * the variable DEFAULT_URL is defined in viewer.js
 */

// this is a useful linl : https://www.sitepoint.com/custom-pdf-rendering/

// following are the global scope variables to be used by both js and paper-script files
var room;
var uid;
var IsPDFOn = false; // variable used to synchronize edit pdf btn functionality on draw js
var isInitializedByMe=false;
// Initialise Socket.io
var socket = io.connect('/');

//to sync scrolling pdf
var prevPos=0;
var scrollSyncThreshold = 50;//number of pixels scrolled to trigger sync
var DEFAULT_URL ='';

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
$(function () {
    $('#refresh').on('click',function () {
        console.log("refresh");
        $('#container').jstree(true).refresh();
    });
});

/*
$(function() {
    $('#container').jstree({
        'core' : {
            'data' : {
                "url" : location.protocol+"//"+location.host+"/tree/",
                //"url" : "http://"+location.host+"/tree/",
                "data" : function (node) {
                    return { "id" : node.id };
                }
            }
        }
    });
});

/* Select PDF file from file directory*/
/*
$(function(){
    $('#container').on("changed.jstree", function (e, data) {
        //console.log(data.instance.get_selected(true)[0].text);
        //console.log(data.instance.get_node(data.selected[0]).li_attr.isLeaf);

        //if the selected node is a leaf node -> enable the open button
        var openFileButton = $('#openFileButton')
        if(data.instance.get_node(data.selected[0]).li_attr.isLeaf){
            openFileButton.prop('disabled', false);
            
            //following function is defined as a separate function to 'open pdf files' below
            
            //openFileButton.click(function(){
            //    console.log('openning ' + data.instance.get_selected(true)[0].text);
            //    //PDFViewerApplication is an object defined in viewer.js
            //    //PDFViewerApplication.open('/web/compressed.tracemonkey-pldi-09.pdf');
            //    $('#fileBrowserModal').modal('hide');
            //    PDFViewerApplication.open('/files/'+data.instance.get_selected(true)[0].text);
            //    socket.emit('pdf:load', room, uid, data.instance.get_selected(true)[0].text);
            //});
            
            DEFAULT_URL = data.instance.get_selected(true)[0].text;
            
        }
        else {
            $('#openFileButton').prop('disabled', true);
        }
    });
});
*/
//show file browser moadal
$(function(){
    $('#browsFiles').on('click', function(){
        console.log('Can Browse Files');
        $('#fileBrowserModal').modal('show');
    });
});

//open pdf file
$(function(){
    $('#openFileButton').click(function(){
        console.log('openning ' + DEFAULT_URL);
        //PDFViewerApplication is an object defined in viewer.js
        //PDFViewerApplication.open('/web/compressed.tracemonkey-pldi-09.pdf');
        $('#fileBrowserModal').modal('hide');
        PDFViewerApplication.open('/user_files/batch-12-Module-CS2036/'+DEFAULT_URL);
        var documentViewer = $('#documentViewer');
        if (documentViewer.css('visibility') == 'hidden') {
            documentViewer.css('visibility', 'visible');
            //dynamically assigning the background color and image as in viewer.css #230. Otherwise
            //this background color for body tag will make conflicts with whiteboard
            $('body').css('background-color', '#404040');
            $('#myCanvas').css('top','32px'); // pull down the canvas so that we can still use pdfjs control buttons while editing on top of pdf
        }
        IsPDFOn = true;
        isInitializedByMe = true;
        socket.emit('pdf:load', room, uid, DEFAULT_URL);
    }); 
});

/* Go to next page of the loaded PDF file*/

// $(function(){
//     $('#toolbarViewerLeft .toolbarButton.pageDown').click(function(){
//         socket.emit('pdf:pageChange', room, uid, PDFViewerApplication.page+1);
//     });
// });
//
// /* Go to previous page of the loaded PDF file*/
//
// $(function(){
//     $('#toolbarViewerLeft .toolbarButton.pageUp').click(function(){
//         socket.emit('pdf:pageChange', room, uid, PDFViewerApplication.page-1);
//     });
// });
//
// /*Zoom In*/
// $(function(){
//     $('#zoomIn').click(function(){
//         console.log('zooming in from '+PDFViewerApplication.pdfViewer.currentScaleValue);
//         socket.emit('pdf:zoom', room, uid, PDFViewerApplication.pdfViewer.currentScaleValue+0.1);
//     });
// });
//
// /*Zoom Out*/
// $(function(){
//     $('#zoomOut').click(function(){
//         socket.emit('pdf:zoom', room, uid, PDFViewerApplication.pdfViewer.currentScaleValue-0.1);
//     });
// });

/*Presentation Mode*/
$(function (){
    $('#presentationMode').click(function(){
        console.log('Entering to presentation mode');
        socket.emit('pdf:presentationMode', room, uid);
    });
});



//These events are emited in pdf js. Please refer viewer.js
$(document).bind('pagechange', function (e) {
    console.log('Page changed .'+PDFViewerApplication.page+'event page'+e.pageNumber);
    //socket.emit('pdf:pageChange', room, uid, PDFViewerApplication.page);
});

$(document).bind('scalechange', function (e) {
    console.log('Scale Change .'+PDFViewerApplication.pdfViewer.currentScaleValue);
    socket.emit('pdf:zoom', room, uid, PDFViewerApplication.pdfViewer.currentScaleValue);
});

$(document).bind('documentload', function (e) {
    console.log('document Change .'+PDFViewerApplication.pdfViewer.pdfDocument);
    //socket.emit('pdf:zoom', room, uid, PDFViewerApplication.pdfViewer.currentScaleValue);
});
$(document).bind('updateviewarea', function (e) {
    console.log('updateviewarea '+PDFViewerApplication.pdfViewer.scroll.down+' '+PDFViewerApplication.pdfViewer.scroll.lastY);
    if(isInitializedByMe)
        socket.emit('pdf:scroll', room, uid, PDFViewerApplication.pdfViewer.scroll.lastY);
});


$('#viewerContainer').scroll(function(){

    // var position = $('#viewerContainer').scrollTop();
    // if((myRole==TUTOR_ROLE)&&((prevPos-position)>scrollSyncThreshold||(prevPos-position)<(-scrollSyncThreshold))) {
    //     socket.emit('pdf:scroll', room, uid, position);
    //     prevPos=position;
    // }

});