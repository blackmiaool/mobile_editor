if (window.location.href[7] === "1") {
    var url = "http://localhost:8088//common";
    var url_short = "http://localhost:8088//"
} else {
    var url = "http://support.io.mi.srv/common";
    var url_short = "http://support.io.mi.srv/"
}
var the_url1 = url + "/if_editor_data";
var the_url2 = url + "/if_editor_addon";
var sys_setting_global;
angular.module("main", ["dndLists", "contenteditable", "ngAnimate", "ngRoute", "angularFileUpload"])
    .animation('.editor-document-slide', function () {
        var NG_HIDE_CLASS = 'ng-hide';
        return {
            beforeAddClass: function (element, className, done) {
                if (className === NG_HIDE_CLASS) {
                    element.slideUp(done);
                }
            },
            removeClass: function (element, className, done) {
                if (className === NG_HIDE_CLASS) {
                    element.hide().slideDown(done);
                }
            }
        };
    })
    .factory("globalShareData", function () {
        return {
            miao_parse: function (str) {
                try {
                    eval("var a=" + str);

                } catch (e) {
                    console.log(e);
                    a = false;
                }
                return a;

            }
        };
    })
    .factory("globalPropData", function () {
        return {
            prop: {}

        };
    })
    .factory("editorModels", ["$http", "$rootScope", "globalShareData", "$timeout", function ($http, $rootScope, globalShareData, $timeout) {
        var service = {}
        console.log("get server models")
        $http({
            method: 'POST',
            url: the_url2,
            data: {
                action: "list",
            }
        }).
        success(function (data, status, headers, config) {
            console.log("server models列表", data)
                //            service.list = data.result.list;
                //            console.log("model列表", data, data.result)
                //            data.result.forEach(
                //                function (d) {
                //                    console.log(d)
                //                }
                //            )
            data.result.forEach(
                function (model) {
                    //                    console.log("server", model)
                    try {
                        var json = JSON.parse(model.data)
                        if (!json)
                            return;
                    } catch (e) {
                        console.warn("Parse model failed with error.", model);
                        return;
                    }


                    if (json && json.form) {
                        //                        console.log(json)
                        json.form = globalShareData.miao_parse(json.form);

                        var model_this = {};
                        model_this.editor_model_config = {
                            preview: true,
                            kind: json.kind,
                            model_data: json.form,
                            name: model.name
                        }
                        model_this.editor_general_block_style = clone(general_block_default_style);
                        model_this.editor_model_config.source = "server";
                        if (model_this.editor_model_config.model_data) {

                            model_this.editor_model_config.default_data = get_jsonform_default_value(model_this.editor_model_config.model_data);
                        }
                        model_this.editor_model_tpl = json.model;
                        //                        console.log(model)

                        $rootScope.$emit('softAppendModel', model_this)
                        MIOTEDITOR.models.push(model_this)
                        $timeout(
                            function () {
                                $rootScope.appendModel(model_this);
                            }
                        )

                    } else {
                        console.warn("Parse model failed.", model_this)
                    }

                }
            )

        }).
        error(function (data, status, headers, config) {
            alert(status);
        });
        return service;
    }])
    .config(['$compileProvider', function ($compileProvider) {
        $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|chrome-extension|smarthome):/);
    }])
    .controller("rootController", ["$scope", "$http", "$timeout", "$rootScope", "modelData", "FileUploader", function ($scope, $http, $timeout, $rootScope, modelData, FileUploader) {
        $rootScope.title = "未命名文档";
        $scope.$rootScope = $rootScope;
        $scope.saving = false;
        $scope.export = function (data) {
            if (data) {
                exp(data);
            } else {
                preview_load(get_pure_html(), exp)
            }

            function generate_json() {
                var output = [];

                modelData.models.lists.forEach(function (v, i) {
                    switch (v.editor_model_config.name) {
                        case "img": {
                            output.push({
                                Img:v.src
                            })
                            break;
                        }
                        case "img_nogap": {
                            output.push({
                                Img:v.src
                            })
                            break;
                        }
                    }
                });
                return JSON.stringify(output);
            }

            function exp(data) {
                var id;
                if (!$scope.document_id) {
                    id = undefined;
                } else {
                    id = $scope.document_id;
                }
                console.log(data);
                codemirror_editor.setValue(data);
                $("#editor-generated-json").val(generate_json());
                $http({
                    method: 'POST',
                    url: the_url1,
                    data: {
                        action: "upload",
                        html: data,
                        id: id,
                    }
                }).
                success(function (data, status, headers, config) {
                    console.log(data)
                    $http({
                        method: 'POST',
                        url: the_url1,
                        data: {
                            action: "get",
                            id: id,
                        }
                    }).
                    success(function (data, status, headers, config) {
                        $scope.editor_html_href = data.result.url;
                        $('#editor_html_qrcode').empty();
                        $('#editor_html_qrcode').qrcode($scope.editor_html_href);

                    }).
                    error(function (data, status, headers, config) {
                        alert(status);


                    });

                }).
                error(function (data, status, headers, config) {
                    alert(status);


                });
            }

        }
        setInterval(function () {
                $http({
                    method: 'POST',
                    url: url + "/if_mail",
                    data: {
                        receiver: "sunqimin@xiaomi.com",
                        title: "MIOT编辑器自动备份-" + $rootScope.title,
                        content: (escape(JSON.stringify(modelData.models))),

                    }
                }).success(function (data, status, headers, config) {
                    console.log(data)

                })
            }, 1000 * 60 * 10) //10min       

        $scope.save = function () {
            var id;
            if (!$scope.document_id) {
                id = undefined;
            } else {
                id = $scope.document_id;
            }
            console.log(modelData)
            if (!modelData.globalPropData) {
                set_global_prop_data();
            }
            $scope.saving = true;
            $http({
                method: 'POST',
                url: url + "/if_mail",
                data: {
                    receiver: "sunqimin@xiaomi.com",
                    title: "MIOT编辑器保存时备份-" + $rootScope.title,
                    content: escape(JSON.stringify(modelData.models))

                }
            }).success(function (data, status, headers, config) {
                //                console.log(data)

            })
            $http({
                method: 'POST',
                url: the_url1,
                data: {
                    action: "put",
                    title: $rootScope.title,
                    content: JSON.stringify(modelData.models),
                    id: id,
                }
            }).
            success(function (data, status, headers, config) {
                console.log(data)
                $scope.saving = false;
                $scope.document_id = data.result.id;
            }).
            error(function (data, status, headers, config) {
                alert(status);
                $scope.saving = false;

            });
        }
        var uploader = $scope.uploader = new FileUploader({
            url: url_short + '/image/cdnupload'
        });

        // FILTERS

        uploader.filters.push({
            name: 'imageFilter',
            fn: function (item /*{File|FileLikeObject}*/ , options) {
                var type = '|' + item.type.slice(item.type.lastIndexOf('/') + 1) + '|';
                return '|jpg|png|jpeg|bmp|gif|'.indexOf(type) !== -1;
            }
        });

        // CALLBACKS

        uploader.onWhenAddingFileFailed = function (item /*{File|FileLikeObject}*/ , filter, options) {
            console.info('onWhenAddingFileFailed', item, filter, options);
        };
        uploader.onAfterAddingFile = function (fileItem) {
            console.info('onAfterAddingFile', fileItem);
            fileItem.upload();
        };
        uploader.onAfterAddingAll = function (addedFileItems) {
            console.info('onAfterAddingAll', addedFileItems);
        };
        uploader.onBeforeUploadItem = function (item) {
            //            console.info('onBeforeUploadItem', item);
        };
        uploader.onProgressItem = function (fileItem, progress) {
            //            console.info('onProgressItem', fileItem, progress);
        };
        uploader.onProgressAll = function (progress) {
            //            console.info('onProgressAll', progress);
        };
        uploader.onSuccessItem = function (fileItem, response, status, headers) {
            //            console.info('onSuccessItem', fileItem, response, status, headers);
        };
        uploader.onErrorItem = function (fileItem, response, status, headers) {
            //            console.info('onErrorItem', fileItem, response, status, headers);
        };
        uploader.onCancelItem = function (fileItem, response, status, headers) {
            //            console.info('onCancelItem', fileItem, response, status, headers);
        };
        uploader.onCompleteItem = function (fileItem, response, status, headers) {
            //            console.info('onCompleteItem', fileItem, response, status, headers);
            fileItem.remote_url = response.result.urls.file;
            switch (fileItem.target) {
            case "edit":
                {
                    for (var i in MIOTEDITOR.models) {
                        var model = MIOTEDITOR.models[i];
                        if (model.editor_model_config.name == "img") {
                            var pic = clone(model);
                            pic.editor_model_config.initialized = true;
                            pic.src = fileItem.remote_url;
                            $rootScope.$emit("appendModel", pic)
                        }
                    }
                    break;
                }
            }
            //            console.log(response.result.urls);
        };
        uploader.onCompleteAll = function () {
            //            console.info('onCompleteAll');
        };

        //    console.info('uploader', uploader);



    }])
    .filter("toollist", function () {
        return function (model_name) {
            //            console.log(model_name);
        };
    })
    .controller("editorFormController", function ($scope) {
        $scope.submit = function (values1, values2, index) {
            //            console.log(values)
            $scope.$emit("form_submit", values1, values2, index)
        }
        $scope.close = function () {
            $scope.$emit("form_close")
        }
        $scope.change = function () {

        }

    })
    .factory("sysSettingData", function () {
        var model = {
            schema: {
                developer_mode: {
                    type: "boolean",
                    title: "开发者模式",
                    default: true,
                },
                use_contextmenu: {
                    type: "boolean",
                    title: "开启右键菜单",
                    default: true,
                },
                clean_mode: {
                    type: "boolean",
                    title: "纯净模式"
                },
                delay_time: {
                    type: "number",
                    title: "预览更新延迟时间(ms)",
                    default: 1000
                },
            }
        }
        var setting = localStorage.getItem("miot_editor_sys_setting");
        if (setting) {
            setting = JSON.parse(setting);
        } else {
            setting = get_jsonform_default_value(model);
            localStorage.setItem("miot_editor_sys_setting", JSON.stringify(setting));

        }
        model.value = setting;
        sys_setting_global = new function () {
            this.model = model;
            this.value = setting;
        };
        return sys_setting_global;
    })
    .factory("local", function () {
        var head = "miot_editor_"
        return {
            get: function (name, default_value) {
                name = head + name;
                var v = localStorage.getItem(name);
                if (!v) {
                    v = default_value;
                    localStorage.setItem(name, v);
                }
                return v;
            },
            save: function (name, value) {
                name = head + name;
                localStorage.setItem(name, value);
            }
        }
    })
    .directive("editorModel", ["$compile", "$rootScope", function ($compile, $rootScope) {

        return {
            priority: 10,
            scope: true,

            link: function ($scope, element, attr) {

                //                $scope.editor_tool_show = false;
                $scope.set_value = function (values1, values2) {
                    for (var i in values1) {
                        $scope[i] = values1[i];
                    }

                    if (typeof (values2) != "undefined") {
                        $scope.editor_general_block_style = clone(values2);
                    }

                }
                $scope.sync_model = function (tpl) {
                    $scope.editor_model_tpl = tpl;
                    var tools = element.find(".editor-block-tool");

                    element.empty();
                    element.append(tools)
                    var template = $compile($scope.editor_model_tpl)($scope);
                    element.append(template);
                }



                var item = $scope.$parent.item;
                if (!item)
                    return;
                //                console.log($rootScope)
                if (item.editor_model_config) {
                    if (!item.editor_model_config.initialized) {
                        item.editor_model_config.initialized = true;
                        angular.forEach(item.editor_model_config.default_data, function (v, k) {
                            item[k] = v;
                        })
                    }
                }




                //                if(item.editor_model_config){
                //                   item.editor_model_config.model_data.value=item; 
                //                }

                if (typeof (item.$$$init) == "undefined" || !typeof (item.$$$init)) {
                    item.$$$init = true;
                    //                    $scope.data = "www"
                }

                for (var i in item) {
                    if (i[0] != "$" && i != "item" && i != "constructor" && typeof ($scope.$parent[i]) == "undefined") {
                        //                            console.log(i);
                        //                        console.log($scope)
                        $scope[i] = item[i];
                    }
                }

                var template = $compile(item.editor_model_tpl)($scope);
                //                console.log(template)

                element.bind("mouseover", function (e) {

                    //                    console.log("enter");
                    $scope.set_current_model($scope.$index);


                })
                element.bind("dblclick", function (e) {
                    console.log("dbclick")
                })


                element.append(template);

                $scope.$watch(function (value) {
                    //                console.log($scope)

                    for (var i in $scope) {

                        if (i[0] != "$" && i != "item" && i != "constructor" && typeof ($scope.$parent[i]) == "undefined") {
                            //                            if(i=="src"){
                            //                                console.log(i,item[i],$scope[i],"!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
                            //                            }

                            item[i] = clone($scope[i]);

                        }
                    }
                });
            },
        }
    }])
    .controller("mainEditorController", ["$scope", "modelData", "globalPropData", "sysSettingData", "$rootScope", "globalShareData", "$timeout", function ($scope, modelData, globalPropData, sysSettingData, $rootScope, globalShareData, $timeout) {

        var instance = this;
        instance.hide_dialog = hide_dialog;
        instance.show_dialog = show_dialog;
        instance.sys_setting = sysSettingData;
        $rootScope.sys_setting = sysSettingData;
        $scope.instance = instance;
        this.global_prop = globalPropData.prop;
        instance.globalShareData = globalShareData;
        //        instance.globalShareData.editing = "模板编辑";
        instance.hide_dialog();
        $rootScope.$on("appendModel", function (e, model) {
            //            console.log(model);
            //            console.log(typeof(model))
            model.$$hashKey = ""
            $scope.models.lists.push(clone(model));
            $timeout(
                function () {
                    console.log($scope.models);
                    console.log(escape(JSON.stringify($scope.models)));
                    $("#editor-model-put-target")[0].scrollTop = $("#editor-model-put-target")[0].scrollHeight;
                }, 200
            )

        })
        $rootScope.$on("syncModel", function (e, model) {
            //            console.log(model);
            //            console.log(typeof(model))
            $scope.models.lists.forEach(
                function (m, index) {

                    if (m.editor_model_config.name == model.editor_model_config.name) {

                        angular.element(".editor-block[data-index=" + index + "]").scope().sync_model(model.editor_model_tpl)


                    }

                }
            )

        })

        $scope.models = {
            selected: null,
            lists: [],
            globalPropData: globalPropData.prop,
        };
        modelData.models = $scope.models;
        $scope.$on("form_close", function (event) {
            instance.hide_dialog();
        })
        $scope.$on("form_submit", function (event, values1, values2, index) {

            angular.forEach(values1, function (v, k) {
                list[instance.editing_index][k] = v;
            })
            list[instance.editing_index].editor_general_block_style = clone(values2);




            angular.element(".editor-block[data-index=" + index + "]").scope().set_value(values1, values2);

            instance.hide_dialog();

            $rootScope.$digest();


        })
        instance.form_change = function () {
            console.log("change");
            var focusing = $("#editor-data-dialog input:focus,#editor-data-dialog textarea:focus");
            $rootScope.common_dialog_focusing = focusing;
        }

        function tool_set(state) {

            if (state) {
                this.style.color = "steelblue";
            } else {
                this.style.color = "grey";
            }
        }
        var list = $scope.models.lists;

        function show_dialog(name) {
            instance.dialog_name = name;
            instance.show_mask = false;
            instance.show_mask_dialog = true;
            var editor = $("#editor-data-dialog")
            editor.css("left", (parseInt($("body").css("width")) - parseInt(editor.css("width"))) / 2 + "px")
        }

        function hide_dialog() {
            instance.show_mask = false;
            instance.show_mask_dialog = false;
        }
        instance.call_tool = function (name, index) {
            for (var i in instance.editor_tools) {
                if (name == instance.editor_tools[i].name) {
                    return instance.editor_tools[i].callback_wrap(index);
                }
            }
        }
        instance.editor_tools = [
            {
                name: "move_up",
                icon: "glyphicon-chevron-up",
                callback: function (index) {


                    var temp = list[index];
                    list[index] = list[index - 1];
                    list[index - 1] = temp;

                },
                check: function (index) {
                    if (index > 0)
                        return true;
                    else {
                        return false;
                    }
                }
            }
            , {
                name: "data",
                icon: "glyphicon-th-list",
                callback: function (index) {

                    instance.editing_index = index;
                    var editing_model = angular.element(".editor-block[data-index=" + index + "]").scope();
                    var model_data = list[index].editor_model_config.model_data;
                    //                model_data["onSubmitValid"] =
                    //
                    //                    console.log(model_data)
                    var form_body_special = $("#editor-data-dialog").find(".panel-body.editor-form-special-prop");
                    var form_body_general = $("#editor-data-dialog").find(".panel-body.editor-form-general-prop");
                    form_body_special.empty();
                    form_body_general.empty();
                    model_data.value = list[index];
                    form_body_special.jsonForm(model_data);
                    model_data.value = undefined;
                    general_block_form.value = clone(list[index].editor_general_block_style);
                    form_body_general.jsonForm(general_block_form);


                    instance.show_dialog(list[index].editor_model_config.name);
                    //                    console.log(JSONForm.getFormValue(form_body_special));
                    $("#editor-data-dialog").find(".jsonform-submit").click(function () {
                        var values1 = JSONForm.getFormValue(form_body_special);
                        var values2 = JSONForm.getFormValue(form_body_general)

                        angular.element("#editor-data-dialog").scope().submit(values1, values2, index);

                    })
                },
            }, {
                name: "move_dowm",
                icon: "glyphicon-chevron-down",
                callback: function (index) {
                    var temp = list[index];
                    list[index] = list[index + 1];
                    list[index + 1] = temp;
                },
                check: function (index) {
                    if (index < list.length - 1)
                        return true;
                    else {
                        return false;
                    }
                }
}, {
                name: "setting",
                icon: "glyphicon-cog"
}, {
                name: "delete",
                icon: "glyphicon-trash",
                callback: function (index) {
                    if (list[index].editor_model_config) {
                        if (confirm("是否确认删除 类型：" + list[index].editor_model_config.name + " 内容：" + list[index].editor_model_tpl)) {
                            list.splice(index, 1);

                        }
                    }

                    tool_set.call(this, false);

                },

}, ]

        angular.forEach(this.editor_tools, function (tool, index) {
            tool.callback_wrap = function (index) {
                if ((!this.check || this.check(index)) && this.callback)
                    return this.callback.apply(this, arguments)
            }
            tool.check_wrap = function (index) {
                if (index === false) {
                    tool_set.call(this, false);
                } else {

                    if (this.check) {
                        tool_set.call(this, this.check(index));
                    } else {
                        tool_set.call(this, true);
                    }

                }

            }
            tool.style = {
                top: parseInt(index / 2) * 16 + "px",
            };
            //            console.log(tool.style, tool);
            if (index % 2) {
                tool.style.left = "-21px";
            } else {
                tool.style.right = "-21px";
            }
            //            console.log(tool.style);
        })

        this.tool_callback = function (name, index) {

        }
        $scope.mouse_leave = function () {
            //            $scope.editor_tool_show = -1;
            //            console.log("leave")
        }
        $scope.editor_tool_show = -1;
        $scope.set_current_model = function (index) {

            $scope.$apply(
                function () {
                    $scope.editor_tool_show = index;
                    //                    console.log("index", index);
                }
            )

        }

        // Model to JSON for demo purpose
        var preview_timeout = "none";

        function update_preview() {
            //            console.log("update")
            var model = $scope.models;
            list = $scope.models.lists;
            $scope.modelAsJson = angular.toJson(model, true);
            //            console.log("mmwwmm")
            if (preview_timeout != "none")
                clearTimeout(preview_timeout);
            preview_timeout = setTimeout(
                function () {
                    preview_timeout = "none";

                    if (sysSettingData.value.clean_mode) {
                        preview_load(get_pure_html())
                    } else {
                        var contariner = $("#editor-block-container");
                        if (contariner.length)
                            preview_load(contariner[0].outerHTML)
                    }

                }, sysSettingData.value.delay_time
            )
        }
        $rootScope.$on("update_preview", function () {
            update_preview();
        })
        $scope.$watch('models', update_preview, true);
        $rootScope.$watch('title', update_preview, true);
    }])
    .factory('modelData', function () {

        return new function () {

        };
    })
    .controller("modelEditController", ["$scope", "$rootScope", "$timeout", function ($scope, $rootScope, $timeout) {


        var form = $("textarea#editor-model-form-code")
            //        console.log(form)
        codemirror_editor_modelform = CodeMirror.fromTextArea(form[0], {
            matchBrackets: true,
            theme: "neat",
            lineNumbers: true,
            mode: "javascript",
        });

        function blockIndent(editor, from, to) {
            editor.operation(function () {
                for (var i = from; i < to; ++i)
                    editor.indentLine(i, "smart");
            });
        }
        var formvalue = $("#for_fill_form").html();
        formvalue = js_beautify(formvalue);
        codemirror_editor_modelform.setValue(formvalue)
        setTimeout(
            function () {

            }, 1000
        )

        var model = $("textarea#editor-model-code")
        codemirror_editor_model = CodeMirror.fromTextArea(model[0], {
            matchBrackets: true,
            theme: "neat",
            lineNumbers: true,
            mode: "htmlmixed",
        });

        codemirror_editor_model.setValue("<label ng-style='style' contenteditable ng-model='data'>无有依稀挖来喂</label>")

        var test_scope = angular.element("#editor-model-test-div").scope()
        $scope.implement = function () {
            var form_test = $("#editor-model-form-test");
            form_test.empty();
            try {
                eval("var json=" + codemirror_editor_modelform.getValue())
            } catch (e) {
                var err_text = "表格语法错误<br/>";
                err_text += e.message;
                err_text += "<br/>";
                err_text += e.stack;

                form_test.html(err_text)
            }
            var form_err = false;
            try {
                if (typeof (json) != "undefined") {
                    console.log(json);
                    form_test.jsonForm(json)
                }
            } catch (e) {
                form_err = true;
                var err_text = "JsonForm 语法错误<br/>";
                err_text += e.message;
                err_text += "<br/>";
                err_text += e.stack;

                form_test.html(err_text)
            }
            if (!form_err) {
                $("#editor-model-form-test .jsonform-submit").click(
                    function () {
                        console.log("www");
                        test_scope.$apply(
                            function (scope) {
                                scope.set_value(JSONForm.getFormValue(form_test))
                                $timeout(
                                    function () {
                                        preview_load($rootScope.pure_tpl + window["editor-model-test-div"].outerHTML)
                                    }
                                )
                            }
                        )
                    }
                )
            }

            test_scope.set_model(codemirror_editor_model.getValue())
            if (typeof (json) != undefined) {
                test_scope.set_value(get_jsonform_default_value(json))
            }
        }
    }])


