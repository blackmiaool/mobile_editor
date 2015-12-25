/*
 * jQuery File Upload Plugin JS Example
 * https://github.com/blueimp/jQuery-File-Upload
 *
 * Copyright 2010, Sebastian Tschan
 * https://blueimp.net
 *
 * Licensed under the MIT license:
 * http://www.opensource.org/licenses/MIT
 */

/* global $, window */

$(function () {
    'use strict';
    $('.fud').each(function () {
        $(this).fileupload({
            getFilesFromResponse: function (data) {
//                {"code":0,"message":"ok","result":{"urls":{"file":"http:\/\/static.home.mi.com\/app\/image\/get\/file\/common_image_1448864430dovz7e46.jpg"}}}
                console.log("data",data);
                if (data.result.result && data.result.code==0) {
                    console.log([{urls:data.result.result}])
                    return [{url:data.result.result}];
                }
                return [];
            },
            // Uncomment the following to send cross-domain cookies:
            //xhrFields: {withCredentials: true},
            url: 'http://support.io.mi.srv/shop/uploadpic'
        });

        // Enable iframe cross-domain access via redirect option:
//        $(this).fileupload(
//            'option',
//            'redirect',
//            window.location.href.replace(
//                /\/[^\/]*$/,
//                '/cors/result.html?%s'
//            )
//        );


        // Load existing files:
        $(this).addClass('fileupload-processing');
        for (var i = 0; i < 3; i++) {
            $.ajax({
                // Uncomment the following to send cross-domain cookies:
                //xhrFields: {withCredentials: true},
                url: $(this).fileupload('option', 'url'),
                dataType: 'json',
                context: $(this)[0]
            }).always(function () {
                $(this).removeClass('fileupload-processing');
            }).done(function (result) {
                $(this).fileupload('option', 'done')
                    .call(this, $.Event('done'), {
                        result: result
                    });
            });
        }


    })
});