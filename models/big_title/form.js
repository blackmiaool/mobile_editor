
MIOTEDITOR.models.push({
    preview: true,
    kind: "h",
    model_data: {
        "schema": {
            "data": {
                "type": "string",
                "title": "内容",
                "default": "大标题",
            },
            style: {
                type: "object",
                title: "样式",
                properties: {
                    color: {
                        "type": "string",
                        "title": "颜色",
                        "format": "color"
                    },
                }
            }

        }
    },
})