var global_prop_form = {
    "schema": {
        "top_bar_title": {
            type: "string",
            title: "文章标题栏内容",
            default: "玩家智能圈",
        },
        style: {
            type: "object",
            title: "全局样式",
            properties: {
                color: {
                    "type": "string",
                    "title": "文字颜色",
                    format: "color",
                    default: "#000000",
                },
                "background-color": {
                    "type": "string",
                    "title": "背景颜色",
                    format: "color",
                    default: "#fff",
                },
                "padding-top": {
                    "type": "string",
                    "title": "上边距",
                    default: "0px",
                },
                "padding-bottom": {
                    "type": "string",
                    "title": "下边距",
                    default: "20px",

                },
                "padding-left": {
                    "type": "string",
                    "title": "左边距",
                    default: "10px",

                },
                "padding-right": {
                    "type": "string",
                    "title": "右边距",
                    default: "10px",
                },
            }
        }

    }
}
var general_block_form = {
    schema: {
        color: {
            type: "string",
            title: "文字颜色",
            format: "color",
            default: "#000000",
        },
        "font-size": {
            type: "string",
            title: "字号",
        },
        "background-color": {
            "type": "string",
            "title": "背景颜色",
            format: "color",
            default: "white",
        },
        "padding-top": {
            "type": "string",
            "title": "上边距",
            default: "0px",
        },
        "padding-bottom": {
            "type": "string",
            "title": "下边距",
            default: "0px",

        },
        "padding-left": {
            "type": "string",
            "title": "左边距",
            default: "0px",

        },
        "padding-right": {
            "type": "string",
            "title": "右边距",
            default: "0px",

        },
    }
}

function get_jsonform_default_value(model) {
    test_div = $("#editor-just-used-to-cal-jsonform");
    test_div.empty();
    test_div.jsonForm(model);
    return JSONForm.getFormValue(test_div);
}
$(function () {
    setTimeout(function () {
        $("#model-tab").on("click", "a", function (e) {
            e.preventDefault();
        })
    }, 500)

})

function clone(myObj) {
    if (typeof (myObj) != 'object') return myObj;
    if (myObj == null) return myObj;
    if (myObj.concat) {
        var myNewObj = [];
    } else {
        var myNewObj = {};
    }

    for (var i in myObj)
        myNewObj[i] = clone(myObj[i]);
    return myNewObj;
}